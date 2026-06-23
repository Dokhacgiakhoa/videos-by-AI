import { generateCardScriptOnly, generateImagePostScriptOnly, type PipelineOptions } from "@/lib/pipeline/video";
import { isAspectRatio, isDuration } from "@/lib/pipeline/aspect";
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

  const geminiKey = (body?.geminiKey ?? "").toString().trim();
  if (!geminiKey && !process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
    return Response.json({ error: "Cần Gemini API key." }, { status: 400 });
  }

  // Action: assign layouts cho cardScript đã có
  if (body?.action === "assignLayouts") {
    const cardScript = body?.cardScript;
    if (!cardScript || typeof cardScript !== "object") {
      return Response.json({ error: "Thiếu cardScript" }, { status: 400 });
    }
    const comment = (body?.comment ?? "").toString().trim() || undefined;
    try {
      const result = await geminiAssignLayouts(cardScript as Parameters<typeof geminiAssignLayouts>[0], geminiKey, comment);
      return Response.json({ type: "video", cardScript: result });
    } catch (err) {
      return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
  }

  // Action mặc định: sinh kịch bản mới từ topic
  const topic = (body?.topic ?? "").toString().trim();
  if (!topic) return Response.json({ error: "Thiếu 'topic'" }, { status: 400 });

  const opts: PipelineOptions = {
    useNews: Boolean(body?.useNews),
    newsQuery: (body?.newsQuery ?? "").toString().trim(),
    geminiKey,
    aspectRatio: isAspectRatio(body?.aspectRatio) ? body.aspectRatio : "9:16",
    duration: isDuration(body?.duration) ? body.duration : "short",
  };

  const type = body?.type === "imagepost" ? "imagepost" : "video";

  try {
    if (type === "imagepost") {
      const imagePostScript = await generateImagePostScriptOnly(topic, opts);
      return Response.json({ type, imagePostScript });
    }
    const cardScript = await generateCardScriptOnly(topic, opts);
    return Response.json({ type, cardScript });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
