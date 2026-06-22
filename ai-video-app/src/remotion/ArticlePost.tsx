import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { ACCENT_HEX, type ArticlePostProps } from "./types";
import { BRAND_FONT as FONT, COLORS, useLayout } from "./layout";

/**
 * Ảnh post TĨNH kiểu bài báo: ảnh AI full-bleed + lớp tối + headline + nguồn/ngày + logo.
 * Render bằng renderStill (frame 0) — KHÔNG dùng hiệu ứng phụ thuộc frame.
 */
export const ArticlePost: React.FC<ArticlePostProps> = ({
  headline,
  subheadline,
  source,
  date,
  imageSrc,
  brandText,
  eyebrow,
  accent = "orange",
}) => {
  const L = useLayout();
  const acc = ACCENT_HEX[accent];
  const src = imageSrc.startsWith("http") ? imageSrc : staticFile(imageSrc);
  // 16:9: chữ dồn về trái ~62%; còn lại canh đáy toàn khung.
  const textMaxWidth = L.isWide ? "62%" : "100%";

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, fontFamily: FONT }}>
      {/* Ảnh nền full-bleed */}
      <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />

      {/* Lớp gradient tối để chữ nổi */}
      <AbsoluteFill
        style={{
          background: L.isWide
            ? "linear-gradient(90deg, rgba(5,7,14,0.92) 0%, rgba(5,7,14,0.72) 45%, rgba(5,7,14,0.1) 100%)"
            : "linear-gradient(0deg, rgba(5,7,14,0.95) 0%, rgba(5,7,14,0.75) 32%, rgba(5,7,14,0.05) 70%)",
        }}
      />

      {/* Nội dung */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          alignItems: "flex-start",
          padding: L.isWide ? L.u(96) : L.u(80),
        }}
      >
        <div style={{ maxWidth: textMaxWidth }}>
          {/* Eyebrow / nguồn pill */}
          {(eyebrow || source) && (
            <div
              style={{
                display: "inline-block",
                background: acc,
                color: "#0a0a0a",
                fontWeight: 800,
                fontSize: L.u(30),
                letterSpacing: L.u(2),
                textTransform: "uppercase",
                padding: `${L.u(10)}px ${L.u(22)}px`,
                borderRadius: L.u(10),
                marginBottom: L.u(28),
              }}
            >
              {eyebrow || source}
            </div>
          )}

          {/* Headline */}
          <div
            style={{
              fontSize: L.isWide ? L.u(82) : L.u(96),
              fontWeight: 900,
              lineHeight: 1.08,
              color: "#fff",
              textShadow: "0 2px 24px rgba(0,0,0,0.5)",
            }}
          >
            {headline}
          </div>

          {/* Subheadline */}
          {subheadline && (
            <div
              style={{
                fontSize: L.u(40),
                lineHeight: 1.4,
                color: "rgba(225,233,248,0.85)",
                marginTop: L.u(28),
              }}
            >
              {subheadline}
            </div>
          )}

          {/* Hàng đáy: logo + nguồn·ngày + vạch cam */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: L.u(24),
              marginTop: L.u(48),
              paddingTop: L.u(28),
              borderTop: `${L.u(4)}px solid ${acc}`,
            }}
          >
            <Img src={staticFile("ai91-logo-hi.png")} style={{ height: L.u(72) }} />
            <span style={{ flex: 1 }} />
            {(source || date) && (
              <span style={{ fontSize: L.u(26), color: "rgba(205,218,240,0.7)", letterSpacing: L.u(2) }}>
                {[source, date].filter(Boolean).join(" · ")}
              </span>
            )}
            <span style={{ fontSize: L.u(24), color: "rgba(205,218,240,0.5)", textTransform: "uppercase", letterSpacing: L.u(3) }}>
              {brandText}
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
