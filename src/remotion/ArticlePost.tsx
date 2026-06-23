import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { ACCENT_HEX, type ArticlePostProps } from "./types";
import { BRAND_FONT as FONT, COLORS, useLayout } from "./layout";

/**
 * Ảnh post TĨNH kiểu bài báo — bố cục 3 phần:
 *   [ẢNH thật/minh hoạ] → [KHỐI MÀU thương hiệu: tiêu đề + tóm tắt] → [footer: nguồn·ngày + logo].
 * Màu khối ăn theo logo (brand.palette.primary); render bằng renderStill (frame 0).
 */

/** Độ sáng tương đối (0–1) để chọn màu chữ tương phản trên nền màu. */
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  if (h.length < 6) return 1;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function mixColor(hex: string, mixHex: string, weight: number): string {
  const h1 = hex.replace("#", "");
  const h2 = mixHex.replace("#", "");
  if (h1.length < 6 || h2.length < 6) return hex;

  const r1 = parseInt(h1.slice(0, 2), 16);
  const g1 = parseInt(h1.slice(2, 4), 16);
  const b1 = parseInt(h1.slice(4, 6), 16);

  const r2 = parseInt(h2.slice(0, 2), 16);
  const g2 = parseInt(h2.slice(2, 4), 16);
  const b2 = parseInt(h2.slice(4, 6), 16);

  const r = Math.round(r1 * (1 - weight) + r2 * weight);
  const g = Math.round(g1 * (1 - weight) + g2 * weight);
  const b = Math.round(b1 * (1 - weight) + b2 * weight);

  const toHex = (c: number) => {
    const s = Math.max(0, Math.min(255, c)).toString(16);
    return s.length === 1 ? "0" + s : s;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function resolveSrc(src: string): string {
  return src.startsWith("http") ? src : staticFile(src.replace(/^\//, ""));
}

export const ArticlePost: React.FC<ArticlePostProps> = ({
  headline,
  summary,
  subheadline,
  source,
  date,
  imageSrc,
  brandText,
  eyebrow,
  accent = "orange",
  brand,
}) => {
  const L = useLayout();
  const body = summary ?? subheadline;

  // Màu khối gốc = màu logo nếu có brand, else accent mặc định.
  const baseColor = brand?.palette?.primary ?? ACCENT_HEX[accent];
  const baseLuminance = luminance(baseColor);
  const isLightBg = baseLuminance > 0.6; // true nếu chữ tối màu (nền sáng)

  // Tăng tương phản: chữ sáng màu -> nền tối đi (mix black), chữ tối màu -> nền sáng lên (mix white)
  const blockColor = isLightBg 
    ? mixColor(baseColor, "#ffffff", 0.25)
    : mixColor(baseColor, "#000000", 0.25);

  const finalLuminance = luminance(blockColor);
  const textIsDark = finalLuminance > 0.6;
  const onBlock = textIsDark ? "#0a0a0a" : "#ffffff";
  const onBlockMuted = textIsDark ? "rgba(10,10,10,0.7)" : "rgba(255,255,255,0.78)";
  const hairline = textIsDark ? "rgba(10,10,10,0.18)" : "rgba(255,255,255,0.28)";

  const logoSrc = brand?.logoUrl ? resolveSrc(brand.logoUrl) : staticFile("ai91-logo-hi.png");
  const pad = L.u(64);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, fontFamily: FONT }}>
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
        {/* Phần 1: Ảnh (chiếm 2/3 chiều cao) */}
        <div style={{ height: "66.67%", width: "100%", position: "relative", flexShrink: 0 }}>
          <Img src={resolveSrc(imageSrc)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          {(eyebrow || source) && (
            <div
              style={{
                position: "absolute",
                top: L.u(36),
                left: L.u(36),
                background: blockColor,
                color: onBlock,
                fontWeight: 800,
                fontSize: L.u(28),
                letterSpacing: L.u(2),
                textTransform: "uppercase",
                padding: `${L.u(10)}px ${L.u(22)}px`,
                borderRadius: L.u(8),
              }}
            >
              {eyebrow || source}
            </div>
          )}
        </div>

        {/* Phần 2 + 3: Khối màu thương hiệu (chiếm đúng 1/3 chiều cao) */}
        <div
          style={{
            height: "33.33%",
            width: "100%",
            background: blockColor,
            padding: `${L.u(36)}px ${pad}px ${L.u(32)}px`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
            flexShrink: 0,
          }}
        >
          {/* Tiêu đề + tóm tắt */}
          <div style={{ display: "flex", flexDirection: "column", gap: L.u(12) }}>
            <div
              style={{
                fontSize: L.isWide ? L.u(54) : L.u(66),
                fontWeight: 900,
                lineHeight: 1.1,
                color: onBlock,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {headline}
            </div>

            {body && (
              <div
                style={{
                  fontSize: L.u(30),
                  lineHeight: 1.35,
                  color: onBlockMuted,
                  display: "-webkit-box",
                  WebkitLineClamp: L.isWide ? 1 : 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {body}
              </div>
            )}
          </div>

          {/* Footer: nguồn·ngày + logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: L.u(20),
              paddingTop: L.u(16),
              borderTop: `${L.u(2)}px solid ${hairline}`,
            }}
          >
            {(source || date) && (
              <span style={{ fontSize: L.u(24), color: onBlockMuted, letterSpacing: L.u(1) }}>
                {[source, date].filter(Boolean).join(" · ")}
              </span>
            )}
            <span style={{ flex: 1 }} />
            <Img src={logoSrc} style={{ height: L.u(48), objectFit: "contain" }} />
            <span style={{ fontSize: L.u(22), color: onBlockMuted, fontWeight: 700, letterSpacing: L.u(2) }}>
              {brandText}
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
