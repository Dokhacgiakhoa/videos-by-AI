// Kiểu dữ liệu cho video format "thẻ" (motion-graphics) kiểu AI91.

export type Accent = "blue" | "yellow" | "orange" | "green" | "white";

export const ACCENT_HEX: Record<Accent, string> = {
  blue: "#4aa3ff",
  yellow: "#ffd24a",
  orange: "#ff7a2f",
  green: "#5fd38a",
  white: "#ffffff",
};

export interface VoiceWord {
  word: string;
  start: number; // giây
  end: number; // giây
}

export interface Card {
  // Required fields for base compatibility
  name: string;             
  badges: string[];         
  tag: string;              
  stat: string;             
  statSuffix: string;       
  lab1: string;             
  lab2: string;             
  cmd: string;              
  star: string;             
  durationInFrames: number; 
  words?: VoiceWord[];      

  // Explicit layout type indicator (defaults to 'card' if undefined)
  layoutType?: "card" | "cream" | "manim" | "title" | "list" | "text-image" | "text-video" | "chart" | "bento" | "split-3d" | "quote" | "stats-grid" | "timeline" | "code-snippet" | "outro";

  // Optional overrides for 'card'
  label?: string;           
  pillDay?: string;         

  // Data for 'cream'
  creamTitle?: string;
  progressLabel?: string;
  progressPct?: number;
  chatUser?: string;
  chatBot?: string;
  creamSub?: string;

  // Data for 'manim'
  manimHeader?: string;
  manimTitle?: string;
  mapLeft1?: string;
  mapRight1?: string;
  mapLeft2?: string;
  mapRight2?: string;
  manimSub?: string;

  // Data for 'title'
  titleMain?: string;
  titleSub?: string;

  // Data for 'list'
  listTitle?: string;
  listItems?: string[];

  // Data for 'text-image'
  tiTitle?: string;
  tiText?: string;
  tiImageMock?: "sphere" | "cube" | "network";

  // Data for 'text-video'
  tvTitle?: string;
  tvText?: string;
  tvVideoMock?: "radar" | "code" | "pulse";

  // Data for 'chart'
  chartTitle?: string;
  chartSub?: string;
  chartData?: { label: string; value: number }[];

  // Data for 'bento'
  bentoTitle?: string;
  bentoItems?: { title: string; desc: string }[];

  // Data for 'split-3d'
  s3dTitle?: string;
  s3dLayers?: string[];

  // Data for 'quote'
  quoteText?: string;
  quoteAuthor?: string;

  // Data for 'stats-grid'
  sgTitle?: string;
  sgStats?: { val: number; suffix: string; label: string }[];

  // Data for 'timeline'
  tlTitle?: string;
  tlNodes?: { year: string; event: string }[];

  // Data for 'code-snippet'
  csTitle?: string;
  csCode?: string;

  // Data for 'outro'
  outroSlogan?: string;
  outroContact?: string;
}


export interface BrandPalette {
  primary: string;   // → --hot
  secondary: string; // → --cy
  accent: string;    // → --hot2
  bg: string;        // → --bg
  text: string;      // → --ink
}

export interface BrandConfig {
  logoUrl: string;
  palette: BrandPalette;
}

export interface VideoProps {
  brandText: string;
  cards: Card[];
  audioSrc?: string;
  bgMusic?: string;
  width?: number;
  height?: number;
  brand?: BrandConfig;
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
