import React from "react";
import { Composition } from "remotion";
import { Ai91Video } from "./Video";
import { ArticlePost } from "./ArticlePost";
import { GsapSampleSlide, totalMockupDuration } from "./GsapSampleSlide";
import type { ArticlePostProps, Card, VideoProps } from "./types";

const FPS = 30;

const sampleCards: Card[] = [
  {
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
    durationInFrames: 5 * FPS,
  },
  {
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
    durationInFrames: 6 * FPS,
  },
];

const videoDefaultProps: Record<string, unknown> = {
  brandText: "AI91",
  cards: sampleCards,
  audioSrc: undefined,
  width: 1080,
  height: 1920,
} satisfies VideoProps;

const articleDefaultProps: Record<string, unknown> = {
  width: 1080,
  height: 1920,
  headline: "AI tạo sinh bùng nổ tại Việt Nam",
  subheadline: "Doanh nghiệp tăng tốc ứng dụng để bứt phá năng suất",
  source: "VnExpress",
  date: "2026-06-23",
  imageSrc: "ai91-logo-hi.png",
  brandText: "AI91",
  eyebrow: "TIÊU ĐIỂM",
  accent: "orange",
} satisfies ArticlePostProps;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Ai91Video"
        component={Ai91Video as unknown as React.ComponentType<Record<string, unknown>>}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={11 * FPS}
        defaultProps={videoDefaultProps}
        calculateMetadata={({ props }) => {
          const cards = (props.cards as Card[]) ?? [];
          const total = cards.reduce((s: number, c: Card) => s + c.durationInFrames, 0);
          return {
            durationInFrames: Math.max(1, total),
            width: (props.width as number) ?? 1080,
            height: (props.height as number) ?? 1920,
          };
        }}
      />
      <Composition
        id="ArticlePost"
        component={ArticlePost as unknown as React.ComponentType<Record<string, unknown>>}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={1}
        defaultProps={articleDefaultProps}
        calculateMetadata={({ props }) => ({
          width: (props.width as number) ?? 1080,
          height: (props.height as number) ?? 1920,
          durationInFrames: 1,
        })}
      />
      <Composition
        id="GsapSampleSlide"
        component={GsapSampleSlide}
        fps={FPS}
        width={1080}
        height={1920}
        durationInFrames={totalMockupDuration}
      />
    </>
  );
};
