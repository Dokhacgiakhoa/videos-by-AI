import { spawn } from "child_process";
import fs from "fs";
import path from "path";

export interface VoiceWord {
  word: string;
  start: number; // giây
  end: number; // giây
}

/**
 * Sinh giọng đọc tiếng Việt MIỄN PHÍ bằng Edge-TTS (chạy local qua Python, không cần API key).
 *
 * Yêu cầu: đã cài Python và `pip install edge-tts`.
 *
 * Cấu hình qua biến môi trường (.env.local) — đều có mặc định:
 *   PYTHON_BIN  (mặc định "python")
 *   EDGE_TTS_VOICE (mặc định "vi-VN-HoaiMyNeural"; giọng nam: "vi-VN-NamMinhNeural")
 *
 * @param text Lời thoại (VoiceOver)
 * @param sceneId ID của cảnh (dùng để đặt tên file)
 * @returns Object chứa đường dẫn file audio, file timestamps và mảng word timings
 */
export interface VoiceOptions {
  /** Tên giọng edge-tts, vd "vi-VN-HoaiMyNeural" (nữ) / "vi-VN-NamMinhNeural" (nam). */
  voice?: string;
  /** Tốc độ đọc, định dạng edge-tts vd "+0%", "-15%", "+20%". */
  rate?: string;
  /** Tín hiệu hủy job — kill tiến trình Python edge-tts nếu abort. */
  signal?: AbortSignal;
}

export async function generateVoiceWithTimestamps(text: string, sceneId: string, vopts: VoiceOptions = {}) {
  vopts.signal?.throwIfAborted();
  const pythonBin = process.env.PYTHON_BIN ?? "python";
  const voice = vopts.voice || process.env.EDGE_TTS_VOICE || "vi-VN-HoaiMyNeural";
  const rate = vopts.rate || process.env.EDGE_TTS_RATE || "+0%";

  const audioDir = path.join(process.cwd(), "public", "assets", "audio");
  const dataDir = path.join(process.cwd(), "public", "assets", "data");
  fs.mkdirSync(audioDir, { recursive: true });
  fs.mkdirSync(dataDir, { recursive: true });

  const audioFilename = `${sceneId}.mp3`;
  const audioFilePath = path.join(audioDir, audioFilename);
  const timestampsFilePath = path.join(dataDir, `${sceneId}_timestamps.json`);
  const scriptPath = path.join(process.cwd(), "scripts", "edge_tts_gen.py");

  console.log(`Đang sinh giọng đọc (Edge-TTS) cho: "${text.substring(0, 50)}..."`);

  await new Promise<void>((resolve, reject) => {
    const proc = spawn(
      pythonBin,
      [
        scriptPath,
        "--text", text,
        "--voice", voice,
        "--rate", rate,
        "--out-audio", audioFilePath,
        "--out-json", timestampsFilePath,
      ],
      { stdio: ["ignore", "inherit", "inherit"] },
    );

    const onAbort = () => {
      proc.kill();
      reject(new DOMException("Aborted", "AbortError"));
    };
    if (vopts.signal) {
      if (vopts.signal.aborted) return onAbort();
      vopts.signal.addEventListener("abort", onAbort, { once: true });
    }

    proc.on("error", (err) =>
      reject(
        new Error(
          `Không chạy được Python/Edge-TTS ("${pythonBin}"). Đã cài Python và 'pip install edge-tts' chưa? Chi tiết: ${err.message}`,
        ),
      ),
    );
    proc.on("close", (code) => {
      vopts.signal?.removeEventListener("abort", onAbort);
      code === 0
        ? resolve()
        : reject(new Error(`Edge-TTS thoát với mã lỗi ${code}.`));
    });
  });

  const words = JSON.parse(fs.readFileSync(timestampsFilePath, "utf-8")).words as VoiceWord[];
  console.log(`Đã lưu audio tại ${audioFilePath} và timestamps tại ${timestampsFilePath}`);

  return {
    audioUrl: `/assets/audio/${audioFilename}`,
    timestampsUrl: `/assets/data/${sceneId}_timestamps.json`,
    words,
  };
}
