"use client";

import { useEffect, useState } from "react";
import { SegmentedControl } from "./_components/SegmentedControl";
import { GeminiKeyField } from "./_components/GeminiKeyField";
import { ProgressPanel } from "./_components/ProgressPanel";
import { VideoResult } from "./_components/VideoResult";
import { ImageGallery } from "./_components/ImageGallery";
import { LibraryPanel } from "./_components/LibraryPanel";
import { ScriptEditor, type CardScriptLite, type ImagePostScriptLite } from "./_components/ScriptEditor";
import { GsapSampleSlide, totalMockupDuration } from "../remotion/GsapSampleSlide";
import dynamic from "next/dynamic";

const Player = dynamic(
  () => import("@remotion/player").then((mod) => mod.Player),
  { ssr: false }
);

type ProductType = "video" | "imagepost";
type Aspect = "9:16" | "1:1" | "16:9";
type Duration = "short" | "long";
type Rate = "slow" | "normal" | "fast";

const PREFS_KEY = "ai91_prefs";

interface Prefs {
  geminiKey: string;
  type: ProductType;
  aspect: Aspect;
  duration: Duration;
  voice: string;
  rate: Rate;
}

const DEFAULT_PREFS: Prefs = {
  geminiKey: "",
  type: "video",
  aspect: "9:16",
  duration: "short",
  voice: "vi-VN-HoaiMyNeural",
  rate: "normal",
};

function loadPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT_PREFS;
}

interface PostImage {
  url: string;
  headline?: string;
}

export default function Home() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [topic, setTopic] = useState(
    "Tóm tắt bản tin AI trong tuần và phân tích ảnh hưởng tới thị trường Việt Nam",
  );
  const [useNews, setUseNews] = useState(true);
  const [newsQuery, setNewsQuery] = useState("trí tuệ nhân tạo");
  const [preview, setPreview] = useState(true);
  const [music, setMusic] = useState(false);
  const [musicAvailable, setMusicAvailable] = useState(false);

  const [draftCard, setDraftCard] = useState<CardScriptLite | null>(null);
  const [draftImage, setDraftImage] = useState<ImagePostScriptLite | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [libRefresh, setLibRefresh] = useState(0);

  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [images, setImages] = useState<PostImage[]>([]);
  const [zipUrl, setZipUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setPrefs(loadPrefs());
    fetch("/api/music")
      .then((r) => r.json())
      .then((d) => setMusicAvailable((d.tracks?.length ?? 0) > 0))
      .catch(() => setMusicAvailable(false));
  }, []);

  function update(patch: Partial<Prefs>) {
    setPrefs((p) => {
      const next = { ...p, ...patch };
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  function pushLog(msg: string) {
    setLog((l) => [...l, msg]);
    setStatus(msg);
  }

  const needsKey = !prefs.geminiKey;
  const canRun = !running && topic.trim().length > 0 && !needsKey;
  const isVideo = prefs.type === "video";

  const baseBody = () => ({
    topic,
    useNews,
    newsQuery,
    geminiKey: prefs.geminiKey,
    type: prefs.type,
    aspectRatio: prefs.aspect,
    duration: prefs.duration,
    voice: prefs.voice,
    rate: prefs.rate,
    music: music && musicAvailable,
  });

  async function onPrimary() {
    if (preview) await genScript();
    else await generate();
  }

  async function genScript() {
    setRunning(true);
    setError("");
    setDraftCard(null);
    setDraftImage(null);
    setShowEditor(false);
    setStatus("Đang soạn kịch bản để xem trước...");
    setLog(["Đang soạn kịch bản để xem trước..."]);
    try {
      const res = await fetch("/api/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(baseBody()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Lỗi ${res.status}`);
      if (data.cardScript) setDraftCard(data.cardScript);
      if (data.imagePostScript) setDraftImage(data.imagePostScript);
      setShowEditor(true);
      setLog((l) => [...l, "Kịch bản sẵn sàng — xem/sửa rồi bấm Render."]);
      setStatus("Kịch bản sẵn sàng.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  async function generate(scriptOverride?: { cardScript?: CardScriptLite; imagePostScript?: ImagePostScriptLite }) {
    setRunning(true);
    setError("");
    setVideoUrl("");
    setImages([]);
    setZipUrl("");
    setThumbs([]);
    setTitle("");
    setLog([]);
    setStatus("Bắt đầu...");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...baseBody(), ...scriptOverride }),
      });
      if (!res.ok || !res.body) {
        const t = await res.text().catch(() => "");
        let msg = `Lỗi máy chủ (${res.status})`;
        try {
          msg = JSON.parse(t).error ?? msg;
        } catch {
          if (t) msg += `: ${t}`;
        }
        throw new Error(msg);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const e = JSON.parse(line);
          if (e.type === "status") pushLog(e.message);
          else if (e.type === "storyboard") {
            setTitle(e.storyboard.title);
            pushLog(`Kịch bản: "${e.storyboard.title}"`);
          } else if (e.type === "scene") {
            if (e.imageUrl) setThumbs((t) => [...t, e.imageUrl]);
          } else if (e.type === "image") {
            setImages((im) => [...im, { url: e.url, headline: e.headline }]);
          } else if (e.type === "done") {
            if (e.videoUrl) setVideoUrl(e.videoUrl);
            if (e.images) setImages(e.images.map((u: string) => ({ url: u })));
            if (e.zipUrl) setZipUrl(e.zipUrl);
            setShowEditor(false);
            setLibRefresh((n) => n + 1);
            pushLog("✅ Hoàn thành!");
          } else if (e.type === "error") {
            setError(e.message);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#06080c] text-[#eef2f6] relative overflow-x-hidden font-sans">
      {/* Premium Glow Effects & Grid Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {/* Glows */}
        <div 
          className="absolute w-[900px] h-[700px] -left-20 -bottom-20 opacity-20 blur-[130px]" 
          style={{ background: 'radial-gradient(circle, rgba(255,90,31,0.25) 0%, transparent 70%)' }}
        />
        <div 
          className="absolute w-[820px] h-[640px] -right-20 top-0 opacity-15 blur-[110px]" 
          style={{ background: 'radial-gradient(circle, rgba(47,230,214,0.18) 0%, transparent 70%)' }}
        />
        {/* Technical Grid Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'linear-gradient(#1b2330 1px, transparent 1px), linear-gradient(90deg, #1b2330 1px, transparent 1px)',
            backgroundSize: '90px 90px',
            maskImage: 'radial-gradient(circle at 50% 30%, black 45%, transparent 85%)',
          }}
        />
      </div>

      {/* Main Container */}
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 md:px-6 relative" style={{ zIndex: 1 }}>
        
        {/* Navigation Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-5 mb-2">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-hot via-hot2 to-cy">
              🎬 AI91 Medimation
            </h1>
            <p className="text-xs font-mono tracking-wider uppercase text-zinc-400 mt-1">
              AUTOMATED VIDEO & IMAGE PIPELINE · LOCAL & CLOUD
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#69748a]">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>localhost:3000 online</span>
          </div>
        </header>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* COLUMN 1: Configurations & Inputs (Left: 4 cols on lg, 3 on xl) */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-5">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#69748a] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-hot" /> Setup parameters
            </h2>
            
            {/* Gemini API Key */}
            <GeminiKeyField value={prefs.geminiKey} onChange={(v) => update({ geminiKey: v })} />

            {/* Parameter Config Form */}
            <section className="flex flex-col gap-5 rounded-2xl border border-line bg-[#0b0f16]/60 backdrop-blur-md p-5 shadow-xl relative overflow-hidden">
              {/* Subtle top indicator border */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-hot to-cy" />
              
              <SegmentedControl<ProductType>
                label="Loại sản phẩm"
                value={prefs.type}
                onChange={(v) => update({ type: v })}
                disabled={running}
                options={[
                  { value: "video", label: "🎬 Video", hint: "Motion card & voice" },
                  { value: "imagepost", label: "🖼️ Ảnh post", hint: "Bộ ảnh bài viết" },
                ]}
                accent="orange"
              />

              <SegmentedControl<Aspect>
                label="Tỉ lệ khung hình"
                value={prefs.aspect}
                onChange={(v) => update({ aspect: v })}
                disabled={running}
                options={[
                  { value: "9:16", label: "9:16 (Dọc)", hint: "Shorts/Reels" },
                  { value: "1:1", label: "1:1 (Vuông)", hint: "Post mạng xã hội" },
                  { value: "16:9", label: "16:9 (Ngang)", hint: "YouTube/Web" },
                ]}
              />

              {isVideo && (
                <SegmentedControl<Duration>
                  label="Thời lượng"
                  value={prefs.duration}
                  onChange={(v) => update({ duration: v })}
                  disabled={running}
                  options={[
                    { value: "short", label: "Ngắn", hint: "90 giây" },
                    { value: "long", label: "Dài", hint: "3 phút" },
                  ]}
                />
              )}

              {isVideo && (
                <div className="flex flex-col gap-3">
                  <SegmentedControl
                    label="Giọng đọc"
                    value={prefs.voice}
                    onChange={(v) => update({ voice: v })}
                    disabled={running}
                    options={[
                      { value: "vi-VN-HoaiMyNeural", label: "Nữ miền Bắc" },
                      { value: "vi-VN-NamMinhNeural", label: "Nam" },
                    ]}
                  />
                  <SegmentedControl<Rate>
                    label="Tốc độ"
                    value={prefs.rate}
                    onChange={(v) => update({ rate: v })}
                    disabled={running}
                    options={[
                      { value: "slow", label: "Chậm" },
                      { value: "normal", label: "Thường" },
                      { value: "fast", label: "Nhanh" },
                    ]}
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-zinc-400">Ý tưởng / Chủ đề</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={running}
                  rows={4}
                  className="w-full resize-y rounded-xl border border-line bg-black/60 p-3 text-sm outline-none focus:border-zinc-500 disabled:opacity-60 transition-colors placeholder:text-zinc-600 font-sans text-zinc-100"
                  placeholder="Ví dụ: Tóm tắt tin AI tuần này và ảnh hưởng tới thị trường Việt Nam..."
                />
              </div>

              <div className="flex flex-col gap-2 rounded-xl border border-line bg-black/30 p-3">
                <label className="flex items-center gap-2.5 text-xs font-mono uppercase tracking-wider text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useNews}
                    onChange={(e) => setUseNews(e.target.checked)}
                    disabled={running}
                    className="h-4 w-4 rounded border-line bg-zinc-950 text-orange-500 accent-orange-500 focus:ring-0"
                  />
                  Dựa trên tin tức mới nhất
                </label>
                {useNews && (
                  <input
                    type="text"
                    value={newsQuery}
                    onChange={(e) => setNewsQuery(e.target.value)}
                    disabled={running}
                    placeholder="Từ khoá tìm tin, vd: trí tuệ nhân tạo"
                    className="w-full rounded-lg border border-line bg-black px-3 py-2 text-xs outline-none focus:border-zinc-500 disabled:opacity-60 transition-colors font-sans text-zinc-100"
                  />
                )}
              </div>

              <div className="flex flex-col gap-2 rounded-xl border border-line bg-black/30 p-3">
                <label className="flex items-center gap-2.5 text-xs font-mono uppercase tracking-wider text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preview}
                    onChange={(e) => setPreview(e.target.checked)}
                    disabled={running}
                    className="h-4 w-4 rounded border-line bg-zinc-950 text-orange-500 accent-orange-500 focus:ring-0"
                  />
                  Xem trước kịch bản
                </label>
                {isVideo && (
                  <label className="flex items-center gap-2.5 text-xs font-mono uppercase tracking-wider text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={music}
                      onChange={(e) => setMusic(e.target.checked)}
                      disabled={running || !musicAvailable}
                      className="h-4 w-4 rounded border-line bg-zinc-950 text-orange-500 accent-orange-500 focus:ring-0"
                    />
                    Nhạc nền thoại{" "}
                    {musicAvailable ? (
                      <span className="text-[10px] text-zinc-500 font-sans">(có sẵn)</span>
                    ) : (
                      <span className="text-[10px] text-amber-500 font-sans">(chưa có file)</span>
                    )}
                  </label>
                )}
              </div>

              {needsKey && (
                <p className="rounded-lg border border-amber-900/60 bg-amber-950/20 px-3 py-2 text-xs text-amber-400 font-medium">
                  ⚠️ Nhập Gemini API key để tiếp tục.
                </p>
              )}

              <button
                onClick={onPrimary}
                disabled={!canRun}
                className="w-full rounded-xl bg-gradient-to-r from-hot to-hot2 hover:opacity-90 py-3 text-sm font-display font-bold text-black transition-all shadow-lg shadow-hot/10 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer uppercase tracking-wider"
              >
                {running ? "Đang xử lý..." : preview ? "Soạn kịch bản →" : isVideo ? "Bắt đầu tạo Video" : "Bắt đầu tạo bộ ảnh"}
              </button>
            </section>
          </div>

          {/* COLUMN 2: Stage, Editor & Results (Middle: 5 cols on lg, 6 on xl) */}
          <div className="lg:col-span-5 xl:col-span-6 flex flex-col gap-5">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#69748a] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cy" /> Workspace canvas
            </h2>

            {/* Live GSAP Player Section */}
            <section className="flex flex-col gap-4 rounded-2xl border border-line bg-[#0b0f16]/60 backdrop-blur-md p-5 shadow-xl relative overflow-hidden">
              {/* Subtle top indicator border */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cy to-hot" />

              <div className="flex items-center justify-between border-b border-line pb-2">
                <h3 className="text-sm font-display font-bold text-white flex items-center gap-2">
                  <span>🎨</span> Mẫu Hoạt ảnh GSAP (Remotion Player)
                </h3>
                <span className="rounded-full bg-cy/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-cy border border-cy/20">
                  LIVE TEMPLATE
                </span>
              </div>
              
              {/* Mobile Phone Mockup Device Wrapper */}
              <div className="self-center flex flex-col rounded-2xl border border-line bg-[#000000] shadow-2xl relative max-w-[280px] w-full overflow-hidden">
                {/* Device Speaker & Camera dots */}
                <div className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-zinc-950 border-b border-line">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                  <span className="ml-2 font-mono text-[9px] text-zinc-500 uppercase tracking-widest">Viewport</span>
                </div>
                
                <div className="aspect-[9/16] max-h-[460px] flex items-center justify-center bg-black">
                  <Player
                    component={GsapSampleSlide}
                    durationInFrames={totalMockupDuration}
                    fps={30}
                    compositionWidth={1080}
                    compositionHeight={1920}
                    style={{
                      width: "100%",
                      height: "100%",
                    }}
                    controls
                    loop
                    autoPlay
                  />
                </div>
              </div>
              
              <p className="text-xs text-[#69748a] text-center leading-relaxed font-sans">
                Timeline GSAP đồng bộ Remotion. Code mẫu tại:{" "}
                <a href="file:///d:/Videos-by-AI/src/remotion/GsapSampleSlide.tsx" className="text-hot hover:underline font-mono text-[10px]">
                  GsapSampleSlide.tsx
                </a>
              </p>
            </section>

            {/* Script Editor Overlay/Panel */}
            {showEditor && (draftCard || draftImage) && (
              <ScriptEditor
                type={prefs.type}
                cardScript={draftCard ?? undefined}
                imagePostScript={draftImage ?? undefined}
                onChangeCard={setDraftCard}
                onChangeImage={setDraftImage}
                onCancel={() => setShowEditor(false)}
                running={running}
                onRender={() =>
                  generate(
                    prefs.type === "video"
                      ? { cardScript: draftCard ?? undefined }
                      : { imagePostScript: draftImage ?? undefined },
                  )
                }
              />
            )}

            {/* Final Rendered Outputs */}
            {videoUrl && <VideoResult videoUrl={videoUrl} aspect={prefs.aspect} />}
            {!isVideo && <ImageGallery images={images} zipUrl={zipUrl} aspect={prefs.aspect} />}
          </div>

          {/* COLUMN 3: Console Logs & History Library (Right: 3 cols on lg, 3 on xl) */}
          <div className="lg:col-span-3 flex flex-col gap-5">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#69748a] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff5f57]" /> Monitor & history
            </h2>

            {/* Progress / Logs Panel */}
            <ProgressPanel running={running} title={title} status={status} log={log} thumbs={thumbs} />

            {/* Error Message */}
            {error && (
              <section className="rounded-2xl border border-red-950 bg-red-950/20 p-4 text-xs font-mono text-red-400 shadow-lg">
                <strong className="text-red-500 font-bold block mb-1 uppercase tracking-wider">⚠️ System Error:</strong> {error}
              </section>
            )}

            {/* Library Panel (History of past creations) */}
            <LibraryPanel refreshKey={libRefresh} />
          </div>

        </div>
      </main>
    </div>
  );
}
