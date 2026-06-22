import type { Card } from "./types";
import { getCardEntranceDuration } from "./layoutsTimings";

const FPS = 30;

export const DATA: Card[] = [
  {
    layoutType: "card",
    name: "LOREMSIMZ",
    label: "loremsimz.repo · daily",
    pillDay: "LOREM SIMZ DAY",
    badges: ["LIPSUM", "Consectetur", "v1.0"],
    tag: "Lorem simz amet dolor sit <em>consectetur elit clean</em>.",
    stat: "99",
    statSuffix: "%",
    lab1: "simz",
    lab2: "lorem ipsum",
    cmd: "npx lorem-simz-mcp",
    star: "10.5K",
    durationInFrames: 0,
  },
  {
    layoutType: "cream",
    name: "CREAM",
    badges: [], tag: "", stat: "", statSuffix: "", lab1: "", lab2: "", cmd: "", star: "", durationInFrames: 0,
    creamTitle: "Tạm Dừng · Chờ Ký",
    progressLabel: "Ngày 8 / 14",
    progressPct: 57,
    chatUser: "Lorem bot?",
    chatBot: "Ipsum response.",
    creamSub: "Nó phải tạm dừng.",
  },
  {
    layoutType: "manim",
    name: "MANIM",
    badges: [], tag: "", stat: "", statSuffix: "", lab1: "", lab2: "", cmd: "", star: "", durationInFrames: 0,
    manimHeader: "Từ Số 0 Đến Transformer",
    manimTitle: "VECTOR là gì?",
    mapLeft1: "Xin chào", mapRight1: "[0.2, -0.5, 1.3, ...]",
    mapLeft2: "Hình ảnh", mapRight2: "[0.8, 0.1, -0.3, ...]",
    manimSub: "Trong AI, mọi thông tin đều thành vector",
  },
  {
    layoutType: "title",
    name: "TITLE",
    badges: [], tag: "", stat: "", statSuffix: "", lab1: "", lab2: "", cmd: "", star: "", durationInFrames: 0,
    titleMain: "TƯƠNG LAI CỦA TRÍ TUỆ NHÂN TẠO",
    titleSub: "AI KHÔNG THAY THẾ BẠN, NGƯỜI DÙNG AI SẼ THAY THẾ BẠN",
  },
  {
    layoutType: "list",
    name: "LIST",
    badges: [], tag: "", stat: "", statSuffix: "", lab1: "", lab2: "", cmd: "", star: "", durationInFrames: 0,
    listTitle: "3 Trụ Cột Chính",
    listItems: ["Năng lực tính toán (Compute)", "Dữ liệu lớn (Big Data)", "Thuật toán tinh chỉnh (Algorithms)"],
  },
  {
    layoutType: "text-image",
    name: "TEXT-IMAGE",
    badges: [], tag: "", stat: "", statSuffix: "", lab1: "", lab2: "", cmd: "", star: "", durationInFrames: 0,
    tiTitle: "Kiến Trúc Mạng",
    tiText: "Mạng lưới nơ-ron nhân tạo lấy cảm hứng từ cấu trúc não bộ con người, kết nối hàng tỷ tham số thông qua các lớp ẩn.",
    tiImageMock: "network",
  },
  {
    layoutType: "text-video",
    name: "TEXT-VIDEO",
    badges: [], tag: "", stat: "", statSuffix: "", lab1: "", lab2: "", cmd: "", star: "", durationInFrames: 0,
    tvTitle: "Hệ Thống Real-time",
    tvText: "Phân tích dữ liệu theo thời gian thực (real-time) cho phép AI đưa ra quyết định chỉ trong vài mili-giây.",
    tvVideoMock: "radar",
  },
  {
    layoutType: "chart",
    name: "CHART",
    badges: [], tag: "", stat: "", statSuffix: "", lab1: "", lab2: "", cmd: "", star: "", durationInFrames: 0,
    chartTitle: "Tốc Độ Tăng Trưởng Lượng Tham Số",
    chartSub: "Từ năm 2018 đến 2024",
    chartData: [{ label: "GPT-1", value: 10 }, { label: "GPT-2", value: 30 }, { label: "GPT-3", value: 70 }, { label: "GPT-4", value: 95 }],
  },
  {
    layoutType: "bento",
    name: "BENTO",
    badges: [], tag: "", stat: "", statSuffix: "", lab1: "", lab2: "", cmd: "", star: "", durationInFrames: 0,
    bentoTitle: "Hệ Sinh Thái Công Cụ",
    bentoItems: [
      { title: "Tự động hóa", desc: "Giảm 80% thời gian code" },
      { title: "Phân tích", desc: "Nhận diện xu hướng chuẩn" },
      { title: "Bảo mật", desc: "Mã hóa đa lớp an toàn" },
      { title: "Mở rộng", desc: "Scale hệ thống mượt mà" }
    ],
  },
  {
    layoutType: "split-3d",
    name: "SPLIT-3D",
    badges: [], tag: "", stat: "", statSuffix: "", lab1: "", lab2: "", cmd: "", star: "", durationInFrames: 0,
    s3dTitle: "Kiến Trúc Đa Tầng (Multi-layer)",
    s3dLayers: ["Giao Diện Trình Diễn (UI)", "Tầng Logic Thuật Toán (Core)", "Tầng Cơ Sở Dữ Liệu (DB)"],
  },
  {
    layoutType: "quote",
    name: "QUOTE",
    badges: [], tag: "", stat: "", statSuffix: "", lab1: "", lab2: "", cmd: "", star: "", durationInFrames: 0,
    quoteText: "Phần mềm đang ăn thịt thế giới, nhưng AI đang ăn thịt phần mềm.",
    quoteAuthor: "Jensen Huang",
  },
  {
    layoutType: "stats-grid",
    name: "STATS",
    badges: [], tag: "", stat: "", statSuffix: "", lab1: "", lab2: "", cmd: "", star: "", durationInFrames: 0,
    sgTitle: "Hiệu Suất Thực Tế",
    sgStats: [
      { val: 99, suffix: "%", label: "Độ chính xác" },
      { val: 10, suffix: "x", label: "Tăng tốc độ" },
      { val: 2.5, suffix: "M", label: "Lượt truy vấn" },
      { val: 24, suffix: "/7", label: "Hoạt động" }
    ],
  },
  {
    layoutType: "timeline",
    name: "TIMELINE",
    badges: [], tag: "", stat: "", statSuffix: "", lab1: "", lab2: "", cmd: "", star: "", durationInFrames: 0,
    tlTitle: "Hành Trình Trí Tuệ Nhân Tạo",
    tlNodes: [
      { year: "2017", event: "Transformer Ra Mắt" },
      { year: "2020", event: "GPT-3 Bùng Nổ" },
      { year: "2024", event: "AI Đa Phương Thức" }
    ],
  },
  {
    layoutType: "code-snippet",
    name: "CODE",
    badges: [], tag: "", stat: "", statSuffix: "", lab1: "", lab2: "", cmd: "", star: "", durationInFrames: 0,
    csTitle: "Mã Nguồn Khởi Tạo",
    csCode: "import torch\nimport torch.nn as nn\n\nclass SimpleTransformer(nn.Module):\n    def __init__(self):\n        super().__init__()\n        self.attention = nn.MultiheadAttention(d_model=512, num_heads=8)\n\n    def forward(self, x):\n        return self.attention(x, x, x)[0]",
  },
  {
    layoutType: "outro",
    name: "OUTRO",
    badges: [], tag: "", stat: "", statSuffix: "", lab1: "", lab2: "", cmd: "", star: "", durationInFrames: 0,
    outroSlogan: "AI91 - Tự động hóa bản tin của bạn.",
    outroContact: "www.ai91.vn | @ai91.medimation",
  },
  // Repeat the cycle with different data
  {
    layoutType: "card",
    name: "IPSUMSYS",
    label: "loremsimz.repo · daily",
    pillDay: "LOREM SIMZ DAY",
    badges: ["Apache-2.0", "Tempor", "Node"],
    tag: "Adipiscing elit sed do <em>eiusmod tempor incididunt</em>.",
    stat: "95",
    statSuffix: "K★",
    lab1: "stars",
    lab2: "on GitHub",
    cmd: "npm i ipsum-sys",
    star: "95K",
    durationInFrames: 0,
  },
  {
    layoutType: "cream",
    name: "CREAM2",
    badges: [], tag: "", stat: "", statSuffix: "", lab1: "", lab2: "", cmd: "", star: "", durationInFrames: 0,
    creamTitle: "Bộ Nhớ Đệm",
    progressLabel: "Bộ Nhớ 5 / 10",
    progressPct: 50,
    chatUser: "Sint occaecat?",
    chatBot: "Officia deserunt.",
    creamSub: "Lưu trữ dữ liệu truy cập nhanh.",
  },
  {
    layoutType: "manim",
    name: "MANIM2",
    badges: [], tag: "", stat: "", statSuffix: "", lab1: "", lab2: "", cmd: "", star: "", durationInFrames: 0,
    manimHeader: "Đo Lường Khoảng Cách",
    manimTitle: "COSINE SIMILARITY",
    mapLeft1: "cos(theta)", mapRight1: "Độ tương đồng góc",
    mapLeft2: "A . B / (|A||B|)", mapRight2: "Công thức toán",
    manimSub: "Tính khoảng cách góc giữa các vector nhúng",
  },
  {
    layoutType: "title",
    name: "TITLE2",
    badges: [], tag: "", stat: "", statSuffix: "", lab1: "", lab2: "", cmd: "", star: "", durationInFrames: 0,
    titleMain: "KHAI THÁC DỮ LIỆU ĐÁM MÂY",
    titleSub: "QUY TRÌNH BIG DATA THEO THỜI GIAN THỰC TỐI ƯU",
  },
  {
    layoutType: "list",
    name: "LIST2",
    badges: [], tag: "", stat: "", statSuffix: "", lab1: "", lab2: "", cmd: "", star: "", durationInFrames: 0,
    listTitle: "Bảo Mật Cấp Cao",
    listItems: ["Mã hóa đầu cuối (E2E)", "Kiểm soát truy cập Role-based", "Chống tấn công DDoS", "Kiểm toán Logs tự động"],
  },
  {
    layoutType: "text-image",
    name: "TEXT-IMAGE2",
    badges: [], tag: "", stat: "", statSuffix: "", lab1: "", lab2: "", cmd: "", star: "", durationInFrames: 0,
    tiTitle: "Máy Học Lượng Tử",
    tiText: "Sử dụng trạng thái chồng chất lượng tử để tính toán song song, giúp tăng tốc độ huấn luyện mô hình gấp hàng ngàn lần.",
    tiImageMock: "cube",
  },
  {
    layoutType: "text-video",
    name: "TEXT-VIDEO2",
    badges: [], tag: "", stat: "", statSuffix: "", lab1: "", lab2: "", cmd: "", star: "", durationInFrames: 0,
    tvTitle: "Nhận Diện Hình Ảnh",
    tvText: "Computer Vision quét qua từng khung hình để bóc tách đặc trưng khuôn mặt, vật thể và biển báo giao thông.",
    tvVideoMock: "pulse",
  },
  {
    layoutType: "chart",
    name: "CHART2",
    badges: [], tag: "", stat: "", statSuffix: "", lab1: "", lab2: "", cmd: "", star: "", durationInFrames: 0,
    chartTitle: "Tỷ Lệ Giữ Chân Người Dùng",
    chartSub: "Phân tích hành vi theo tháng",
    chartData: [{ label: "T1", value: 40 }, { label: "T2", value: 65 }, { label: "T3", value: 85 }, { label: "T4", value: 92 }],
  },
  {
    layoutType: "bento",
    name: "BENTO2",
    badges: [], tag: "", stat: "", statSuffix: "", lab1: "", lab2: "", cmd: "", star: "", durationInFrames: 0,
    bentoTitle: "Kiến Trúc Microservices",
    bentoItems: [
      { title: "Độc lập", desc: "Không phụ thuộc lẫn nhau" },
      { title: "Bảo trì", desc: "Dễ dàng nâng cấp từng cụm" },
      { title: "Linh hoạt", desc: "Phù hợp mọi quy mô mảng" },
      { title: "CI/CD", desc: "Tích hợp deploy liên tục" }
    ],
  },
  {
    layoutType: "split-3d",
    name: "SPLIT-3D2",
    badges: [], tag: "", stat: "", statSuffix: "", lab1: "", lab2: "", cmd: "", star: "", durationInFrames: 0,
    s3dTitle: "Cấu Trúc Tệp AI91",
    s3dLayers: ["Luồng Render (Remotion)", "Kiểm Soát API (Next.js)", "Kho Lưu Trữ Đám Mây (S3)"],
  },
  {
    layoutType: "quote",
    name: "QUOTE2",
    badges: [], tag: "", stat: "", statSuffix: "", lab1: "", lab2: "", cmd: "", star: "", durationInFrames: 0,
    quoteText: "Dữ liệu là nguồn dầu mỏ mới của nền kinh tế số.",
    quoteAuthor: "Clive Humby",
  },
  {
    layoutType: "stats-grid",
    name: "STATS2",
    badges: [], tag: "", stat: "", statSuffix: "", lab1: "", lab2: "", cmd: "", star: "", durationInFrames: 0,
    sgTitle: "Quy Mô Hệ Thống",
    sgStats: [
      { val: 1.2, suffix: "B+", label: "Token/Ngày" },
      { val: 500, suffix: "ms", label: "Độ trễ trung bình" },
      { val: 12, suffix: "k", label: "CPU Cores" },
      { val: 99.9, suffix: "%", label: "SLA Uptime" }
    ],
  },
  {
    layoutType: "timeline",
    name: "TIMELINE2",
    badges: [], tag: "", stat: "", statSuffix: "", lab1: "", lab2: "", cmd: "", star: "", durationInFrames: 0,
    tlTitle: "Kế Hoạch Ra Mắt (Roadmap)",
    tlNodes: [
      { year: "Q1", event: "Bản thử nghiệm Alpha" },
      { year: "Q2", event: "Mở API cho lập trình viên" },
      { year: "Q3", event: "Phát hành phiên bản Beta" },
      { year: "Q4", event: "Chính thức ra mắt toàn cầu" }
    ],
  },
  {
    layoutType: "code-snippet",
    name: "CODE2",
    badges: [], tag: "", stat: "", statSuffix: "", lab1: "", lab2: "", cmd: "", star: "", durationInFrames: 0,
    csTitle: "Tích Hợp API Dễ Dàng",
    csCode: "import { Ai91Client } from 'ai91-sdk';\n\nconst client = new Ai91Client({ key: 'sk-12345' });\n\nconst video = await client.render({\n  topic: 'AI News',\n  layout: 'bento'\n});\nconsole.log(video.url);",
  },
  {
    layoutType: "outro",
    name: "OUTRO2",
    badges: [], tag: "", stat: "", statSuffix: "", lab1: "", lab2: "", cmd: "", star: "", durationInFrames: 0,
    outroSlogan: "Sáng tạo nội dung không giới hạn.",
    outroContact: "docs.ai91.vn | github.com/ai91",
  }
];

// Dynamically calculate durationInFrames for all slides
DATA.forEach(slide => {
  const entrance = getCardEntranceDuration(slide);
  slide.durationInFrames = Math.round((entrance + 1.0 + 0.4) * FPS);
});

export const startOffsets = DATA.reduce<number[]>((acc, slide, idx) => {
  if (idx === 0) {
    acc.push(0);
  } else {
    acc.push(acc[idx - 1] + DATA[idx - 1].durationInFrames);
  }
  return acc;
}, []);

export const totalMockupDuration = startOffsets[DATA.length - 1] + DATA[DATA.length - 1].durationInFrames;
