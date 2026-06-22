import React from "react";
import { Composition } from "remotion";
import { Ai91Video } from "./Video";
import type { Card, VideoProps } from "./types";

const FPS = 30;

const sampleCards: Card[] = [
  {
    type: "title",
    label: "BẢN TIN AI",
    headline: [
      { text: "Tuần này" },
      { text: "AI", color: "orange" },
      { text: "rung chuyển" },
      { text: "Việt Nam", color: "blue" },
    ],
    description: "Tổng hợp những tin trí tuệ nhân tạo nổi bật nhất và tác động tới thị trường trong nước.",
    tags: [
      { text: "báo chí", color: "blue" },
      { text: "hành chính", color: "yellow" },
      { text: "an ninh", color: "orange" },
    ],
    durationInFrames: 5 * FPS,
  },
  {
    type: "list",
    label: "ĐIỂM NHẤN",
    headline: "AI len lỏi vào mọi lĩnh vực",
    items: [
      { tag: "BÁO CHÍ", title: "10 quy tắc dùng AI trong toà soạn", subtitle: "chuẩn hoá việc ứng dụng AI" },
      { tag: "HÀNH CHÍNH", title: "Đẩy mạnh AI trong tham mưu", subtitle: "tăng hiệu quả công vụ" },
      { tag: "ĐÀO TẠO", title: "Tập huấn AI cho cán bộ", subtitle: "nâng cao kỹ năng khai thác" },
    ],
    durationInFrames: 6 * FPS,
  },
];

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Ai91Video"
      component={Ai91Video}
      fps={FPS}
      width={1080}
      height={1920}
      durationInFrames={11 * FPS}
      defaultProps={
        {
          brandText: "AI91",
          cards: sampleCards,
          audioSrc: undefined,
        } satisfies VideoProps
      }
      calculateMetadata={({ props }) => {
        const total = props.cards.reduce((s, c) => s + c.durationInFrames, 0);
        return { durationInFrames: Math.max(1, total) };
      }}
    />
  );
};
