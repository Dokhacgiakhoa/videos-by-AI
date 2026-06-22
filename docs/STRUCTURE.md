# 🗂️ Sơ đồ Thư mục — AI91 Medimation

> Repo này là **một app Next.js đặt ngay ở root** `D:\Videos-by-AI\`.
> **Không** có tầng `ai-video-app/` lồng bên trong nữa, **không** có repo git lồng nhau.
> Nếu thấy lại thư mục `videos-by-AI/` hay `ai-video-app/` lồng bên trong → đó là clone nhầm, xóa đi.
>
> Cập nhật: 2026-06-23 (sau khi flatten về chuẩn).

```
D:\Videos-by-AI\                    ← ROOT = app Next.js (repo git duy nhất)
│
├── src\
│   ├── app\                        Next.js App Router
│   │   ├── page.tsx                Dashboard chính (1 trang)
│   │   ├── layout.tsx  globals.css Khung + style toàn cục
│   │   ├── _components\            UI: SegmentedControl, GeminiKeyField, ScriptEditor,
│   │   │                           ProgressPanel, VideoResult, ImageGallery, LibraryPanel
│   │   └── api\                    4 route: generate, script, music, library
│   │
│   ├── lib\
│   │   ├── types.ts
│   │   └── pipeline\               🧠 LÕI BACKEND:
│   │       ├── video.ts            ★ Orchestrator pipeline Video (Card Motion)
│   │       ├── imageposts.ts       ★ Pipeline Ảnh Post (renderStill + zip)
│   │       ├── aspect.ts           Kích thước/tỷ lệ + WORDS_PER_MINUTE=225
│   │       ├── cards.ts content.ts Sinh kịch bản/nội dung (LLM)
│   │       ├── voice.ts            Edge-TTS (audio + word timestamps)
│   │       ├── subtitles.ts        Phụ đề karaoke ASS
│   │       ├── remotion-render.ts  Gọi Remotion render / renderStill
│   │       ├── assemble.ts         Ghép FFmpeg + Audio Ducking
│   │       ├── image.ts pollinations.ts google.ts  Sinh ảnh + provider
│   │       ├── news.ts             Lấy tin tức làm input (tùy chọn)
│   │       ├── lock.ts             🔒 Job lock chống quá tải VRAM (in-memory)
│   │       ├── library.ts          Lưu/đọc lịch sử job
│   │       ├── zip.ts upload.ts    Nén ZIP / lưu file
│   │
│   └── remotion\                   🎬 ENGINE ĐỒ HỌA (React → video):
│       ├── Root.tsx index.ts       Đăng ký compositions / entry
│       ├── Video.tsx               Composition Video (Card Motion)
│       ├── ArticlePost.tsx         Composition Ảnh Post
│       ├── LayoutComponents.tsx    ★ 15 layout (GSAP)
│       ├── layoutsTimings.ts       ★ Tính timing 15 layout (adaptive)
│       ├── layouts.css types.ts layout.ts
│       └── MockData.ts GsapSampleSlide.tsx   Dữ liệu/slide mẫu (dev)
│
├── scripts\
│   ├── edge_tts_gen.py             Sinh giọng Edge-TTS + word timestamps
│   └── make-ico.js                 Tạo .ico
│
├── public\
│   ├── ai91-logo.*                 Logo
│   └── assets\                     audio\ data\ images\ videos\ work\ music\ (sinh lúc chạy, gitignore)
│
├── docs\                           📖 Tài liệu:
│   ├── srs_technical_video_pipeline.md  + srs_1..4   (bộ SRS)
│   ├── SETUP-LOCAL.md              Hướng dẫn chạy local
│   ├── PLAN-V2.md                  Kế hoạch v2 (lịch sử)
│   └── STRUCTURE.md                File này
│
├── package.json  package-lock.json
├── next.config.ts  tsconfig.json  eslint.config.mjs  postcss.config.mjs  next-env.d.ts
├── .env.example                    Mẫu cấu hình (commit được)
├── .env.local                      Cấu hình thật + key (gitignore)
├── .gitignore                      Chuẩn Next.js + bỏ media pipeline sinh ra
├── README.md  AGENTS.md  CLAUDE.md Hướng dẫn dự án & agent
├── start.bat  create-shortcut.ps1  Khởi động Windows + shortcut desktop
├── .agents\  .claude\              Cấu hình tooling agent
└── node_modules\                   (gitignore)
```

★ = file cốt lõi, hay phải sửa.

## Quy tắc giữ repo sạch
1. Code app luôn ở **root** `D:\Videos-by-AI\` — không tạo tầng con `ai-video-app/`.
2. Chỉ **một** git repo (`.git` ở root). Không `git clone` vào trong chính thư mục này.
3. Media pipeline sinh ra (ảnh/audio/video/work) nằm trong `public/assets/` và đã được `.gitignore`.
4. Bí mật/khóa để trong `.env.local` (không commit); mẫu công khai để ở `.env.example`.
