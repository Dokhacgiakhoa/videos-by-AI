# AI91 Medimation — Phần mềm Sản xuất Video Tự động AI

Pipeline chạy **local (localhost)** biến một prompt thành:
- **Video thuyết trình (Card Motion):** lời thoại + phụ đề karaoke đồng bộ từng từ + 15 layout đồ họa động (Remotion + GSAP), xuất MP4 1080p @30fps.
- **Bộ ảnh mạng xã hội (Image Post):** các slide tĩnh dàn trang tự động, xuất JPEG/PNG đóng gói `.zip`.

> Tài liệu đặc tả đầy đủ: xem [`docs/`](docs/) (bộ SRS) và [`docs/SETUP-LOCAL.md`](docs/SETUP-LOCAL.md).

## Công nghệ

| Lớp | Thành phần |
| :-- | :-- |
| Web/Dashboard | Next.js (App Router) + Tailwind + TypeScript |
| LLM | Ollama (`qwen2.5:7b`, local) hoặc Gemini (`gemini-2.5-flash`) — chọn qua `AI_PROVIDER` |
| Giọng đọc (TTS) | Edge-TTS (local qua Python, có word-timestamp) |
| Đồ họa & Render | Remotion (React) + Headless Chromium, GSAP, Framer Motion |
| Ghép & Đóng gói | FFmpeg (video + audio ducking), ZIP (ảnh post) |
| Sinh ảnh | Pollinations (Flux, mặc định) / Google Imagen / ComfyUI local — qua `IMAGE_PROVIDER` |

## Yêu cầu

- Node.js + npm, FFmpeg
- Python + `pip install edge-tts`
- (Tùy chọn) Ollama + model `qwen2.5:7b`; ComfyUI + Flux để sinh ảnh local
- (Tùy chọn) `GEMINI_API_KEY` nếu dùng Gemini

Chi tiết: [`docs/SETUP-LOCAL.md`](docs/SETUP-LOCAL.md).

## Cài & chạy

```bash
npm install          # lần đầu
cp .env.example .env.local   # rồi điền cấu hình
npm run dev          # http://localhost:3000
```

Hoặc trên Windows: chạy [`start.bat`](start.bat) (tự cap GPU 200W, cài deps, mở trình duyệt).

## Cấu trúc thư mục

Xem [`docs/STRUCTURE.md`](docs/STRUCTURE.md) để biết sơ đồ thư mục có chú thích.

## Scripts

| Lệnh | Tác dụng |
| :-- | :-- |
| `npm run dev` | Chạy dev server |
| `npm run build` | Build production |
| `npm run start` | Chạy bản build |
| `npm run lint` | ESLint |
