import fs from "fs";
import path from "path";
import { imageDims, type AspectRatio, type Dimensions } from "./aspect";

/**
 * Sinh ảnh AI MIỄN PHÍ qua Pollinations.ai (chạy Flux trên server của họ — KHÔNG cần API key,
 * KHÔNG dùng GPU máy bạn). Phù hợp khi không muốn ép GPU local.
 *
 * Cấu hình .env.local (đều có mặc định):
 *   POLLINATIONS_MODEL=flux
 *   POLLINATIONS_BASE=https://image.pollinations.ai
 *
 * @param prompt Mô tả ảnh (tiếng Anh)
 * @param filename Tên file lưu (vd scene_1.png)
 * @param dims Kích thước ảnh theo tỉ lệ (mặc định 9:16)
 * @returns đường dẫn public của ảnh
 */
export async function pollinationsGenerateImage(
  prompt: string,
  filename: string,
  dims?: Dimensions | AspectRatio,
): Promise<string> {
  const base = process.env.POLLINATIONS_BASE ?? "https://image.pollinations.ai";
  const model = process.env.POLLINATIONS_MODEL ?? "flux";
  const { width, height } = typeof dims === "string" ? imageDims(dims) : dims ?? imageDims("9:16");
  const seed = Math.floor(Math.random() * 1_000_000_000);
  const url =
    `${base}/prompt/${encodeURIComponent(prompt)}` +
    `?width=${width}&height=${height}&nologo=true&model=${encodeURIComponent(model)}&seed=${seed}`;

  console.log(`Đang sinh ảnh (Pollinations/${model}) cho: "${prompt.substring(0, 50)}..."`);

  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (ai-video-app)" },
        signal: AbortSignal.timeout(120_000),
      });
      if (!res.ok) {
        throw new Error(`Pollinations lỗi ${res.status}`);
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length < 2000) {
        throw new Error("Ảnh trả về rỗng/quá nhỏ");
      }
      const assetsDir = path.join(process.cwd(), "public", "assets", "images");
      fs.mkdirSync(assetsDir, { recursive: true });
      const filePath = path.join(assetsDir, filename);
      fs.writeFileSync(filePath, buffer);
      console.log(`Đã lưu ảnh tại: ${filePath}`);
      return `/assets/images/${filename}`;
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
  throw new Error(`Pollinations thất bại sau 3 lần thử: ${lastErr instanceof Error ? lastErr.message : lastErr}`);
}
