# PLAN V2 — videos-by-AI: Thời lượng, Tỉ lệ, Ảnh post, Logo to, Hoàn thiện

Plan triển khai HOÀN CHỈNH (FRONTEND + BACKEND + Remotion), gộp từ 4 góc nhìn, đã loại trùng và giải quyết mâu thuẫn. Trình user duyệt TRƯỚC khi code.

> **AGENTS.md (BẮT BUỘC):** Trước khi viết bất kỳ code Next nào, đọc `node_modules/next/dist/docs/01-app/` (đã xác nhận tồn tại: `01-app 02-pages 03-architecture 04-community index.md`). Next 16 có breaking changes — đặc biệt phần Client Components và private folders `_components`.
> **GPU (memory):** RTX 2080 Ti phải cap `nvidia-smi -pl 200` kẻo BSOD 0x1E khi sinh ảnh Flux local hoặc render nặng. Plan có cơ chế khoá job (Phase 6/A1) để không chạy 2 job song song.

---

## 0. ĐỐI CHIẾU YÊU CẦU USER (1–7) — không bỏ sót

| # | Yêu cầu | Giải quyết ở |
|---|---|---|
| 1 | Video dài hơn (Ngắn 1–3' / Dài 3–7') | Phase 1 (aspect.ts/durationPlan) + Phase 3 (cards.ts ngân sách từ) + Phase 5 (render preset) |
| 2 | Logo AI91 TO HƠN (giữ ai91-logo.webp, không office box) | Phase 4 (Video.tsx footer) + **Phase 0b (xuất lại logo PNG độ phân giải cao)** |
| 3 | Tách 2 sản phẩm: VIDEO (Card Motion) vs ẢNH POST bài báo | Phase 2 (FE product picker) + Phase 7 (BE imagepost pipeline + ArticlePost) |
| 4 | Chọn tỉ lệ 9:16 / 1:1 / 16:9 cho cả video lẫn ảnh | Phase 1 (dims) + Phase 4 (layout co giãn) + Phase 2 (FE) + ảnh AI sinh đúng size |
| 5 | Đổi icon Desktop thành logo AI91 (.ico) | Phase 8 |
| 6 | Gợi ý hoàn thiện app | Mục "BỔ SUNG ĐỂ HOÀN THIỆN" (MUST/NÊN/TUỲ CHỌN) |
| 7 | Plan đầy đủ FE + BE | Toàn bộ tài liệu này |

---

## QUYẾT ĐỊNH KIẾN TRÚC (giải mâu thuẫn giữa 4 góc nhìn)

1. **Tên trường API:** dùng `type` ('video'|'imagepost'), `aspectRatio`, `duration`, `voice`, `rate`. (FE đề xuất `product`, BE đề xuất `type` → **chọn `type`** vì khớp dispatch backend; FE đổi `product` state → gửi field `type`.) Giữ tương thích ngược: `mode==='card'` → `type='video'`.
2. **"VIDEO" = Card Motion (Remotion)**, KHÔNG phải Ken Burns. `runPipeline` (Ken Burns cũ) **giữ lại nhưng deprecate**, chỉ chạy qua `?legacy=1`. Mặc định route không gọi nữa.
3. **Một composition, 3 tỉ lệ** qua `calculateMetadata` trả `width/height` từ inputProps (đã xác minh `Composition.d.ts` cho phép). KHÔNG tạo 3 composition.
4. **Ảnh post render bằng `renderStill` của Remotion** (đã xác minh có), KHÔNG dùng sharp để vẽ chữ — tận dụng React layout cho headline/logo. `sharp` (đã cài) chỉ dùng cho việc phụ: resize logo, watermark video bản tin nếu cần.
5. **Cross-fade video dài:** `@remotion/transitions` **CHƯA cài** (đã kiểm tra) → **dùng overlap thủ công** (cộng OVERLAP frame vào Sequence, KHÔNG đổi tổng durationInFrames = tổng audio). Không thêm dependency.
6. **Zip ảnh post:** zip phía **backend** (trả `done.zipUrl`), FE chỉ render link. Tránh thêm `jszip` + tránh tải lại ảnh.
7. **WPM:** KHÔNG hardcode tin. `WORDS_PER_MINUTE=150` là điểm KHỞI ĐẦU; Phase 0a ĐO THẬT bằng `probeDuration` trước khi chốt ngân sách từ.

---

## PHASE 0 — Nền tảng & đo lường (CHẶN mọi thứ khác) — Công sức: NHỎ

### 0a. Đo tốc độ đọc edge-tts thật (BE)
- **Mục tiêu:** lấy WPM thật của `vi-VN-HoaiMyNeural` để tính ngân sách từ chính xác (yêu cầu #1).
- **Việc:** chạy thử 1 đoạn ~100 từ tiếng Việt qua `scripts/edge_tts_gen.py`, dùng `probeDuration` (đã export trong `assemble.ts`) đo giây → WPM = từ/(giây/60). Ghi số vào `aspect.ts`.
- **File:** không sửa code; chỉ là bước đo → cập nhật hằng số ở Phase 1.

### 0b. Xuất lại logo độ phân giải cao (Asset) — phục vụ yêu cầu #2 & #5
- **Vấn đề đã xác minh:** `public/ai91-logo.webp` chỉ **7.3 KB** → phóng to trong video/ảnh post sẽ **vỡ/mờ**.
- **Việc:** tạo `public/ai91-logo.png` (hoặc webp) bản lớn ≥ 512px chiều cao từ nguồn gốc. Nếu không có nguồn lớn hơn → dùng `sharp` upscale tạm + cảnh báo user nên cung cấp logo gốc nét. Logo .png lớn này cũng là nguồn tạo `.ico` ở Phase 8.
- **File mới:** `public/ai91-logo-hi.png`.

### 0c. `src/lib/pipeline/aspect.ts` (FILE MỚI)
- **Mục tiêu:** 1 nguồn sự thật cho kích thước + thời lượng.
- **Nội dung:**
  ```ts
  export type AspectRatio = '9:16'|'1:1'|'16:9';
  export type Duration = 'short'|'long';
  export interface Dimensions { width:number; height:number; }
  export const VIDEO_DIMS: Record<AspectRatio,Dimensions>; // 1080x1920 / 1080x1080 / 1920x1080
  export const IMAGE_DIMS: Record<AspectRatio,Dimensions>; // 768x1344 / 1024x1024 / 1344x768
  export function videoDims(ar:AspectRatio):Dimensions;
  export function imageDims(ar:AspectRatio):Dimensions;
  export function imagenAspectLabel(ar:AspectRatio):'9:16'|'1:1'|'16:9';
  export const WORDS_PER_MINUTE: number; // = số đo từ 0a
  export interface DurationPlan { targetSeconds:[number,number]; wordBudget:number; sceneCount:number; }
  export function durationPlan(d:Duration):DurationPlan;
  ```
  - `short`: ~2' → wordBudget ≈ `120s*WPM/... ` (tính từ WPM thật), sceneCount 6–8.
  - `long`: ~5' → wordBudget tương ứng, sceneCount 12–16.
- **Phụ thuộc:** không. Mọi file khác import từ đây.

---

## PHASE 1 — Sinh ảnh AI nhận kích thước theo tỉ lệ (BE) — Công sức: NHỎ

Mục tiêu: yêu cầu #4 — ảnh AI sinh đúng tỉ lệ, không méo. Thêm tham số `dims?` ở CUỐI (optional) để không vỡ caller cũ.

- `src/lib/pipeline/pollinations.ts` (SỬA): `pollinationsGenerateImage(prompt, filename, dims?)` — thay hardcode `width=768&height=1344` bằng `dims` (mặc định 9:16).
- `src/lib/pipeline/google.ts` (SỬA): `googleGenerateImage(prompt, filename, ar?)` — Imagen `:predict` set `parameters.aspectRatio = imagenAspectLabel(ar)`; nhánh Gemini đổi câu mô tả khung theo `ar`.
- `src/lib/pipeline/image.ts` (SỬA, Flux): `generateAndSaveImage(prompt, filename, dims?)` — truyền `width/height` vào node `"5" EmptyLatentImage`.

---

## PHASE 2 — FRONTEND: bộ chọn mới + 2 nhánh kết quả (FE) — Công sức: VỪA

> Đọc docs Next trước (private folders `_components`, Client Components).

### 2a. State & request (`src/app/page.tsx` SỬA)
- Thay `mode` bằng: `type:'video'|'imagepost'` (default video), `aspect:AspectRatio` (default 9:16), `duration:'short'|'long'` (default short, chỉ video), `voice`, `rate`. Thêm `images: {index,imageUrl,headline}[]`, `zipUrl`.
- Lazy-init từ localStorage key mới `ai91_prefs` (JSON) — giữ pattern `useState(()=>…)` chống hydration mismatch; helper `savePrefs()` ghi mỗi lần đổi.
- `generate()` body: `{ topic, useNews, newsQuery, geminiKey, type, aspectRatio, duration, voice, rate }`.
- Stream NDJSON: thêm nhánh `e.type==='image'` → push vào `images`; `done.zipUrl` → set zip; reset kết quả nhánh kia khi đổi `type`.
- `needsKey = !geminiKey` (cả 2 sản phẩm dùng Gemini); `canRun = !running && topic.trim() && !needsKey`. Label nút động: "Tạo video" / "Tạo bộ ảnh" / "Đang tạo…".

### 2b. Component mới (`src/app/_components/`)
| File | Trách nhiệm |
|---|---|
| `SegmentedControl.tsx` | radiogroup tái dùng (a11y: `role=radiogroup`/`radio`, mũi tên trái/phải) |
| `ProductPicker.tsx` | Video Card Motion / Ảnh post bài báo |
| `AspectPicker.tsx` | 9:16 / 1:1 / 16:9 — icon khung bằng `aspect-[9/16]`/`aspect-square`/`aspect-video` |
| `DurationPicker.tsx` | Ngắn/Dài — render `null` khi `type!=='video'` |
| `VoicePicker.tsx` | Nữ miền Bắc (HoaiMy, mặc định) / Nam (NamMinh) + tốc độ (chậm/thường/nhanh) → A4 |
| `GeminiKeyField.tsx` | bóc khối key + localStorage hiện có |
| `ProgressPanel.tsx` | spinner + status (`aria-live=polite`) + log (`role=log`) + thumbnail |
| `VideoResult.tsx` | player co theo aspect (9:16 `aspect-[9/16] max-h-[70vh]`, 1:1 `aspect-square max-w-md`, 16:9 `aspect-video max-w-2xl`) + nút tải mp4 |
| `ImageGallery.tsx` | lưới carousel theo aspect, tải từng ảnh (`<a download>`), "Tải tất cả (.zip)" dùng `zipUrl` từ BE |

`page.tsx` còn: state + `generate()` + ghép component. Bố cục: header → GeminiKeyField → section cấu hình (ProductPicker → AspectPicker → DurationPicker → VoicePicker → textarea → news block → nút) → ProgressPanel → VideoResult/ImageGallery theo `type`.

---

## PHASE 3 — Thời lượng video (BE, lõi yêu cầu #1) — Công sức: VỪA

- `src/lib/pipeline/cards.ts` (SỬA):
  - Chữ ký `geminiGenerateCards(topic, newsContext, geminiKey, plan: DurationPlan)`.
  - **Bỏ** `.min(3).max(6)` và câu "Tạo 3–5 scene". Schema scenes → `.min(3).max(20)`.
  - Prompt theo NGÂN SÁCH TỪ: chèn `plan.sceneCount` + `plan.wordBudget` ("TỔNG voiceOver ≈ N từ tiếng Việt, mỗi scene 2–4 câu"). Giữ ràng buộc chữ HIỂN THỊ trên card ngắn (chỉ voiceOver dài ra).
- `src/lib/pipeline/content.ts` + `google.ts` storyboard (SỬA — chỉ để legacy không còn ép cứng): `generateStoryboard(topic, newsContext, plan?)` / `geminiGenerateStoryboard(...)` — bỏ "4–6 cảnh, 30–45 giây". Mặc định short khi không có plan.

---

## PHASE 4 — Remotion: tỉ lệ động + LOGO TO (yêu cầu #2, #4) — Công sức: VỪA→LỚN

Đây là phase rủi ro thị giác cao nhất (16:9 khó). Test trong `npx remotion studio` cả 3 tỉ lệ.

- `src/remotion/types.ts` (SỬA): thêm `width/height` vào `VideoProps`; thêm `AspectRatio`, `DIMENSIONS`, và `ArticlePostProps {width,height,headline,subheadline?,source?,date?,imageSrc,brandText,accent?}`.
- `src/remotion/layout.ts` (MỚI): `useLayout()` → `{width,height,base=min(w,h), u(n)=(n/1080)*base, isWide, isSquare}` + hằng màu (`ORANGE #ff7a2f`, `BLUE #4aa3ff`, nền `#070b16`). Mọi số cứng quy về `u(...)`.
- `src/remotion/Video.tsx` (SỬA — tham số hoá toàn bộ):
  - Thay tất cả px cứng (font 78, padding 90, SearchBar top 150, brackets 56…) bằng `u(...)`.
  - **LOGO TO:** `logoH = isWide ? u(84) : u(110)` (16:9 thấp nên nhỏ hơn theo chiều cao tuyệt đối; 9:16/1:1 to rõ rệt so với 56 cũ). Footer `bottom u(90)`, `left/right u(64)`, progress `u(10)`. **Giữ `staticFile()`** nhưng trỏ logo hi-res từ 0b.
  - Chống đè chữ: thêm `paddingBottom` cho card = chiều cao footer + lề (`u(220)` dọc / `u(160)` ngang).
  - 16:9: Title font giảm (`u(64)`), List xếp **2 cột** (`flexWrap`, item ~48%), SearchBar ẩn/thu nhỏ (`if(isWide) return null`).
- `src/remotion/Root.tsx` (SỬA): `Ai91Video.calculateMetadata` trả thêm `width/height` từ `props.width/height` (mặc định 1080×1920 cho Studio). Thêm `<Composition id="ArticlePost" durationInFrames=1 ...>` với `calculateMetadata` width/height động.
- **Cross-fade (video dài):** trong `Ai91Video`, Sequence chồng `OVERLAP=8` frame (card mới fade-in đè card cũ fade-out). **KHÔNG** đổi tổng `durationInFrames` (phải = tổng audio, kẻo cụt/câm tiếng cuối). `useEnter` giảm damping ~26.

---

## PHASE 5 — Render động + chống render lâu (BE/Remotion, yêu cầu #1) — Công sức: VỪA

- `src/lib/pipeline/remotion-render.ts` (SỬA `renderCardVideo`):
  - Opts thêm `aspectRatio`; tính `videoDims(ar)` → đưa `{width,height}` vào `inputProps` (calculateMetadata dùng).
  - **Performance (đã xác minh option tồn tại):** `concurrency: Math.max(2, Math.floor(os.cpus().length/2))` (đừng full để máy còn thở + giảm rủi ro BSOD), `x264Preset:'veryfast'` (nháp dài) / `'faster'`, `crf:23`.
  - **Cảnh báo ETA:** nếu `durationInFrames/fps > 120` → `onProgress("Video N phút, render CPU có thể 10–30 phút, vui lòng chờ…")`. Cân nhắc fps 24 cho `long` (tuỳ chọn).
- `src/lib/pipeline/video.ts` (SỬA `runCardPipeline`):
  - `PipelineOptions` thêm `aspectRatio, duration, voice, rate`. `ProgressEvent` thêm `{type:'image',...}` và nới `done` có `images?, zipUrl?`.
  - Tính `plan=durationPlan(duration)` → `geminiGenerateCards(...,plan)`; truyền `aspectRatio` xuống render.
  - Sau khi đo audio mỗi cảnh: cộng tổng giây thực + đếm từ → log WPM thật + emit status nếu lệch xa target (hiệu chỉnh dần, KHÔNG regenerate tự động).

---

## PHASE 6 — Hàng đợi 1-job + khoá GPU (MUST A1 — chống BSOD) — Công sức: VỪA

> Đặt SỚM vì nó chặn rủi ro nghiêm trọng nhất (memory: BSOD khi quá tải). Có thể làm song song Phase 2–3.

- `src/lib/pipeline/lock.ts` (MỚI): in-memory mutex (module-scope boolean + jobId hiện tại). `acquire()`/`release()`.
- `src/app/api/generate/route.ts` (SỬA):
  - Parse body mới `{type, aspectRatio, duration, voice, rate}` + validate whitelist (400 nếu sai). Validate: topic không rỗng (đã có) + bắt buộc `geminiKey` cho cả 2 type (API chặn lại, không tin FE) + giới hạn độ dài topic.
  - Map `mode==='card'`→`type='video'` (tương thích). `?legacy=1` → `runPipeline`.
  - Nếu lock đang giữ → emit error "Đang bận, vui lòng đợi job hiện tại xong" + đóng (không chạy song song). `finally` release lock.
  - Dispatch: `imagepost`→`runImagePostPipeline`, `video`→`runCardPipeline`.
- **UI:** banner nhắc "Đã cap GPU 200W chưa?" khi chọn model ảnh local (Flux). (FE, nhỏ.)

---

## PHASE 7 — Sản phẩm "ẢNH POST bài báo" (yêu cầu #3) — Công sức: LỚN

### 7a. `src/lib/pipeline/imageposts.ts` (MỚI — LLM nội dung)
Theo mẫu `cards.ts` (Gemini, responseMimeType json, zod). `geminiGenerateImagePosts(topic, newsContext, geminiKey, count)` → `ImagePostScript {title, slides:[{headline(≤12 từ), subheadline?, imagePrompt(EN, no text in image), source?}]}` (`.min(2).max(10)`). `count` mặc định 5.

### 7b. `src/remotion/ArticlePost.tsx` (MỚI — layout tĩnh)
- Render bằng `renderStill` (frame 0) → KHÔNG dùng `useCurrentFrame` cho animation.
- Lớp: ảnh AI full-bleed (`objectFit:cover`) → gradient tối đáy → nội dung (eyebrow/nguồn pill cam, headline 900 `u(96)`/`u(82)` cho wide, subheadline `u(40)`, hàng đáy: logo hi-res `u(72)` + `source · date` + vạch cam).
- 3 tỉ lệ qua `useLayout()`; 16:9 text canh trái ~60%.

### 7c. `src/remotion/Root.tsx`: đăng ký `<Composition id="ArticlePost">` + `articleSample` defaultProps (Phase 4 đã thêm khung).

### 7d. `src/lib/pipeline/remotion-render.ts`: `renderArticlePostBatch(slides, {aspectRatio, jobId, brandText})`
- **bundle 1 LẦN** cho cả bộ (bundle rất chậm) → loop `renderStill` từng slide → PNG `/assets/images/<jobId>_post_<i>.png`. `fs.rmSync(bundle)` trong `finally`.
- Trả mảng đường dẫn PNG. KHÔNG mp4, KHÔNG Ken Burns.

### 7e. `src/lib/pipeline/video.ts`: `runImagePostPipeline(topic, emit, opts)`
- `jobId=imgpost_<ts>` → [RSS tuỳ chọn] → `geminiGenerateImagePosts` → mỗi slide: sinh ảnh nền `imageDims(ar)` (tuần tự, nhẹ tải) → `renderArticlePostBatch` → emit `{type:'image',index,total,url}` (bọc try/catch mỗi slide, lỗi 1 ảnh không giết cả bộ) → **zip** bộ ảnh (BE, dùng thư viện nén có sẵn hoặc sharp) → emit `{type:'done', images, zipUrl}`.

---

## PHASE 8 — Icon Desktop AI91 (.ico) (yêu cầu #5) — Công sức: NHỎ

- Tạo `public/ai91-logo.ico` từ `ai91-logo-hi.png` (Phase 0b) — đa kích thước (16/32/48/256) bằng `sharp` (đã cài) hoặc ImageMagick. Vì `sharp` không xuất `.ico` đa kích thước trực tiếp ⇒ tạo PNG 256 rồi đóng gói .ico (script nhỏ hoặc dùng `png-to-ico` — kiểm tra/cài nếu thiếu).
- `create-shortcut.ps1` (SỬA): set `$shortcut.IconLocation = "<abs>\public\ai91-logo.ico"`. Chạy lại để cập nhật shortcut hiện có.

---

## BỔ SUNG ĐỂ HOÀN THIỆN (yêu cầu #6) — ưu tiên hoá

### MUST (đã đưa vào phase trên)
- **A1 Hàng đợi + khoá GPU** → Phase 6. (Chống BSOD — quan trọng nhất.)
- **A4 Chọn giọng + tốc độ** → Phase 2b/5. RẺ NHẤT: `edge_tts_gen.py` **đã có sẵn `--rate/--volume/--pitch`** (đã xác minh) — chỉ cần truyền `voice`/`rate` xuống `voice.ts` (thêm tham số) → script.
- **A3 Độ bền: retry + validate** → một phần ở Phase 6 (validate) + nên thêm: retry backoff cho Pollinations/Gemini (429 → chờ + báo tiếng Việt), ảnh 1 cảnh lỗi → placeholder thay vì giết job, RSS rỗng → fallback LLM không news.

### MUST (phase riêng đề nghị thêm — sau Phase 7)
- **A5 Preview kịch bản trước khi render dài** — QUAN TRỌNG cho video 3–7'. Tách 2 bước: (1) sinh cards trả về UI xem/sửa; (2) bấm "Render" mới TTS+ảnh+render. Dùng `@remotion/player` (đã cài) preview ngay trong browser, không cần render. **Công sử: VỪA→LỚN.** Đề xuất làm thành **Phase 9** nếu user muốn.
- **A2 Thư viện/lịch sử output + Xóa** — ghi `public/assets/data/jobs.json` mỗi job; `GET /api/library`; tab "Thư viện" xem lại/tải/xóa (giải quyết luôn đầy đĩa). **Công sức: VỪA.** Đề xuất **Phase 10**.
- **A6 Nhạc nền** — `public/assets/music/` + track no-copyright; Card Motion thêm `<Audio>` volume thấp; bản tin FFmpeg `amix`. Bật/tắt + chọn track trên UI. **Công sức: VỪA.**
- **A7 Docs** — cập nhật `.env.example` (`EDGE_TTS_RATE`, defaults tỉ lệ/thời lượng), `SETUP-LOCAL.md` (nhạc nền, ảnh post, sharp/ffmpeg PATH, font tiếng Việt). **Công sức: NHỎ.**

### NÊN CÓ
- B1 Settings mặc định (gắn localStorage `ai91_prefs` — đã có ở Phase 2a, mở rộng).
- B3 Phụ đề bật/tắt + cỡ (đặc biệt cho 16:9 — `subtitles.ts` hardcode Arial 84 sẽ lệch).
- B4 Preset phong cách ảnh AI (Điện ảnh/Tài liệu/Hoạt hình/Tin tức) chèn vào imagePrompt.
- B5 Watermark logo nhất quán cho ảnh post (đã có qua ArticlePost) & video bản tin (ffmpeg overlay).

### TUỲ CHỌN (ROI thấp — KHÔNG làm giai đoạn này)
- C1 **Auto-upload YouTube/TikTok** — bẫy chi phí lớn (OAuth/verify, automation dễ vỡ, vi phạm ToS). **Thay bằng:** render xong **mở thư mục output** + copy sẵn caption/hashtag để user tự đăng. `upload.ts` hiện chỉ là TODO.
- C2 Batch/lập lịch nhiều video. C3 Gợi ý chủ đề tự động.

---

## DỌN ĐĨA & FONT (rủi ro Windows — đưa vào mọi phase render)
- **Đầy đĩa (Cao):** `assemble.ts`/`remotion-render.ts` còn để lại `public/assets/work/*` (xác nhận còn sót). Thêm `fs.rmSync(workDir,{recursive,force})` trong `finally` mỗi pipeline. Kèm A2 (xóa thủ công).
- **Font tiếng Việt (Cao):** `subtitles.ts` dùng Arial; Remotion dùng `"Segoe UI"`. Trên Windows OK nhưng nên khai báo font có dấu rõ ràng (Be Vietnam/Roboto) để khỏi ra "□". Ghi vào docs (A7).
- **FFmpeg PATH (Vừa):** kiểm tra `ffmpeg` lúc khởi động + báo tiếng Việt rõ + cho `FFMPEG_PATH` env.

---

## THỨ TỰ THỰC HIỆN & ƯỚC LƯỢNG CÔNG SỨC

| Thứ tự | Phase | FE/BE | Công sức | Chặn cái gì |
|---|---|---|---|---|
| 1 | **0** Nền tảng (đo WPM, logo hi-res, aspect.ts) | BE+Asset | NHỎ | chặn tất cả |
| 2 | **1** Ảnh AI nhận dims | BE | NHỎ | Phase 7 |
| 3 | **6** Hàng đợi + khoá GPU + route mới | BE | VỪA | an toàn — làm sớm |
| 4 | **3** Thời lượng (cards.ts) | BE | VỪA | Phase 5 |
| 5 | **4** Remotion tỉ lệ + logo to | Remotion | VỪA→LỚN | Phase 5, 7 |
| 6 | **5** Render động + preset | BE | VỪA | — |
| 7 | **2** FE bộ chọn + 2 nhánh | FE | VỪA | trải nghiệm |
| 8 | **7** Ảnh post (imageposts + ArticlePost) | BE+Remotion | LỚN | — |
| 9 | **8** Icon .ico | Asset | NHỎ | — |
| 10 | (đề xuất) **9** A5 preview, **10** A2 thư viện, A6 nhạc, A7 docs | FE+BE | VỪA mỗi cái | hoàn thiện |

> Có thể làm Phase 2 (FE) song song với 3–5 nếu chốt sớm hợp đồng API (`type/aspectRatio/duration/voice/rate`, sự kiện `image`, `done.zipUrl/images`).

**Tổng quan:** lõi (Phase 0–8) ≈ phần lớn công sức ở Phase 4 (Remotion 3 tỉ lệ) và Phase 7 (ảnh post). Nhóm hoàn thiện (9–10 + A6/A7) làm sau khi lõi chạy mượt.

---

## TỰ PHẢN BIỆN — rủi ro & giả định

1. **Render video dài trên CPU (RỦI RO CAO):** 5' @30fps = 9000 frame; CPU có thể 10–30 phút. Đã giảm: preset `veryfast`, `concurrency = cores/2`, cảnh báo ETA, tuỳ chọn fps 24. Vẫn nên cho **hủy job** (gắn A1). Đây là lý do A5 (preview trước) rất đáng làm.
2. **WPM giả định (ĐÃ KHỬ):** không chốt 150; Phase 0a đo thật trước. Cơ chế log WPM thật mỗi lần chạy để hiệu chỉnh.
3. **Logo phóng to vỡ (ĐÃ PHÁT HIỆN):** webp gốc chỉ 7.3KB → Phase 0b bắt buộc xuất bản hi-res, nếu không yêu cầu #2 sẽ ra logo mờ. Nếu không có nguồn gốc nét, cần user cung cấp.
4. **16:9 layout (RỦI RO TRUNG BÌNH):** chiều dọc ngắn → chữ tràn, list 4 mục thiếu chỗ. Bắt buộc giảm font + list 2 cột + ẩn SearchBar. Test kỹ tỉ lệ này trong Studio trước khi render.
5. **`calculateMetadata` override width/height:** đã xác minh `Composition.d.ts` cho phép; nhưng `<Composition>` tĩnh vẫn cần khai 1080×1920 cho Studio preview. Lưu ý phân biệt preview vs runtime.
6. **Cross-fade tổng frame:** overlap KHÔNG được làm tổng `durationInFrames` lệch tổng audio → kẻo cụt/câm tiếng. Chỉ overlap phần HIỂN THỊ card.
7. **`renderStill` chỉ frame 0:** ArticlePost tuyệt đối không dùng animation phụ thuộc frame.
8. **Khoá job in-memory:** nếu sau này chạy nhiều process/cluster sẽ không đủ; với app 1-người-dùng local thì đủ. Ghi rõ giới hạn.
9. **Tương thích ngược:** `mode='card'` cũ được map sang `type='video'`; FE cũ vẫn chạy trong giai đoạn chuyển.
10. **Điểm cần CHỐT với user trước khi code:** (a) số phút mục tiêu cụ thể cho short/long (đang nhắm ~2' / ~5'); (b) có làm Phase 9 (preview kịch bản) và Phase 10 (thư viện) trong đợt này không — chúng tăng đáng kể giá trị nhưng cũng tăng công sức; (c) chấp nhận `?legacy=1` để giữ Ken Burns hay bỏ hẳn.

---

## FILE THAY ĐỔI — TỔNG HỢP

**MỚI:**
`src/lib/pipeline/aspect.ts`, `src/lib/pipeline/imageposts.ts`, `src/lib/pipeline/lock.ts`,
`src/remotion/layout.ts`, `src/remotion/ArticlePost.tsx`,
`src/app/_components/{SegmentedControl,ProductPicker,AspectPicker,DurationPicker,VoicePicker,GeminiKeyField,ProgressPanel,VideoResult,ImageGallery}.tsx`,
`public/ai91-logo-hi.png`, `public/ai91-logo.ico`.

**SỬA:**
`src/app/api/generate/route.ts`, `src/app/page.tsx`,
`src/lib/pipeline/{video,cards,content,google,pollinations,image,remotion-render,voice}.ts`,
`src/remotion/{types,Video,Root}.tsx`,
`create-shortcut.ps1`, `.env.example`, `SETUP-LOCAL.md`.

**ASSET/đo:** `scripts/edge_tts_gen.py` (đã sẵn `--rate`, không cần sửa) — chỉ truyền tham số từ `voice.ts`.
