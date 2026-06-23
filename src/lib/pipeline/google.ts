import fs from "fs";
import path from "path";
import { Storyboard, StoryboardSchema } from "../types";
import { imagenAspectLabel, durationPlan, type AspectRatio, type DurationPlan } from "./aspect";
import { fetchWithRetry } from "./http";
import { ollamaGenerateContent } from "./ollama";

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

let _clientKey: string | undefined;

export function setGeminiClientKey(key: string | undefined) {
  _clientKey = key;
}

function apiKey(): string {
  const key = _clientKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) {
    throw new Error("Thiếu GEMINI_API_KEY trong .env.local (lấy free tại https://aistudio.google.com/apikey).");
  }
  return key;
}

/** Sinh kịch bản bằng Gemini, trả JSON theo StoryboardSchema. */
export interface FallbackOptions {
  temperature?: number;
  responseMimeType?: string;
  label?: string;
  preferredModel?: string;
}

/** Gọi Gemini generateContent với chuỗi model dự phòng tự động. */
export async function geminiGenerateContentWithFallback(
  key: string,
  prompt: string,
  options: FallbackOptions = {},
): Promise<string> {
  const primaryModel = options.preferredModel ?? process.env.GEMINI_TEXT_MODEL ?? "gemini-2.5-flash";
  const models = [
    primaryModel,
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-pro-latest",
    "gemini-2.5-pro",
  ].filter((v, i, self) => self.indexOf(v) === i);

  let lastError: any = null;
  for (const model of models) {
    try {
      console.log(`[Gemini] Đang thử sinh nội dung với model: ${model} (${options.label || "request"})`);
      const res = await fetchWithRetry(
        `${BASE}/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: options.temperature ?? 0.8,
              responseMimeType: options.responseMimeType ?? "application/json",
            },
          }),
        },
        {
          label: `${options.label || "Gemini"} (${model})`,
          retries: 2, // Retry ít hơn từng model vì có chuỗi fallback
        }
      );
      
      const data = await res.json();
      const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        console.log(`[Gemini] Đã sinh nội dung thành công bằng model: ${model}`);
        return text;
      }
      throw new Error(`Model ${model} trả về nội dung rỗng`);
    } catch (err: any) {
      console.warn(`[Gemini] Lỗi với model ${model}: ${err.message || err}`);
      lastError = err;
      // 400 (Safety/cú pháp) hoặc 401/403 (sai key) -> ném ngay, không chạy tiếp model khác
      if (err.status === 400 || err.status === 401 || err.status === 403) {
        throw err;
      }
    }
  }
  throw lastError || new Error("Tất cả các model Gemini đều thất bại.");
}

/** Sinh kịch bản bằng Gemini, trả JSON theo StoryboardSchema. */
export async function geminiGenerateStoryboard(
  topic: string,
  newsContext?: string,
  plan: DurationPlan = durationPlan("short"),
  ollamaOptions?: { enabled?: boolean; host?: string; model?: string },
): Promise<Storyboard> {
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
1. Khoảng ${plan.sceneCount} cảnh; TỔNG voiceOver khoảng ${plan.wordBudget} từ tiếng Việt (~${Math.round(plan.aimSeconds / 60)} phút).
2. Câu đầu là "Hook" cực mạnh. VoiceOver tiếng Việt tự nhiên.
3. imagePrompt BẮT BUỘC bằng TIẾNG ANH. ĐÂY LÀ PROMPT SINH ẢNH MINH HỌA SÁT VỚI NỘI DUNG VOICEOVER. BẮT BUỘC ÁP DỤNG CÔNG THỨC 4 PHẦN: [1. Chủ thể & Hành động: MÔ TẢ CHÍNH XÁC VÀ BÁM SÁT Ý NGHĨA CỦA VOICEOVER], [2. Bối cảnh & Môi trường], [3. Phong cách nghệ thuật: cinematic, photorealistic, 8k], [4. Ánh sáng, Không khí & Góc máy: dramatic lighting, highly detailed]. TUYỆT ĐỐI KHÔNG CÓ CHỮ (no text) trong ảnh. Phong cách phải nhất quán.

Trả về JSON đúng cấu trúc:
{"title":"...","topic":"...","scenes":[{"id":"scene_1","voiceOver":"...","imagePrompt":"...","durationInSeconds":7}],"totalEstimatedDuration":35}`;

  let text: string;
  if (ollamaOptions?.enabled) {
    text = await ollamaGenerateContent(prompt, {
      host: ollamaOptions.host,
      model: ollamaOptions.model,
      temperature: 0.8,
      label: "Ollama (kịch bản video)",
    });
  } else {
    text = await geminiGenerateContentWithFallback(
      apiKey(),
      prompt,
      {
        temperature: 0.8,
        responseMimeType: "application/json",
        label: "Gemini text",
        preferredModel: process.env.GEMINI_TEXT_MODEL ?? "gemini-2.5-flash",
      }
    );
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
export async function googleGenerateImage(
  prompt: string,
  filename: string,
  ar: AspectRatio = "9:16",
): Promise<string> {
  const model = process.env.GEMINI_IMAGE_MODEL ?? "imagen-3.0-generate-002";
  const key = apiKey();

  let base64: string | undefined;

  if (model.startsWith("imagen")) {
    const res = await fetchWithRetry(
      `${BASE}/models/${model}:predict?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1, aspectRatio: imagenAspectLabel(ar) },
        }),
      },
      { label: "Imagen" },
    );
    const data = await res.json();
    base64 = data?.predictions?.[0]?.bytesBase64Encoded;
  } else {
    // Gemini image generation (generateContent) — ảnh thường vuông, FFmpeg sẽ crop về 9:16
    const res = await fetchWithRetry(
      `${BASE}/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${prompt}. ${ar === "16:9" ? "Horizontal 16:9 widescreen" : ar === "1:1" ? "Square 1:1" : "Vertical 9:16"} composition.`,
                },
              ],
            },
          ],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
      },
      { label: "Gemini image" },
    );
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
