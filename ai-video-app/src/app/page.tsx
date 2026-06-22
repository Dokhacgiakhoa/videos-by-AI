"use client";

import { useEffect, useState } from "react";
import { SegmentedControl } from "./_components/SegmentedControl";
import { GeminiKeyField } from "./_components/GeminiKeyField";
import { ProgressPanel } from "./_components/ProgressPanel";
import { VideoResult } from "./_components/VideoResult";
import { ImageGallery } from "./_components/ImageGallery";
import { LibraryPanel } from "./_components/LibraryPanel";
import { ScriptEditor, type CardScriptLite, type ImagePostScriptLite } from "./_components/ScriptEditor";

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
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
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
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100">
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-12">
        <header className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">🎬 AI91 — Video & Ảnh tin tức</h1>
          <p className="text-sm text-zinc-400">
            Gemini · Edge-TTS (giọng nữ miền Bắc) · Remotion · 100% local, miễn phí.
          </p>
        </header>

        <GeminiKeyField value={prefs.geminiKey} onChange={(v) => update({ geminiKey: v })} />

        <section className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <SegmentedControl<ProductType>
            label="Loại sản phẩm"
            value={prefs.type}
            onChange={(v) => update({ type: v })}
            disabled={running}
            options={[
              { value: "video", label: "🎬 Video", hint: "Card motion + giọng đọc" },
              { value: "imagepost", label: "🖼️ Ảnh post", hint: "Bộ ảnh bài báo" },
            ]}
          />

          <SegmentedControl<Aspect>
            label="Tỉ lệ khung hình"
            value={prefs.aspect}
            onChange={(v) => update({ aspect: v })}
            disabled={running}
            options={[
              { value: "9:16", label: "9:16", hint: "Dọc" },
              { value: "1:1", label: "1:1", hint: "Vuông" },
              { value: "16:9", label: "16:9", hint: "Ngang" },
            ]}
          />

          {isVideo && (
            <SegmentedControl<Duration>
              label="Thời lượng"
              value={prefs.duration}
              onChange={(v) => update({ duration: v })}
              disabled={running}
              options={[
                { value: "short", label: "Ngắn", hint: "~1-3 phút" },
                { value: "long", label: "Dài", hint: "~3-7 phút" },
              ]}
            />
          )}

          {isVideo && (
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <SegmentedControl
                  label="Giọng đọc"
                  value={prefs.voice}
                  onChange={(v) => update({ voice: v })}
                  disabled={running}
                  options={[
                    { value: "vi-VN-HoaiMyNeural", label: "Nữ (miền Bắc)" },
                    { value: "vi-VN-NamMinhNeural", label: "Nam" },
                  ]}
                />
              </div>
              <div className="flex-1">
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
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Ý tưởng / chủ đề</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={running}
              rows={3}
              className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm outline-none focus:border-zinc-500 disabled:opacity-60"
              placeholder="Ví dụ: Tóm tắt tin AI tuần này và ảnh hưởng tới thị trường Việt Nam..."
            />
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={useNews}
                onChange={(e) => setUseNews(e.target.checked)}
                disabled={running}
                className="h-4 w-4 accent-indigo-500"
              />
              Dựa trên tin thật mới nhất (Google News, 7 ngày qua)
            </label>
            {useNews && (
              <input
                type="text"
                value={newsQuery}
                onChange={(e) => setNewsQuery(e.target.value)}
                disabled={running}
                placeholder="Từ khoá tìm tin, vd: trí tuệ nhân tạo"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-500 disabled:opacity-60"
              />
            )}
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={preview}
                onChange={(e) => setPreview(e.target.checked)}
                disabled={running}
                className="h-4 w-4 accent-indigo-500"
              />
              Xem trước & sửa kịch bản trước khi render (khuyên dùng cho video dài)
            </label>
            {isVideo && (
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={music}
                  onChange={(e) => setMusic(e.target.checked)}
                  disabled={running || !musicAvailable}
                  className="h-4 w-4 accent-indigo-500"
                />
                Nhạc nền{" "}
                {musicAvailable ? (
                  <span className="text-xs text-zinc-500">(dùng track trong assets/music)</span>
                ) : (
                  <span className="text-xs text-amber-400">(thả file nhạc vào public/assets/music để bật)</span>
                )}
              </label>
            )}
          </div>

          {needsKey && (
            <p className="rounded-lg border border-amber-800/60 bg-amber-950/30 px-3 py-2 text-xs text-amber-300">
              Cần nhập Gemini API key ở trên để bắt đầu (free).
            </p>
          )}

          <button
            onClick={onPrimary}
            disabled={!canRun}
            className="self-start rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? "Đang xử lý..." : preview ? "Soạn kịch bản →" : isVideo ? "Tạo video" : "Tạo bộ ảnh"}
          </button>
        </section>

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

        <ProgressPanel running={running} title={title} status={status} log={log} thumbs={thumbs} />

        {error && (
          <section className="rounded-2xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
            <strong>Lỗi:</strong> {error}
          </section>
        )}

        {videoUrl && <VideoResult videoUrl={videoUrl} aspect={prefs.aspect} />}
        {!isVideo && <ImageGallery images={images} zipUrl={zipUrl} aspect={prefs.aspect} />}

        <LibraryPanel refreshKey={libRefresh} />
      </main>
    </div>
  );
}
