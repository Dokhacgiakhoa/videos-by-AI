# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) - MỤC LỤC
## Phần mềm Sản xuất Video Tự động AI91 Medimation

Tài liệu này đặc tả chi tiết về mặt chức năng, kiến trúc, luồng dữ liệu và lộ trình triển khai cho hệ thống **AI91 Medimation** nhằm tự động hóa quy trình tạo video và bài post mạng xã hội chất lượng cao từ AI. Do tài liệu dài nên đã được chia thành các phần nhỏ dưới đây:

### 📑 Mục lục tài liệu

1. **[Phần 1: Giới thiệu & Công nghệ (Tech Stack) ➔](./srs_1_intro_tech.md)**
   - Giới thiệu & Mục tiêu Dự án
   - Lựa chọn Công nghệ Tối ưu (Mã nguồn mở, Local & Cloud API)

2. **[Phần 2: Kiến trúc & Luồng xử lý dữ liệu ➔](./srs_2_architecture_pipelines.md)**
   - Kiến trúc Hệ thống & Thiết kế Tính năng Cốt lõi (Mô hình Trạng thái Động, Chống Khung hình chết, Hệ sinh thái Layout Động)
   - Luồng xử lý chi tiết (Pipelines tạo Video & Ảnh Post, Xem trước Kịch bản, 3 biến thể pipeline, Nhạc nền)

3. **[Phần 3: Yêu cầu Chức năng & Giao diện (UI/UX) ➔](./srs_3_requirements_ui.md)**
   - Kích thước & Tỷ lệ hiển thị (Dimensions)
   - Yêu cầu chức năng cụ thể (Dashboard, Prompt AI, Phụ đề Karaoke ASS, Xem trước Kịch bản, Chọn Nhạc nền)
   - Đặc tả Giao diện Người dùng

4. **[Phần 4: Yêu cầu Phi chức năng & Lộ trình Triển khai ➔](./srs_4_roadmap.md)**
   - Yêu cầu Phi chức năng (Hiệu năng, Bảo vệ VRAM, UX)
   - Lộ trình Triển khai (Roadmap 6 Phase)
