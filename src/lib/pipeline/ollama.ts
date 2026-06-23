import { fetchWithRetry } from "./http";

export interface OllamaOptions {
  host?: string;
  model?: string;
  temperature?: number;
  label?: string;
  signal?: AbortSignal;
}

/**
 * Gọi sinh nội dung bằng Ollama cục bộ.
 * Hỗ trợ định dạng JSON bắt buộc từ Ollama ("format": "json").
 */
export async function ollamaGenerateContent(
  prompt: string,
  opts: OllamaOptions = {}
): Promise<string> {
  const host = (opts.host ?? process.env.OLLAMA_HOST ?? "http://localhost:11434").replace(/\/$/, "");
  const model = opts.model ?? process.env.OLLAMA_MODEL ?? "qwen2.5:7b";
  const url = `${host}/api/chat`;

  console.log(`[Ollama] Đang gửi yêu cầu tới model: ${model} tại ${host}`);

  try {
    const res = await fetchWithRetry(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          stream: false,
          format: "json",
          options: {
            temperature: opts.temperature ?? 0.8,
          },
        }),
      },
      {
        label: opts.label ?? `Ollama (${model})`,
        retries: 2,
        signal: opts.signal,
      }
    );

    const data = await res.json();
    const text: string | undefined = data?.message?.content;
    if (!text) {
      throw new Error(`Ollama không trả về nội dung.`);
    }

    console.log(`[Ollama] Đã sinh nội dung thành công.`);
    return text.trim();
  } catch (err: any) {
    console.error(`[Ollama] Lỗi:`, err.message || err);

    // Bắt lỗi không kết nối được (rớt mạng/chưa bật Ollama)
    if (err.message?.includes("fetch failed") || err.message?.includes("ECONNREFUSED")) {
      throw new Error(
        `[ERR_OLLAMA_CONN] Không thể kết nối với Ollama tại ${host}. Hãy chắc chắn rằng ứng dụng Ollama đã được khởi động.`
      );
    }

    // Bắt lỗi thiếu model
    if (err.message?.toLowerCase().includes("not found") || err.message?.toLowerCase().includes("pull")) {
      throw new Error(
        `[ERR_OLLAMA_MODEL] Mô hình "${model}" chưa được tải. Vui lòng mở Terminal và chạy lệnh: "ollama run ${model}" để tải về.`
      );
    }

    throw err;
  }
}
