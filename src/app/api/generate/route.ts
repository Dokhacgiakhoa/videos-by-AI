import fs from "fs";
import path from "path";
import {
  runPipeline,
  runCardPipeline,
  runImagePostPipeline,
  type PipelineOptions,
  type ProgressEvent,
} from "@/lib/pipeline/video";
import { isAspectRatio, isDuration, type AspectRatio, type Duration } from "@/lib/pipeline/aspect";
import { tryAcquire, release, currentJobLabel } from "@/lib/pipeline/lock";

/** Đọc brand.json nếu tồn tại (logo + palette đã phân tích). */
function loadBrandJson(): PipelineOptions["brand"] {
  try {
    const p = path.join(process.cwd(), "public", "assets", "brand", "brand.json");
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch { /* ignore */ }
  return undefined;
}

/** Tìm track nhạc nền đầu tiên trong public/assets/music. */
function resolveBgMusic(): string | undefined {
  try {
    const dir = path.join(process.cwd(), "public", "assets", "music");
    const f = fs.readdirSync(dir).find((n) => /\.(mp3|m4a|aac|wav|ogg)$/i.test(n));
    return f ? `/assets/music/${f}` : undefined;
  } catch {
    return undefined;
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 3600;

type ProductType = "video" | "imagepost";

// Map lựa chọn tốc độ trên UI -> tham số edge-tts
const RATE_MAP: Record<string, string> = { slow: "-12%", normal: "+0%", fast: "+15%" };

export async function POST(request: Request) {
  const url = new URL(request.url);
  const legacy = url.searchParams.get("legacy") === "1";

  let topic = "";
  let type: ProductType = "video";
  let aspectRatio: AspectRatio = "9:16";
  let duration: Duration = "short";
  let useNews = false;
  let noApiMode = false;
  let ollamaMode = false;
  let ollamaHost = "";
  let ollamaModel = "";
  let newsQuery = "";
  let geminiKey = "";
  let voice = "en-US-GuyNeural";
  let rate = "+0%";
  let useMusic = false;
  let preset = "";
  let cardScript: PipelineOptions["cardScript"];
  let imagePostScript: PipelineOptions["imagePostScript"];
  let brandFromBody: PipelineOptions["brand"];
  let newsSourceType = "auto";
  let newsTimeframe = "";
  let newsCustomDays = 3;
  let newsManualUrls: string[] | undefined = undefined;
  let count: number | undefined = undefined;
  let postRatio: string | undefined = undefined;
  let useCoverImage = false;
  let ttsEngine: "edgetts" | "omnivoice" = "omnivoice";

  try {
    const body = await request.json();
    useMusic = Boolean(body?.music);
    preset = (body?.preset ?? "").toString().trim();
    if (body?.brand && typeof body.brand === "object") brandFromBody = body.brand as PipelineOptions["brand"];
    if (body?.cardScript && typeof body.cardScript === "object") cardScript = body.cardScript;
    if (body?.imagePostScript && typeof body.imagePostScript === "object") imagePostScript = body.imagePostScript;
    topic = (body?.topic ?? "").toString().trim();
    // Tương thích ngược: mode 'card' -> type 'video'
    const rawType = body?.type ?? (body?.mode === "card" ? "video" : undefined);
    type = rawType === "imagepost" ? "imagepost" : "video";
    if (isAspectRatio(body?.aspectRatio)) aspectRatio = body.aspectRatio;
    if (isDuration(body?.duration)) duration = body.duration;
    useNews = Boolean(body?.useNews);
    noApiMode = Boolean(body?.noApiMode);
    ollamaMode = Boolean(body?.ollamaMode);
    ollamaHost = (body?.ollamaHost ?? "").toString().trim();
    ollamaModel = (body?.ollamaModel ?? "").toString().trim();
    newsQuery = (body?.newsQuery ?? "").toString().trim();
    geminiKey = (body?.geminiKey ?? "").toString().trim();
    if (typeof body?.voice === "string" && /^[a-z]{2}-[A-Z]{2}-\w+$/.test(body.voice)) voice = body.voice;
    if (typeof body?.rate === "string") rate = RATE_MAP[body.rate] ?? RATE_MAP.normal;

    newsSourceType = body?.newsSourceType === "manual" ? "manual" : "auto";
    newsTimeframe = (body?.newsTimeframe ?? "").toString().trim();
    if (body?.newsCustomDays) newsCustomDays = Number(body.newsCustomDays);
    if (Array.isArray(body?.newsManualUrls)) {
      newsManualUrls = body.newsManualUrls.map((u: any) => String(u).trim()).filter(Boolean);
    }
    if (body?.count) count = Number(body.count);
    if (body?.postRatio) postRatio = String(body.postRatio);
    useCoverImage = Boolean(body?.useCoverImage);
  } catch {
    return new Response(JSON.stringify({ error: "Body JSON không hợp lệ" }), { status: 400 });
  }

  if (!topic && !preset) {
    return new Response(JSON.stringify({ error: "Thiếu 'topic' hoặc 'preset'" }), { status: 400 });
  }
  if (topic.length > 2000) {
    return new Response(JSON.stringify({ error: "Chủ đề quá dài (tối đa 2000 ký tự)" }), { status: 400 });
  }
  // Preset hoặc AI Local hoặc noApiMode -> không cần Gemini key
  if (!preset && !noApiMode && !ollamaMode && !geminiKey && !process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
    return new Response(JSON.stringify({ error: "Cần Gemini API key hoặc bật chế độ AI Local (Ollama)." }), { status: 400 });
  }

  const jobLabel = `${type}:${aspectRatio}:${duration}`;
  if (!tryAcquire(jobLabel)) {
    return new Response(
      JSON.stringify({ error: `Đang bận xử lý job khác (${currentJobLabel()}). Vui lòng đợi job hiện tại xong.` }),
      { status: 409 },
    );
  }

  const opts: PipelineOptions = {
    useNews,
    noApiMode,
    newsSourceType: newsSourceType as "auto" | "manual",
    newsQuery,
    newsTimeframe: newsTimeframe || undefined,
    newsManualUrls,
    geminiKey,
    ollamaMode,
    ollamaHost: ollamaHost || undefined,
    ollamaModel: ollamaModel || undefined,
    aspectRatio,
    duration,
    voice,
    rate,
    cardScript,
    imagePostScript,
    bgMusic: useMusic ? resolveBgMusic() : undefined,
    signal: request.signal,
    preset: preset || undefined,
    brand: brandFromBody ?? loadBrandJson(),
    count,
    postRatio: postRatio as any,
    useCoverImage,
    ttsEngine,
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (e: ProgressEvent) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
        } catch {
          /* stream đã đóng */
        }
      };
      try {
        if (type === "imagepost") {
          await runImagePostPipeline(topic, emit, opts);
        } else if (legacy) {
          await runPipeline(topic, emit, opts);
        } else {
          await runCardPipeline(topic, emit, opts);
        }
      } catch (err) {
        const aborted = (err instanceof Error && err.name === "AbortError") || request.signal.aborted;
        if (aborted) {
          emit({ type: "status", message: "Đã hủy job." });
        } else {
          emit({ type: "error", message: err instanceof Error ? err.message : String(err) });
        }
      } finally {
        release();
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
