# PLAN — Kênh "AIDev Repo" (video faceless về repo/tool AI)

> Bản kế hoạch tổng hợp toàn bộ dự án. Đặt tại: `videos-by-ai/plan.md`
> Cập nhật lần cuối: 2026-06-22

---

## 1. Mục tiêu

Sản xuất **đều đặn hằng ngày** các video ngắn faceless giới thiệu repo/tool dev hot,
đăng TikTok/Shorts/Reels. Mỗi video = 1 repo, kéo dài 6–12 giây, khổ dọc 9:16.

**Format:** slide trình chiếu động (kinetic typography / motion graphics) — KHÔNG người.
Aesthetic dev pro: nền đen, neon cam (#ff5a1f) + cyan (#2fe6d6), badge, số liệu nổi bật,
thanh lệnh terminal gõ chữ tự động.

---

## 2. Quyết định kỹ thuật quan trọng

- **KHÔNG dùng AI video gen (Veo/Flow/Sora) cho format này.** Lý do: chữ phải nét và
  chính xác từng pixel, mà AI sinh video hay bịa/méo chữ. Đây là việc của **code render**.
- **Engine chính: template render** (HTML hoặc Remotion). Chữ nét tuyệt đối, dữ liệu hóa,
  tái dùng vô hạn.
- **(Tùy chọn) Veo/Flow chỉ để tạo nền chuyển động trừu tượng**, rồi đặt lớp chữ HTML lên trên
  nếu muốn thêm chất "động". Không bắt buộc.

---

## 3. Pipeline tổng quan

```
[1] Nguồn tin   →  [2] Sinh nội dung  →  [3] Đổ vào template  →  [4] Render MP4  →  [5] Hậu kỳ + đăng
 GitHub trending    LLM (prompt sẵn)      file dữ liệu (DATA)     HTML record /     CapCut: nhạc,
 / X / newsletter   ra object chuẩn                              Remotion          caption, đăng
```

---

## 4. Công cụ

| Khâu | Công cụ | Ghi chú |
|---|---|---|
| Sinh nội dung | Gemini / LLM bất kỳ | Dùng prompt ở mục 7 |
| Template (MVP) | `card-template.html` | Đã có, mở Chrome là chạy |
| Template (tự động) | **Remotion** (React → MP4) | Lộ trình giai đoạn 2 |
| Render thủ công | OBS / screen-record | Quay vùng stage 1080×1920 |
| Render tự động | Puppeteer/Playwright + ffmpeg, hoặc `remotion render` | Ra MP4 sạch |
| Hậu kỳ | CapCut | Nhạc trending, caption, hook 1s đầu |

---

## 5. Cấu trúc thư mục dự kiến

```
videos-by-ai/
├── plan.md                  ← file này
├── template/
│   └── card-template.html   ← template slide hiện tại
├── data/
│   └── 2026-06-22.json      ← dữ liệu repo mỗi ngày (1 file/ngày)
├── assets/
│   ├── music/               ← nhạc nền/trending
│   └── brand/               ← logo, font, màu
└── output/
    └── 2026-06-22.mp4       ← video render ra
```

---

## 6. Quy trình hằng ngày (MVP — chưa tự động)

1. Chọn 1 repo/tool hot trong ngày (GitHub Trending, X, newsletter AI).
2. Chạy prompt sinh nội dung (mục 7) → copy object kết quả.
3. Dán vào mảng `DATA` trong `card-template.html`.
4. Mở file bằng Chrome, bấm Replay kiểm tra.
5. Quay màn hình vùng stage ở 1080×1920 (OBS).
6. Mở CapCut: cắt gọn, thêm nhạc trending + caption + hook.
7. Đăng. Lưu file vào `output/`.

⏱️ Mục tiêu: < 15 phút/video sau khi quen tay.

---

## 7. Prompt sinh nội dung (dán vào LLM mỗi ngày)

```
Bạn viết nội dung cho kênh TikTok "AIDev Repo" — mỗi video giới thiệu 1 repo/tool dev hot.
Từ thông tin repo bên dưới, xuất ra ĐÚNG 1 object JS theo mẫu, không giải thích thêm:

{ name:"TÊN VIẾT HOA NGẮN", badges:["license","ngôn ngữ","loại"],
  tag:"1 câu mô tả, bọc <em>...</em> quanh cụm đắt giá nhất, tối đa 18 từ",
  stat:"SỐ", statSuffix:"hậu tố như % hoặc K★ hoặc +",
  lab1:"từ khóa đậm", lab2:" phần còn lại của nhãn",
  cmd:"lệnh cài 1 dòng (npx/npm/pip...)", star:"số sao dạng 12.3K" }

Quy tắc: name ≤ 10 ký tự nếu được; chọn 1 con số ấn tượng nhất làm stat; KHÔNG bịa số.
REPO: """[dán mô tả repo / link GitHub hôm nay]"""
```

---

## 8. Ba cách chuyển slide → video

1. **Quay màn hình** (nhanh, không cần code): Chrome + OBS, quay vùng stage khổ dọc.
   → Dùng cho giai đoạn MVP, làm thử.
2. **Headless render** (bán tự động): Puppeteer/Playwright chụp từng frame animation → ffmpeg ghép MP4.
   → Sạch, không lọt chuột/thanh công cụ.
3. **Remotion** (tự động hẳn): viết lại template bằng React, chạy `npx remotion render` ra MP4 từ file JSON.
   → Bền nhất cho làm hằng ngày, batch nhiều video một lúc.

---

## 9. Lộ trình

### Giai đoạn 1 — MVP (tuần 1)
- [ ] Hoàn thiện `card-template.html` (đã có bản chạy được).
- [ ] Làm thử 5–10 video bằng cách quay màn hình.
- [ ] Chốt: nhạc nền, độ dài, kiểu caption, hook 1 giây đầu.
- [ ] Đăng đều, xem retention/insight để chỉnh format.

### Giai đoạn 2 — Tự động hóa (tuần 2–3)
- [ ] Chuyển template sang **Remotion**.
- [ ] Tách dữ liệu ra file `data/YYYY-MM-DD.json`.
- [ ] Script `render` → ra MP4 tự động.
- [ ] (Tùy chọn) script lấy GitHub Trending tự gợi ý repo + sinh nội dung qua API.

### Giai đoạn 3 — Quy mô
- [ ] Batch nhiều video/ngày.
- [ ] Thêm biến thể template (so sánh tool, tổng hợp tuần, tips).
- [ ] (Tùy chọn) nền động từ Veo/Flow cho video "hero".

---

## 10. Checklist chất lượng mỗi video

- [ ] 1 con số ấn tượng, KHÔNG bịa.
- [ ] Tên repo ngắn, đọc được trong 0.5s.
- [ ] Lệnh cài chính xác (test thật).
- [ ] Hook trong 1 giây đầu (số sốc hoặc câu hỏi).
- [ ] Caption + nhạc trending.
- [ ] Khổ 9:16, không cắt chữ, không lọt thanh công cụ.
- [ ] Link/CTA ở mô tả hoặc cuối video.

---

## 11. Ghi chú mở

- Voiceover: format này thường để **nhạc + chữ trên màn**, không cần giọng đọc.
  Nếu muốn VO, tạo riêng (ElevenLabs/giọng AI) và đắp lên — không nhờ AI video sinh.
- Nếu sau này muốn thêm dòng video "bản tin AI" (có giọng dẫn, nền động) thì đó là
  nhánh riêng dùng Flow/Veo — tách project, đừng trộn với format card này.
- Kiểm tra lại license repo trước khi quảng bá (một số tool có ràng buộc thương mại).
