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
import { BRAND_FONT as FONT, COLORS, useLayout, type Layout } from "./layout";

/** Số frame chồng lấn giữa 2 thẻ để tạo crossfade. */
const OVERLAP = 8;

const accent = (c?: Accent) => ACCENT_HEX[c ?? "white"];

/* ----------------------------- Nền + khung ----------------------------- */

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const shift = interpolate(frame, [0, 300], [0, 12], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 90% at 50% ${18 + shift}%, #16243f 0%, #0a1020 45%, #05070e 100%)`,
        }}
      />
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

const CornerBrackets: React.FC<{ L: Layout }> = ({ L }) => {
  const sz = L.u(56);
  const m = L.u(54);
  const bw = L.u(3);
  const s: React.CSSProperties = {
    position: "absolute",
    width: sz,
    height: sz,
    borderColor: "rgba(180,200,235,0.45)",
    borderStyle: "solid",
  };
  return (
    <>
      <div style={{ ...s, top: m, left: m, borderWidth: `${bw}px 0 0 ${bw}px` }} />
      <div style={{ ...s, top: m, right: m, borderWidth: `${bw}px ${bw}px 0 0` }} />
      <div style={{ ...s, bottom: m, left: m, borderWidth: `0 0 ${bw}px ${bw}px` }} />
      <div style={{ ...s, bottom: m, right: m, borderWidth: `0 ${bw}px ${bw}px 0` }} />
    </>
  );
};

const SearchBar: React.FC<{ L: Layout }> = ({ L }) => {
  // 16:9 quá thấp -> ẩn để nhường chỗ cho nội dung.
  if (L.isWide) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: L.u(150),
        left: "50%",
        transform: "translateX(-50%)",
        width: L.u(760),
        height: L.u(96),
        borderRadius: L.u(24),
        background: "rgba(160,185,225,0.10)",
        border: "1px solid rgba(170,195,235,0.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `0 ${L.u(32)}px`,
        backdropFilter: "blur(4px)",
      }}
    >
      <span style={{ color: "rgba(210,225,250,0.7)", fontSize: L.u(34), fontFamily: FONT }}>Tìm kiếm</span>
      <div
        style={{
          width: L.u(64),
          height: L.u(64),
          borderRadius: L.u(16),
          background: "rgba(170,195,235,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: L.u(34),
        }}
      >
        🔍
      </div>
    </div>
  );
};

const Footer: React.FC<{ brandText: string; L: Layout }> = ({ brandText, L }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const pct = interpolate(frame, [0, durationInFrames - 1], [0, 100], { extrapolateRight: "clamp" });
  const cur = Math.floor(frame / fps);
  const tot = Math.floor(durationInFrames / fps);
  const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  // LOGO TO HƠN: 9:16/1:1 to rõ; 16:9 thấp nên nhỏ hơn theo chiều cao tuyệt đối.
  const logoH = L.isWide ? L.u(84) : L.u(110);
  return (
    <div style={{ position: "absolute", left: L.u(70), right: L.u(70), bottom: L.u(80) }}>
      <div style={{ height: L.u(10), borderRadius: L.u(8), background: "rgba(180,200,235,0.15)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: L.u(8), background: COLORS.orange }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: L.u(22) }}>
        <Img src={staticFile("ai91-logo-hi.png")} style={{ height: logoH }} />
        <span
          style={{
            color: "rgba(200,215,240,0.55)",
            fontSize: L.u(24),
            fontFamily: FONT,
            letterSpacing: L.u(4),
            textTransform: "uppercase",
          }}
        >
          {brandText} · {mmss(cur)}/{mmss(tot)}
        </span>
      </div>
    </div>
  );
};

/* ------------------------- Hiệu ứng vào/ra của thẻ ------------------------- */

function useEnter(delay = 0) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const enter = spring({ frame: frame - delay, fps, config: { damping: 26 }, durationInFrames: 22 });
  const exit = interpolate(frame, [durationInFrames - 12, durationInFrames - 1], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { opacity: enter * exit, translateY: interpolate(enter, [0, 1], [40, 0]) };
}

const Label: React.FC<{ children: string; L: Layout }> = ({ children, L }) => (
  <div
    style={{
      color: "rgba(150,180,225,0.85)",
      fontSize: L.u(26),
      fontWeight: 700,
      letterSpacing: L.u(8),
      textTransform: "uppercase",
      fontFamily: FONT,
      marginBottom: L.u(28),
    }}
  >
    {children}
  </div>
);

/** Lề dưới để nội dung không đè footer. */
function contentPadding(L: Layout): React.CSSProperties {
  return {
    paddingLeft: L.isWide ? L.u(110) : L.u(90),
    paddingRight: L.isWide ? L.u(110) : L.u(90),
    paddingBottom: L.isWide ? L.u(160) : L.u(240),
    paddingTop: L.isWide ? L.u(120) : L.u(280),
  };
}

/* ------------------------------ Thẻ tiêu đề ----------------------------- */

const TitleCardView: React.FC<{ card: Extract<Card, { type: "title" }>; L: Layout }> = ({ card, L }) => {
  const { opacity, translateY } = useEnter();
  const titleSize = L.isWide ? L.u(64) : L.u(78);
  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        opacity,
        transform: `translateY(${translateY}px)`,
        ...contentPadding(L),
      }}
    >
      <Label L={L}>{card.label}</Label>
      <div style={{ fontFamily: FONT, fontSize: titleSize, fontWeight: 800, lineHeight: 1.12, color: "#fff" }}>
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
          fontSize: L.u(32),
          lineHeight: 1.5,
          color: "rgba(205,218,240,0.78)",
          marginTop: L.u(34),
          maxWidth: L.u(820),
        }}
      >
        {card.description}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: L.u(18), justifyContent: "center", marginTop: L.u(46) }}>
        {card.tags.map((t, i) => (
          <div
            key={i}
            style={{
              fontFamily: FONT,
              fontSize: L.u(28),
              fontWeight: 700,
              color: accent(t.color),
              padding: `${L.u(16)}px ${L.u(30)}px`,
              borderRadius: 999,
              border: `1px solid ${accent(t.color)}55`,
              background: `${accent(t.color)}14`,
            }}
          >
            {t.text}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/* ----------------------------- Thẻ danh sách ---------------------------- */

const ListCardView: React.FC<{ card: Extract<Card, { type: "list" }>; L: Layout }> = ({ card, L }) => {
  const { opacity, translateY } = useEnter();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity,
        transform: `translateY(${translateY}px)`,
        ...contentPadding(L),
      }}
    >
      <div style={{ textAlign: "center" }}>
        <Label L={L}>{card.label}</Label>
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontSize: L.isWide ? L.u(54) : L.u(66),
          fontWeight: 800,
          lineHeight: 1.15,
          color: "#fff",
          textAlign: "center",
          marginBottom: L.u(46),
        }}
      >
        {card.headline}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: L.isWide ? "row" : "column",
          flexWrap: L.isWide ? "wrap" : "nowrap",
          gap: L.u(22),
          width: "100%",
          justifyContent: "center",
        }}
      >
        {card.items.map((it, i) => {
          const s = spring({ frame: frame - 8 - i * 6, fps, config: { damping: 200 }, durationInFrames: 18 });
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: L.u(28),
                padding: `${L.u(30)}px ${L.u(34)}px`,
                borderRadius: L.u(22),
                background: "rgba(150,175,220,0.08)",
                border: "1px solid rgba(160,185,225,0.14)",
                opacity: s,
                transform: `translateX(${interpolate(s, [0, 1], [-30, 0])}px)`,
                width: L.isWide ? "46%" : "100%",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: L.u(22),
                  fontWeight: 700,
                  letterSpacing: L.u(3),
                  color: "rgba(150,180,225,0.85)",
                  minWidth: L.u(150),
                  textTransform: "uppercase",
                }}
              >
                {it.tag}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT, fontSize: L.u(36), fontWeight: 800, color: "#fff" }}>{it.title}</div>
                <div style={{ fontFamily: FONT, fontSize: L.u(27), color: "rgba(205,218,240,0.62)", marginTop: L.u(6) }}>
                  {it.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------ Composition ----------------------------- */

export const Ai91Video: React.FC<VideoProps> = ({ brandText, cards, audioSrc, bgMusic }) => {
  const L = useLayout();
  const offsets = cards.reduce<number[]>((acc, _card, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + cards[i - 1].durationInFrames);
    return acc;
  }, []);

  return (
    <AbsoluteFill>
      <Background />
      {audioSrc ? <Audio src={audioSrc.startsWith("http") ? audioSrc : staticFile(audioSrc)} /> : null}
      {bgMusic ? (
        <Audio src={bgMusic.startsWith("http") ? bgMusic : staticFile(bgMusic.replace(/^\//, ""))} volume={0.14} loop />
      ) : null}
      {cards.map((card, i) => {
        const isLast = i === cards.length - 1;
        // Kéo dài thêm OVERLAP frame (trừ thẻ cuối) để thẻ sau fade-in đè thẻ trước fade-out.
        const seqDur = card.durationInFrames + (isLast ? 0 : OVERLAP);
        return (
          <Sequence key={i} from={offsets[i]} durationInFrames={seqDur}>
            {card.type === "title" ? <TitleCardView card={card} L={L} /> : <ListCardView card={card} L={L} />}
          </Sequence>
        );
      })}
      <SearchBar L={L} />
      <CornerBrackets L={L} />
      <Footer brandText={brandText} L={L} />
    </AbsoluteFill>
  );
};
