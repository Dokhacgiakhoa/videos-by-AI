import type { VoiceWord } from "./voice";

/** Đổi giây -> định dạng thời gian ASS: H:MM:SS.cc */
function toAssTime(seconds: number): string {
  const s = Math.max(0, seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const cs = Math.round((s - Math.floor(s)) * 100);
  const pad = (n: number, w = 2) => n.toString().padStart(w, "0");
  return `${h}:${pad(m)}:${pad(sec)}.${pad(cs)}`;
}

/**
 * Tạo nội dung file phụ đề .ass từ danh sách từ + timestamp (phụ đề tiếng Việt,
 * chữ to giữa dưới màn hình, có viền đậm cho dễ đọc trên video dọc 1080x1920).
 *
 * @param words Mảng từ kèm start/end (giây) — lấy từ Edge-TTS
 * @param maxWordsPerLine Số từ tối đa mỗi dòng phụ đề
 */
export function buildAss(words: VoiceWord[], maxWordsPerLine = 5): string {
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,84,&H00FFFFFF,&H000000FF,&H00000000,&H96000000,-1,0,0,0,100,100,0,0,1,5,3,2,90,90,300,163

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const lines: string[] = [];
  for (let i = 0; i < words.length; i += maxWordsPerLine) {
    const chunk = words.slice(i, i + maxWordsPerLine);
    if (chunk.length === 0) continue;
    const start = toAssTime(chunk[0].start);
    const end = toAssTime(chunk[chunk.length - 1].end);
    // Bỏ ký tự xuống dòng/đặc biệt có thể phá cú pháp ASS
    const text = chunk
      .map((w) => w.word)
      .join(" ")
      .replace(/[\r\n]+/g, " ")
      .replace(/\{|\}/g, "");
    lines.push(`Dialogue: 0,${start},${end},Default,,0,0,0,,${text}`);
  }

  return header + lines.join("\n") + "\n";
}
