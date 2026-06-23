import fs from "fs";
import path from "path";
import { generateStoryboard } from "./content";
import { generateAndSaveImage } from "./image";
import { geminiGenerateStoryboard, googleGenerateImage, setGeminiClientKey } from "./google";
import { pollinationsGenerateImage } from "./pollinations";
import { generateVoiceWithTimestamps } from "./voice";
import { assembleVideo, concatAudio, probeDuration, type AssembleScene } from "./assemble";
import { fetchGoogleNews, fetchManualUrls, formatNewsContext, type NewsItem } from "./news";
import { geminiGenerateCards, type CardScript } from "./cards";
import { geminiGenerateImagePosts, type ImagePostSlide } from "./imageposts";
import { acquireSlideImage } from "./imagefetch";
import { renderCardVideo, renderArticlePostBatch, type ArticleSlideInput } from "./remotion-render";
import { recordJob } from "./library";
import {
  postDims,
  videoDims,
  type AspectRatio,
  type Dimensions,
  type PostRatio,
  getAIAspectRatio,
  imageDims,
  type Duration,
  type DurationPlan,
  durationPlan,
} from "./aspect";
import type { Card } from "../../remotion/types";
import type { Storyboard } from "../types";

const TEXT_PROVIDER = process.env.AI_PROVIDER ?? "google";
const useGoogleText = TEXT_PROVIDER === "google";

const IMAGE_PROVIDER = process.env.IMAGE_PROVIDER ?? "pollinations";
const imageProviderLabel =
  IMAGE_PROVIDER === "local" ? "Flux local" : IMAGE_PROVIDER === "google" ? "Imagen" : "Pollinations";

const FPS = 30;

const makeStoryboard = (
  topic: string,
  news: string | undefined,
  plan: DurationPlan,
  ollamaOptions?: { enabled?: boolean; host?: string; model?: string }
): Promise<Storyboard> =>
  useGoogleText || ollamaOptions?.enabled
    ? geminiGenerateStoryboard(topic, news, plan, ollamaOptions)
    : generateStoryboard(topic, news, plan);

const makeImage = (prompt: string, filename: string, ar: AspectRatio): Promise<string> => {
  const dims = imageDims(ar);
  if (IMAGE_PROVIDER === "local") return generateAndSaveImage(prompt, filename, dims);
  if (IMAGE_PROVIDER === "google") return googleGenerateImage(prompt, filename, ar);
  return pollinationsGenerateImage(prompt, filename, dims);
};

/**
 * Gen ảnh minh hoạ cho ẢNH POST theo tỉ lệ post (4:5/2:1...) — luôn dùng nguồn FREE.
 * Imagen (google) không nhận tỉ lệ post + tốn tiền → bỏ qua, fallback Pollinations.
 */
const makePostImage = (prompt: string, filename: string, ratio: PostRatio): Promise<string> => {
  const aiAspect = getAIAspectRatio(ratio);
  const dims = imageDims(aiAspect);
  if (IMAGE_PROVIDER === "local") return generateAndSaveImage(prompt, filename, dims);
  return pollinationsGenerateImage(prompt, filename, dims);
};

/** Load kịch bản preset có sẵn (vd "demo-ai91") từ public/presets/<name>.json */
function loadPresetScript(name: string): CardScript {
  const filePath = path.join(process.cwd(), "public", "presets", `${name}.json`);
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return raw as CardScript;
}

export interface PipelineOptions {
  useNews?: boolean;
  noApiMode?: boolean; // Bật chế độ không dùng API key (lấy trực tiếp từ search)
  newsSourceType?: "auto" | "manual";
  newsQuery?: string;
  newsTimeframe?: string;
  newsManualUrls?: string[];
  geminiKey?: string;
  ollamaMode?: boolean;
  ollamaHost?: string;
  ollamaModel?: string;
  aspectRatio?: AspectRatio;
  duration?: Duration;
  voice?: string; // tên giọng edge-tts
  rate?: string; // tốc độ edge-tts, vd "+0%"
  ttsEngine?: "edgetts" | "omnivoice";
  count?: number; // số ảnh post
  useCoverImage?: boolean; // tự động tạo ảnh bìa
  postRatio?: PostRatio; // tỉ lệ mặc định cho ảnh post (mỗi slide có thể override)
  cardScript?: CardScript; // kịch bản đã duyệt (bỏ qua bước sinh)
  imagePostScript?: ImagePostScriptFull; // nội dung ảnh đã duyệt (kèm imageSrc + ratio)
  bgMusic?: string; // đường dẫn public nhạc nền (vd /assets/music/x.mp3)
  signal?: AbortSignal; // tín hiệu hủy job (client ngắt / bấm "Hủy")
  preset?: string; // tên preset (vd "demo-ai91") — load kịch bản từ public/presets/
  brand?: { logoUrl: string; palette: { primary: string; secondary: string; accent: string; bg: string; text: string } };
}

/** 1 slide ảnh post đã đủ dữ liệu để render (ảnh đã lấy + tỉ lệ riêng). */
export interface ImagePostSlideFull extends ImagePostSlide {
  imageSrc?: string; // ảnh đã lấy ở bước preview (có thể rỗng nếu chưa lấy được)
  ratio: PostRatio;
  link?: string; // link bài báo (giữ qua bước duyệt để lấy og:image sau)
}
export interface ImagePostScriptFull {
  title: string;
  slides: ImagePostSlideFull[];
}
/** Ảnh post hoàn chỉnh trả cho gallery (kèm tỉ lệ để hiển thị đúng). */
export interface PostImageOut {
  url: string;
  ratio: PostRatio;
  headline?: string;
}

export type ProgressEvent =
  | { type: "status"; message: string }
  | { type: "storyboard"; storyboard: Storyboard }
  | { type: "scene"; index: number; total: number; imageUrl: string; audioUrl: string }
  | { type: "image"; index: number; total: number; url: string; headline?: string; ratio?: PostRatio }
  | { type: "imagescript"; script: ImagePostScriptFull }
  | { type: "done"; videoUrl?: string; storyboard?: Storyboard; images?: PostImageOut[] }
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
  if (opts.newsSourceType === "manual") {
    const urls = opts.newsManualUrls ?? [];
    if (urls.length === 0) return undefined;
    emit({ type: "status", message: `Đang lấy nội dung từ ${urls.length} link thủ công...` });
    try {
      const items = await fetchManualUrls(urls, opts.signal);
      if (items.length > 0) {
        emit({ type: "status", message: `Đã tải thành công ${items.length} link.` });
        return formatNewsContext(items);
      }
      emit({ type: "status", message: "Không tải được nội dung từ link nguồn." });
    } catch (err) {
      emit({ type: "status", message: `Lỗi tải link thủ công: ${err instanceof Error ? err.message : err}` });
    }
    return undefined;
  }

  const query = (opts.newsQuery || "trí tuệ nhân tạo").trim();
  const timeframe = opts.newsTimeframe || "7d";
  emit({ type: "status", message: `Đang lấy tin tự động ("${query}", quét: ${timeframe})...` });
  try {
    const items = await fetchGoogleNews(query, timeframe, 12);
    if (items.length > 0) {
      emit({ type: "status", message: `Đã lấy ${items.length} tin mới nhất.` });
      return formatNewsContext(items);
    }
    emit({ type: "status", message: "Không tìm thấy tin phù hợp." });
  } catch (err) {
    emit({ type: "status", message: `Lấy tin lỗi: ${err instanceof Error ? err.message : err}` });
  }
  return undefined;
}

/** Chỉ SINH kịch bản thẻ (cho bước xem trước, không render). */
export async function generateCardScriptOnly(topic: string, opts: PipelineOptions = {}): Promise<CardScript> {
  if (opts.geminiKey) setGeminiClientKey(opts.geminiKey);
  const plan = durationPlan(opts.duration ?? "short");
  let result: CardScript;
  
  const hasKey = opts.geminiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if ((!hasKey && !opts.ollamaMode) || opts.noApiMode) {
    // Không dùng API: Tạo kịch bản phân cảnh từ dữ liệu tin tức quét được
    const count = opts.count ?? 5;
    const items = await fetchNewsItems({ ...opts, useNews: true }, () => {}, count * 2);
    if (items.length === 0) {
      throw new Error("Không có dữ liệu tin tức để tạo kịch bản. Vui lòng nhập API Key hoặc bật Nguồn dữ liệu bổ trợ.");
    }
    const scenes = items.slice(0, count).map((item, i) => {
      const summary = item.snippet || item.content || `Cập nhật từ nguồn ${item.source}.`;
      return {
        voiceOver: `Tin tức thứ ${i + 1}. ${item.title}. ${summary}`,
      card: {
        name: item.source || "Tin tức",
        badges: [item.date ? item.date.slice(0, 10) : "Mới nhất"],
        tag: `Tin tức ${i + 1}`,
        stat: `${i + 1}`,
        statSuffix: "TIN",
        lab1: "Nguồn",
        lab2: item.source || "Internet",
        cmd: item.title,
        star: "Hot",
      }
    };
    });
    result = {
      title: `Điểm tin: ${topic || "Tin tức"}`,
      scenes
    };
  } else {
    const news = await fetchNewsContext(opts, () => {});
    result = await geminiGenerateCards(topic, news, opts.geminiKey, plan, {
      enabled: opts.ollamaMode,
      host: opts.ollamaHost,
      model: opts.ollamaModel,
    });
  }

  if (opts.useCoverImage) {
    const count = opts.count ?? 5;
    let titleCover = (topic || "").trim().toUpperCase();
    if (!titleCover || titleCover.length < 20) {
      const timeframeStr = opts.newsTimeframe === "24h" ? "24 GIỜ" : opts.newsTimeframe === "7d" ? "TUẦN" : "THÁNG";
      titleCover = `${count} TIÊU ĐIỂM ${titleCover || "TIN TỨC"} ${timeframeStr} QUA`;
    }
    const today = new Intl.DateTimeFormat('vi-VN').format(new Date());
    
    result.scenes.unshift({
      voiceOver: `Chào mừng bạn đến với bản tin cập nhật ngày ${today}. Sau đây là ${count} tiêu điểm đáng chú ý nhất về ${topic || "tin tức"}.`,
      card: {
        name: "Tiêu điểm",
        badges: ["Nổi bật"],
        tag: "Tin nóng",
        stat: `${count}`,
        statSuffix: "TIN",
        lab1: "Tổng hợp",
        lab2: "Đáng chú ý",
        cmd: titleCover,
        star: "Hot",
      }
    });
  }
  return result;
}

/** Lấy tin THẬT kèm link (cho ảnh post) — phiên bản trả raw items để moi og:image. */
async function fetchNewsItems(opts: PipelineOptions, emit: Emit, limit: number): Promise<NewsItem[]> {
  if (!opts.useNews) return [];
  if (opts.newsSourceType === "manual") {
    const urls = opts.newsManualUrls ?? [];
    if (urls.length === 0) return [];
    emit({ type: "status", message: `Đang lấy nội dung từ ${urls.length} link thủ công...` });
    try {
      const items = await fetchManualUrls(urls, opts.signal);
      if (items.length > 0) {
        emit({ type: "status", message: `Đã tải thành công ${items.length} link.` });
        return items;
      }
      emit({ type: "status", message: "Không tải được nội dung từ link nguồn." });
    } catch (err) {
      emit({ type: "status", message: `Lỗi tải link thủ công: ${err instanceof Error ? err.message : err}` });
    }
    return [];
  }

  const query = (opts.newsQuery || "trí tuệ nhân tạo").trim();
  const timeframe = opts.newsTimeframe || "7d";
  emit({ type: "status", message: `Đang lấy tin tự động ("${query}", quét: ${timeframe})...` });
  try {
    let items = await fetchGoogleNews(query, timeframe, limit);
    if (items.length > 0) {
      emit({ type: "status", message: `Đã lấy ${items.length} tin mới nhất.` });
      
      // Nếu là chế độ Free (noApiMode), quét sâu nội dung từng bài báo
      if (opts.noApiMode) {
        emit({ type: "status", message: `Đang quét sâu nội dung các bài báo...` });
        const deepItems = await fetchManualUrls(items.map(i => i.link), opts.signal);
        items = items.map(item => {
           const found = deepItems.find(d => d.link === item.link);
           if (found && found.content) {
             return { ...item, content: found.content };
           }
           return item;
        });
      }
      return items;
    }
    emit({ type: "status", message: "Không tìm thấy tin phù hợp." });
  } catch (err) {
    emit({ type: "status", message: `Lấy tin lỗi: ${err instanceof Error ? err.message : err}` });
  }
  return [];
}

/** Lấy ảnh cho 1 slide theo imageMode (photo: og:image/web · generated: gen free). */
async function acquireImageForSlide(
  slide: ImagePostSlide,
  ratio: PostRatio,
  link: string | undefined,
  filenameBase: string,
  emit: Emit,
  signal?: AbortSignal,
  indexLabel?: string,
): Promise<string | undefined> {
  try {
    if (slide.imageMode === "photo") {
      emit({ type: "status", message: `Ảnh ${indexLabel}: tìm ảnh thật (bài báo/web)...` });
      const got = await acquireSlideImage({
        link,
        query: slide.imageQuery || slide.headline,
        filename: `${filenameBase}.jpg`,
        signal,
      });
      if (got) return got;
      emit({ type: "status", message: `Ảnh ${indexLabel}: không tìm thấy ảnh thật, chuyển sang tự gen (Pollinations)...` });
    } else {
      emit({ type: "status", message: `Ảnh ${indexLabel}: gen ảnh minh hoạ (Pollinations)...` });
    }
    
    // Fallback or explicit generated mode
    const prompt = slide.imagePrompt || `An impressive photo representing ${slide.headline}, 8k resolution, cinematic`;
    return await makePostImage(prompt, `${filenameBase}.png`, ratio);
  } catch (err) {
    emit({ type: "status", message: `Ảnh ${indexLabel}: không lấy/gen được (${err instanceof Error ? err.message : err}).` });
    return undefined;
  }
}

/**
 * GIAI ĐOẠN 1 — chỉ SOẠN NỘI DUNG (text), CHƯA lấy ảnh. Nhanh → hiện ngay để user duyệt.
 * Giữ link bài báo + source thật vào từng slide để bước lấy ảnh sau dùng (og:image).
 */
export async function runImagePostContent(topic: string, opts: PipelineOptions = {}): Promise<ImagePostScriptFull> {
  if (opts.geminiKey) setGeminiClientKey(opts.geminiKey);
  const count = Math.min(10, Math.max(2, opts.count ?? 5));
  const ratio: PostRatio = opts.postRatio ?? "4:5";
  let result: ImagePostScriptFull;

  const items = await fetchNewsItems({ ...opts, useNews: true }, () => {}, count);

  const hasKey = opts.geminiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if ((!hasKey && !opts.ollamaMode) || opts.noApiMode) {
    if (items.length === 0) {
      throw new Error("Không có dữ liệu tin tức hỗ trợ để tạo trực tiếp. Vui lòng nhập API Key hoặc bật Nguồn dữ liệu bổ trợ.");
    }
    const slides: ImagePostSlideFull[] = items.slice(0, count).map((item) => {
      const summaryText = item.snippet || item.content || `Tin tức từ nguồn ${item.source} ngày ${item.date ? item.date.slice(0, 10) : new Date().toISOString().slice(0, 10)}.`;
      const summary = summaryText.length > 200 ? summaryText.slice(0, 197) + "..." : summaryText;
      return {
        headline: item.title,
        summary,
        source: item.source,
        link: item.link,
        ratio,
        imageMode: "photo",
        imageQuery: item.title,
      };
    });
    result = {
      title: `Điểm tin: ${topic || "Tin tức"}`,
      slides
    };
  } else {
    const newsContext = items.length ? formatNewsContext(items) : undefined;
    const script = await geminiGenerateImagePosts(topic, newsContext, opts.geminiKey, count, {
      enabled: opts.ollamaMode,
      host: opts.ollamaHost,
      model: opts.ollamaModel,
    });
    const slides: ImagePostSlideFull[] = script.slides.map((s, i) => ({
      ...s,
      source: s.source || items[i]?.source,
      link: items[i]?.link,
      ratio: (s as any).ratio || ratio,
      imageMode: s.imageMode || "generated",
    }));
    result = { ...script, slides };
  }

  if (opts.useCoverImage) {
    let titleCover = (topic || "").trim().toUpperCase();
    if (!titleCover || titleCover.length < 20) {
      const timeframeStr = opts.newsTimeframe === "24h" ? "24 GIỜ" : opts.newsTimeframe === "7d" ? "TUẦN" : "THÁNG";
      titleCover = `${count} TIÊU ĐIỂM ${titleCover || "TIN TỨC"} ${timeframeStr} QUA`;
    }
    const today = new Intl.DateTimeFormat('vi-VN').format(new Date());
    
    result.slides.unshift({
      headline: titleCover,
      summary: `Bản tin cập nhật ngày ${today}. Điểm nhanh ${count} sự kiện nổi bật nhất về ${topic || "công nghệ"}.`,
      caption: `Cùng nhìn lại ${count} sự kiện nổi bật nhất về ${topic || "công nghệ"} trong ngày ${today}. Chắc chắn bạn sẽ không muốn bỏ lỡ những thông tin quan trọng này!`,
      source: "Tổng hợp",
      ratio,
      imageMode: "generated",
      imagePrompt: `An impressive cover image representing: ${topic || "technology news"}, dramatic lighting, highly detailed, 8k resolution, cinematic`,
    });
  }

  return result;
}

/**
 * GIAI ĐOẠN 2 — LẤY ẢNH cho từng slide của script đã duyệt. Stream tiến trình + ảnh từng slide.
 * Trả script đã cập nhật imageSrc.
 */
export async function runImagePostImages(
  script: ImagePostScriptFull,
  emit: Emit,
  opts: PipelineOptions = {},
): Promise<ImagePostScriptFull> {
  const base = `imgpost_src_${Date.now()}`;
  const slides: ImagePostSlideFull[] = [];
  for (let i = 0; i < script.slides.length; i++) {
    opts.signal?.throwIfAborted();
    const s = script.slides[i];
    const imageSrc = await acquireImageForSlide(
      s, s.ratio, s.link, `${base}_${i}`, emit, opts.signal, `${i + 1}/${script.slides.length}`,
    );
    slides.push({ ...s, imageSrc });
    emit({ type: "image", index: i + 1, total: script.slides.length, url: imageSrc ?? "", headline: s.headline, ratio: s.ratio });
  }
  const full: ImagePostScriptFull = { title: script.title, slides };
  emit({ type: "imagescript", script: full });
  return full;
}

/** Lấy ảnh lại cho một slide duy nhất. */
export async function runImagePostSingleImage(
  slide: ImagePostSlideFull,
  index: number,
  emit: Emit,
  opts: PipelineOptions = {},
): Promise<string | undefined> {
  const base = `imgpost_src_${Date.now()}`;
  opts.signal?.throwIfAborted();
  const imageSrc = await acquireImageForSlide(
    slide, slide.ratio, slide.link, `${base}_single`, emit, opts.signal, `đơn lẻ (${index + 1})`,
  );
  emit({ type: "image", index: index + 1, total: 1, url: imageSrc ?? "", headline: slide.headline, ratio: slide.ratio });
  return imageSrc;
}

/** Gộp 2 giai đoạn (dùng khi render thẳng không qua preview). */
export async function runImagePostScript(
  topic: string,
  emit: Emit,
  opts: PipelineOptions = {},
): Promise<ImagePostScriptFull> {
  emit({ type: "status", message: "Đang soạn nội dung bộ ảnh (Gemini)..." });
  const content = await runImagePostContent(topic, opts);
  emit({ type: "status", message: `Nội dung xong: "${content.title}" — ${content.slides.length} slide.` });
  return runImagePostImages(content, emit, opts);
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
    message: opts.ollamaMode
      ? "Đang viết kịch bản bằng Ollama (local)..."
      : useGoogleText
      ? "Đang viết kịch bản bằng Gemini (cloud)..."
      : "Đang viết kịch bản...",
  });
  const storyboard = await makeStoryboard(topic, newsContext, plan, {
    enabled: opts.ollamaMode,
    host: opts.ollamaHost,
    model: opts.ollamaModel,
  });
  emit({ type: "storyboard", storyboard });

  const scenes: AssembleScene[] = [];
  const total = storyboard.scenes.length;

  for (let i = 0; i < total; i++) {
    const scene = storyboard.scenes[i];
    const sceneKey = `${jobId}_${scene.id}`;
    emit({ type: "status", message: `Cảnh ${i + 1}/${total}: đang sinh ảnh AI (${imageProviderLabel})...` });
    const imageUrl = await makeImage(scene.imagePrompt, `${sceneKey}.png`, ar);
    emit({ type: "status", message: `Cảnh ${i + 1}/${total}: đang sinh giọng đọc (Edge-TTS)...` });
    const voice = await generateVoiceWithTimestamps(scene.voiceOver, sceneKey, { 
      voice: opts.voice, 
      rate: opts.rate,
      ttsEngine: opts.ttsEngine
    });
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
    if (opts.preset) {
      cardScript = loadPresetScript(opts.preset);
      emit({ type: "status", message: `Dùng preset "${opts.preset}": "${cardScript.title}" — ${cardScript.scenes.length} thẻ.` });
    } else if (opts.cardScript) {
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
      opts.signal?.throwIfAborted();
      const scene = cardScript.scenes[i];
      const sceneKey = `${jobId}_scene_${i}`;
      emit({ type: "status", message: `Thẻ ${i + 1}/${cardScript.scenes.length}: đang sinh giọng đọc...` });
      const voice = await generateVoiceWithTimestamps(scene.voiceOver, sceneKey, { 
        voice: opts.voice, 
        rate: opts.rate, 
        signal: opts.signal,
        ttsEngine: opts.ttsEngine
      });
      const absAudio = publicToAbs(voice.audioUrl);
      const dur = await probeDuration(absAudio);
      totalSec += dur;
      totalWords += scene.voiceOver.trim().split(/\s+/).length;
      audioPaths.push(absAudio);
      const { getCardEntranceDuration } = await import("../../remotion/layoutsTimings");
      const entranceDur = getCardEntranceDuration(scene.card as any);
      
      const minReadingTime = entranceDur + 1.0;
      const activeTime = Math.max(dur, minReadingTime);
      const sceneDur = activeTime + 0.4;
      
      cards.push({
        ...scene.card,
        label: scene.card.label ?? undefined,
        pillDay: scene.card.pillDay ?? undefined,
        durationInFrames: Math.round(sceneDur * FPS),
        words: voice.words,
      });
      emit({ type: "scene", index: i + 1, total: cardScript.scenes.length, imageUrl: "", audioUrl: voice.audioUrl });
    }

    const realWpm = totalSec > 0 ? Math.round(totalWords / (totalSec / 60)) : 0;
    emit({
      type: "status",
      message: `Tổng giọng đọc ~${Math.round(totalSec)}s (mục tiêu ~${plan.aimSeconds}s, ${realWpm} từ/phút).`,
    });

    opts.signal?.throwIfAborted();
    const mergedAudioAbs = path.join(workDir, "merged.mp3");
    emit({ type: "status", message: "Đang nối audio..." });
    await concatAudio(audioPaths, mergedAudioAbs, opts.signal);
    const audioSrc = `assets/work/${jobId}/merged.mp3`;

    opts.signal?.throwIfAborted();
    const videoUrl = await renderCardVideo({
      cards,
      audioSrc,
      bgMusic: opts.bgMusic,
      aspectRatio: ar,
      jobId,
      signal: opts.signal,
      brand: opts.brand,
      onProgress: (msg) => emit({ type: "status", message: msg }),
    });

    recordJob({
      id: jobId,
      type: "video",
      title: cardScript.title,
      aspectRatio: ar,
      createdAt: new Date().toISOString(),
      videoUrl,
      scriptData: cardScript,
    });
    emit({ type: "done", videoUrl, storyboard: { title: cardScript.title, topic, scenes: [], totalEstimatedDuration: 0 } });
    return { videoUrl, cardScript };
  } finally {
    safeRm(workDir);
  }
}

/**
 * Pipeline ẢNH POST bài báo (TĨNH): nhận script đã duyệt (có ảnh thật/minh hoạ + tỉ lệ)
 * → Remotion renderStill compose [ảnh + khối tiêu đề + tóm tắt + logo] → xuất PNG riêng lẻ.
 * Nếu không có draft (gọi thẳng) → tự soạn nội dung + lấy ảnh trước.
 */
export async function runImagePostPipeline(
  topic: string,
  emit: Emit,
  opts: PipelineOptions = {},
): Promise<{ images: PostImageOut[] }> {
  const jobId = `imgpost_${Date.now()}`;
  const today = new Date().toISOString().slice(0, 10);

  let script: ImagePostScriptFull;
  if (opts.imagePostScript) {
    script = opts.imagePostScript;
    emit({ type: "status", message: `Dùng nội dung đã duyệt: "${script.title}" — ${script.slides.length} ảnh.` });
  } else {
    script = await runImagePostScript(topic, emit, opts);
  }

  // Mỗi slide: dùng ảnh đã lấy ở preview; thiếu thì lấy bù tại đây. Lỗi 1 ảnh → bỏ slide đó.
  const slides: ArticleSlideInput[] = [];
  const intermediates: string[] = [];
  try {
    for (let i = 0; i < script.slides.length; i++) {
      opts.signal?.throwIfAborted();
      const s = script.slides[i];
      let imageSrc = s.imageSrc;
      if (!imageSrc) {
        imageSrc = await acquireImageForSlide(
          s, s.ratio, undefined, `${jobId}_src_${i}`, emit, opts.signal, `${i + 1}/${script.slides.length}`,
        );
      }
      if (!imageSrc) {
        emit({ type: "status", message: `Bỏ qua ảnh ${i + 1} (không có ảnh nguồn).` });
        continue;
      }
      intermediates.push(imageSrc);
      slides.push({
        headline: s.headline,
        summary: s.summary ?? undefined,
        source: s.source ?? undefined,
        date: today,
        imageSrc,
        eyebrow: i === 0 ? "TIÊU ĐIỂM" : undefined,
        ratio: s.ratio,
      });
    }

    if (slides.length === 0) throw new Error("Không có ảnh nguồn nào để dựng.");

    opts.signal?.throwIfAborted();
    emit({ type: "status", message: "Đang dựng ảnh post (ảnh + tiêu đề + logo)..." });
    const urls = await renderArticlePostBatch(slides, {
      jobId,
      brand: opts.brand,
      signal: opts.signal,
      onProgress: (msg) => emit({ type: "status", message: msg }),
    });

    const out: PostImageOut[] = urls.map((url, i) => ({ url, ratio: slides[i].ratio, headline: slides[i].headline }));
    out.forEach((img, i) => emit({ type: "image", index: i + 1, total: out.length, url: img.url, headline: img.headline, ratio: img.ratio }));

    recordJob({
      id: jobId,
      type: "imagepost",
      title: script.title,
      aspectRatio: slides[0]?.ratio ?? "4:5",
      createdAt: new Date().toISOString(),
      images: out,
      thumb: out[0]?.url,
      scriptData: script,
    });
    emit({ type: "done", images: out });
    return { images: out };
  } finally {
    // Dọn ảnh nguồn trung gian — đã ghép vào ảnh post, không cần giữ (chống rò đĩa).
    for (const src of intermediates) safeRm(publicToAbs(src));
  }
}
