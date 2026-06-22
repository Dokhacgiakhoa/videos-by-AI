import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ACCENT_HEX, type Accent, type Card, type VideoProps } from "./types";

const FONT = '"Segoe UI", system-ui, -apple-system, Arial, sans-serif';
const accent = (c?: Accent) => ACCENT_HEX[c ?? "white"];

/* ----------------------------- Nền + khung ----------------------------- */

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  // gradient dịch chuyển nhẹ cho sống động
  const shift = interpolate(frame, [0, 300], [0, 12], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: "#070b16" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 90% at 50% ${18 + shift}%, #16243f 0%, #0a1020 45%, #05070e 100%)`,
        }}
      />
      {/* hoạ tiết blueprint */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(120,160,220,0.05) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(120,160,220,0.05) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(80% 70% at 50% 40%, #000 30%, transparent 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

const CornerBrackets: React.FC = () => {
  const s: React.CSSProperties = {
    position: "absolute",
    width: 56,
    height: 56,
    borderColor: "rgba(180,200,235,0.45)",
    borderStyle: "solid",
  };
  const m = 54;
  return (
    <>
      <div style={{ ...s, top: m, left: m, borderWidth: "3px 0 0 3px" }} />
      <div style={{ ...s, top: m, right: m, borderWidth: "3px 3px 0 0" }} />
      <div style={{ ...s, bottom: m, left: m, borderWidth: "0 0 3px 3px" }} />
      <div style={{ ...s, bottom: m, right: m, borderWidth: "0 3px 3px 0" }} />
    </>
  );
};

const SearchBar: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: 150,
      left: "50%",
      transform: "translateX(-50%)",
      width: 760,
      height: 96,
      borderRadius: 24,
      background: "rgba(160,185,225,0.10)",
      border: "1px solid rgba(170,195,235,0.18)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 32px",
      backdropFilter: "blur(4px)",
    }}
  >
    <span style={{ color: "rgba(210,225,250,0.7)", fontSize: 34, fontFamily: FONT }}>Tìm kiếm</span>
    <div
      style={{
        width: 64,
        height: 64,
        borderRadius: 16,
        background: "rgba(170,195,235,0.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 34,
      }}
    >
      🔍
    </div>
  </div>
);

const Footer: React.FC<{ brandText: string }> = ({ brandText }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const pct = interpolate(frame, [0, durationInFrames - 1], [0, 100], { extrapolateRight: "clamp" });
  const cur = Math.floor(frame / fps);
  const tot = Math.floor(durationInFrames / fps);
  const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  return (
    <div style={{ position: "absolute", left: 70, right: 70, bottom: 110 }}>
      <div style={{ height: 8, borderRadius: 8, background: "rgba(180,200,235,0.15)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 8, background: "#ff7a2f" }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 22 }}>
        <Img src={staticFile("ai91-logo.webp")} style={{ height: 56 }} />
        <span
          style={{
            color: "rgba(200,215,240,0.55)",
            fontSize: 24,
            fontFamily: FONT,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          {brandText} · {mmss(cur)}/{mmss(tot)}
        </span>
      </div>
    </div>
  );
};

/* ------------------------- Hiệu ứng vào của thẻ ------------------------- */

function useEnter(delay = 0) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const enter = spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: 22 });
  const exit = interpolate(frame, [durationInFrames - 12, durationInFrames - 1], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { opacity: enter * exit, translateY: interpolate(enter, [0, 1], [40, 0]) };
}

const Label: React.FC<{ children: string }> = ({ children }) => (
  <div
    style={{
      color: "rgba(150,180,225,0.85)",
      fontSize: 26,
      fontWeight: 700,
      letterSpacing: 8,
      textTransform: "uppercase",
      fontFamily: FONT,
      marginBottom: 28,
    }}
  >
    {children}
  </div>
);

/* ------------------------------ Thẻ tiêu đề ----------------------------- */

const TitleCardView: React.FC<{ card: Extract<Card, { type: "title" }> }> = ({ card }) => {
  const { opacity, translateY } = useEnter();
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 90px",
        textAlign: "center",
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <Label>{card.label}</Label>
      <div style={{ fontFamily: FONT, fontSize: 78, fontWeight: 800, lineHeight: 1.12, color: "#fff" }}>
        {card.headline.map((seg, i) => (
          <span key={i} style={{ color: accent(seg.color) }}>
            {seg.text}
            {i < card.headline.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 32,
          lineHeight: 1.5,
          color: "rgba(205,218,240,0.78)",
          marginTop: 34,
          maxWidth: 820,
        }}
      >
        {card.description}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 18, justifyContent: "center", marginTop: 46 }}>
        {card.tags.map((t, i) => (
          <div
            key={i}
            style={{
              fontFamily: FONT,
              fontSize: 28,
              fontWeight: 700,
              color: accent(t.color),
              padding: "16px 30px",
              borderRadius: 999,
              border: `1px solid ${accent(t.color)}55`,
              background: `${accent(t.color)}14`,
            }}
          >
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ----------------------------- Thẻ danh sách ---------------------------- */

const ListCardView: React.FC<{ card: Extract<Card, { type: "list" }> }> = ({ card }) => {
  const { opacity, translateY } = useEnter();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 80px",
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <Label>{card.label}</Label>
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 66,
          fontWeight: 800,
          lineHeight: 1.15,
          color: "#fff",
          textAlign: "center",
          marginBottom: 46,
        }}
      >
        {card.headline}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22, width: "100%" }}>
        {card.items.map((it, i) => {
          const s = spring({ frame: frame - 8 - i * 6, fps, config: { damping: 200 }, durationInFrames: 18 });
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 28,
                padding: "30px 34px",
                borderRadius: 22,
                background: "rgba(150,175,220,0.08)",
                border: "1px solid rgba(160,185,225,0.14)",
                opacity: s,
                transform: `translateX(${interpolate(s, [0, 1], [-30, 0])}px)`,
              }}
            >
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: 3,
                  color: "rgba(150,180,225,0.85)",
                  minWidth: 150,
                  textTransform: "uppercase",
                }}
              >
                {it.tag}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT, fontSize: 36, fontWeight: 800, color: "#fff" }}>{it.title}</div>
                <div style={{ fontFamily: FONT, fontSize: 27, color: "rgba(205,218,240,0.62)", marginTop: 6 }}>
                  {it.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ------------------------------ Composition ----------------------------- */

export const Ai91Video: React.FC<VideoProps> = ({ brandText, cards, audioSrc }) => {
  let from = 0;
  return (
    <AbsoluteFill>
      <Background />
      {audioSrc ? <Audio src={audioSrc.startsWith("http") ? audioSrc : staticFile(audioSrc)} /> : null}
      {cards.map((card, i) => {
        const seq = (
          <Sequence key={i} from={from} durationInFrames={card.durationInFrames}>
            {card.type === "title" ? <TitleCardView card={card} /> : <ListCardView card={card} />}
          </Sequence>
        );
        from += card.durationInFrames;
        return seq;
      })}
      <SearchBar />
      <CornerBrackets />
      <Footer brandText={brandText} />
    </AbsoluteFill>
  );
};
