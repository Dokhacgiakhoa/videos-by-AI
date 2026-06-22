import { useVideoConfig } from "remotion";

/** Màu thương hiệu AI91. */
export const COLORS = {
  orange: "#ff7a2f",
  blue: "#4aa3ff",
  yellow: "#ffd24a",
  green: "#5fd38a",
  white: "#ffffff",
  bg: "#070b16",
};

export const BRAND_FONT = '"Segoe UI", system-ui, -apple-system, Arial, sans-serif';

export interface Layout {
  width: number;
  height: number;
  /** Cạnh nhỏ hơn — dùng làm gốc tỉ lệ. */
  base: number;
  /** Quy đổi 1 giá trị thiết kế (gốc theo khung dọc 1080) sang khung hiện tại. */
  u: (designPx: number) => number;
  isWide: boolean; // 16:9
  isSquare: boolean; // 1:1
  isTall: boolean; // 9:16
}

/**
 * Hook tạo hệ số co giãn theo tỉ lệ khung hình hiện tại.
 * Mọi số đo trong component quy về `u(...)` để 1 layout chạy cho cả 9:16 / 1:1 / 16:9.
 */
export function useLayout(): Layout {
  const { width, height } = useVideoConfig();
  const base = Math.min(width, height);
  return {
    width,
    height,
    base,
    u: (designPx: number) => (designPx / 1080) * base,
    isWide: width > height,
    isSquare: width === height,
    isTall: height > width,
  };
}
