<p align="center">
  <img src="public/AI91.jpg" alt="AI91 Logo" width="200" style="border-radius: 20px;" />
</p>

# AI91 Medimation - Tự Động Hoá Sản Xuất Media

Một hệ thống tự động hoá hoàn toàn quy trình sản xuất **Video ngắn (Shorts/Reels)** và **Bài viết dạng ảnh (Carousel Posts)** dành cho mạng xã hội, sử dụng sức mạnh của các mô hình AI tiên tiến nhất (LLM, Text-to-Speech, Text-to-Image, và Headless Video Rendering). 

**Tác giả:** [AI91 / Dokhacgiakhoa](https://github.com/Dokhacgiakhoa)  
**Bản quyền:** MIT License (Hoàn toàn miễn phí mã nguồn mở)

---

## 🌟 Tính Năng Cốt Lõi

Hệ thống cho phép bạn chỉ cần nhập **1 câu Promt (Ý tưởng)** và nhấn nút, AI sẽ lo toàn bộ từ A-Z:
1. **Lên kịch bản (Scripting):** Viết lời dẫn, chia nội dung thành các thẻ đồ hoạ (Card).
2. **Thu âm (Voice-over):** Đọc giọng AI tiếng Việt tự nhiên và trích xuất dấu thời gian (timestamps) cho từng chữ (Karaoke).
3. **Sinh ảnh minh hoạ (Image Gen):** Tự động prompt và sinh các bức ảnh minh hoạ cực nét cho từng ngữ cảnh.
4. **Render Video / Ảnh:** Dựng các thẻ đồ hoạ với hiệu ứng chuyển động mượt mà (GSAP), tự chèn nhạc nền, khớp lời đọc với phụ đề, sau đó xuất ra file `.mp4` 1080p@30fps (hoặc bộ ảnh `.png`).

Tất cả đều chạy **100% tự động** qua một giao diện Dashboard siêu đẹp. 

---

## 🛠 Ngăn Xếp Công Nghệ (Tech Stack)

Dự án này là sự kết hợp của những công nghệ hàng đầu:
- **Giao diện (Frontend):** Next.js 16 (App Router), React 19, Tailwind CSS.
- **Trình dựng Video (Rendering Engine):** Remotion (React-based renderer), Puppeteer Chromium.
- **Đồ hoạ chuyển động (Motion):** GSAP (GreenSock), Framer Motion.
- **Trí tuệ nhân tạo (AI & LLMs):** 
  - **Text:** Google Gemini (Cloud) hoặc Ollama (Local LLM - `qwen2.5:7b`).
  - **Voice:** Edge-TTS (Python).
  - **Image:** Pollinations API (Flux.1) hoặc Local ComfyUI.

---

## 🚀 Hướng Dẫn Cài Đặt (Installation Guide)

### 1. Yêu Cầu Hệ Thống (Prerequisites)
Bạn cần cài đặt các phần mềm sau trước khi bắt đầu:
- **Node.js:** Phiên bản 20+ (Khuyên dùng v24+).
- **Python:** Phiên bản 3.10+ (Đã thêm vào biến môi trường PATH).
- **FFmpeg:** Tải và thêm vào PATH (Bắt buộc để ghép nhạc và render MP4).
- **Git:** Để clone dự án.

### 2. Tải & Cài Đặt Mã Nguồn
Mở Terminal / Command Prompt và chạy lần lượt các lệnh sau:

```bash
# Clone dự án về máy
git clone https://github.com/Dokhacgiakhoa/videos-by-ai.git
cd videos-by-ai

# Cài đặt các thư viện Node.js
npm install

# Cài đặt thư viện Python (Dùng cho Edge-TTS)
pip install edge-tts
```

### 3. Cấu Hình Biến Môi Trường (.env)
Dự án cần một số cấu hình cơ bản để kết nối với AI.
1. Copy file mẫu `.env.example` thành file `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Mở file `.env.local` lên và điền thông tin:
   - Nếu bạn dùng API của Google Gemini, hãy điền Key vào (có thể tự lấy miễn phí tại Google AI Studio).
   - Nếu bạn dùng Ollama (chạy Local hoàn toàn), hãy đảm bảo Ollama đang bật trên máy tính.

---

## 💻 Cách Khởi Chạy

### Chế độ Nhà Phát Triển (Development)
Chạy lệnh sau để khởi động máy chủ Web Server:
```bash
npm run dev
```
👉 Sau đó mở trình duyệt và truy cập: **[http://localhost:3000](http://localhost:3000)**

*(Đối với người dùng Windows, bạn cũng có thể click đúp chuột vào file `start.bat` để máy tự động cài đặt và mở dự án mà không cần gõ lệnh).*

### Đóng Gói Phần Mềm (Build to .exe)
Nếu bạn muốn đóng gói thành 1 phần mềm Desktop cài đặt `.exe` độc lập bằng Electron:
```bash
# Xoá file rác (nếu có) trước khi build
npm run build:electron
```
File cài đặt sẽ nằm trong thư mục `dist/`.

---

## 🤝 Đóng Góp (Contributing)
Mã nguồn này được chia sẻ miễn phí với mong muốn đẩy mạnh năng suất tự động hoá trong mảng Truyền thông (Media). Nếu bạn thấy dự án hữu ích, hãy để lại **1 Ngôi sao (Star)** ⭐️ trên GitHub nhé! 

Mọi ý tưởng đóng góp (Pull Request) để làm dự án tốt hơn đều được chào đón!

---
*Powered by AI91 - Nâng tầm kỷ nguyên tự động hoá.*
