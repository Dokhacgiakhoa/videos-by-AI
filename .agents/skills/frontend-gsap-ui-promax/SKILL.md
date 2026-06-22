---
name: frontend-gsap-ui-promax
description: "Kỹ năng thiết kế giao diện React/HTML cao cấp (UX/UI Promax) và tạo chuyển động đồ họa động mượt mà bằng GSAP (GreenSock) trong Remotion."
---

# Kỹ năng Phát triển Front-end, GSAP & UX/UI Promax trong React/Remotion

Kỹ năng này giúp Agent thiết kế các giao diện web dashboard hiện đại, tinh tế và tạo ra các chuyển động đồ họa (motion graphics) chất lượng cao bằng GSAP được đồng bộ hoàn hảo trong môi trường làm video Remotion.

---

## 1. Thiết kế Giao diện UX/UI Cao cấp (Promax Layout)

Để giao diện web hoặc slide video trông đẳng cấp, chuyên nghiệp và có chiều sâu, luôn áp dụng các nguyên tắc thiết kế sau:

### 1.1 Hệ màu sắc & Typography (Typography & Palettes)
* **Tone màu tối hiện đại (Dark Theme)**: Sử dụng các tone màu xám đậm sang trọng làm nền (ví dụ: `bg-[#0B0F19]`, `bg-[#111827]`), tránh dùng màu đen thuần khiết (`#000`).
* **Màu điểm nhấn hài hòa (Accent Colors)**: Sử dụng các màu neon dịu mắt như tím Indigo, xanh ngọc Emerald, hoặc cam Amber để làm nổi bật các trạng thái hành động hoặc tiêu đề chính.
* **Typography**: Sử dụng các phông chữ Sans-serif hiện đại từ Google Fonts (như *Inter*, *Outfit*, *Plus Jakarta Sans*) để hiển thị tiêu đề và nội dung sắc nét.

### 1.2 Glassmorphism (Hiệu ứng kính mờ)
Áp dụng cho các panel, thẻ kịch bản hoặc khung kết quả để tạo chiều sâu lớp:
```css
.glass-panel {
  background: rgba(17, 24, 39, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

### 1.3 Micro-interactions (Tương tác nhỏ)
* Sử dụng các chuyển động hover mượt mà với `transition-all duration-300 ease-out`.
* Các nút bấm, thẻ slide cần dịch chuyển nhẹ lên trên (`hover:-translate-y-0.5`) hoặc tăng nhẹ độ sáng viền để phản hồi hành động của người dùng.

---

## 2. Quy tắc Đồng bộ GSAP với Remotion (Frame-by-Frame Sync)

> [!IMPORTANT]
> Trong Remotion, **KHÔNG** chạy hoạt ảnh GSAP theo thời gian thực (time-based) mặc định. Nếu dùng `gsap.to()` thông thường, khi render video thông qua Headless Chromium, các khung hình sẽ bị lệch hoặc giật vì quá trình render không diễn ra theo thời gian thực 1 giây = 1 giây thật.

### Giải pháp: Điều khiển thủ công qua Progress
Bạn phải liên kết thuộc tính `.progress()` của timeline GSAP với trục frame của Remotion thông qua hook `useCurrentFrame()`.

### Mã mẫu chuẩn hóa (Standard Boilerplate):
```tsx
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// Đăng ký hook React của GSAP
gsap.registerPlugin(useGSAP);

export const MotionSlideElement: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // 1. Tạo Timeline GSAP ở trạng thái paused
  useGSAP(() => {
    const tl = gsap.timeline({ paused: true });

    // Định nghĩa các chuyển động
    tl.fromTo(titleRef.current, 
      { opacity: 0, y: 50 }, 
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
    );
    tl.fromTo(boxRef.current, 
      { scale: 0.5, rotation: -45, opacity: 0 }, 
      { scale: 1, rotation: 0, opacity: 1, duration: 1.5, ease: 'elastic.out(1, 0.5)' },
      '-=0.5' // Overlap animation
    );

    timelineRef.current = tl;
  }, { scope: containerRef });

  // 2. Đồng bộ hóa tiến trình hoạt ảnh với số frame của Remotion
  useEffect(() => {
    if (timelineRef.current) {
      const progress = frame / durationInFrames;
      // Giới hạn progress trong khoảng từ 0 đến 1
      timelineRef.current.progress(Math.min(1, Math.max(0, progress)));
    }
  }, [frame, durationInFrames]);

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col justify-center items-center">
      <h1 ref={titleRef} className="text-4xl font-bold text-white mb-8">
        AI91 Medimation
      </h1>
      <div ref={boxRef} className="w-32 h-32 bg-indigo-500 rounded-2xl glass-panel shadow-2xl" />
    </div>
  );
};
```

---

## 3. Quy trình làm việc khi Thiết kế Hoạt ảnh Đồ họa (UX/UI Promax)

Khi có yêu cầu thiết kế giao diện động hoặc tạo slide video:
1. **Lập bố cục phân vùng**: Sử dụng Flexbox hoặc CSS Grid để đảm bảo slide tự co giãn tốt ở cả 3 tỉ lệ (9:16, 1:1, 16:9).
2. **Khai báo timeline GSAP**: Gom tất cả các phần tử đồ họa động (tiêu đề, ảnh, icon, biểu đồ) vào một timeline duy nhất.
3. **Trigger chuyển trạng thái bằng sự kiện Whispers**: Kết nối mốc thời gian của từ khóa nhận diện từ Whisper để dịch chuyển hoặc kích hoạt timeline GSAP tại đúng thời điểm giọng nói phát ra.
4. **Tối ưu hóa tài nguyên**: Sử dụng SVG thay vì ảnh bitmap khi vẽ các hình khối kỹ thuật để giữ độ sắc nét khi phóng to hoặc render ở chuẩn 1080p.
