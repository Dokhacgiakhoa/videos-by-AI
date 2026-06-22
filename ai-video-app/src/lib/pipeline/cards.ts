import { z } from "zod";

/**
 * Sinh nội dung video dạng "THẺ" (cho format motion-graphics AI91) bằng Gemini.
 * Mỗi scene gồm: lời thoại (voiceOver) + 1 thẻ (title hoặc list).
 * durationInFrames sẽ được tính sau từ độ dài audio thực tế.
 */

const AccentSchema = z.enum(["blue", "yellow", "orange", "green", "white"]).optional();

const TitleCardSchema = z.object({
  type: z.literal("title"),
  label: z.string(),
  headline: z.array(z.object({ text: z.string(), color: AccentSchema })),
  description: z.string(),
  tags: z.array(z.object({ text: z.string(), color: AccentSchema })),
});

const ListCardSchema = z.object({
  type: z.literal("list"),
  label: z.string(),
  headline: z.string(),
  items: z.array(z.object({ tag: z.string(), title: z.string(), subtitle: z.string() })).min(2).max(4),
});

const SceneSchema = z.object({
  voiceOver: z.string(),
  card: z.discriminatedUnion("type", [TitleCardSchema, ListCardSchema]),
});

const CardScriptSchema = z.object({
  title: z.string(),
  scenes: z.array(SceneSchema).min(3).max(6),
});

export type CardScene = z.infer<typeof SceneSchema>;
export type CardScript = z.infer<typeof CardScriptSchema>;

const BASE = "https://generativelanguage.googleapis.com/v1beta";

export async function geminiGenerateCards(topic: string, newsContext?: string): Promise<CardScript> {
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("Thiếu GEMINI_API_KEY trong .env.local.");
  const model = process.env.GEMINI_TEXT_MODEL ?? "gemini-2.5-flash";

  const newsBlock = newsContext
    ? `
DỮ LIỆU TIN TỨC THẬT (mới nhất, báo chí Việt Nam) — CHỈ dựa vào đây, KHÔNG bịa thêm:
${newsContext}
`
    : "";

  const prompt = `Bạn là chuyên gia dựng video ngắn dạng motion-graphics "thẻ thông tin" (giống tech explainer).
Chủ đề: "${topic}".
${newsBlock}
Tạo 3-5 scene. Mỗi scene gồm "voiceOver" (lời đọc tiếng Việt tự nhiên, 1-2 câu, hấp dẫn) và "card" để hiển thị.
Có 2 loại card:
- "title": { type, label (NHÃN IN HOA ngắn), headline (mảng các đoạn {text, color}), description (1-2 câu), tags (2-3 {text,color}) }
  -> headline cắt thành nhiều đoạn, tô màu 1-2 đoạn QUAN TRỌNG. color ∈ blue|yellow|orange|green|white (mặc định white).
- "list": { type, label, headline (1 dòng), items (2-4 {tag (NHÃN trái IN HOA), title (đậm ngắn), subtitle (mô tả ngắn)}) }
Scene đầu nên là "title" làm mở màn (hook). Xen kẽ list cho phần liệt kê.
Mọi chữ hiển thị NGẮN GỌN (tiêu đề ≤ 8 từ, subtitle ≤ 7 từ) để vừa khung dọc.

Trả về JSON thuần đúng cấu trúc:
{"title":"...","scenes":[{"voiceOver":"...","card":{"type":"title","label":"...","headline":[{"text":"...","color":"orange"}],"description":"...","tags":[{"text":"...","color":"blue"}]}},{"voiceOver":"...","card":{"type":"list","label":"...","headline":"...","items":[{"tag":"...","title":"...","subtitle":"..."}]}}]}`;

  const res = await fetch(`${BASE}/models/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, responseMimeType: "application/json" },
    }),
  });
  if (!res.ok) {
    throw new Error(`Gemini lỗi ${res.status}: ${(await res.text().catch(() => "")).slice(0, 500)}`);
  }
  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini không trả về nội dung thẻ.");

  const cleanJson = text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
  return CardScriptSchema.parse(JSON.parse(cleanJson));
}
