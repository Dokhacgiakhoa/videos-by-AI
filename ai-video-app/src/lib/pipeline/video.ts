import path from "path";
import { generateStoryboard } from "./content";
import { generateAndSaveImage } from "./image";
import { geminiGenerateStoryboard, googleGenerateImage } from "./google";
import { pollinationsGenerateImage } from "./pollinations";
import { generateVoiceWithTimestamps } from "./voice";
import { assembleVideo, type AssembleScene } from "./assemble";
import { fetchGoogleNews, formatNewsContext } from "./news";
import type { Storyboard } from "../types";

// Nguồn KỊCH BẢN: "google" = Gemini cloud (free, không GPU) | "local" = Ollama (GPU)
const TEXT_PROVIDER = process.env.AI_PROVIDER ?? "google";
const useGoogleText = TEXT_PROVIDER === "google";

// Nguồn ẢNH: "pollinations" = Flux free không GPU (mặc định) | "google" = Imagen (trả phí) | "local" = ComfyUI/Flux (GPU)
const IMAGE_PROVIDER = process.env.IMAGE_PROVIDER ?? "pollinations";
const imageProviderLabel =
  IMAGE_PROVIDER === "local" ? "Flux local" : IMAGE_PROVIDER === "google" ? "Imagen" : "Pollinations";

const makeStoryboard = (topic: string, news?: string): Promise<Storyboard> =>
  useGoogleText ? geminiGenerateStoryboard(topic, news) : generateStoryboard(topic, news);

const makeImage = (prompt: string, filename: string): Promise<string> => {
  if (IMAGE_PROVIDER === "local") return generateAndSaveImage(prompt, filename);
  if (IMAGE_PROVIDER === "google") return googleGenerateImage(prompt, filename);
  return pollinationsGenerateImage(prompt, filename);
};

export interface PipelineOptions {
  useNews?: boolean; // lấy tin thật từ internet làm nguồn
  newsQuery?: string; // từ khoá tìm tin (mặc định "trí tuệ nhân tạo")
}

export type ProgressEvent =
  | { type: "status"; message: string }
  | { type: "storyboard"; storyboard: Storyboard }
  | { type: "scene"; index: number; total: number; imageUrl: string; audioUrl: string }
  | { type: "done"; videoUrl: string; storyboard: Storyboard }
  | { type: "error"; message: string };

export type Emit = (e: ProgressEvent) => void;

function publicToAbs(publicPath: string): string {
  return path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
}

/**
 * Chạy TOÀN BỘ pipeline: prompt -> kịch bản (Ollama) -> từng cảnh sinh ảnh (ComfyUI/Flux)
 * + giọng đọc (Edge-TTS) -> ghép thành video mp4 (FFmpeg). Phát tiến độ qua `emit`.
 *
 * Ảnh được sinh TUẦN TỰ (không song song) để giữ tải GPU/điện ở mức an toàn.
 */
export async function runPipeline(
  topic: string,
  emit: Emit,
  opts: PipelineOptions = {},
): Promise<{ videoUrl: string; storyboard: Storyboard }> {
  const jobId = `vid_${Date.now()}`;

  // Tuỳ chọn: lấy tin tức THẬT từ internet làm nguồn cho kịch bản
  let newsContext: string | undefined;
  if (opts.useNews) {
    const query = (opts.newsQuery || "trí tuệ nhân tạo").trim();
    emit({ type: "status", message: `Đang lấy tin thật từ internet ("${query}")...` });
    try {
      const items = await fetchGoogleNews(query, 7, 12);
      if (items.length > 0) {
        newsContext = formatNewsContext(items);
        emit({ type: "status", message: `Đã lấy ${items.length} tin mới nhất làm nguồn.` });
      } else {
        emit({ type: "status", message: "Không tìm thấy tin phù hợp — sẽ tạo theo chủ đề." });
      }
    } catch (err) {
      emit({
        type: "status",
        message: `Lấy tin lỗi (${err instanceof Error ? err.message : err}) — sẽ tạo theo chủ đề.`,
      });
    }
  }

  emit({
    type: "status",
    message: useGoogleText
      ? "Đang viết kịch bản bằng Gemini (cloud)..."
      : "Đang viết kịch bản bằng Ollama (local)...",
  });
  const storyboard = await makeStoryboard(topic, newsContext);
  emit({ type: "storyboard", storyboard });

  const scenes: AssembleScene[] = [];
  const total = storyboard.scenes.length;

  for (let i = 0; i < total; i++) {
    const scene = storyboard.scenes[i];
    const sceneKey = `${jobId}_${scene.id}`;

    emit({
      type: "status",
      message: `Cảnh ${i + 1}/${total}: đang sinh ảnh AI (${imageProviderLabel})...`,
    });
    const imageUrl = await makeImage(scene.imagePrompt, `${sceneKey}.png`);

    emit({ type: "status", message: `Cảnh ${i + 1}/${total}: đang sinh giọng đọc (Edge-TTS)...` });
    const voice = await generateVoiceWithTimestamps(scene.voiceOver, sceneKey);

    scenes.push({
      imagePath: publicToAbs(imageUrl),
      audioPath: publicToAbs(voice.audioUrl),
      words: voice.words,
    });
    emit({ type: "scene", index: i + 1, total, imageUrl, audioUrl: voice.audioUrl });
  }

  emit({ type: "status", message: "Đang ghép video bằng FFmpeg..." });
  const videoUrl = await assembleVideo(scenes, jobId, (message) => emit({ type: "status", message }));

  emit({ type: "done", videoUrl, storyboard });
  return { videoUrl, storyboard };
}
