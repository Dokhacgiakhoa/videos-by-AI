import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { DATA, startOffsets, totalMockupDuration } from "./MockData";
import { SlideRenderer } from "./LayoutComponents";
import "./layouts.css"; // Ensure this imports the extracted and appended CSS

export { totalMockupDuration };

export const GsapSampleSlide: React.FC = () => {
  const frame = useCurrentFrame();

  // Find activeIndex dynamically based on cumulative start offsets
  let activeIndex = 0;
  for (let i = 0; i < startOffsets.length; i++) {
    const start = startOffsets[i];
    const duration = DATA[i].durationInFrames;
    if (frame >= start && frame < start + duration) {
      activeIndex = i;
      break;
    }
  }
  // Clamp to last index
  const lastStart = startOffsets[startOffsets.length - 1];
  const lastDuration = DATA[DATA.length - 1].durationInFrames;
  if (frame >= lastStart + lastDuration) {
    activeIndex = DATA.length - 1;
  }

  const slide = DATA[activeIndex];
  const localFrame = frame - startOffsets[activeIndex];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000"
      }}
      className="dev-repo-card-stage overflow-hidden select-none"
    >
      <SlideRenderer slide={slide} activeIndex={activeIndex} localFrame={localFrame} key={activeIndex} />
    </AbsoluteFill>
  );
};
