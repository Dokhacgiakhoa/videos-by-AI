import { z } from "zod";
import { durationPlan, type DurationPlan } from "./aspect";
import { fetchWithRetry } from "./http";

/**
 * Sinh nội dung video dạng "THẺ" (cho format motion-graphics AI91) bằng Gemini.
 * Mỗi scene gồm: lời thoại (voiceOver) + 1 thẻ (title hoặc list).
 * durationInFrames sẽ được tính sau từ độ dài audio thực tế.
 */

const CardSchema = z.object({
  name: z.string(),
  label: z.string().optional(),
  pillDay: z.string().optional(),
  badges: z.array(z.string()).max(4),
  tag: z.string(),
  stat: z.string(),
  statSuffix: z.string(),
  lab1: z.string(),
  lab2: z.string(),
  cmd: z.string(),
  star: z.string(),
});

const SceneSchema = z.object({
  voiceOver: z.string(),
  card: CardSchema,
});

const CardScriptSchema = z.object({
  title: z.string(),
  scenes: z.array(SceneSchema).min(3).max(100),
});

export type CardScene = z.infer<typeof SceneSchema>;
export type CardScript = z.infer<typeof CardScriptSchema>;

const BASE = "https://generativelanguage.googleapis.com/v1beta";

export async function geminiGenerateCards(
  topic: string,
  newsContext?: string,
  geminiKey?: string,
  plan: DurationPlan = durationPlan("short"),
): Promise<CardScript> {
  const key = geminiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("Cần Gemini API key cho format Card. Nhập key trên giao diện hoặc đặt GEMINI_API_KEY trong .env.local.");
  const model = process.env.GEMINI_TEXT_MODEL ?? "gemini-2.5-flash";

  const newsBlock = newsContext
    ? `
DỮ LIỆU TIN TỨC THẬT (mới nhất, báo chí Việt Nam) — CHỈ dựa vào đây, KHÔNG bịa thêm:
${newsContext}
`
    : "";

  const wordsPerScene = Math.round(plan.wordBudget / plan.sceneCount);
  const prompt = `Bạn là chuyên gia dựng video ngắn dạng motion-graphics "thẻ thông tin kỹ thuật" (tech explainer).
Chủ đề: "${topic}".
${newsBlock}
Tạo CHÍNH XÁC khoảng ${plan.sceneCount} scene (tối thiểu ${Math.max(3, plan.sceneCount - 2)}, tối đa ${plan.sceneCount + 2}).
QUAN TRỌNG VỀ THỜI LƯỢNG: TỔNG lời đọc (voiceOver của tất cả scene cộng lại) phải khoảng ${plan.wordBudget} TỪ tiếng Việt (mỗi scene ~${wordsPerScene} từ, tức 2-4 câu). Viết đủ dài, sinh động, trôi chảy — đây là video dài ~${Math.round(plan.aimSeconds / 60)} phút.
Mỗi scene gồm "voiceOver" (lời thoại giải thích chi tiết trôi chảy mạch lạc) và "card" hiển thị giao diện thẻ kỹ thuật.

Cấu trúc của "card" gồm các trường sau:
- "name": Tên từ khóa hoặc công nghệ chính, IN HOA (ví dụ: FIRECRAWL, GEMINI 2.5, DEEPSEEK V3, AI VIETNAM).
- "label": Nhãn phụ trên cùng (ví dụ: "aidev.repo · daily" hoặc tên chuyên mục của bạn).
- "pillDay": Nhãn màu cam nổi bật góc phải trên (ví dụ: "REPO OF THE DAY", "AI NEWS", "HOT TOPIC").
- "badges": Mảng gồm 2-3 nhãn đặc tính ngắn (ví dụ: ["MIT", "TypeScript", "API"]).
- "tag": Dòng mô tả tagline ngắn gọn, súc tích (có thể chứa thẻ <em>...</em> để in đậm/tô sáng cụm từ khóa quan trọng).
- "stat": Con số thống kê nổi bật (ví dụ: "96", "95", "45", "10", v.v.).
- "statSuffix": Hậu tố của con số thống kê (ví dụ: "%", "K★", "+", "x").
- "lab1": Nhãn mô tả thống kê dòng 1 (ví dụ: "phủ", "sao", "sàn").
- "lab2": Nhãn mô tả thống kê dòng 2 (ví dụ: "toàn web", "trên GitHub", "được hỗ trợ").
- "cmd": Lệnh terminal ví dụ chạy công cụ (ví dụ: "npx firecrawl-mcp", "npm i puppeteer", "pip install kronos").
- "star": Chuỗi ký tự biểu thị số star hoặc thông tin footer bên trái (ví dụ: "12.3K", "95K", "4.2K").

LƯU Ý: chỉ có voiceOver được DÀI; mọi CHỮ HIỂN THỊ trên card phải ngắn gọn, tinh giản để khớp khung hình mà không bị tràn chữ.

Trả về JSON thuần đúng cấu trúc:
{"title":"...","scenes":[{"voiceOver":"...","card":{"name":"FIRECRAWL","label":"aidev.repo · daily","pillDay":"REPO OF THE DAY","badges":["MIT","TypeScript","API"],"tag":"Crawl & cào mọi website thành <em>dữ liệu sạch cho LLM</em> — không cần sitemap.","stat":"96","statSuffix":"%","lab1":"phủ","lab2":"toàn web","cmd":"npx firecrawl-mcp","star":"12.3K"}}]}`;

  const res = await fetchWithRetry(
    `${BASE}/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, responseMimeType: "application/json" },
      }),
    },
    { label: "Gemini (kịch bản thẻ)" },
  );
  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini không trả về nội dung thẻ.");

  const cleanJson = text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
  return CardScriptSchema.parse(JSON.parse(cleanJson));
}

const LAYOUT_TYPES = [
  "card", "title", "list", "chart", "bento", "quote", "stats-grid",
  "timeline", "code-snippet", "cream", "manim", "text-image", "text-video", "split-3d", "outro",
] as const;

const LAYOUT_DESCRIPTIONS = `
- "card": thẻ kỹ thuật mặc định (badges, stat, terminal). Dùng khi giới thiệu 1 tool/công nghệ cụ thể.
- "title": tiêu đề lớn gradient + subtitle. Dùng cho intro/hook/chuyển chủ đề.
- "list": tiêu đề + danh sách gạch đầu dòng (listItems). Dùng khi liệt kê 3-5 điểm.
- "chart": biểu đồ cột (chartData:[{label,value}]). Dùng khi có dữ liệu số so sánh.
- "bento": lưới ô thông tin (bentoItems:[{title,desc}]). Dùng khi giới thiệu nhiều tính năng song song.
- "quote": trích dẫn nổi bật (quoteText, quoteAuthor). Dùng cho nhấn mạnh thông điệp.
- "stats-grid": lưới 4 con số (sgStats:[{val,suffix,label}]). Dùng khi tổng kết/thống kê.
- "timeline": dòng thời gian (tlNodes:[{year,event}]). Dùng cho lộ trình/lịch sử.
- "code-snippet": khung code (csCode). Dùng khi giới thiệu API/lệnh/đoạn code.
- "cream": nền kem tối giản (creamTitle, chatUser, chatBot, progressLabel, progressPct). Dùng cho demo chat/AI.
- "manim": nền đen toán học (manimTitle, mapLeft1→mapRight1). Dùng cho giải thích khái niệm/ánh xạ.
- "text-image": chữ trái + hình mockup 3D phải (tiTitle, tiText, tiImageMock:"sphere"|"cube"|"network"). Dùng cho giới thiệu sản phẩm trực quan.
- "text-video": chữ trái + video mock phải (tvTitle, tvText, tvVideoMock:"radar"|"code"|"pulse"). Dùng cho giới thiệu pipeline/quy trình.
- "split-3d": xếp lớp 3D (s3dTitle, s3dLayers:string[]). Dùng cho kiến trúc hệ thống.
- "outro": logo + slogan + contact (outroSlogan, outroContact). CHỈ dùng cho cảnh cuối.
`.trim();

/**
 * Gọi Gemini assign layoutType + sinh layout-specific data cho từng scene.
 * Nhận cardScript đã có voiceOver → trả lại cardScript với layoutType + data đầy đủ.
 * Nếu có `comment` → Gemini sửa theo feedback user.
 */
export async function geminiAssignLayouts(
  cardScript: CardScript,
  geminiKey?: string,
  comment?: string,
): Promise<CardScript> {
  const key = geminiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("Cần Gemini API key để assign layout.");
  const model = process.env.GEMINI_TEXT_MODEL ?? "gemini-2.5-flash";

  const sceneSummary = cardScript.scenes
    .map((s, i) => `Scene ${i + 1}: "${s.voiceOver.slice(0, 120)}..."`)
    .join("\n");

  const commentBlock = comment
    ? `\n\nUser FEEDBACK (BẮT BUỘC tuân theo):\n${comment}\n`
    : "";

  const prompt = `Bạn là chuyên gia thiết kế video motion-graphics. Dưới đây là kịch bản "${cardScript.title}" gồm ${cardScript.scenes.length} cảnh.

DANH SÁCH SCENE:
${sceneSummary}
${commentBlock}
Nhiệm vụ: Với MỖI scene, hãy:
1. Chọn layoutType phù hợp nhất từ danh sách sau (dựa trên NỘI DUNG voiceOver):
${LAYOUT_DESCRIPTIONS}

2. Sinh DỮ LIỆU HIỂN THỊ cho layout đó. Ví dụ:
   - Nếu chọn "chart" → phải có chartTitle, chartSub, chartData:[{label, value}]
   - Nếu chọn "list" → phải có listTitle, listItems:string[]
   - Nếu chọn "stats-grid" → phải có sgTitle, sgStats:[{val, suffix, label}] (đúng 4 mục)
   - Nếu chọn "bento" → phải có bentoTitle, bentoItems:[{title, desc}] (2-6 mục)
   - Nếu chọn "timeline" → phải có tlTitle, tlNodes:[{year, event}]
   - Nếu chọn "quote" → phải có quoteText, quoteAuthor
   - Nếu chọn "code-snippet" → phải có csTitle, csCode
   - Nếu chọn "title" → phải có titleMain, titleSub
   - Nếu chọn "cream" → phải có creamTitle, progressLabel, progressPct, chatUser, chatBot
   - Nếu chọn "manim" → phải có manimHeader, manimTitle, mapLeft1, mapRight1, mapLeft2, mapRight2
   - Nếu chọn "text-image" → phải có tiTitle, tiText, tiImageMock
   - Nếu chọn "text-video" → phải có tvTitle, tvText, tvVideoMock
   - Nếu chọn "split-3d" → phải có s3dTitle, s3dLayers
   - Nếu chọn "outro" → phải có outroSlogan, outroContact
   - Nếu chọn "card" → dùng data card gốc (name, badges, tag, stat...)
3. Giữ NGUYÊN voiceOver gốc (KHÔNG sửa).
4. Đa dạng layout — tránh dùng cùng 1 layout cho quá 3 scene liên tiếp. Scene cuối NÊN là "outro".

QUY TẮC: mọi CHỮ HIỂN THỊ trên layout (title, label, item...) phải NGẮN GỌN, phù hợp khung hình, KHÔNG copy nguyên voiceOver dài.

Trả về JSON: {"title":"...","scenes":[{"voiceOver":"...","card":{...tất cả field bao gồm layoutType + layout data...}}]}`;

  const res = await fetchWithRetry(
    `${BASE}/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, responseMimeType: "application/json" },
      }),
    },
    { label: "Gemini (assign layouts)" },
  );
  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini không trả về layout data.");

  const cleanJson = text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
  const result = JSON.parse(cleanJson) as CardScript;
  result.title = result.title || cardScript.title;
  return result;
}

