"use client";

import React from "react";

// Kiểu lỏng để khớp dữ liệu từ API (tránh phụ thuộc type backend trong client).
export interface CardScriptLite {
  title: string;
  scenes: { voiceOver: string; card: Record<string, unknown> }[];
}
export interface ImagePostScriptLite {
  title: string;
  slides: { headline: string; subheadline?: string; imagePrompt: string; source?: string }[];
}

interface Props {
  type: "video" | "imagepost";
  cardScript?: CardScriptLite;
  imagePostScript?: ImagePostScriptLite;
  onChangeCard: (s: CardScriptLite) => void;
  onChangeImage: (s: ImagePostScriptLite) => void;
  onRender: () => void;
  onNextLayout?: () => void;
  onCancel: () => void;
  running: boolean;
}

export function ScriptEditor({
  type,
  cardScript,
  imagePostScript,
  onChangeCard,
  onChangeImage,
  onRender,
  onNextLayout,
  onCancel,
  running,
}: Props) {
  const wordCount =
    type === "video" && cardScript
      ? cardScript.scenes.reduce((n, s) => n + s.voiceOver.trim().split(/\s+/).filter(Boolean).length, 0)
      : 0;

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-indigo-800/60 bg-indigo-950/20 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">📝 Xem trước & sửa kịch bản</h2>
        <span className="text-xs text-zinc-400">
          {type === "video" ? `${cardScript?.scenes.length ?? 0} cảnh · ~${wordCount} từ` : `${imagePostScript?.slides.length ?? 0} ảnh`}
        </span>
      </div>

      {type === "video" && cardScript && (
        <div className="flex flex-col gap-3">
          {cardScript.scenes.map((s, i) => (
            <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Cảnh {i + 1} — lời đọc</div>
              <textarea
                value={s.voiceOver}
                disabled={running}
                onChange={(e) => {
                  const scenes = cardScript.scenes.slice();
                  scenes[i] = { ...scenes[i], voiceOver: e.target.value };
                  onChangeCard({ ...cardScript, scenes });
                }}
                rows={2}
                className="w-full resize-y rounded-lg border border-zinc-700 bg-zinc-950 p-2 text-sm outline-none focus:border-zinc-500 disabled:opacity-60"
              />
            </div>
          ))}
        </div>
      )}

      {type === "imagepost" && imagePostScript && (
        <div className="flex flex-col gap-3">
          {imagePostScript.slides.map((s, i) => (
            <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">Ảnh {i + 1}</div>
              <input
                value={s.headline}
                disabled={running}
                onChange={(e) => {
                  const slides = imagePostScript.slides.slice();
                  slides[i] = { ...slides[i], headline: e.target.value };
                  onChangeImage({ ...imagePostScript, slides });
                }}
                placeholder="Tiêu đề"
                className="mb-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2 text-sm font-semibold outline-none focus:border-zinc-500 disabled:opacity-60"
              />
              <input
                value={s.subheadline ?? ""}
                disabled={running}
                onChange={(e) => {
                  const slides = imagePostScript.slides.slice();
                  slides[i] = { ...slides[i], subheadline: e.target.value };
                  onChangeImage({ ...imagePostScript, slides });
                }}
                placeholder="Mô tả ngắn (tuỳ chọn)"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2 text-sm outline-none focus:border-zinc-500 disabled:opacity-60"
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        {type === "video" && onNextLayout && (
          <button
            onClick={onNextLayout}
            disabled={running}
            className="flex-1 rounded-xl bg-gradient-to-r from-cy to-emerald-500 px-6 py-2.5 text-sm font-display font-bold text-black hover:opacity-90 disabled:opacity-50 cursor-pointer uppercase tracking-wider"
          >
            Tiếp → Chọn Layout
          </button>
        )}
        <button
          onClick={onRender}
          disabled={running}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-50 cursor-pointer"
          title={type === "video" && onNextLayout ? "Bỏ qua preview, render thẳng" : undefined}
        >
          {running ? "Đang tạo..." : type === "video" ? "⚡ Render thẳng" : "✅ Tạo bộ ảnh"}
        </button>
        <button
          onClick={onCancel}
          disabled={running}
          className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
        >
          Huỷ
        </button>
      </div>
    </section>
  );
}
