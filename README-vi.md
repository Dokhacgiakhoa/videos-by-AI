<div align="center">
  <p>[🇬🇧 Read in English](README.md)</p>
  <img src="public/AI91.jpg" alt="AI91 Logo" width="200" style="border-radius: 20px;" />
</div>

# AI91 Medimation - Tự Động Hoá Sản Xuất Media

Một hệ thống tự động hoá hoàn toàn quy trình sản xuất **Video ngắn (Shorts/Reels)** và **Bài viết dạng ảnh (Carousel Posts)** dành cho mạng xã hội, sử dụng sức mạnh của các mô hình AI tiên tiến nhất (LLM, Text-to-Speech, Text-to-Image, và Headless Video Rendering).

**Tác giả:** [AI91 / Dokhacgiakhoa](https://github.com/Dokhacgiakhoa)  
**Bản quyền:** MIT License (Mã nguồn mở)

---

## 🌟 Tính Năng Cốt Lõi

Hệ thống cho phép bạn chỉ cần nhập **1 câu Prompt (Chủ đề)** và AI sẽ tự động xử lý toàn bộ quy trình:
1. **Lên Kịch Bản:** Tự động lên dàn ý, viết lời dẫn và chia nội dung thành các thẻ đồ hoạ trực quan.
2. **Thu Âm (TTS):** Đọc giọng AI tự nhiên và trích xuất dấu thời gian (timestamps) để làm phụ đề Karaoke.
3. **Sinh Ảnh AI:** Tự động tạo prompt và vẽ ảnh minh hoạ nét căng cho từng cảnh.
4. **Render Video:** Dựng video với chuyển động đồ hoạ mượt mà (GSAP), chèn nhạc nền, ghép âm thanh và xuất ra file `.mp4` 1080p@30fps (hoặc bộ ảnh tĩnh `.png`).

Tất cả đều được thực hiện **100% tự động** thông qua giao diện Next.js hiện đại.

---

## 🚀 Phần 1: Cài đặt dành cho Vibecoders (Sử dụng AI)

Dự án này được thiết kế theo chuẩn **AI-First**. Nếu bạn thuộc hệ "vibecoding", bạn KHÔNG CẦN phải hì hục tải hay cài đặt Node.js, Python, hay FFmpeg bằng tay.

Tất cả những gì bạn cần là một **Trợ lý AI lập trình** (như **Antigravity**, **Claude Code**, **Cursor**, hoặc **Codex**).

1. Tải mã nguồn về máy:
   ```bash
   git clone https://github.com/Dokhacgiakhoa/videos-by-ai.git
   cd videos-by-ai
   ```
2. Mở thư mục dự án trong IDE hoặc Terminal có tích hợp AI của bạn.
3. **Chat với AI câu lệnh sau:**
   > *"Hãy phân tích dự án này và cài đặt toàn bộ môi trường cần thiết (Node.js, Python, FFmpeg, npm install, pip install edge-tts) để chạy nó hộ tôi."*
4. Việc của bạn là đi pha một ly cà phê ☕ và để AI tự động thiết lập toàn bộ máy móc cho bạn.

---

## 🛠 Phần 2: Cài đặt dành cho Real Devs (Cài đặt thủ công)

Nếu bạn là một lập trình viên truyền thống và muốn tự tay thiết lập để làm chủ toàn bộ môi trường, hãy làm theo hướng dẫn sau.

### Yêu Cầu Hệ Thống (Prerequisites)
Bạn cần cài đặt các phần mềm sau và thêm chúng vào biến môi trường (`PATH`):
- **Node.js:** Phiên bản 20.0 trở lên (Khuyên dùng v24+).
- **Python:** Phiên bản 3.10 trở lên.
- **FFmpeg:** Bắt buộc để Remotion ghép nối Video và Audio.
- **Git:** Để tải mã nguồn.

### Cài Đặt Thư Viện
Mở Terminal và chạy các lệnh:

```bash
# Clone dự án về máy
git clone https://github.com/Dokhacgiakhoa/videos-by-ai.git
cd videos-by-ai

# Cài đặt thư viện Node.js
npm install

# Cài đặt thư viện Python (Cần thiết cho tính năng sinh giọng đọc)
pip install edge-tts
```

### Cấu Hình Biến Môi Trường (.env)
Dự án cần một vài thông số kết nối với AI.
1. Copy file mẫu `.env.example` thành file `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Mở `.env.local` lên và điền thông tin:
   - Nhập **Google Gemini API Key** của bạn (Lấy miễn phí tại Google AI Studio).
   - Nếu bạn dùng LLM chạy trên máy tính (như `qwen2.5:7b`), hãy đảm bảo phần mềm **Ollama** đang được bật ở port `11434`.

### Khởi Chạy Dự Án
Bật máy chủ lập trình (Development Server):
```bash
npm run dev
```
👉 Mở trình duyệt và truy cập: **[http://localhost:3000](http://localhost:3000)**

### Đóng Gói Phần Mềm (Electron)
Nếu bạn muốn xuất file chạy `.exe` độc lập cho hệ điều hành:
```bash
npm run build:electron
```
File cài đặt hoàn chỉnh sẽ nằm trong thư mục `dist/`.

---

## 🏗 Ngăn Xếp Công Nghệ (Tech Stack)

Dự án này sử dụng các công nghệ tiên tiến nhất:
- **Giao diện & Hệ thống:** Next.js 16 (App Router), React 19, Tailwind CSS, TypeScript.
- **Trình dựng Video:** Remotion (Chạy thông qua Headless Chromium).
- **Hiệu ứng đồ hoạ:** GSAP (GreenSock), Framer Motion.
- **Trí tuệ nhân tạo (AI):**
  - **Văn bản:** Google Gemini API (Cloud) hoặc Ollama (Local).
  - **Giọng đọc:** Edge-TTS (Python).
  - **Hình ảnh:** Pollinations API (Flux.1) hoặc Local ComfyUI.
- **Xử lý Đa phương tiện:** FFmpeg.

### Cấu Trúc Thư Mục
- `src/app/`: Giao diện người dùng và API Backend.
- `src/lib/pipeline/`: Lõi xử lý dữ liệu (Kết nối LLM, sinh Audio, kết nối Remotion).
- `src/remotion/`: Các Component React đặc biệt chuyên dùng để vẽ khung hình Video.
- `public/assets/`: Nơi lưu trữ Video, ảnh sinh ra và các mẫu cài đặt tự động.

---

## 🤝 Đóng Góp (Contributing)
Mã nguồn này được chia sẻ miễn phí nhằm đẩy mạnh năng suất tự động hoá trong mảng Truyền thông (Media). Nếu bạn thấy dự án có ích, hãy ủng hộ bằng cách tặng **1 Ngôi sao (Star)** ⭐️ trên GitHub nhé!

Mọi ý tưởng đóng góp mã nguồn (Pull Request), báo cáo lỗi hay gợi ý tính năng đều được chào đón nhiệt tình!
