import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { buildAss } from "./subtitles";
import type { VoiceWord } from "./voice";

const FFMPEG = process.env.FFMPEG_BIN ?? "ffmpeg";
const FFPROBE = process.env.FFPROBE_BIN ?? "ffprobe";

export interface AssembleScene {
  imagePath: string; // đường dẫn tuyệt đối tới file ảnh
  audioPath: string; // đường dẫn tuyệt đối tới file mp3
  words: VoiceWord[]; // timestamp để làm phụ đề
}

function run(bin: string, args: string[], cwd?: string, signal?: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const proc = spawn(bin, args, { cwd });
    let stderr = "";
    let stdout = "";
    const onAbort = () => {
      proc.kill();
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", (err) =>
      reject(new Error(`Không chạy được "${bin}" (đã cài FFmpeg và có trong PATH chưa?): ${err.message}`)),
    );
    proc.on("close", (code) => {
      signal?.removeEventListener("abort", onAbort);
      code === 0 ? resolve(stdout || stderr) : reject(new Error(`${bin} lỗi (mã ${code}):\n${stderr.slice(-1500)}`));
    });
  });
}

/** Đo thời lượng (giây) của file media bằng ffprobe. */
export async function probeDuration(file: string): Promise<number> {
  const out = await run(FFPROBE, [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=nw=1:nk=1",
    file,
  ]);
  const dur = parseFloat(out.trim());
  return Number.isFinite(dur) && dur > 0 ? dur : 3;
}

/**
 * Ghép các cảnh (ảnh + giọng + phụ đề) thành 1 video dọc 1080x1920 (mp4).
 * Mỗi cảnh: ảnh được zoom nhẹ (Ken Burns) trong đúng thời lượng giọng đọc,
 * phụ đề tiếng Việt cháy thẳng vào hình.
 *
 * @returns đường dẫn public của video, ví dụ /assets/videos/<jobId>.mp4
 */
export async function assembleVideo(
  scenes: AssembleScene[],
  jobId: string,
  onProgress?: (msg: string) => void,
): Promise<string> {
  const workDir = path.join(process.cwd(), "public", "assets", "work", jobId);
  const videosDir = path.join(process.cwd(), "public", "assets", "videos");
  fs.mkdirSync(workDir, { recursive: true });
  fs.mkdirSync(videosDir, { recursive: true });

  const clipNames: string[] = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const dur = await probeDuration(scene.audioPath);
    const frames = Math.max(1, Math.round(dur * 30));

    // Phụ đề cho cảnh này (đường dẫn tương đối trong workDir để tránh lỗi escape path Windows)
    const assName = `scene_${i}.ass`;
    fs.writeFileSync(path.join(workDir, assName), buildAss(scene.words), "utf-8");

    const clipName = `scene_${i}.mp4`;
    clipNames.push(clipName);

    const vf =
      `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,` +
      `zoompan=z='min(zoom+0.0012,1.18)':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30,` +
      `subtitles=${assName}`;

    onProgress?.(`Ghép cảnh ${i + 1}/${scenes.length} (${dur.toFixed(1)}s)...`);
    await run(
      FFMPEG,
      [
        "-y",
        "-loop", "1",
        "-t", dur.toFixed(3),
        "-i", scene.imagePath,
        "-i", scene.audioPath,
        "-filter_complex", `[0:v]${vf}[v]`,
        "-map", "[v]",
        "-map", "1:a",
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-pix_fmt", "yuv420p",
        "-r", "30",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        clipName,
      ],
      workDir,
    );
  }

  // Nối tất cả clip lại (cùng thông số codec nên copy được, nhanh)
  const listPath = path.join(workDir, "list.txt");
  fs.writeFileSync(listPath, clipNames.map((c) => `file '${c}'`).join("\n") + "\n", "utf-8");

  const outName = `${jobId}.mp4`;
  const outAbs = path.join(videosDir, outName);
  onProgress?.("Nối các cảnh thành video cuối...");
  await run(FFMPEG, ["-y", "-f", "concat", "-safe", "0", "-i", "list.txt", "-c", "copy", outAbs], workDir);

  return `/assets/videos/${outName}`;
}

/**
 * Nối nhiều file mp3 thành 1 file duy nhất (giữ đúng thứ tự).
 * @returns đường dẫn tuyệt đối tới file output.
 */
export async function concatAudio(audioPaths: string[], outputPath: string, signal?: AbortSignal): Promise<void> {
  const dir = path.dirname(outputPath);
  fs.mkdirSync(dir, { recursive: true });
  const listPath = outputPath + ".list.txt";
  fs.writeFileSync(listPath, audioPaths.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n") + "\n", "utf-8");
  await run(FFMPEG, ["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", outputPath], undefined, signal);
  fs.unlinkSync(listPath);
}
