import React, { useRef } from "react";
import { AbsoluteFill, Img, staticFile, useVideoConfig } from "remotion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { Card } from "./types";
import { getCardEntranceDuration } from "./layoutsTimings";

export const SlideRenderer: React.FC<{ slide: Card; activeIndex: number; localFrame: number }> = ({ slide, activeIndex, localFrame }) => {
  const { fps } = useVideoConfig();
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // Common GSAP Setup for all layouts
  useGSAP(() => {
    const tl = gsap.timeline({ paused: true });

    if (slide.layoutType === "title") {
      tl.fromTo(".title-main", { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.0, ease: "power3.out" }, 0.1);
      tl.fromTo(".title-sub", { y: "3rem", opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power2.out" }, 0.4);
    } 
    else if (slide.layoutType === "list") {
      tl.fromTo(".list-title", { x: "-3rem", opacity: 0 }, { x: 0, opacity: 1, duration: 0.9, ease: "power3.out" }, 0.1);
      tl.fromTo(".list-item", { y: "2rem", opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: "power2.out" }, 0.3);
    }
    else if (slide.layoutType === "text-image") {
      tl.fromTo(".ti-left", { x: "-3rem", opacity: 0 }, { x: 0, opacity: 1, duration: 0.9, ease: "power3.out" }, 0.1);
      tl.fromTo(".ti-right", { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.0, ease: "back.out(1.2)" }, 0.3);
    }
    else if (slide.layoutType === "text-video") {
      tl.fromTo(".tv-left", { x: "3rem", opacity: 0 }, { x: 0, opacity: 1, duration: 0.9, ease: "power3.out" }, 0.1);
      tl.fromTo(".tv-right", { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.2, ease: "power2.out" }, 0.3);
      tl.to(".tv-radar", { rotation: 360, duration: 2, repeat: -1, ease: "none" }, 0);
    }
    else if (slide.layoutType === "chart") {
      tl.fromTo(".chart-header", { y: "-2rem", opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" }, 0.1);
      tl.fromTo(".chart-bar", { scaleY: 0 }, { scaleY: 1, duration: 1.5, stagger: 0.1, ease: "power3.out" }, 0.3);
      tl.fromTo(".chart-label", { opacity: 0 }, { opacity: 1, duration: 0.5, stagger: 0.1 }, 0.8);
      tl.fromTo(".chart-val", { opacity: 0, y: "1rem" }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }, 0.8);
    }
    else if (slide.layoutType === "bento") {
      tl.fromTo(".bento-title", { y: "-2rem", opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" }, 0.1);
      tl.fromTo(".bento-item", { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, stagger: 0.1, ease: "back.out(1.2)" }, 0.3);
    }
    else if (slide.layoutType === "split-3d") {
      tl.fromTo(".s3d-title", { y: "-2rem", opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" }, 0.1);
      tl.fromTo(".s3d-layer", { z: -500, opacity: 0 }, { z: (i) => i * 100, opacity: 1, duration: 1.5, stagger: 0.2, ease: "power3.out" }, 0.4);
    }
    else if (slide.layoutType === "quote") {
      tl.fromTo(".quote-mark", { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 0.3, duration: 1.2, ease: "power2.out" }, 0.1);
      tl.fromTo(".quote-text", { y: "2rem", opacity: 0 }, { y: 0, opacity: 1, duration: 1.0, ease: "power3.out" }, 0.3);
      tl.fromTo(".quote-author", { y: "2rem", opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" }, 0.6);
    }
    else if (slide.layoutType === "stats-grid") {
      tl.fromTo(".sg-title", { y: "-2rem", opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" }, 0.1);
      tl.fromTo(".sg-card", { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, stagger: 0.1, ease: "power2.out" }, 0.4);
    }
    else if (slide.layoutType === "timeline") {
      tl.fromTo(".tl-title", { y: "-2rem", opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" }, 0.1);
      tl.to(".tl-line-fill", { width: "100%", duration: 1.5, ease: "power2.inOut" }, 0.3);
      tl.fromTo(".tl-node", { y: "2rem", opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.4, ease: "back.out(1.5)" }, 0.5);
    }
    else if (slide.layoutType === "code-snippet") {
      tl.fromTo(".cs-title", { y: "-2rem", opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" }, 0.1);
      tl.fromTo(".cs-window", { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "power2.out" }, 0.3);
      
      const codeLen = slide.csCode ? slide.csCode.length : 50;
      const typeObj = { len: 0 };
      tl.to(typeObj, {
        len: codeLen,
        duration: Math.max(1.0, Math.min(3.0, codeLen * 0.02)),
        ease: "none",
        onUpdate: () => {
          const el = document.querySelector(".cs-body");
          if (el && slide.csCode) el.textContent = slide.csCode.slice(0, Math.round(typeObj.len));
        }
      }, 0.5);
    }
    else if (slide.layoutType === "outro") {
      tl.fromTo(".outro-logo", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.0, ease: "back.out(1.5)" }, 0.1);
      tl.fromTo(".outro-logo-inner", { rotation: 0 }, { rotation: 45, duration: 1.0, ease: "power2.out" }, 0.1);
      tl.fromTo(".outro-slogan", { y: "2rem", opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" }, 0.5);
      tl.fromTo(".outro-contact", { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "power2.out" }, 1.0);
    }
    else if (slide.layoutType === "cream") {
      tl.fromTo(".cream-title", { y: "-2.5rem", opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" }, 0.1);
      tl.fromTo(".cream-slider", { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 1.0, ease: "power2.out" }, 0.25);
      tl.fromTo(".chat-bubble", { x: "-3.5rem", opacity: 0 }, { x: 0, opacity: 1, duration: 0.9, stagger: 0.25, ease: "back.out(1.2)" }, 0.45);
      tl.fromTo(".cream-sub", { y: "2rem", opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power2.out" }, 0.8);
    }
    else if (slide.layoutType === "manim") {
      tl.fromTo(".manim-header", { y: "-2.5rem", opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" }, 0.1);
      tl.fromTo(".manim-title", { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.0, ease: "back.out(1.5)" }, 0.25);
      tl.fromTo(".manim-formula-row", { y: "3.5rem", opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.3, ease: "power3.out" }, 0.45);
      tl.fromTo(".manim-sub", { y: "2rem", opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power2.out" }, 0.8);
    }
    else {
      // Default 'card'
      tl.fromTo(".eye", { y: "2.5rem", opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, 0.1);
      tl.fromTo(".badge", { y: "2.5rem", opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power3.out" }, 0.15);
      tl.fromTo(".name", { y: "105%" }, { y: 0, duration: 1.0, ease: "power4.out" }, 0.3);
      tl.fromTo(".tag", { y: "2.5rem", opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power2.out" }, 0.6);
      tl.fromTo(".stat", { y: "2.5rem", opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power2.out" }, 0.8);
      
      const count = { val: 0 };
      const targetVal = parseFloat(slide.stat) || 0;
      tl.to(count, {
        val: targetVal, duration: 1.0, ease: "power2.out",
        onUpdate: () => {
          const el = document.querySelector(".num");
          if (el) el.textContent = Math.round(count.val) + slide.statSuffix;
        }
      }, 0.8);

      tl.fromTo(".term", { y: "2.5rem", opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power2.out" }, 1.0);
      
      const typeObj = { len: 0 };
      tl.to(typeObj, {
        len: slide.cmd ? slide.cmd.length : 0, duration: 1.0, ease: "none",
        onUpdate: () => {
          const el = document.querySelector(".cmd span:nth-child(2)");
          if (el && slide.cmd) el.textContent = slide.cmd.slice(0, Math.round(typeObj.len));
        }
      }, 1.0);

      tl.fromTo(".foot", { y: "2.5rem", opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" }, 1.3);
    }

    // Dynamic exit transition
    const durSec = slide.durationInFrames / fps;
    tl.to(containerRef.current, { opacity: 0, y: "-5rem", duration: 0.4, ease: "power2.in" }, durSec - 0.4);

    timelineRef.current = tl;
  }, { scope: containerRef });

  // Update progress every frame
  React.useEffect(() => {
    if (timelineRef.current) {
      const progress = localFrame / slide.durationInFrames;
      timelineRef.current.progress(Math.min(1, Math.max(0, progress)));
    }
  }, [localFrame, slide.durationInFrames]);

  // Render Layouts
  if (slide.layoutType === "title") return (
    <div ref={containerRef} className="title-stage absolute inset-0">
      <div className="title-main">{slide.titleMain}</div>
      <div className="title-sub">{slide.titleSub}</div>
    </div>
  );

  if (slide.layoutType === "list") return (
    <div ref={containerRef} className="list-stage absolute inset-0">
      <div className="list-title">{slide.listTitle}</div>
      <div className="list-items">
        {slide.listItems?.map((item, i) => (
          <div key={i} className="list-item">
            <div className="list-icon">✓</div>
            <div>{item}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (slide.layoutType === "text-image") return (
    <div ref={containerRef} className="ti-stage absolute inset-0">
      <div className="ti-left">
        <div className="ti-title">{slide.tiTitle}</div>
        <div className="ti-text">{slide.tiText}</div>
      </div>
      <div className="ti-right">
        <div className={`ti-mockup ${slide.tiImageMock}`} />
      </div>
    </div>
  );

  if (slide.layoutType === "text-video") return (
    <div ref={containerRef} className="tv-stage absolute inset-0">
      <div className="tv-left">
        <div className="tv-title">{slide.tvTitle}</div>
        <div className="tv-text">{slide.tvText}</div>
      </div>
      <div className="tv-right">
        <div className="tv-video-mock">
          {slide.tvVideoMock === "radar" && <div className="tv-radar" />}
        </div>
      </div>
    </div>
  );

  if (slide.layoutType === "chart") return (
    <div ref={containerRef} className="chart-stage absolute inset-0">
      <div className="chart-header">
        <div className="chart-title">{slide.chartTitle}</div>
        <div className="chart-sub">{slide.chartSub}</div>
      </div>
      <div className="chart-bars">
        {slide.chartData?.map((item, i) => {
          const maxVal = Math.max(...(slide.chartData || []).map(d => d.value));
          const hPct = (item.value / maxVal) * 100;
          return (
            <div key={i} className="chart-col" style={{ height: '100%' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', width: '100%' }}>
                <div className="chart-val">{item.value}</div>
                <div className="chart-bar" style={{ height: `${hPct}%` }} />
              </div>
              <div className="chart-label">{item.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (slide.layoutType === "bento") return (
    <div ref={containerRef} className="bento-stage absolute inset-0">
      <div className="bento-title">{slide.bentoTitle}</div>
      <div className="bento-grid">
        {slide.bentoItems?.map((item, i) => (
          <div key={i} className="bento-item">
            <div className="bento-item-title">{item.title}</div>
            <div className="bento-item-desc">{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (slide.layoutType === "split-3d") return (
    <div ref={containerRef} className="s3d-stage absolute inset-0">
      <div className="s3d-title">{slide.s3dTitle}</div>
      <div className="s3d-layers">
        {slide.s3dLayers?.map((layer, i) => (
          <div key={i} className="s3d-layer" style={{ transform: `translateZ(${i * 100}px)` }}>
            {layer}
          </div>
        ))}
      </div>
    </div>
  );

  if (slide.layoutType === "quote") return (
    <div ref={containerRef} className="quote-stage absolute inset-0">
      <div className="quote-mark">"</div>
      <div className="quote-text">{slide.quoteText}</div>
      <div className="quote-author">- {slide.quoteAuthor}</div>
    </div>
  );

  if (slide.layoutType === "stats-grid") return (
    <div ref={containerRef} className="sg-stage absolute inset-0">
      <div className="sg-title">{slide.sgTitle}</div>
      <div className="sg-grid">
        {slide.sgStats?.map((stat, i) => (
          <div key={i} className="sg-card">
            <div className="sg-val">{stat.val}{stat.suffix}</div>
            <div className="sg-label">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (slide.layoutType === "timeline") return (
    <div ref={containerRef} className="tl-stage absolute inset-0">
      <div className="tl-title">{slide.tlTitle}</div>
      <div className="tl-track">
        <div className="tl-line" />
        <div className="tl-line-fill" />
        {slide.tlNodes?.map((node, i) => (
          <div key={i} className="tl-node">
            <div className={`tl-dot ${i === 0 ? 'active' : ''}`} />
            <div className="tl-year">{node.year}</div>
            <div className="tl-event">{node.event}</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (slide.layoutType === "code-snippet") return (
    <div ref={containerRef} className="cs-stage absolute inset-0">
      <div className="cs-title">{slide.csTitle}</div>
      <div className="cs-window">
        <div className="cs-header">
          <div className="cs-dot r" />
          <div className="cs-dot y" />
          <div className="cs-dot g" />
        </div>
        <div className="cs-body" />
      </div>
    </div>
  );

  if (slide.layoutType === "outro") return (
    <div ref={containerRef} className="outro-stage absolute inset-0">
      <div className="outro-logo">
        <Img src={staticFile("AI91.jpg")} className="outro-logo-img" />
      </div>
      <div className="outro-brand">AI91 Medimation</div>
      <div className="outro-slogan">{slide.outroSlogan}</div>
      <div className="outro-contact">{slide.outroContact}</div>
    </div>
  );

  if (slide.layoutType === "cream") return (
    <div ref={containerRef} className="cream-stage absolute inset-0 text-neutral-800">
      <div className="pad">
        <div className="cream-index">
          {String(activeIndex + 1).padStart(2, "0")} / 30
        </div>
        <h2 className="cream-title">{slide.creamTitle}</h2>
        <div className="spacer" />
        <div className="cream-slider">
          <span className="slider-label">{slide.progressLabel}</span>
          <div className="slider-track-wrap">
            <div className="slider-track">
              <div className="slider-bar" style={{ width: `${slide.progressPct}%` }} />
            </div>
            <div className="slider-thumb" style={{ left: `${slide.progressPct}%` }}>II</div>
          </div>
        </div>
        <div className="cream-chat">
          <div className="chat-bubble user">
            <span className="avatar">👦</span>
            <div className="chat-content">{slide.chatUser}</div>
          </div>
          <div className="chat-bubble bot">
            <span className="avatar">🤖</span>
            <div className="chat-content">{slide.chatBot}</div>
          </div>
        </div>
        <div className="spacer" />
        <div className="cream-sub">{slide.creamSub}</div>
      </div>
    </div>
  );

  if (slide.layoutType === "manim") return (
    <div ref={containerRef} className="manim-stage absolute inset-0 text-white">
      <div className="pad">
        <div className="manim-index">
          {String(activeIndex + 1).padStart(2, "0")} / 30
        </div>
        <div className="manim-header">
          <span>{slide.manimHeader}</span>
          <span className="manim-tag">LOREM SIMZ</span>
        </div>
        <div className="spacer" />
        <div className="manim-content-wrap">
          <h3 className="manim-title">{slide.manimTitle}</h3>
          <div className="manim-formula">
            <div className="manim-formula-row">
              <span className="term-left">"{slide.mapLeft1}"</span>
              <span className="arrow">&rarr;</span>
              <span className="term-right">{slide.mapRight1}</span>
            </div>
            <div className="manim-formula-row">
              <span className="term-left">"{slide.mapLeft2}"</span>
              <span className="arrow">&rarr;</span>
              <span className="term-right">{slide.mapRight2}</span>
            </div>
          </div>
        </div>
        <div className="spacer" />
        <div className="manim-sub">{slide.manimSub}</div>
      </div>
    </div>
  );

  // Default 'card' layout
  return (
    <div ref={containerRef} className="pad absolute inset-0 text-[#eef2f6]">
      <div className="glows" />
      <div className="grid" />
      <div className="vig" />

      <div className="eye">
        <span><b>{slide.label || "loremsimz.repo · daily"}</b></span>
        <span className="pill-day">{slide.pillDay || "LOREM SIMZ DAY"}</span>
      </div>

      <div className="badges">
        {slide.badges?.map((b, i) => {
          const modifier = i === 0 ? "hot" : i === 1 ? "cy" : "";
          return <span key={i} className={`badge ${modifier}`}>{b}</span>;
        })}
      </div>

      <div className="name-wrap">
        <div className="name">{slide.name}</div>
      </div>

      <div className="tag" dangerouslySetInnerHTML={{ __html: slide.tag }} />

      <div className="spacer" />

      <div className="stat">
        <div className="num">0{slide.statSuffix}</div>
        <div className="lab"><b>{slide.lab1}</b> {slide.lab2}</div>
      </div>

      <div className="term">
        <div className="dots"><i></i><i></i><i></i></div>
        <div className="cmd"><span className="pr">$</span><span /><span className="cur" /></div>
      </div>

      <div className="foot">
        <span className="star">{slide.star}★ GitHub</span>
        <span className="h">@loremsimz.repo</span>
      </div>
    </div>
  );
};
