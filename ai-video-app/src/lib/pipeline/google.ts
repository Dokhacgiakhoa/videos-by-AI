import fs from "fs";
import path from "path";
import { Storyboard, StoryboardSchema } from "../types";

/**
 * Tích hợp Google Gemini API (chạy CLOUD, KHÔNG dùng GPU local — an toàn cho máy đang yếu nguồn).
 * Free tier qua Google AI Studio: https://aistudio.google.com/apikey
 *
 * Cấu hình .env.local:
 *   GEMINI_API_KEY=AIza...            (bắt buộc)
 *   GEMINI_TEXT_MODEL=gemini-2.0-flash        (sinh kịch bản)
 *   GEMINI_IMAGE_MODEL=imagen-3.0-generate-002 (sinh ảnh)
 */

const BASE = "https://generativelanguage.googleapis.com/v1beta";

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!key) {
    throw new Error("Thiếu GEMINI_API_KEY trong .env.local (lấy free tại https://aistudio.google.com/apikey).");
  }
  return key;
}

/** Sinh kịch bản bằng Gemini, trả JSON theo StoryboardSchema. */
export async function geminiGenerateStoryboard(topic: string, newsContext?: string): Promise<Storyboard> {
  const model = process.env.GEMINI_TEXT_MODEL ?? "gemini-2.0-flash";

  const newsBlock = newsContext
    ? `
DỮ LIỆU TIN TỨC THẬT (mới nhất, lấy từ báo chí Việt Nam) — BẮT BUỘC chỉ dựa vào các tin này, KHÔNG bịa thêm sự kiện/số liệu:
${newsContext}

Hãy tóm tắt những tin nổi bật nhất ở trên và phân tích ảnh hưởng tới thị trường Việt Nam.
`
    : "";

  const prompt = `Bạn là một chuyên gia kịch bản video ngắn (Shorts/Reels) triệu view.
Hãy viết một kịch bản siêu lôi cuốn về chủ đề: "${topic}".
${newsBlock}
Yêu cầu:
1. Khoảng 4-6 cảnh, tổng 30-45 giây.
2. Câu đầu là "Hook" cực mạnh. VoiceOver tiếng Việt tự nhiên.
3. imagePrompt BẮT BUỘC bằng TIẾNG ANH, chi tiết (cinematic, photorealistic, 8k, dramatic lighting), KHÔNG có chữ trong ảnh, phong cách nhất quán.

Trả về JSON đúng cấu trúc:
{"title":"...","topic":"...","scenes":[{"id":"scene_1","voiceOver":"...","imagePrompt":"...","durationInSeconds":7}],"totalEstimatedDuration":35}`;

  const res = await fetch(`${BASE}/models/${model}:generateContent?key=${apiKey()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, responseMimeType: "application/json" },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini text lỗi ${res.status}: ${(await res.text().catch(() => "")).slice(0, 500)}`);
  }

  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini không trả về nội dung kịch bản.");
  }

  const cleanJson = text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
  const storyboard = StoryboardSchema.parse(JSON.parse(cleanJson));
  for (const scene of storyboard.scenes) {
    scene.voiceOver = scene.voiceOver.trim().replace(/^[[("'""]+/, "").replace(/[\])"'""]+$/, "").trim();
  }
  return storyboard;
}

/**
 * Sinh ảnh bằng Google. Tự nhận diện loại model:
 *  - "imagen-*"  -> endpoint :predict (hỗ trợ aspectRatio 9:16)
 *  - "gemini-*"  -> endpoint :generateContent (ảnh trả qua inlineData)
 * Lưu ảnh vào public/assets/images và trả về đường dẫn public.
 */
export async function googleGenerateImage(prompt: string, filename: string): Promise<string> {
  const model = process.env.GEMINI_IMAGE_MODEL ?? "imagen-3.0-generate-002";
  const key = apiKey();

  let base64: string | undefined;

  if (model.startsWith("imagen")) {
    const res = await fetch(`${BASE}/models/${model}:predict?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1, aspectRatio: "9:16" },
      }),
    });
    if (!res.ok) {
      throw new Error(`Imagen lỗi ${res.status}: ${(await res.text().catch(() => "")).slice(0, 500)}`);
    }
    const data = await res.json();
    base64 = data?.predictions?.[0]?.bytesBase64Encoded;
  } else {
    // Gemini image generation (generateContent) — ảnh thường vuông, FFmpeg sẽ crop về 9:16
    const res = await fetch(`${BASE}/models/${model}:generateContent?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `${prompt}. Vertical 9:16 composition.` }] }],
        generationConfig: { responseModalities: ["IMAGE"] },
      }),
    });
    if (!res.ok) {
      throw new Error(`Gemini image lỗi ${res.status}: ${(await res.text().catch(() => "")).slice(0, 500)}`);
    }
    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    base64 = parts.find((p: { inlineData?: { data?: string } }) => p?.inlineData?.data)?.inlineData?.data;
  }

  if (!base64) {
    throw new Error("Google không trả về dữ liệu ảnh.");
  }

  const assetsDir = path.join(process.cwd(), "public", "assets", "images");
  fs.mkdirSync(assetsDir, { recursive: true });
  const filePath = path.join(assetsDir, filename);
  fs.writeFileSync(filePath, Buffer.from(base64, "base64"));
  console.log(`Đã lưu ảnh (Google) tại: ${filePath}`);

  return `/assets/images/${filename}`;
}
