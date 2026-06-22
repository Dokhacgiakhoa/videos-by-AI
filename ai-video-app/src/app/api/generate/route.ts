import { runPipeline, type ProgressEvent } from "@/lib/pipeline/video";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Không giới hạn thời gian (pipeline có thể chạy vài phút)
export const maxDuration = 3600;

export async function POST(request: Request) {
  let topic = "";
  let useNews = false;
  let newsQuery = "";
  try {
    const body = await request.json();
    topic = (body?.topic ?? "").toString().trim();
    useNews = Boolean(body?.useNews);
    newsQuery = (body?.newsQuery ?? "").toString().trim();
  } catch {
    return new Response(JSON.stringify({ error: "Body JSON không hợp lệ" }), { status: 400 });
  }

  if (!topic) {
    return new Response(JSON.stringify({ error: "Thiếu 'topic'" }), { status: 400 });
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
        await runPipeline(topic, emit, { useNews, newsQuery });
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
