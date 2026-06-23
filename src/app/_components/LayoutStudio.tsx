"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { BrandData } from "./BrandUploader";

const Player = dynamic(() => import("@remotion/player").then((m) => m.Player), { ssr: false });
const Ai91Video = dynamic(() => import("@/remotion/Video").then((m) => m.Ai91Video), { ssr: false });

const LAYOUT_OPTIONS = [
  { value: "card", label: "Card" },
  { value: "title", label: "Title" },
  { value: "list", label: "List" },
  { value: "chart", label: "Chart" },
  { value: "bento", label: "Bento" },
  { value: "quote", label: "Quote" },
  { value: "stats-grid", label: "Stats" },
  { value: "timeline", label: "Timeline" },
  { value: "code-snippet", label: "Code" },
  { value: "cream", label: "Cream" },
  { value: "manim", label: "Manim" },
  { value: "text-image", label: "Text+Img" },
  { value: "text-video", label: "Text+Vid" },
  { value: "split-3d", label: "3D Split" },
  { value: "outro", label: "Outro" },
] as const;

interface CardScriptLite {
  title: string;
  scenes: { voiceOver: string; card: Record<string, unknown> }[];
}

interface Props {
  cardScript: CardScriptLite;
  onChange: (script: CardScriptLite) => void;
  onBack: () => void;
  onRender: () => void;
  geminiKey: string;
  brand: BrandData | null;
  running: boolean;
}

const PREVIEW_FPS = 30;
const PREVIEW_FRAMES_PER_SCENE = 90; // 3s per scene

export function LayoutStudio({ cardScript, onChange, onBack, onRender, geminiKey, brand, running }: Props) {
  const [selectedScene, setSelectedScene] = useState(0);
  const [comment, setComment] = useState("");
  const [remaking, setRemaking] = useState(false);
  const [error, setError] = useState("");

  const previewCards = useMemo(
    () =>
      cardScript.scenes.map((s) => ({
        ...s.card,
        durationInFrames: PREVIEW_FRAMES_PER_SCENE,
        layoutType: (s.card.layoutType as string) || "card",
      })),
    [cardScript],
  );

  const totalFrames = previewCards.length * PREVIEW_FRAMES_PER_SCENE;

  const updateLayout = useCallback(
    (index: number, layoutType: string) => {
      const next = { ...cardScript, scenes: [...cardScript.scenes] };
      next.scenes[index] = {
        ...next.scenes[index],
        card: { ...next.scenes[index].card, layoutType },
      };
      onChange(next);
    },
    [cardScript, onChange],
  );

  async function autoAssign() {
    setRemaking(true);
    setError("");
    try {
      const res = await fetch("/api/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assignLayouts",
          cardScript,
          geminiKey,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Lỗi ${res.status}`);
      if (data.cardScript) onChange(data.cardScript);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRemaking(false);
    }
  }

  async function remake() {
    if (!comment.trim()) return;
    setRemaking(true);
    setError("");
    try {
      const res = await fetch("/api/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assignLayouts",
          cardScript,
          comment: comment.trim(),
          geminiKey,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Lỗi ${res.status}`);
      if (data.cardScript) {
        onChange(data.cardScript);
        setComment("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRemaking(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-panel/60 backdrop-blur-md p-5 shadow-xl">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-display font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-hot" />
          Layout Studio — {cardScript.title}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={autoAssign}
            disabled={remaking}
            className="rounded-lg border border-cy/30 bg-cy/10 px-3 py-1.5 text-[11px] font-mono font-bold text-cy hover:bg-cy/20 transition-colors cursor-pointer disabled:opacity-40"
          >
            {remaking ? "Đang xử lý..." : "🤖 Auto Layout"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT: Scene list + layout picker */}
        <div className="flex flex-col gap-2 max-h-[520px] overflow-y-auto pr-1">
          {cardScript.scenes.map((scene, i) => (
            <div
              key={i}
              onClick={() => setSelectedScene(i)}
              className={`flex items-start gap-2 rounded-xl border p-2.5 cursor-pointer transition-colors ${
                i === selectedScene
                  ? "border-hot/50 bg-hot/5"
                  : "border-line bg-black/30 hover:border-line hover:bg-black/50"
              }`}
            >
              <span className="text-[10px] font-mono text-zinc-500 mt-0.5 shrink-0 w-5">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-zinc-300 truncate">{scene.voiceOver.slice(0, 80)}...</p>
                <select
                  value={(scene.card.layoutType as string) || "card"}
                  onChange={(e) => { e.stopPropagation(); updateLayout(i, e.target.value); }}
                  className="mt-1 rounded-md border border-line bg-black/60 px-2 py-0.5 text-[10px] font-mono text-cy cursor-pointer"
                >
                  {LAYOUT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT: Preview Player */}
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-line bg-black overflow-hidden" style={{ aspectRatio: "9/16", maxHeight: 520 }}>
            <Player
              component={Ai91Video as unknown as React.ComponentType<Record<string, unknown>>}
              inputProps={{
                brandText: "AI91",
                cards: previewCards,
                brand: brand ?? undefined,
              }}
              durationInFrames={Math.max(1, totalFrames)}
              fps={PREVIEW_FPS}
              compositionWidth={1080}
              compositionHeight={1920}
              style={{ width: "100%", height: "100%" }}
              controls
              loop
              acknowledgeRemotionLicense
            />
          </div>
          <p className="text-[10px] font-mono text-zinc-500 text-center">
            Preview {previewCards.length} cảnh · {Math.round(totalFrames / PREVIEW_FPS)}s · click scene bên trái để xem
          </p>
        </div>
      </div>

      {/* Comment + Remake */}
      <div className="flex gap-2">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Gõ feedback (vd: cảnh 3 đổi sang chart, thêm dữ liệu so sánh...)"
          className="flex-1 rounded-xl border border-line bg-black/40 px-3 py-2 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 resize-none"
          rows={2}
        />
        <button
          onClick={remake}
          disabled={remaking || !comment.trim()}
          className="rounded-xl border border-hot/30 bg-hot/10 px-4 text-xs font-mono font-bold text-hot hover:bg-hot/20 transition-colors cursor-pointer disabled:opacity-40 whitespace-nowrap"
        >
          🔄 Remake
        </button>
      </div>

      {error && <p className="text-[10px] text-red-400 font-mono">{error}</p>}

      {/* Action buttons */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onBack}
          disabled={running}
          className="rounded-xl border border-line px-4 py-2.5 text-xs font-mono text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors cursor-pointer"
        >
          ◀ Sửa nội dung
        </button>
        <button
          onClick={onRender}
          disabled={running}
          className="flex-1 rounded-xl bg-gradient-to-r from-hot to-hot2 py-2.5 text-sm font-display font-bold text-black transition-all shadow-lg shadow-hot/10 disabled:opacity-40 cursor-pointer uppercase tracking-wider"
        >
          {running ? "Đang render..." : "▶ Render Video"}
        </button>
      </div>
    </div>
  );
}
