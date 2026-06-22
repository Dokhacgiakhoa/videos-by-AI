import { z } from "zod";

/**
 * Sinh nội dung BỘ ẢNH POST kiểu bài báo bằng Gemini.
 * Mỗi slide = 1 ảnh bài báo: headline + ảnh nền (imagePrompt). KHÔNG voiceover, không video.
 */

const SlideSchema = z.object({
  headline: z.string(), // ≤ 12 từ
  subheadline: z.string().optional(),
  imagePrompt: z.string(), // tiếng Anh, không có chữ trong ảnh
  source: z.string().optional(),
});

const ImagePostScriptSchema = z.object({
  title: z.string(),
  slides: z.array(SlideSchema).min(2).max(10),
});

export type ImagePostSlide = z.infer<typeof SlideSchema>;
export type ImagePostScript = z.infer<typeof ImagePostScriptSchema>;

const BASE = "https://generativelanguage.googleapis.com/v1beta";

export async function geminiGenerateImagePosts(
  topic: string,
  newsContext?: string,
  geminiKey?: string,
  count = 5,
): Promise<ImagePostScript> {
  const key = geminiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("Cần Gemini API key cho ảnh post. Nhập key trên giao diện hoặc đặt GEMINI_API_KEY.");
  const model = process.env.GEMINI_TEXT_MODEL ?? "gemini-2.5-flash";

  const newsBlock = newsContext
    ? `
DỮ LIỆU TIN TỨC THẬT (mới nhất, báo chí Việt Nam) — CHỈ dựa vào đây, KHÔNG bịa thêm:
${newsContext}
`
    : "";

  const prompt = `Bạn là biên tập viên tạo BỘ ẢNH POST kiểu bài báo cho mạng xã hội (carousel).
Chủ đề: "${topic}".
${newsBlock}
Tạo CHÍNH XÁC ${count} slide. Mỗi slide là 1 tấm ảnh bài báo gồm:
- "headline": tiêu đề tiếng Việt GIẬT GÂN nhưng chính xác, ≤ 12 từ.
- "subheadline": 1 câu mô tả ngắn (tuỳ chọn, ≤ 18 từ).
- "imagePrompt": prompt TIẾNG ANH chi tiết để sinh ảnh nền (cinematic, photorealistic, 8k, dramatic lighting). TUYỆT ĐỐI KHÔNG có chữ/text trong ảnh. Phong cách nhất quán giữa các slide.
- "source": tên nguồn tin nếu có (tuỳ chọn).
Slide 1 là ảnh "bìa" tổng quan chủ đề (hook mạnh). Các slide sau mỗi cái 1 ý/tin nổi bật.

Trả về JSON thuần đúng cấu trúc:
{"title":"...","slides":[{"headline":"...","subheadline":"...","imagePrompt":"...","source":"..."}]}`;

  const res = await fetch(`${BASE}/models/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.85, responseMimeType: "application/json" },
    }),
  });
  if (!res.ok) {
    throw new Error(`Gemini lỗi ${res.status}: ${(await res.text().catch(() => "")).slice(0, 500)}`);
  }
  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini không trả về nội dung ảnh post.");

  const cleanJson = text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
  return ImagePostScriptSchema.parse(JSON.parse(cleanJson));
}
