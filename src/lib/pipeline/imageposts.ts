import { z } from "zod";
import { fetchWithRetry } from "./http";
import { geminiGenerateContentWithFallback } from "./google";
import { ollamaGenerateContent } from "./ollama";

/**
 * Sinh NỘI DUNG bộ ảnh post kiểu bài báo bằng Gemini (KHÔNG sinh ảnh).
 * Mỗi slide gồm: tiêu đề + tóm tắt ngắn + phân loại nguồn ảnh:
 *  - imageMode "photo": nội dung về người/sự vật/sự việc cụ thể → dùng ảnh thật trên web.
 *  - imageMode "generated": nội dung chung chung → tự gen ảnh minh hoạ (free).
 * Pipeline sẽ lấy ảnh sau dựa trên imageMode + imageQuery/imagePrompt.
 */

const SlideSchema = z.object({
  headline: z.string(), // ≤ 12 từ
  summary: z.string().nullish(), // 1–2 câu, ≤ ~40 từ
  caption: z.string().nullish(), // Nội dung chi tiết bài đăng
  source: z.string().nullish(),
  imageMode: z.enum(["photo", "generated"]).default("photo"),
  imageQuery: z.string().nullish(), // từ khoá tìm ảnh (khi photo)
  imagePrompt: z.string().nullish(), // prompt tiếng Anh (khi generated)
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
  ollamaOptions?: { enabled?: boolean; host?: string; model?: string },
): Promise<ImagePostScript> {

  const newsBlock = newsContext
    ? `
DỮ LIỆU TIN TỨC THẬT (mới nhất, báo chí Việt Nam) — danh sách đánh số. Tạo ĐÚNG ${count} slide THEO ĐÚNG THỨ TỰ các tin này (slide i ⟷ tin i). CHỈ dựa vào đây, KHÔNG bịa thêm:
${newsContext}
`
    : "";

  const prompt = `Bạn là biên tập viên tạo BỘ ẢNH POST kiểu bài báo cho mạng xã hội (carousel "điểm tin").
Chủ đề: "${topic}".
${newsBlock}
Tạo CHÍNH XÁC ${count} slide. Mỗi slide là 1 thẻ tin gồm:
- "headline": tiêu đề tiếng Việt GIẬT GÂN, NGẮN GỌN (tối đa 50 ký tự) để in lên ảnh. BẮT BUỘC có Chủ thể rõ ràng và Hành động/Sự kiện.
- "summary": 1–2 câu tóm tắt để in lên ảnh (≤ 40 từ). YÊU CẦU CẤU TRÚC: BẮT BUỘC phải là CÂU GHÉP (hoặc nhiều câu đơn) có ÍT NHẤT 2 VẾ thể hiện rõ QUAN HỆ NHÂN QUẢ (Ví dụ: Vì A xảy ra nên dẫn tới B, Sự kiện X khiến Y thay đổi). Tuyệt đối KHÔNG viết câu đơn sáo rỗng.
- "caption": NỘI DUNG CHI TIẾT của bài viết (dùng làm caption đăng mạng xã hội). YÊU CẦU BẮT BUỘC: Phải bóc tách và diễn giải các thông tin thực tế (Ai, Sự kiện gì, Nguyên nhân nào, Kết quả ra sao) từ bản tin gốc. KHÔNG VIẾT CHUNG CHUNG, VÔ NGHĨA. Viết dài tối thiểu 100 chữ, văn phong báo chí cuốn hút, chia đoạn rõ ràng.
- "source": tên nguồn tin nếu có (tuỳ chọn).
- "imageMode": LUÔN ƯU TIÊN chọn "photo" (tìm ảnh thật). CHỈ chọn "generated" nếu nội dung quá trừu tượng không thể có ảnh thật.
- "imageQuery": (BẮT BUỘC khi chọn photo) từ khoá ngắn để tìm ảnh thật trên web (tên riêng, sự kiện cụ thể).
- "imagePrompt": BẮT BUỘC CHO TẤT CẢ CÁC SLIDE (kể cả photo, dùng làm dự phòng nếu web lỗi). ĐÂY LÀ PROMPT SINH ẢNH MINH HỌA SÁT VỚI NỘI DUNG SUMMARY. BẮT BUỘC VIẾT BẰNG TIẾNG ANH THEO CÔNG THỨC 4 PHẦN: [1. Chủ thể & Hành động: MÔ TẢ CHÍNH XÁC VÀ BÁM SÁT Ý NGHĨA CỦA BÀI VIẾT, KHÔNG ĐƯỢC LẠC ĐỀ], [2. Bối cảnh & Môi trường], [3. Phong cách nghệ thuật: cinematic, photorealistic, 8k], [4. Ánh sáng, Không khí & Góc máy: dramatic lighting, highly detailed]. TUYỆT ĐỐI KHÔNG CÓ CHỮ (no text) trong ảnh.

Trả về JSON thuần đúng cấu trúc:
{"title":"...","slides":[{"headline":"...","summary":"...","caption":"...","source":"...","imageMode":"photo","imageQuery":"...","imagePrompt":"..."}]}`;

  let text: string;
  if (ollamaOptions?.enabled) {
    text = await ollamaGenerateContent(prompt, {
      host: ollamaOptions.host,
      model: ollamaOptions.model,
      temperature: 0.85,
      label: "Ollama (nội dung ảnh post)",
    });
  } else {
    const key = geminiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!key) throw new Error("Cần Gemini API key cho ảnh post. Nhập key trên giao diện hoặc đặt GEMINI_API_KEY.");
    text = await geminiGenerateContentWithFallback(key, prompt, {
      temperature: 0.85,
      responseMimeType: "application/json",
      label: "Gemini (nội dung ảnh post)",
      preferredModel: process.env.GEMINI_TEXT_MODEL ?? "gemini-1.5-flash",
    });
  }

  const cleanJson = text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
  return ImagePostScriptSchema.parse(JSON.parse(cleanJson));
}
