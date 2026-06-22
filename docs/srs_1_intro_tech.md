# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) - PHẦN 1
## Phần mềm Sản xuất Video Tự động AI91 Medimation

Tài liệu này đặc tả chi tiết về mặt chức năng, kiến trúc, luồng dữ liệu và lộ trình triển khai cho hệ thống **AI91 Medimation** nhằm tự động hóa quy trình tạo video và bài post mạng xã hội chất lượng cao từ AI.

---

## 1. Giới thiệu & Mục tiêu Dự án

### 1.1 Mục tiêu
Xây dựng một pipeline hoàn chỉnh chạy trên môi trường **localhost** để chuyển đổi một prompt yêu cầu của người dùng thành:
1. **Video thuyết trình chuyên nghiệp (Card Motion)**: Có lời thoại, phụ đề karaoke đồng bộ từng từ, và các hiệu ứng chuyển động đồ họa (motion graphics) mượt mà, triệt tiêu hoàn toàn khung hình chết (dead frames).
2. **Bài post đăng mạng xã hội (Image Post)**: Các slide tĩnh được dàn trang tự động (React layout) chứa các luận điểm chính, tiêu đề và logo thương hiệu, xuất ra dưới dạng các tệp ảnh định dạng JPEG hoặc PNG chất lượng cao (được đóng gói trong file zip).

### 1.2 Bối cảnh & Khác biệt với MoneyPrinterTurbo
* **MoneyPrinterTurbo**: Rất mạnh trong việc ghép các video stock tĩnh có sẵn đè sub lên. Tuy nhiên, nó không thể tạo ra các thành phần đồ họa động (biểu đồ, sơ đồ cấu trúc thuật toán tự vẽ) và xử lý hiệu ứng chuyển cảnh mượt mà do hạn chế từ thư viện MoviePy.
* **AI91 Medimation**: Chuyển hướng sang kiến trúc **State-driven Animation** sử dụng **Remotion (React)** làm engine đồ họa cốt lõi, render thông qua Headless Chromium ở 30fps để đạt độ phân giải HD 1080p và tối ưu thời gian xử lý.

---

## 2. Lựa chọn Công nghệ Tối ưu (Tech Stack)

Công nghệ được chia làm 2 phần chính: Mã nguồn mở chạy cục bộ (Open Source & Local) và Dịch vụ đám mây (API/Token Cloud Services) để tối đa tính linh hoạt và bảo mật.

> **Ghi chú trạng thái triển khai:** Bảng dưới đánh dấu rõ thành phần **đang chạy thực tế** trong code và thành phần thuộc **lộ trình/tùy chọn cắm thêm** (chưa wired). Xem thêm mục 2.3.

### 2.1 Công nghệ Mã nguồn mở & Chạy cục bộ (Open Source & Local)

| Thành phần | Giải pháp áp dụng | Trạng thái | Đặc tính kỹ thuật |
| :--- | :--- | :--- | :--- |
| **Dashboard & Logic Web** | Next.js (React App Router, Tailwind CSS, TS) | ✅ Đang dùng | Chạy offline hoàn toàn trên localhost làm giao diện cấu hình và điều khiển pipeline. |
| **LLM Engine (Local)** | Ollama (mặc định `qwen2.5:7b`; có thể đổi sang Llama-3, DeepSeek, Mistral) | ✅ Đang dùng | Sinh kịch bản và phân cảnh offline hoàn toàn trên VRAM cục bộ không cần internet. |
| **Giọng đọc (TTS)** | **Edge-TTS** (chạy local qua Python `edge-tts`; giọng `vi-VN-HoaiMyNeural` nữ / `vi-VN-NamMinhNeural` nam) | ✅ Đang dùng | Engine TTS duy nhất hiện hành. Sinh audio kèm **timestamp cấp độ từ (WordBoundary)** ngay trong cùng một bước. |
| **Đồng bộ từ (Word Timestamp)** | **Edge-TTS WordBoundary** (`scripts/edge_tts_gen.py` → mảng `words{word,start,end}`) | ✅ Đang dùng | Timestamp cấp độ từ được sinh trực tiếp khi tạo audio — **không cần bước bóc băng (Whisper) riêng**. |
| **Đồ họa & Render** | Remotion (React framework) + Headless Chromium | ✅ Đang dùng | Chụp frame đồ họa động chất lượng cao bằng mã lập trình. |
| **Đóng gói video** | FFmpeg CLI | ✅ Đang dùng | Hợp nhất video frames, audio thoại và nhạc nền cục bộ (kèm Audio Ducking). |
| **Thiết kế Template** | Agent Custom Skills (HTML/React template design)| ✅ Đang dùng | Kỹ năng của Agent tự thiết kế/chỉnh sửa template React/HTML động phù hợp với prompt. |
| **Hiệu ứng đồ họa (Animation)**| **GSAP `^3.15` + `@gsap/react` `^2.1`** (đồng bộ trục frame Remotion) + **Framer Motion `^12.40`** (hiệu ứng UI dashboard) | ✅ Đang dùng | Thư viện tạo chuyển động mượt mà cho React, được đồng bộ trực tiếp với trục frame của Remotion để xuất video chất lượng cao. |

### 2.2 Dịch vụ Đám mây & Yêu cầu API/Token (API & Token Cloud Services)

| Thành phần | Giải pháp đám mây | Trạng thái | Yêu cầu API / Token |
| :--- | :--- | :--- | :--- |
| **LLM Engine (Cloud)** | Gemini API (mặc định `gemini-2.5-flash`) | ✅ Đang dùng | Yêu cầu `GEMINI_API_KEY`. Chọn Ollama hay Gemini qua biến `AI_PROVIDER` (mặc định `google`). |
| **Sinh ảnh (Image, cho Image Post / pipeline cũ)** | Pollinations (Flux, miễn phí — mặc định) / Google Imagen / ComfyUI+Flux local | ✅ Đang dùng | Chọn qua biến `IMAGE_PROVIDER` (`pollinations` / `google` / `local`). |

### 2.3 Tùy chọn / Lộ trình mở rộng (chưa triển khai trong code)

Các công nghệ dưới đây nằm trong định hướng nhưng **hiện chưa được wired** vào code; có thể bổ sung dưới dạng provider cắm thêm:
* **TTS thay thế:** VITS Local (giọng Infore), XTTS, Bark, Google Cloud TTS (Neural2), ElevenLabs.
* **Bóc băng độc lập:** OpenAI Whisper Local (`whisper.cpp` / `faster-whisper`), Whisper API, AssemblyAI — *chỉ cần khi chuyển sang TTS không tự sinh timestamp.*
* **LLM Cloud khác:** OpenAI GPT-4o, Anthropic Claude.
* **Animation bổ sung:** Lottie, Motion One.

---

👉 Xem tiếp: [Kiến trúc Hệ thống & Luồng xử lý chi tiết](./srs_2_architecture_pipelines.md)
