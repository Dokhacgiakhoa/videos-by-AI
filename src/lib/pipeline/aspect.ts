/**
 * Nguồn sự thật DUY NHẤT cho kích thước khung hình + kế hoạch thời lượng.
 * Mọi file khác (image gen, Remotion render, prompt LLM) import từ đây.
 */

export type AspectRatio = "9:16" | "1:1" | "16:9";
export type Duration = "short" | "long";

export interface Dimensions {
  width: number;
  height: number;
}

/** Kích thước VIDEO (Remotion render) theo tỉ lệ. */
export const VIDEO_DIMS: Record<AspectRatio, Dimensions> = {
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
  "16:9": { width: 1920, height: 1080 },
};

/**
 * Kích thước ẢNH AI sinh ra theo tỉ lệ (giữ ~1MP, bội số 16 cho SD/Flux).
 * 9:16 -> 768x1344, 1:1 -> 1024x1024, 16:9 -> 1344x768.
 */
export const IMAGE_DIMS: Record<AspectRatio, Dimensions> = {
  "9:16": { width: 768, height: 1344 },
  "1:1": { width: 1024, height: 1024 },
  "16:9": { width: 1344, height: 768 },
};

const ASPECTS: AspectRatio[] = ["9:16", "1:1", "16:9"];

export function isAspectRatio(v: unknown): v is AspectRatio {
  return typeof v === "string" && (ASPECTS as string[]).includes(v);
}

/**
 * Tỉ lệ RIÊNG cho ẢNH POST (album bài viết) — mỗi slide chọn 1 tỉ lệ.
 * Tách khỏi AspectRatio (video/Imagen chỉ nhận 9:16/1:1/16:9) để thêm 4:5, 2:1
 * mà không phá pipeline video. Mọi khung lấy bề rộng chuẩn 1080 cho social.
 */
export type PostRatio = "1:1" | "4:5" | "9:16" | "2:1" | "16:9";

export const POST_DIMS: Record<PostRatio, Dimensions> = {
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
  "9:16": { width: 1080, height: 1920 },
  "2:1": { width: 1080, height: 540 },
  "16:9": { width: 1080, height: 608 },
};

/**
 * AI Models (Flux, SDXL) sinh ảnh đẹp nhất ở các tỉ lệ chuẩn (1:1, 16:9, 9:16).
 * Các tỉ lệ dị như 2:1 hay 4:5 nếu ép gen trực tiếp thường bị méo hình.
 * Hàm này map tỉ lệ post về tỉ lệ AI chuẩn gần nhất để gen, sau đó UI/Video sẽ tự crop (object-cover).
 */
export function getAIAspectRatio(r: PostRatio): AspectRatio {
  if (r === "9:16") return "9:16";
  if (r === "1:1") return "1:1";
  if (r === "16:9") return "16:9";
  if (r === "2:1") return "16:9"; // 2:1 gần với 16:9, gen 16:9 rồi crop trên/dưới
  if (r === "4:5") return "1:1"; // 4:5 gần với 1:1, gen 1:1 rồi crop 2 bên
  return "1:1";
}

const POST_RATIOS: PostRatio[] = ["1:1", "4:5", "9:16", "2:1", "16:9"];

export function isPostRatio(v: unknown): v is PostRatio {
  return typeof v === "string" && (POST_RATIOS as string[]).includes(v);
}

export function postDims(r: PostRatio): Dimensions {
  return POST_DIMS[r] ?? POST_DIMS["4:5"];
}

export function videoDims(ar: AspectRatio): Dimensions {
  return VIDEO_DIMS[ar] ?? VIDEO_DIMS["9:16"];
}

export function imageDims(ar: AspectRatio): Dimensions {
  return IMAGE_DIMS[ar] ?? IMAGE_DIMS["9:16"];
}

/** Nhãn aspectRatio mà Imagen (Google) chấp nhận. */
export function imagenAspectLabel(ar: AspectRatio): "9:16" | "1:1" | "16:9" {
  return ar;
}

/**
 * Tốc độ đọc của giọng vi-VN-HoaiMyNeural (edge-tts) — ĐO THỰC TẾ:
 * 112 từ / 29.88s ≈ 225 từ/phút (tiếng Việt đơn âm nên cao). Đo lại bằng
 * scripts/edge_tts_gen.py + ffprobe nếu đổi giọng/tốc độ.
 */
export const WORDS_PER_MINUTE = 225;

export interface DurationPlan {
  /** Khoảng thời lượng mục tiêu [min, max] giây (để hiển thị/cảnh báo). */
  targetSeconds: [number, number];
  /** Số giây nhắm tới (giữa khoảng). */
  aimSeconds: number;
  /** Tổng số từ voiceOver cần để đạt aimSeconds. */
  wordBudget: number;
  /** Số cảnh đề xuất. */
  sceneCount: number;
}

/**
 * Ngắn: nhắm ~2 phút (trong 1-3'). Dài: nhắm ~5 phút (trong 3-7').
 * wordBudget = aimSeconds * WPM / 60.
 */
export function durationPlan(d: Duration): DurationPlan {
  if (d === "long") {
    const aimSeconds = 180; // 3 phút (180s)
    return {
      targetSeconds: [120, 240],
      aimSeconds,
      wordBudget: Math.round((aimSeconds * WORDS_PER_MINUTE) / 60), // ~675 từ
      sceneCount: 40, // 40 cảnh * ~4.5s (linh hoạt 3-6s)
    };
  }
  const aimSeconds = 90; // 90s
  return {
    targetSeconds: [60, 120],
    aimSeconds,
    wordBudget: Math.round((aimSeconds * WORDS_PER_MINUTE) / 60), // ~338 từ
      sceneCount: 20, // 20 cảnh * ~4.5s (linh hoạt 3-6s)
  };
}

export function isDuration(v: unknown): v is Duration {
  return v === "short" || v === "long";
}
