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
    const aimSeconds = 300; // ~5'
    return {
      targetSeconds: [180, 420],
      aimSeconds,
      wordBudget: Math.round((aimSeconds * WORDS_PER_MINUTE) / 60), // ~1125
      sceneCount: 14,
    };
  }
  const aimSeconds = 120; // ~2'
  return {
    targetSeconds: [60, 180],
    aimSeconds,
    wordBudget: Math.round((aimSeconds * WORDS_PER_MINUTE) / 60), // ~450
    sceneCount: 7,
  };
}

export function isDuration(v: unknown): v is Duration {
  return v === "short" || v === "long";
}
