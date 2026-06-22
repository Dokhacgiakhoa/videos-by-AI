import fs from "fs";
import path from "path";
import { generateStoryboard } from "./content";
import { generateAndSaveImage } from "./image";
import { geminiGenerateStoryboard, googleGenerateImage, setGeminiClientKey } from "./google";
import { pollinationsGenerateImage } from "./pollinations";
import { generateVoiceWithTimestamps } from "./voice";
import { assembleVideo, concatAudio, probeDuration, type AssembleScene } from "./assemble";
import { fetchGoogleNews, formatNewsContext } from "./news";
import { geminiGenerateCards, type CardScript } from "./cards";
import { geminiGenerateImagePosts, type ImagePostScript } from "./imageposts";
import { renderCardVideo, renderArticlePostBatch, type ArticleSlideInput } from "./remotion-render";
import { zipFiles } from "./zip";
import { recordJob } from "./library";
import { durationPlan, imageDims, type AspectRatio, type Duration, type DurationPlan } from "./aspect";
import type { Card } from "../../remotion/types";
import type { Storyboard } from "../types";

const TEXT_PROVIDER = process.env.AI_PROVIDER ?? "google";
const useGoogleText = TEXT_PROVIDER === "google";

const IMAGE_PROVIDER = process.env.IMAGE_PROVIDER ?? "pollinations";
const imageProviderLabel =
  IMAGE_PROVIDER === "local" ? "Flux local" : IMAGE_PROVIDER === "google" ? "Imagen" : "Pollinations";

const FPS = 30;

const makeStoryboard = (topic: string, news: string | undefined, plan: DurationPlan): Promise<Storyboard> =>
  useGoogleText ? geminiGenerateStoryboard(topic, news, plan) : generateStoryboard(topic, news, plan);

const makeImage = (prompt: string, filename: string, ar: AspectRatio): Promise<string> => {
  const dims = imageDims(ar);
  if (IMAGE_PROVIDER === "local") return generateAndSaveImage(prompt, filename, dims);
  if (IMAGE_PROVIDER === "google") return googleGenerateImage(prompt, filename, ar);
  return pollinationsGenerateImage(prompt, filename, dims);
};

export interface PipelineOptions {
  useNews?: boolean;
  newsQuery?: string;
  geminiKey?: string;
  aspectRatio?: AspectRatio;
  duration?: Duration;
  voice?: string; // tên giọng edge-tts
  rate?: string; // tốc độ edge-tts, vd "+0%"
  count?: number; // số ảnh post
  cardScript?: CardScript; // kịch bản đã duyệt (bỏ qua bước sinh)
  imagePostScript?: ImagePostScript; // nội dung ảnh đã duyệt
  bgMusic?: string; // đường dẫn public nhạc nền (vd /assets/music/x.mp3)
}

export type ProgressEvent =
  | { type: "status"; message: string }
  | { type: "storyboard"; storyboard: Storyboard }
  | { type: "scene"; index: number; total: number; imageUrl: string; audioUrl: string }
  | { type: "image"; index: number; total: number; url: string; headline?: string }
  | { type: "done"; videoUrl?: string; storyboard?: Storyboard; images?: string[]; zipUrl?: string }
  | { type: "error"; message: string };

export type Emit = (e: ProgressEvent) => void;

function publicToAbs(publicPath: string): string {
  return path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
}

function safeRm(dir: string) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    /* bỏ qua lỗi dọn dẹp */
  }
}

async function fetchNewsContext(opts: PipelineOptions, emit: Emit): Promise<string | undefined> {
  if (!opts.useNews) return undefined;
  const query = (opts.newsQuery || "trí tuệ nhân tạo").trim();
  emit({ type: "status", message: `Đang lấy tin thật từ internet ("${query}")...` });
  try {
    const items = await fetchGoogleNews(query, 7, 12);
    if (items.length > 0) {
      emit({ type: "status", message: `Đã lấy ${items.length} tin mới nhất làm nguồn.` });
      return formatNewsContext(items);
    }
    emit({ type: "status", message: "Không tìm thấy tin phù hợp — sẽ tạo theo chủ đề." });
  } catch (err) {
    emit({ type: "status", message: `Lấy tin lỗi (${err instanceof Error ? err.message : err}) — tạo theo chủ đề.` });
  }
  return undefined;
}

/** Chỉ SINH kịch bản thẻ (cho bước xem trước, không render). */
export async function generateCardScriptOnly(topic: string, opts: PipelineOptions = {}): Promise<CardScript> {
  if (opts.geminiKey) setGeminiClientKey(opts.geminiKey);
  const plan = durationPlan(opts.duration ?? "short");
  const news = await fetchNewsContext(opts, () => {});
  return geminiGenerateCards(topic, news, opts.geminiKey, plan);
}

/** Chỉ SINH nội dung bộ ảnh (cho bước xem trước, không render). */
export async function generateImagePostScriptOnly(topic: string, opts: PipelineOptions = {}) {
  if (opts.geminiKey) setGeminiClientKey(opts.geminiKey);
  const count = Math.min(10, Math.max(2, opts.count ?? 5));
  const news = await fetchNewsContext(opts, () => {});
  return geminiGenerateImagePosts(topic, news, opts.geminiKey, count);
}

/**
 * [LEGACY] Pipeline ảnh AI + Ken Burns + phụ đề cháy (FFmpeg). Chỉ chạy qua ?legacy=1.
 */
export async function runPipeline(
  topic: string,
  emit: Emit,
  opts: PipelineOptions = {},
): Promise<{ videoUrl: string; storyboard: Storyboard }> {
  const jobId = `vid_${Date.now()}`;
  const ar = opts.aspectRatio ?? "9:16";
  const plan = durationPlan(opts.duration ?? "short");
  if (opts.geminiKey) setGeminiClientKey(opts.geminiKey);

  const newsContext = await fetchNewsContext(opts, emit);

  emit({
    type: "status",
    message: useGoogleText ? "Đang viết kịch bản bằng Gemini (cloud)..." : "Đang viết kịch bản bằng Ollama (local)...",
  });
  const storyboard = await makeStoryboard(topic, newsContext, plan);
  emit({ type: "storyboard", storyboard });

  const scenes: AssembleScene[] = [];
  const total = storyboard.scenes.length;

  for (let i = 0; i < total; i++) {
    const scene = storyboard.scenes[i];
    const sceneKey = `${jobId}_${scene.id}`;
    emit({ type: "status", message: `Cảnh ${i + 1}/${total}: đang sinh ảnh AI (${imageProviderLabel})...` });
    const imageUrl = await makeImage(scene.imagePrompt, `${sceneKey}.png`, ar);
    emit({ type: "status", message: `Cảnh ${i + 1}/${total}: đang sinh giọng đọc (Edge-TTS)...` });
    const voice = await generateVoiceWithTimestamps(scene.voiceOver, sceneKey, { voice: opts.voice, rate: opts.rate });
    scenes.push({ imagePath: publicToAbs(imageUrl), audioPath: publicToAbs(voice.audioUrl), words: voice.words });
    emit({ type: "scene", index: i + 1, total, imageUrl, audioUrl: voice.audioUrl });
  }

  emit({ type: "status", message: "Đang ghép video bằng FFmpeg..." });
  const videoUrl = await assembleVideo(scenes, jobId, (message) => emit({ type: "status", message }));
  safeRm(path.join(process.cwd(), "public", "assets", "work", jobId));

  emit({ type: "done", videoUrl, storyboard });
  return { videoUrl, storyboard };
}

/**
 * Pipeline VIDEO (Card Motion): chủ đề → tin tức → Gemini sinh thẻ (theo thời lượng)
 * → TTS mỗi scene → Remotion render (theo tỉ lệ) → MP4.
 */
export async function runCardPipeline(
  topic: string,
  emit: Emit,
  opts: PipelineOptions = {},
): Promise<{ videoUrl: string; cardScript: CardScript }> {
  const jobId = `card_${Date.now()}`;
  const ar = opts.aspectRatio ?? "9:16";
  const plan = durationPlan(opts.duration ?? "short");
  const workDir = path.join(process.cwd(), "public", "assets", "work", jobId);

  try {
    let cardScript: CardScript;
    if (opts.cardScript) {
      cardScript = opts.cardScript;
      emit({ type: "status", message: `Dùng kịch bản đã duyệt: "${cardScript.title}" — ${cardScript.scenes.length} thẻ.` });
    } else {
      const newsContext = await fetchNewsContext(opts, emit);
      emit({ type: "status", message: "Đang soạn kịch bản dạng thẻ (Gemini)..." });
      cardScript = await geminiGenerateCards(topic, newsContext, opts.geminiKey, plan);
      emit({ type: "status", message: `Kịch bản xong: "${cardScript.title}" — ${cardScript.scenes.length} thẻ.` });
    }

    const cards: Card[] = [];
    const audioPaths: string[] = [];
    let totalSec = 0;
    let totalWords = 0;

    for (let i = 0; i < cardScript.scenes.length; i++) {
      const scene = cardScript.scenes[i];
      const sceneKey = `${jobId}_scene_${i}`;
      emit({ type: "status", message: `Thẻ ${i + 1}/${cardScript.scenes.length}: đang sinh giọng đọc...` });
      const voice = await generateVoiceWithTimestamps(scene.voiceOver, sceneKey, { voice: opts.voice, rate: opts.rate });
      const absAudio = publicToAbs(voice.audioUrl);
      const dur = await probeDuration(absAudio);
      totalSec += dur;
      totalWords += scene.voiceOver.trim().split(/\s+/).length;
      audioPaths.push(absAudio);
      cards.push({ ...scene.card, durationInFrames: Math.max(FPS, Math.round(dur * FPS)) });
      emit({ type: "scene", index: i + 1, total: cardScript.scenes.length, imageUrl: "", audioUrl: voice.audioUrl });
    }

    const realWpm = totalSec > 0 ? Math.round(totalWords / (totalSec / 60)) : 0;
    emit({
      type: "status",
      message: `Tổng giọng đọc ~${Math.round(totalSec)}s (mục tiêu ~${plan.aimSeconds}s, ${realWpm} từ/phút).`,
    });

    const mergedAudioAbs = path.join(workDir, "merged.mp3");
    emit({ type: "status", message: "Đang nối audio..." });
    await concatAudio(audioPaths, mergedAudioAbs);
    const audioSrc = `assets/work/${jobId}/merged.mp3`;

    const videoUrl = await renderCardVideo({
      cards,
      audioSrc,
      bgMusic: opts.bgMusic,
      aspectRatio: ar,
      jobId,
      onProgress: (msg) => emit({ type: "status", message: msg }),
    });

    recordJob({
      id: jobId,
      type: "video",
      title: cardScript.title,
      aspectRatio: ar,
      createdAt: new Date().toISOString(),
      videoUrl,
    });
    emit({ type: "done", videoUrl, storyboard: { title: cardScript.title, topic, scenes: [], totalEstimatedDuration: 0 } });
    return { videoUrl, cardScript };
  } finally {
    safeRm(workDir);
  }
}

/**
 * Pipeline ẢNH POST bài báo (TĨNH): chủ đề → tin tức → Gemini sinh slide
 * → sinh ảnh nền (theo tỉ lệ) → Remotion renderStill compose ảnh+tiêu đề+logo → zip.
 */
export async function runImagePostPipeline(
  topic: string,
  emit: Emit,
  opts: PipelineOptions = {},
): Promise<{ images: string[]; zipUrl: string }> {
  const jobId = `imgpost_${Date.now()}`;
  const ar = opts.aspectRatio ?? "9:16";
  const count = Math.min(10, Math.max(2, opts.count ?? 5));
  const today = new Date().toISOString().slice(0, 10);

  let script: ImagePostScript;
  if (opts.imagePostScript) {
    script = opts.imagePostScript;
    emit({ type: "status", message: `Dùng nội dung đã duyệt: "${script.title}" — ${script.slides.length} ảnh.` });
  } else {
    const newsContext = await fetchNewsContext(opts, emit);
    emit({ type: "status", message: "Đang soạn nội dung bộ ảnh (Gemini)..." });
    script = await geminiGenerateImagePosts(topic, newsContext, opts.geminiKey, count);
    emit({ type: "status", message: `Nội dung xong: "${script.title}" — ${script.slides.length} ảnh.` });
  }

  // Sinh ảnh nền tuần tự (nhẹ tải GPU); lỗi 1 ảnh không giết cả bộ.
  const slides: ArticleSlideInput[] = [];
  for (let i = 0; i < script.slides.length; i++) {
    const s = script.slides[i];
    emit({ type: "status", message: `Ảnh ${i + 1}/${script.slides.length}: đang sinh ảnh nền AI...` });
    try {
      const bgUrl = await makeImage(s.imagePrompt, `${jobId}_bg_${i}.png`, ar);
      slides.push({
        headline: s.headline,
        subheadline: s.subheadline,
        source: s.source,
        date: today,
        imageSrc: bgUrl,
        eyebrow: i === 0 ? "TIÊU ĐIỂM" : undefined,
      });
    } catch (err) {
      emit({ type: "status", message: `Bỏ qua ảnh ${i + 1} (lỗi sinh nền: ${err instanceof Error ? err.message : err}).` });
    }
  }

  if (slides.length === 0) throw new Error("Không sinh được ảnh nền nào.");

  emit({ type: "status", message: "Đang dựng ảnh post (ảnh + tiêu đề + logo)..." });
  const urls = await renderArticlePostBatch(slides, {
    aspectRatio: ar,
    jobId,
    onProgress: (msg) => emit({ type: "status", message: msg }),
  });

  urls.forEach((url, i) => emit({ type: "image", index: i + 1, total: urls.length, url, headline: slides[i]?.headline }));

  // Zip cả bộ
  emit({ type: "status", message: "Đang nén bộ ảnh (.zip)..." });
  const zipAbs = path.join(process.cwd(), "public", "assets", "videos", `${jobId}.zip`);
  await zipFiles(urls.map(publicToAbs), zipAbs);
  const zipUrl = `/assets/videos/${jobId}.zip`;

  recordJob({
    id: jobId,
    type: "imagepost",
    title: script.title,
    aspectRatio: ar,
    createdAt: new Date().toISOString(),
    images: urls,
    zipUrl,
    thumb: urls[0],
  });
  emit({ type: "done", images: urls, zipUrl });
  return { images: urls, zipUrl };
}
