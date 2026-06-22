# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) - PHẦN 4

## 8. Yêu cầu Phi chức năng (Non-functional Requirements)

* **Hiệu năng Render (Performance)**:
  * Video chỉ cần render ở chuẩn tốc độ khung hình **30fps** (đã tối ưu và đủ mượt mà cho định dạng video content mạng xã hội).
  * Độ phân giải đầu ra bắt buộc phải đạt chất lượng **HD tối thiểu 1080p** (ví dụ: 1080x1920 cho định dạng dọc 9:16 hoặc 1920x1080 cho định dạng ngang 16:9).
* **Bảo vệ GPU (VRAM Guard)**:
  * Do việc render Remotion (Headless Chromium) và sinh ảnh AI local (ComfyUI/Flux) đòi hỏi nhiều tài nguyên, hệ thống bắt buộc phải có cơ chế **Lock job** – chỉ cho phép một tiến trình render chạy tại một thời điểm để tránh quá tải GPU hoặc BSOD trên card đồ họa (ví dụ RTX 2080 Ti).
  * **Giới hạn hiện tại:** khóa là **in-memory, single-process** (`src/lib/pipeline/lock.ts` với biến `busy`) — chỉ đảm bảo đúng cho môi trường localhost 1 người dùng / 1 tiến trình Node, không phân tán.
* **Trải nghiệm người dùng (UX)**: Stream log tiến trình (NDJSON) liên tục từ server xuống client để hiển thị thanh phần trăm hoặc thông điệp giúp người dùng biết hệ thống đang chạy ở Phase nào (Sinh kịch bản, Sinh âm thanh + timestamp, Dựng phụ đề, Sinh ảnh, hay Render).

---

## 9. Lộ trình Triển khai (Roadmap)

* **Phase 1: Đo đạc & Cấu trúc Ddims (Hoàn thành)**: Thiết lập bộ kích thước chuẩn (`aspect.ts`), đo đạc WPM thực tế của TTS.
* **Phase 2: Sinh ảnh đa tỉ lệ (Hoàn thành)**: Truyền kích thước tùy biến vào các API sinh ảnh (Pollinations, Imagen, Flux).
* **Phase 3: Giao diện Dashboard (Hoàn thành)**: Hoàn thiện bộ chọn sản phẩm, tỉ lệ, giọng đọc, và lưu cấu hình.
* **Phase 4: Tách luồng render Video & ImagePost (Hoàn thành)**: Hỗ trợ render slide tĩnh, nén zip ảnh post, tích hợp file âm thanh và render Remotion theo tỉ lệ.
* **Phase 5: Đa dạng hóa 15 Template Layout động (Hoàn thành)**: Tích hợp 15 mẫu layout phong cách Keynote (100% bằng HTML/CSS/GSAP) kết hợp cơ chế nội suy đo đếm khung giờ thông minh cho backend và frontend đồng nhất.
* **Phase 6: Tối ưu hoá & Đóng gói sản phẩm (Đang lên lịch)**: Đóng gói thành sản phẩm chạy offline 1-click installer.
