import { generateCardScriptOnly, runImagePostContent, runImagePostImages, type PipelineOptions, type ProgressEvent, type ImagePostScriptFull, type ImagePostSlideFull } from "@/lib/pipeline/video";
import { isAspectRatio, isDuration, isPostRatio } from "@/lib/pipeline/aspect";
import { geminiAssignLayouts } from "@/lib/pipeline/cards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Sinh KỊCH BẢN để xem trước (không render, nhanh).
 *  Nếu body.action === "assignLayouts" → gọi Gemini assign layout cho cardScript có sẵn.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body JSON không hợp lệ" }, { status: 400 });
  }

  const noApiMode = Boolean(body?.noApiMode);
  const geminiKey = (body?.geminiKey ?? "").toString().trim();
  const hasEnvKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

  // Action: assign layouts cho cardScript đã có
  if (body?.action === "assignLayouts") {
    const cardScript = body?.cardScript;
    if (!cardScript || typeof cardScript !== "object") {
      return Response.json({ error: "Thiếu cardScript" }, { status: 400 });
    }
    const ollamaMode = Boolean(body?.ollamaMode);
    if (!geminiKey && !hasEnvKey && !ollamaMode) {
      return Response.json({ error: "Tính năng Auto Layout yêu cầu Gemini API key hoặc kích hoạt AI Local." }, { status: 400 });
    }
    const comment = (body?.comment ?? "").toString().trim() || undefined;
    try {
      const result = await geminiAssignLayouts(
        cardScript as Parameters<typeof geminiAssignLayouts>[0],
        geminiKey,
        comment,
        {
          enabled: ollamaMode,
          host: body?.ollamaHost ? String(body.ollamaHost) : undefined,
          model: body?.ollamaModel ? String(body.ollamaModel) : undefined,
        }
      );
      return Response.json({ type: "video", cardScript: result });
    } catch (err) {
      return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
  }

  // Nếu không dùng chế độ noApiMode và không dùng AI Local thì bắt buộc có API Key
  const ollamaMode = Boolean(body?.ollamaMode);
  if (!noApiMode && !ollamaMode && !geminiKey && !hasEnvKey) {
    return Response.json({ error: "Cần Gemini API key hoặc bật chế độ AI Local (Ollama)." }, { status: 400 });
  }

  const countRaw = Number(body?.count);
  const opts: PipelineOptions = {
    useNews: Boolean(body?.useNews),
    noApiMode: Boolean(body?.noApiMode),
    newsSourceType: body?.newsSourceType === "manual" ? "manual" : "auto",
    newsQuery: (body?.newsQuery ?? "").toString().trim(),
    newsTimeframe: (body?.newsTimeframe ?? "").toString().trim() || undefined,
    newsManualUrls: Array.isArray(body?.newsManualUrls)
      ? body.newsManualUrls.map((u: any) => String(u).trim()).filter(Boolean)
      : undefined,
    geminiKey,
    ollamaMode,
    ollamaHost: body?.ollamaHost ? String(body.ollamaHost) : undefined,
    ollamaModel: body?.ollamaModel ? String(body.ollamaModel) : undefined,
    aspectRatio: isAspectRatio(body?.aspectRatio) ? body.aspectRatio : "9:16",
    duration: isDuration(body?.duration) ? body.duration : "short",
    count: Number.isFinite(countRaw) ? Math.min(10, Math.max(2, Math.round(countRaw))) : undefined,
    useCoverImage: Boolean(body?.useCoverImage),
    postRatio: isPostRatio(body?.postRatio) ? body.postRatio : undefined,
  };

  // GIAI ĐOẠN 2 (ảnh post): lấy ảnh cho script đã duyệt → stream tiến trình + ảnh từng slide.
  if (body?.action === "imageFetch") {
    const script = body?.imagePostScript;
    if (!script || typeof script !== "object") {
      return Response.json({ error: "Thiếu imagePostScript" }, { status: 400 });
    }
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
          await runImagePostImages(script as ImagePostScriptFull, emit, opts);
        } catch (err) {
          emit({ type: "error", message: err instanceof Error ? err.message : String(err) });
        } finally {
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

  // GIAI ĐOẠN 2b (ảnh post): lấy ảnh cho 1 slide duy nhất.
  if (body?.action === "imageFetchSingle") {
    const slide = body?.slide;
    const index = body?.index;
    if (!slide || index === undefined) {
      return Response.json({ error: "Thiếu slide hoặc index" }, { status: 400 });
    }
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
          // Dynamic import to avoid circular dependency issues if any
          const { runImagePostSingleImage } = await import("@/lib/pipeline/video");
          await runImagePostSingleImage(slide as ImagePostSlideFull, index as number, emit, opts);
        } catch (err) {
          emit({ type: "error", message: err instanceof Error ? err.message : String(err) });
        } finally {
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

  // GIAI ĐOẠN 1: sinh nội dung từ topic (text, nhanh, trả JSON).
  const topic = (body?.topic ?? "").toString().trim();
  if (!topic) return Response.json({ error: "Thiếu 'topic'" }, { status: 400 });

  const type = body?.type === "imagepost" ? "imagepost" : "video";

  try {
    if (type === "imagepost") {
      const imagePostScript = await runImagePostContent(topic, opts);
      return Response.json({ type, imagePostScript });
    }
    const cardScript = await generateCardScriptOnly(topic, opts);
    return Response.json({ type, cardScript });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
