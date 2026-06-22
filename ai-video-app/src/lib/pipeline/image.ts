import fs from "fs";
import path from "path";
import { imageDims, type AspectRatio, type Dimensions } from "./aspect";

/**
 * Sinh ảnh bằng Flux.1-schnell chạy LOCAL trên ComfyUI (miễn phí, dùng GPU NVIDIA).
 *
 * Yêu cầu: ComfyUI đang chạy (mặc định http://127.0.0.1:8188) và đã có sẵn checkpoint
 * Flux schnell trong ComfyUI/models/checkpoints (mặc định "flux1-schnell-fp8.safetensors").
 *
 * Cấu hình qua biến môi trường (.env.local) — đều có mặc định:
 *   COMFYUI_HOST       (mặc định http://127.0.0.1:8188)
 *   COMFYUI_FLUX_CKPT  (mặc định flux1-schnell-fp8.safetensors)
 *
 * @param prompt Mô tả hình ảnh (Tiếng Anh)
 * @param filename Tên file lưu trữ (ví dụ: scene_1.png)
 * @returns Đường dẫn public tới file ảnh đã lưu
 */
export async function generateAndSaveImage(
  prompt: string,
  filename: string,
  dims?: Dimensions | AspectRatio,
): Promise<string> {
  const host = process.env.COMFYUI_HOST ?? "http://127.0.0.1:8188";
  const ckpt = process.env.COMFYUI_FLUX_CKPT ?? "flux1-schnell-fp8.safetensors";
  const seed = Math.floor(Math.random() * 1_000_000_000_000);
  const { width, height } = typeof dims === "string" ? imageDims(dims) : dims ?? imageDims("9:16");

  // Workflow ComfyUI dạng API cho Flux.1-schnell (kích thước theo tỉ lệ chọn)
  const workflow: Record<string, unknown> = {
    "4": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: ckpt } },
    "5": { class_type: "EmptyLatentImage", inputs: { width, height, batch_size: 1 } },
    "6": { class_type: "CLIPTextEncode", inputs: { text: prompt, clip: ["4", 1] } },
    "7": { class_type: "CLIPTextEncode", inputs: { text: "", clip: ["4", 1] } },
    "3": {
      class_type: "KSampler",
      inputs: {
        seed,
        steps: 4, // schnell chỉ cần ~4 bước
        cfg: 1,
        sampler_name: "euler",
        scheduler: "simple",
        denoise: 1,
        model: ["4", 0],
        positive: ["6", 0],
        negative: ["7", 0],
        latent_image: ["5", 0],
      },
    },
    "8": { class_type: "VAEDecode", inputs: { samples: ["3", 0], vae: ["4", 2] } },
    "9": { class_type: "SaveImage", inputs: { filename_prefix: "aivideo", images: ["8", 0] } },
  };

  console.log(`Đang sinh ảnh (ComfyUI/Flux) cho prompt: "${prompt.substring(0, 50)}..."`);

  // 1) Gửi workflow vào hàng đợi
  let promptId: string;
  try {
    const res = await fetch(`${host}/prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: workflow }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`ComfyUI /prompt lỗi ${res.status}: ${detail}`);
    }
    promptId = ((await res.json()) as { prompt_id: string }).prompt_id;
  } catch (error) {
    console.error("Không kết nối được ComfyUI. Đã khởi động ComfyUI chưa?", error);
    throw new Error(`Không kết nối được ComfyUI tại ${host}. Hãy đảm bảo ComfyUI đang chạy.`);
  }

  // 2) Chờ render xong (poll /history)
  const deadline = Date.now() + 5 * 60 * 1000; // tối đa 5 phút mỗi ảnh
  let imageInfo: { filename: string; subfolder: string; type: string } | undefined;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1500));
    const histRes = await fetch(`${host}/history/${promptId}`);
    if (!histRes.ok) continue;
    const history = (await histRes.json()) as Record<
      string,
      { outputs?: Record<string, { images?: { filename: string; subfolder: string; type: string }[] }> }
    >;
    const entry = history[promptId];
    if (!entry?.outputs) continue;
    for (const nodeOut of Object.values(entry.outputs)) {
      if (nodeOut.images?.length) {
        imageInfo = nodeOut.images[0];
        break;
      }
    }
    if (imageInfo) break;
  }

  if (!imageInfo) {
    throw new Error("ComfyUI không trả về ảnh trong thời gian chờ (timeout 5 phút).");
  }

  // 3) Tải ảnh về public/assets/images
  const assetsDir = path.join(process.cwd(), "public", "assets", "images");
  fs.mkdirSync(assetsDir, { recursive: true });
  const filePath = path.join(assetsDir, filename);

  const viewUrl = `${host}/view?filename=${encodeURIComponent(imageInfo.filename)}&subfolder=${encodeURIComponent(imageInfo.subfolder)}&type=${encodeURIComponent(imageInfo.type)}`;
  const imgRes = await fetch(viewUrl);
  const buffer = Buffer.from(await imgRes.arrayBuffer());
  fs.writeFileSync(filePath, buffer);
  console.log(`Đã lưu ảnh tại: ${filePath}`);

  return `/assets/images/${filename}`;
}
