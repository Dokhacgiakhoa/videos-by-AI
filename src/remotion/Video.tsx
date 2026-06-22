import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Card, VideoProps, VoiceWord } from "./types";
import { SlideRenderer } from "./LayoutComponents";
import "./layouts.css"; // The unified CSS for all 15 layouts

/** Số frame chồng lấn giữa 2 thẻ để tạo crossfade. */
const OVERLAP = 8;

const KaraokeSubtitles: React.FC<{ words: VoiceWord[]; durationInFrames: number }> = ({ words }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = frame / fps;

  if (!words || words.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "flex-start",
        gap: "0.625rem",
        background: "rgba(7, 10, 15, 0.45)",
        backdropFilter: "blur(0.5rem)",
        padding: "1rem 1.5rem",
        borderRadius: "1rem",
        border: "1px solid var(--line)",
        marginTop: "1.5rem",
        maxWidth: "55rem",
        zIndex: 9999, // Ensure subtitles are above all layouts
        position: "absolute",
        bottom: "8rem",
        left: "5.5rem",
        boxSizing: "border-box"
      }}
    >
      {words.map((w, idx) => {
        const isActive = time >= w.start && time <= w.end;
        return (
          <span
            key={idx}
            style={{
              fontFamily: "var(--disp)",
              fontSize: "2.125rem",
              fontWeight: 700,
              color: isActive ? "var(--hot)" : "rgba(238, 242, 246, 0.4)",
              transform: isActive ? "scale(1.12)" : "scale(1)",
              transition: "transform 0.08s ease, color 0.08s ease",
              display: "inline-block",
            }}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
};

const SceneComponent: React.FC<{ card: Card; index: number }> = ({ card, index }) => {
  const localFrame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  
  return (
    <>
      <SlideRenderer slide={card} activeIndex={index} localFrame={localFrame} />
      {card.words && card.words.length > 0 && (
        <KaraokeSubtitles words={card.words} durationInFrames={durationInFrames} />
      )}
    </>
  );
};

export const Ai91Video: React.FC<VideoProps> = ({ brandText, cards, audioSrc, bgMusic }) => {
  const offsets = cards.reduce<number[]>((acc, _card, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + cards[i - 1].durationInFrames);
    return acc;
  }, []);

  return (
    <AbsoluteFill
      style={{ backgroundColor: "#000" }}
      className="dev-repo-card-stage overflow-hidden select-none"
    >
      {cards.map((card, i) => {
        return (
          <Sequence
            key={i}
            from={offsets[i]}
            durationInFrames={card.durationInFrames + OVERLAP}
            name={`Scene-${i + 1}`}
          >
            <SceneComponent card={card} index={i} />
          </Sequence>
        );
      })}

      {bgMusic && (
        <Audio src={staticFile(bgMusic)} volume={0.08} loop />
      )}
      {audioSrc && (
        <Audio src={staticFile(audioSrc)} />
      )}
    </AbsoluteFill>
  );
};
