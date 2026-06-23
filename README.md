# AI91 Medimation

<p align="center">
  <img src="public/AI91.jpg" alt="AI91 Logo" width="200" />
</p>

**Phần mềm Sản xuất Video & Ảnh Tự động** bởi **AI91 / Dokhacgiakhoa**

Pipeline chạy **local (localhost)** biến một prompt thành:
- **Video thuyết trình (Card Motion):** lời thoại + phụ đề karaoke + 15 layout đồ họa động (Remotion + GSAP), xuất MP4 1080p @30fps.
- **Bộ ảnh mạng xã hội (Image Post):** slide tĩnh dàn trang tự động, xuất PNG riêng lẻ.

> Tài liệu đặc tả: [`docs/`](docs/) (bộ SRS) | [`docs/SETUP-LOCAL.md`](docs/SETUP-LOCAL.md) | [`docs/STRUCTURE.md`](docs/STRUCTURE.md)

## Công nghệ

| Lớp | Thành phần |
| :-- | :-- |
| Web/Dashboard | Next.js (App Router) + Tailwind + TypeScript |
| LLM | Ollama (`qwen2.5:7b`, local) hoặc Gemini (`gemini-2.5-flash`) |
| Giọng đọc (TTS) | Edge-TTS (local qua Python, word-timestamp tích hợp) |
| Đồ họa & Render | Remotion (React) + Headless Chromium, GSAP, Framer Motion |
| Ghép video | FFmpeg (audio ducking) |
| Sinh ảnh | Pollinations (Flux) / Google Imagen / ComfyUI local |

## Cài & chạy

```bash
npm install
cp .env.example .env.local   # điền cấu hình
npm run dev                   # http://localhost:3000
```

Windows: chạy [`start.bat`](start.bat) (cap GPU 200W, cài deps, mở trình duyệt).

## Scripts

| Lệnh | Tác dụng |
| :-- | :-- |
| `npm run dev` | Dev server |
| `npm run build` | Build production |
| `npm run start` | Chạy bản build |
| `npm run lint` | ESLint |

---

## Bản quyền

Copyright (c) 2024-2026 **AI91** / **Dokhacgiakhoa** (dokhacgiakhoa666@gmail.com)

Dự án được phát hành theo giấy phép [MIT](LICENSE).
