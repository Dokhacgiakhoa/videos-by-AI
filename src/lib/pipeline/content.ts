import { Storyboard, StoryboardSchema } from '../types';
import { durationPlan, type DurationPlan } from './aspect';

/**
 * Sinh kịch bản video bằng LLM chạy LOCAL qua Ollama (miễn phí, không cần API key).
 *
 * Yêu cầu: đã cài Ollama (https://ollama.com) và pull sẵn model, ví dụ:
 *   ollama pull qwen2.5:7b
 *
 * Cấu hình qua biến môi trường (.env.local) — đều có giá trị mặc định:
 *   OLLAMA_HOST  (mặc định http://127.0.0.1:11434)
 *   OLLAMA_MODEL (mặc định qwen2.5:7b)
 *
 * @param topic Chủ đề của video
 * @returns Storyboard object
 */
export async function generateStoryboard(
  topic: string,
  newsContext?: string,
  plan: DurationPlan = durationPlan('short'),
): Promise<Storyboard> {
  const host = process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434';
  const model = process.env.OLLAMA_MODEL ?? 'qwen2.5:7b';

  const newsBlock = newsContext
    ? `
DỮ LIỆU TIN TỨC THẬT (mới nhất, lấy từ báo chí Việt Nam) — BẮT BUỘC chỉ dựa vào các tin này, KHÔNG được bịa thêm sự kiện/số liệu không có ở đây:
${newsContext}

Hãy tóm tắt những tin nổi bật nhất ở trên và phân tích ảnh hưởng tới thị trường Việt Nam, dệt thành một video lôi cuốn.
`
    : '';

  const prompt = `
Bạn là một chuyên gia kịch bản video ngắn (Shorts/Reels) triệu view.
Hãy viết một kịch bản siêu lôi cuốn về chủ đề: "${topic}".
${newsBlock}

Yêu cầu:
1. Độ dài: Khoảng ${plan.sceneCount} cảnh (scenes). TỔNG lời thoại (voiceOver) khoảng ${plan.wordBudget} từ tiếng Việt (~${Math.round(plan.aimSeconds / 60)} phút).
2. Giọng điệu: Hấp dẫn, bí ẩn hoặc kịch tính (tuỳ chủ đề). Câu đầu tiên phải là "Hook" cực mạnh để giữ chân người xem.
3. VoiceOver: Viết bằng tiếng Việt, ngôn từ tự nhiên, ngắt nghỉ hợp lý.
4. ImagePrompt: BẮT BUỘC viết bằng TIẾNG ANH. Đây là prompt cho AI sinh ảnh (Flux), hãy miêu tả cực kỳ chi tiết về góc máy, ánh sáng, phong cách hình ảnh (ví dụ: cinematic, photorealistic, 8k resolution, dramatic lighting, highly detailed). KHÔNG CÓ CHỮ (no text) trong ảnh. Cần giữ phong cách nhất quán giữa các cảnh.

Trả về kết quả DƯỚI DẠNG JSON thuần tuý (không có markdown formatting, không có backticks, không giải thích gì thêm), tuân thủ CHÍNH XÁC cấu trúc sau:
{
  "title": "Tên video",
  "topic": "Chủ đề",
  "scenes": [
    {
      "id": "scene_1",
      "voiceOver": "Lời thoại tiếng Việt...",
      "imagePrompt": "English prompt for image generation...",
      "durationInSeconds": 5
    }
  ],
  "totalEstimatedDuration": 30
}
`;

  let res: Response;
  try {
    res = await fetch(`${host}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        format: 'json', // ép Ollama trả JSON hợp lệ
        options: { temperature: 0.7 },
        messages: [
          {
            role: 'system',
            content:
              'Bạn là hệ thống tự động sinh kịch bản video dưới định dạng JSON. Chỉ trả lời bằng JSON thuần túy.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    });
  } catch (error) {
    console.error('Không kết nối được tới Ollama. Đã chạy `ollama serve` chưa?', error);
    throw new Error(
      `Không kết nối được Ollama tại ${host}. Hãy đảm bảo Ollama đang chạy và đã 'ollama pull ${model}'.`,
    );
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Ollama trả lỗi ${res.status}: ${detail}`);
  }

  const data = (await res.json()) as { message?: { content?: string } };
  const jsonString = data.message?.content?.trim();
  if (!jsonString) {
    throw new Error('Ollama không trả về nội dung. Kiểm tra model đã được pull chưa.');
  }

  try {
    // Phòng khi model vẫn bọc trong markdown dù đã yêu cầu JSON thuần
    const cleanJson = jsonString.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    const parsedData = JSON.parse(cleanJson);
    const storyboard = StoryboardSchema.parse(parsedData);

    // Làm sạch lời thoại: model 7B đôi khi bọc trong [ ] hoặc " " -> bỏ đi cho giọng đọc/phụ đề sạch
    for (const scene of storyboard.scenes) {
      scene.voiceOver = scene.voiceOver
        .trim()
        .replace(/^[[("'""]+/, '')
        .replace(/[\])"'""]+$/, '')
        .trim();
    }
    return storyboard;
  } catch (error) {
    console.error('Lỗi parse/validate JSON từ Ollama:', error, '\nNội dung thô:', jsonString);
    throw error;
  }
}
