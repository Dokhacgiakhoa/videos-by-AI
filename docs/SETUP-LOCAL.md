# Chạy pipeline AI video 100% LOCAL (miễn phí $0)

Hướng dẫn cho máy đã được cài đặt sẵn (Windows + NVIDIA RTX 2080 Ti).

## Đã cài đặt sẵn

| Thành phần | Vai trò | Đường dẫn / lệnh |
|-----------|---------|------------------|
| Node.js + npm | Chạy app Next.js | `node`, `npm` |
| FFmpeg | Ghép video (về sau) | `ffmpeg` |
| Ollama + `qwen2.5:7b` | Sinh kịch bản (LLM local) | `ollama` |
| Python + `edge-tts` | Giọng đọc tiếng Việt | `python` |
| ComfyUI portable + Flux schnell | Sinh ảnh AI (GPU) | `D:\ComfyUI_windows_portable` |

> Không cần API key, không tốn tiền. Chỉ cần các service local đang chạy.

## Khởi động 3 service local

### 1. Ollama (kịch bản)
Ollama thường tự chạy nền sau khi cài (icon ở khay hệ thống). Kiểm tra:
```powershell
ollama list          # phải thấy qwen2.5:7b
```
Nếu chưa chạy: mở app Ollama, hoặc chạy `ollama serve`.

### 2. ComfyUI (sinh ảnh) — cần cho khâu hình ảnh
```
Mở thư mục D:\ComfyUI_windows_portable
Chạy: run_nvidia_gpu.bat
```
Đợi tới khi thấy dòng `To see the GUI go to: http://127.0.0.1:8188`.
File model Flux đã nằm sẵn ở `ComfyUI\models\checkpoints\flux1-schnell-fp8.safetensors`.

### 3. Edge-TTS (giọng đọc)
Không cần khởi động — chạy theo nhu cầu qua Python khi app gọi.

## Chạy app

```powershell
cd D:\Videos-by-AI
npm run dev
```
Mở http://localhost:3000

## Pipeline gồm gì (src/lib/pipeline)

| File | Hàm | Công cụ local |
|------|-----|---------------|
| `content.ts` | `generateStoryboard(topic)` | Ollama → JSON kịch bản |
| `voice.ts` | `generateVoiceWithTimestamps(text, sceneId)` | Edge-TTS → mp3 + timestamps theo từ |
| `image.ts` | `generateAndSaveImage(prompt, filename)` | ComfyUI/Flux → ảnh 9:16 |
| `upload.ts` | `uploadToYouTubeShorts / uploadToTikTok` | (chưa hoàn thiện — TODO) |

Ảnh/giọng sinh ra được lưu vào `public/assets/{images,audio,data}`.

## Cấu hình (tuỳ chọn)

Mọi tham số đều có mặc định trong code. Muốn đổi thì tạo `.env.local` (xem `.env.example`):
- `OLLAMA_MODEL` — đổi model LLM (vd `llama3.1:8b`)
- `EDGE_TTS_VOICE` — `vi-VN-HoaiMyNeural` (nữ) / `vi-VN-NamMinhNeural` (nam)
- `COMFYUI_FLUX_CKPT` — tên file checkpoint trong ComfyUI

## ⚠️ QUAN TRỌNG: Giới hạn điện GPU (chống sập máy)

Máy từng bị **sập nguồn / BSOD 0x1E** khi sinh ảnh do RTX 2080 Ti spike công suất (tới ~325W),
nghi do PSU không chịu nổi. Cách khắc phục: hạ trần công suất GPU xuống **200W**.

> Sau khi cap 200W, công suất đỉnh khi sinh ảnh chỉ ~197W và chạy ổn định, ảnh vẫn đẹp.

**Cap này TỰ RESET mỗi lần khởi động máy.** Có 2 cách:

**Cách 1 — chạy tay sau mỗi lần bật máy** (PowerShell *Run as administrator*):
```powershell
nvidia-smi -pl 200
```

**Cách 2 — tự động áp dụng mỗi lần khởi động** (chạy 1 lần trong PowerShell Admin):
```powershell
$nv = "C:\Windows\System32\nvidia-smi.exe"
schtasks /Create /TN "GPU Power Cap 200W" /TR "$nv -pl 200" /SC ONSTART /RU SYSTEM /RL HIGHEST /F
```
Sau đó mỗi lần bật máy GPU sẽ tự bị cap 200W, không cần làm gì thêm.
Muốn gỡ: `schtasks /Delete /TN "GPU Power Cap 200W" /F`

Nếu vẫn sập, hạ tiếp xuống 180W hoặc 150W (`nvidia-smi -pl 150`). Về lâu dài nên kiểm tra/thay PSU.

## ✅ Luồng "nhập prompt → ra video mp4" (ĐÃ HOÀN THIỆN)

1. Mở http://localhost:3000 → nhập ý tưởng → bấm **Tạo video**.
2. Trang gọi `POST /api/generate` (streaming tiến độ realtime), chạy `runPipeline` trong `src/lib/pipeline/video.ts`:
   kịch bản (Ollama) → từng cảnh: ảnh (Flux) + giọng (Edge-TTS) → ghép FFmpeg.
3. Ghép video: `src/lib/pipeline/assemble.ts` — mỗi cảnh là ảnh zoom nhẹ (Ken Burns) dài đúng bằng giọng đọc,
   phụ đề tiếng Việt cháy thẳng vào hình (`subtitles.ts` tạo file .ass), xuất video dọc **1080×1920**.
4. Video lưu ở `public/assets/videos/<jobId>.mp4`, xem/tải ngay trên giao diện.

> Đã test thật: prompt tin A5→ video 40s, 4 cảnh, ảnh AI đẹp + giọng Việt + phụ đề chuẩn.

### ⚠️ Lưu ý về nội dung "bản tin"
qwen2.5 chạy **offline, không có internet** → nó **tự bịa** nội dung tin theo chủ đề, KHÔNG lấy tin thật.
Muốn tin thật: bật "Dựa trên tin thật" trên UI (Google News RSS, không cần key).

## 🆕 Tính năng V2

Giao diện giờ có 2 loại sản phẩm + nhiều tuỳ chọn:

| Tính năng | Mô tả |
|-----------|-------|
| **Loại sản phẩm** | 🎬 **Video** (Card Motion + giọng đọc) hoặc 🖼️ **Ảnh post** (bộ ảnh bài báo tĩnh, có nút tải .zip) |
| **Tỉ lệ khung hình** | 9:16 (dọc) · 1:1 (vuông) · 16:9 (ngang) — áp cho cả video lẫn ảnh |
| **Thời lượng** (video) | Ngắn ~2 phút / Dài ~5 phút (đổi "ngân sách từ" của kịch bản) |
| **Giọng đọc** | Nữ miền Bắc (HoaiMy) / Nam (NamMinh) + tốc độ chậm/thường/nhanh |
| **Xem trước kịch bản** | Sinh kịch bản → **sửa lời đọc/tiêu đề** → mới Render (tránh chờ render dài rồi mới thấy sai) |
| **Nhạc nền** | Thả 1 file `.mp3` vào `public/assets/music/` → bật checkbox "Nhạc nền" (trộn volume thấp dưới giọng) |
| **Thư viện** | Mục "📚 Thư viện" lưu lại video/ảnh đã tạo — tải lại hoặc xoá (xoá cả file, đỡ đầy đĩa) |
| **1 job/lần** | Chỉ chạy 1 job tại một thời điểm (chống quá tải GPU/CPU → chống BSOD) |

> Mọi sản phẩm đều cần **Gemini API key** (nhập 1 lần trên UI, lưu trong trình duyệt). Lấy free tại https://aistudio.google.com/apikey

### ⏱️ Lưu ý thời gian render
Video dài (3–7 phút) render trên CPU có thể mất **10–30 phút**. App sẽ báo ETA. Mẹo: dùng "Xem trước kịch bản" để chốt nội dung trước, và chọn tỉ lệ/độ dài phù hợp.

### 🖥️ Icon Desktop
Chạy `scripts/make-ico.js` (đã chạy sẵn) tạo `public/ai91-logo.ico`, rồi `create-shortcut.ps1` gán icon AI91 cho shortcut Desktop.

## Còn có thể làm tiếp (tuỳ chọn)
1. **Lấy tin thật**: thêm bước fetch RSS/Google News rồi nhồi vào prompt kịch bản (sẽ cần internet ở khâu này).
2. **Nhạc nền** cho video (FFmpeg trộn thêm 1 track nhạc free).
3. **Auto-upload** YouTube/TikTok — `upload.ts` hiện mới là khung TODO.
4. Đổi model LLM lớn hơn (vd `qwen2.5:14b`) để câu chữ tiếng Việt mượt hơn (7B đôi khi lẫn 1-2 từ tiếng Anh).
