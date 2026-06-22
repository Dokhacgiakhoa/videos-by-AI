# videos-by-ai

Kênh video faceless giới thiệu repo/tool dev hot mỗi ngày (TikTok/Shorts/Reels).
Format: slide trình chiếu động, chữ nét, aesthetic dev (nền đen, neon cam + cyan, lệnh terminal).

> Xem `plan.md` để biết toàn bộ kế hoạch, pipeline và lộ trình.

## Cấu trúc

```
videos-by-ai/
├── plan.md                  # kế hoạch tổng thể
├── template/
│   └── card-template.html   # template slide (mở Chrome là chạy)
├── data/
│   └── 2026-06-22.json      # dữ liệu repo mỗi ngày (1 file/ngày)
├── assets/{music,brand}/    # nhạc, logo, font
└── output/                  # video MP4 render ra (bị .gitignore)
```

## Bắt đầu nhanh

1. Chọn repo hot trong ngày → dùng prompt trong `plan.md` (mục 7) để sinh nội dung.
2. Dán object vào mảng `DATA` trong `template/card-template.html` (hoặc lưu vào `data/`).
3. Mở `template/card-template.html` bằng Chrome → bấm **Replay** kiểm tra.
4. Quay màn hình vùng slide ở **1080×1920** (OBS).
5. Ghép nhạc + caption ở CapCut → đăng.

## Lộ trình
- **Giai đoạn 1 (MVP):** quay tay từ HTML template.
- **Giai đoạn 2:** chuyển sang Remotion → render MP4 tự động từ file `data/*.json`.
- **Giai đoạn 3:** batch nhiều video, thêm biến thể template.

Chi tiết trong `plan.md`.
