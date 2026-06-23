/**
 * Helper fetch có retry/backoff thông minh cho các API cloud (Gemini, Imagen...).
 *
 * - Retry CHỈ khi lỗi *thoáng qua*: lỗi mạng/timeout, hoặc HTTP 429/500/502/503/504.
 * - FAIL-FAST với 400/401/403/404 (sai request / sai key) — ném ngay, KHÔNG chờ retry vô ích.
 * - Backoff lũy thừa (2s, 4s, 6s...), tôn trọng header `Retry-After` khi bị 429.
 * - Hỗ trợ `signal` (AbortSignal) để hủy job giữa chừng (gộp với timeout mỗi request).
 */

/** Lỗi HTTP kèm status để phân biệt loại lỗi. */
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

export interface FetchRetryOptions {
  /** Số lần thử tối đa (mặc định 3). */
  retries?: number;
  /** Backoff cơ bản, ms (mặc định 2000 → 2s, 4s, 6s). */
  baseDelayMs?: number;
  /** Timeout mỗi request, ms (mặc định 120000). */
  timeoutMs?: number;
  /** Tín hiệu hủy từ bên ngoài (hủy job) — gộp với timeout. */
  signal?: AbortSignal;
  /** Nhãn để log/báo lỗi cho dễ hiểu (vd "Gemini text"). */
  label?: string;
}

/** Ngủ `ms`, hủy ngay nếu `signal` abort. */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

/**
 * fetch với retry/backoff. Trả về Response đã `ok` (status 2xx).
 * Ném `HttpError` (status không retry được) hoặc lỗi cuối cùng sau khi hết lượt thử.
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  opts: FetchRetryOptions = {},
): Promise<Response> {
  const { retries = 3, baseDelayMs = 2000, timeoutMs = 120_000, signal, label = "request" } = opts;
  let lastErr: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const combined = signal ? AbortSignal.any([timeoutSignal, signal]) : timeoutSignal;
    try {
      const res = await fetch(url, { ...init, signal: combined });
      if (res.ok) return res;

      const bodySnippet = (await res.text().catch(() => "")).slice(0, 500);
      const friendlyMsg = res.status === 503
        ? `${label}: server đang quá tải (503). Thử lại sau ít phút.`
        : res.status === 429
          ? `${label}: đã vượt giới hạn request (429). Chờ một chút rồi thử lại.`
          : `${label} lỗi ${res.status}: ${bodySnippet}`;
      const httpErr = new HttpError(res.status, friendlyMsg);
      // Lỗi không retry được (sai key/sai request) → ném ngay, không phí thời gian.
      if (!RETRYABLE_STATUS.has(res.status)) throw httpErr;

      lastErr = httpErr;
      const retryAfter = Number(res.headers.get("retry-after"));
      const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : baseDelayMs * attempt;
      if (attempt < retries) {
        console.warn(`[retry] ${label}: HTTP ${res.status}, thử lại sau ${wait}ms (lần ${attempt}/${retries}).`);
        await sleep(wait, signal);
      }
    } catch (err) {
      // HttpError đã ném ở trên = lỗi không retry được → đẩy lên luôn.
      if (err instanceof HttpError) throw err;
      // Job bị hủy từ bên ngoài → dừng ngay, không retry.
      if (signal?.aborted) throw err;
      lastErr = err;
      if (attempt < retries) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[retry] ${label}: ${msg}, thử lại sau ${baseDelayMs * attempt}ms (lần ${attempt}/${retries}).`);
        await sleep(baseDelayMs * attempt, signal);
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(`${label} thất bại sau ${retries} lần thử.`);
}
