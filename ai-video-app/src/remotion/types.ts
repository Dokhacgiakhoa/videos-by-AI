// Kiểu dữ liệu cho video format "thẻ" (motion-graphics) kiểu AI91.

export type Accent = "blue" | "yellow" | "orange" | "green" | "white";

export const ACCENT_HEX: Record<Accent, string> = {
  blue: "#4aa3ff",
  yellow: "#ffd24a",
  orange: "#ff7a2f",
  green: "#5fd38a",
  white: "#ffffff",
};

/** Một đoạn trong tiêu đề lớn — có thể tô màu để nhấn mạnh. */
export interface HeadlineSegment {
  text: string;
  color?: Accent;
}

export interface Tag {
  text: string;
  color?: Accent;
}

export interface ListItem {
  tag: string; // nhãn trái, vd "CYBER"
  title: string; // tiêu đề đậm
  subtitle: string; // mô tả nhỏ
}

/** Thẻ kiểu tiêu đề: nhãn + tiêu đề nhiều màu + mô tả + pill tags. */
export interface TitleCard {
  type: "title";
  label: string;
  headline: HeadlineSegment[];
  description: string;
  tags: Tag[];
  durationInFrames: number;
}

/** Thẻ kiểu danh sách: nhãn + tiêu đề + danh sách mục. */
export interface ListCard {
  type: "list";
  label: string;
  headline: string;
  items: ListItem[];
  durationInFrames: number;
}

export type Card = TitleCard | ListCard;

export interface VideoProps {
  brandText: string;
  cards: Card[];
  /** Đường dẫn audio tương đối trong public/ (vd "assets/audio/x.mp3"), bỏ trống nếu không có. */
  audioSrc?: string;
  /** Nhạc nền (đường dẫn public hoặc trong public/), volume thấp dưới giọng đọc. */
  bgMusic?: string;
  /** Kích thước khung (được calculateMetadata dùng để đổi tỉ lệ). */
  width?: number;
  height?: number;
}

/** Props cho 1 ảnh post tĩnh kiểu bài báo (render bằng renderStill). */
export interface ArticlePostProps {
  width: number;
  height: number;
  headline: string;
  subheadline?: string;
  source?: string;
  date?: string;
  /** URL ảnh nền (http... hoặc đường dẫn trong public/). */
  imageSrc: string;
  brandText: string;
  eyebrow?: string;
  accent?: Accent;
}
