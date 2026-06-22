# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) - PHẦN 3

## 5. Đặc tả Kích thước & Tỷ lệ hiển thị (Dimensions)

Hệ thống hỗ trợ 3 tỷ lệ khung hình chuẩn hóa cho cả video lẫn ảnh post. Các tham số được quy hoạch tại cấu trúc `src/lib/pipeline/aspect.ts`:

| Tỷ lệ | Định dạng Video (px) | Định dạng Ảnh post (px) | Ứng dụng thực tế |
| :--- | :--- | :--- | :--- |
| **9:16** | 1080 x 1920 | 768 x 1344 | TikTok, Reels, YouTube Shorts |
| **1:1** | 1080 x 1080 | 1024 x 1024 | Facebook Post, Instagram |
| **16:9** | 1920 x 1080 | 1344 x 768 | YouTube Landscape, Facebook Video |

---

## 6. Yêu cầu Chức năng cụ thể (Functional Requirements)

### F01: Dashboard cấu hình ứng dụng
* Bộ chọn dạng Tab/SegmentedControl để chọn giữa 2 sản phẩm: **Tạo Video** hoặc **Tạo Bộ ảnh**.
* Bộ chọn tỷ lệ khung hình trực quan (9:16, 1:1, 16:9).
* Bộ chọn thời lượng (Video **Ngắn ≈ 90 giây** / Video **Dài ≈ 180 giây** — theo cấu hình thực tế trong `aspect.ts`).
* Bộ cấu hình Giọng đọc & Tốc độ phát thoại.
* Tự động lưu cấu hình người dùng (`localStorage`) để giữ trạng thái cho lần chạy tiếp theo.

### F02: Luồng xử lý Kịch bản & Prompt AI
* Nhận diện prompt yêu cầu hoặc từ khóa tìm kiếm tin tức để lấy dữ liệu làm đầu vào.
* **Tính toán phân cảnh & thời lượng**:
  * Phân cảnh được tính toán và chia tách động dựa trên số câu thoại thực tế và độ dài của từng câu thoại.
  * Quy tắc: **1 phân cảnh (slide animation/slide tĩnh) tương ứng với đúng 1 câu thoại hoàn chỉnh**.
  * **Hằng số hiệu chỉnh (calibration):** `WORDS_PER_MINUTE = 225` (đo thực tế cho giọng `vi-VN-HoaiMyNeural`). Plan thời lượng: Ngắn ≈ 90s (~338 từ, ~20 cảnh); Dài ≈ 180s (~675 từ, ~40 cảnh) — định nghĩa tại `src/lib/pipeline/aspect.ts`.
  * Mỗi phân cảnh phải đảm bảo hiển thị đầy đủ, trực quan mọi nội dung thoại của câu đó cùng với phụ đề karaoke đồng bộ chạy theo giọng đọc của câu, tránh tình trạng bị ngắt câu giữa chừng.
* Đối với tính năng Image Post: Tự động tạo câu prompt sinh ảnh chi tiết cho AI (Flux/Imagen). Đối với Video: Tự động phân luồng vào 1 trong 15 layout CSS.

### F03: Đồng bộ Phụ đề Karaoke
* Gom các từ đơn lẻ từ **Edge-TTS (WordBoundary)** thành các nhóm câu ngắn (6–8 từ) vừa vặn trên giao diện.
* Trình diễn highlight từ đang phát âm dựa theo thời gian thực (CSS color transition).
* Kích hoạt chuyển trạng thái đồ họa (cross-triggering) khi giọng nói đọc tới các từ khóa quan trọng (Keywords).
* **Cơ chế nung phụ đề (ASS burn-in):** với pipeline ghép bằng FFmpeg, phụ đề karaoke được xuất ra định dạng **ASS** (`src/lib/pipeline/subtitles.ts` → `buildAss`) rồi nung cứng vào khung hình.

### F04: Xem trước Kịch bản (Script Preview)
* Cho phép sinh nhanh JSON kịch bản (card/imagepost) qua `POST /api/script` mà **không render**, để người dùng duyệt/chỉnh trước khi chạy bước render tốn tài nguyên.

### F05: Chọn Nhạc nền
* Liệt kê các track có sẵn trong `public/assets/music` (`GET /api/music`) cho người dùng chọn; track được ghép kèm và tự **Audio Ducking** khi có lời thoại.

---

## 7. Đặc tả Giao diện Người dùng (UI/UX Specification)

Dashboard giao diện chính được thiết kế theo phong cách hiện đại (Dark Mode, layout phẳng, bo góc mềm mại, phân chia rõ ràng các phân vùng chức năng).

### 7.1 Bố cục Giao diện (Layout)
Giao diện được chia thành 3 phân vùng chính từ trái qua phải (hoặc dạng lưới responsive 2 cột):
1. **Phân vùng Cấu hình (Bên trái / Cột 1)**:
   * **Bộ chọn Chế độ (Product Mode Selector)**: Dạng Segmented Control nổi bật để chuyển đổi giữa hai chế độ: "Tạo Video" và "Tạo Ảnh Post".
   * **Ô nhập nội dung (Prompt Input)**: Hộp nhập văn bản lớn (Textarea) để người dùng gõ yêu cầu/prompt cho video hoặc bài viết.
   * **Bảng thông số cấu hình**:
     * **Tỉ lệ khung hình (Aspect Ratio)**: Các nút bấm tượng trưng cho tỉ lệ 9:16, 1:1, và 16:9 kèm hình minh họa trực quan.
     * **Thời lượng (Duration)**: Bộ chọn "Ngắn" hoặc "Dài" (chỉ hiển thị khi chọn chế độ "Tạo Video").
     * **Giọng đọc & Tốc độ (Voice Settings)**: Dropdown chọn giọng nói cùng thanh trượt hoặc bộ chọn tốc độ phát thoại (Chậm - Bình thường - Nhanh).
     * **Khóa Gemini API (Gemini Key)**: Ô nhập khóa bảo mật, hỗ trợ ẩn/hiển thị ký tự, tự động lưu vào localStorage.
   * **Nút hành động chính (CTA Button)**: Kích thước lớn, màu sắc nổi bật, chuyển trạng thái "Đang tạo..." kèm biểu tượng xoay (spinner) khi hệ thống đang xử lý.

2. **Phân vùng Tiến trình & Logs (Ở giữa hoặc dưới nút hành động)**:
   * **Checklist Tiến độ**: Danh sách các bước trong pipeline (Sinh kịch bản -> Sinh tiếng thoại + timestamp từ (Edge-TTS) -> Dựng phụ đề/đồng bộ -> Render Remotion -> Ghép FFmpeg). Các bước hoàn thành sẽ có tích xanh và chuyển màu trạng thái trong thời gian thực.
   * **Hộp thoại Logs (Console Output)**: Khung hiển thị log dạng terminal nền tối, tự động cuộn (auto-scroll) để hiển thị chi tiết tiến trình NDJSON trả về từ backend API.

3. **Phân vùng Kết quả & Thư viện (Bên phải / Cột 2)**:
   * **Khung xem trước Video (Video Preview Box)**: Trình phát video HTML5 chất lượng cao kèm các nút chức năng (Phát, Tải về, Toàn màn hình) hiển thị video MP4 sau khi render xong.
   * **Thư viện Ảnh (Image Post Gallery)**: Lưới ảnh (Grid) hiển thị các slide JPEG/PNG tĩnh vừa tạo, hỗ trợ click xem phóng to và nút bấm **"Tải về tệp .ZIP"** nổi bật.
   * **Thư viện Lịch sử (Local Library)**: Bảng lưu trữ danh sách các sản phẩm đã sản xuất thành công trong quá khứ giúp người dùng có thể nhấp để xem lại nhanh hoặc tải lại.

---

👉 Xem tiếp: [Yêu cầu Phi chức năng & Lộ trình Triển khai](./srs_4_roadmap.md)
