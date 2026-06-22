"use client";

import { useRef, useState } from "react";

interface SceneThumb {
  index: number;
  imageUrl: string;
}

export default function Home() {
  const [topic, setTopic] = useState(
    "Cho tớ video tóm tắt bản tin về AI trong tuần và phân tích ảnh hưởng tới thị trường Việt Nam",
  );
  const [useNews, setUseNews] = useState(true);
  const [newsQuery, setNewsQuery] = useState("trí tuệ nhân tạo");
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [log, setLog] = useState<string[]>([]);
  const [title, setTitle] = useState<string>("");
  const [scenes, setScenes] = useState<SceneThumb[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [error, setError] = useState<string>("");
  const logRef = useRef<HTMLDivElement>(null);

  function pushLog(msg: string) {
    setLog((l) => [...l, msg]);
    setStatus(msg);
    requestAnimationFrame(() => logRef.current?.scrollTo(0, logRef.current.scrollHeight));
  }

  async function generate() {
    setRunning(true);
    setError("");
    setVideoUrl("");
    setScenes([]);
    setTitle("");
    setLog([]);
    setStatus("Bắt đầu...");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, useNews, newsQuery }),
      });
      if (!res.ok || !res.body) {
        const t = await res.text().catch(() => "");
        throw new Error(`Lỗi máy chủ (${res.status}): ${t}`);
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
            pushLog(`Kịch bản xong: "${e.storyboard.title}" — ${e.storyboard.scenes.length} cảnh`);
          } else if (e.type === "scene") {
            setScenes((s) => [...s, { index: e.index, imageUrl: e.imageUrl }]);
          } else if (e.type === "done") {
            setVideoUrl(e.videoUrl);
            pushLog("✅ Hoàn thành! Video đã sẵn sàng.");
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
          <h1 className="text-3xl font-bold tracking-tight">🎬 AI Video Maker — Local &amp; Miễn phí</h1>
          <p className="text-sm text-zinc-400">
            Kịch bản (Ollama) · Giọng đọc (Edge-TTS) · Ảnh AI (Flux/ComfyUI) · Ghép (FFmpeg) — chạy 100% trên máy bạn.
          </p>
        </header>

        <section className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <label className="text-sm font-medium text-zinc-300">Nhập ý tưởng video</label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={running}
            rows={3}
            className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm outline-none focus:border-zinc-500 disabled:opacity-60"
            placeholder="Ví dụ: Tóm tắt tin AI tuần này và ảnh hưởng tới thị trường Việt Nam..."
          />

          <div className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={useNews}
                onChange={(e) => setUseNews(e.target.checked)}
                disabled={running}
                className="h-4 w-4 accent-indigo-500"
              />
              Dựa trên tin thật mới nhất từ internet (Google News, 7 ngày qua)
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

          <button
            onClick={generate}
            disabled={running || !topic.trim()}
            className="self-start rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? "Đang tạo video..." : "Tạo video"}
          </button>
        </section>

        {(running || log.length > 0) && (
          <section className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="flex items-center gap-2 text-sm font-medium">
              {running && (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
              )}
              <span>{title ? `Tiến độ — ${title}` : "Tiến độ"}</span>
            </div>
            <p className="text-sm text-indigo-300">{status}</p>
            <div
              ref={logRef}
              className="max-h-40 overflow-y-auto rounded-lg bg-zinc-950 p-3 font-mono text-xs leading-relaxed text-zinc-400"
            >
              {log.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
            {scenes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {scenes.map((s) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={s.index}
                    src={s.imageUrl}
                    alt={`Cảnh ${s.index}`}
                    className="h-28 w-auto rounded-lg border border-zinc-700"
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {error && (
          <section className="rounded-2xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
            <strong>Lỗi:</strong> {error}
          </section>
        )}

        {videoUrl && (
          <section className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h2 className="text-lg font-semibold">Video của bạn 🎉</h2>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video src={videoUrl} controls className="w-full max-w-xs self-center rounded-xl" />
            <a
              href={videoUrl}
              download
              className="self-start rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold hover:bg-emerald-500"
            >
              ⬇ Tải video (.mp4)
            </a>
          </section>
        )}
      </main>
    </div>
  );
}
