"use client";

import React from "react";

// Kiểu lỏng để khớp dữ liệu từ API (tránh phụ thuộc type backend trong client).
export interface CardScriptLite {
  title: string;
  scenes: { voiceOver: string; card: Record<string, unknown> }[];
}
export type PostRatio = "1:1" | "4:5" | "9:16" | "2:1" | "16:9";
export interface ImagePostSlideLite {
  headline: string;
  summary?: string;
  caption?: string;
  source?: string;
  imageMode: "photo" | "generated";
  imageQuery?: string;
  imagePrompt?: string;
  imageSrc?: string;
  ratio: PostRatio;
}
export interface ImagePostScriptLite {
  title: string;
  slides: ImagePostSlideLite[];
}

const POST_RATIOS: PostRatio[] = ["4:5", "1:1", "9:16", "2:1", "16:9"];

interface Props {
  type: "video" | "imagepost";
  cardScript?: CardScriptLite;
  imagePostScript?: ImagePostScriptLite;
  onChangeCard: (s: CardScriptLite) => void;
  onChangeImage: (s: ImagePostScriptLite) => void;
  onRender: () => void;
  onNextLayout?: () => void;
  onFetchImages?: () => void;
  onFetchSingleImage?: (index: number) => void;
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
  onFetchImages,
  onFetchSingleImage,
  onCancel,
  running,
}: Props) {
  const wordCount =
    type === "video" && cardScript
      ? cardScript.scenes.reduce((n, s) => n + s.voiceOver.trim().split(/\s+/).filter(Boolean).length, 0)
      : 0;

  return (
    <section className="flex flex-col gap-3 p-5 tech-card-glass">
      <div className="flex items-center justify-between border-b border-line/50 pb-2">
        <h2 className="text-base font-display font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
          <span>📝</span> Xem trước & sửa kịch bản
        </h2>
        <span className="text-base font-mono text-zinc-400">
          {type === "video" ? `${cardScript?.scenes.length ?? 0} cảnh · ~${wordCount} từ` : `${imagePostScript?.slides.length ?? 0} ảnh`}
        </span>
      </div>

      {type === "video" && cardScript && (
        <div className="flex flex-col gap-3">
          {cardScript.scenes.map((s, i) => {
            const isCover = s.card?.name === "Tiêu điểm";
            const firstIsCover = cardScript.scenes[0]?.card?.name === "Tiêu điểm";
            const displayIndex = firstIsCover ? i : i + 1;
            return (
            <div key={i} className="rounded-xl border border-line bg-black/25 p-3">
              <div className="mb-1 text-base font-mono uppercase tracking-wide text-[#6b7c96]">
                {isCover ? "Cảnh 0 (Bìa) — lời đọc" : `Cảnh ${displayIndex} — lời đọc`}
              </div>
              <textarea
                value={s.voiceOver}
                disabled={running}
                onChange={(e) => {
                  const scenes = cardScript.scenes.slice();
                  scenes[i] = { ...scenes[i], voiceOver: e.target.value };
                  onChangeCard({ ...cardScript, scenes });
                }}
                rows={2}
                className="w-full resize-y p-2 text-base outline-none disabled:opacity-60 tech-input-glass text-white"
              />
            </div>
            );
          })}
        </div>
      )}

      {type === "imagepost" && imagePostScript && (
        <div className="flex flex-col gap-3">
          {imagePostScript.slides.map((s, i) => {
            const patch = (p: Partial<ImagePostSlideLite>) => {
              const slides = imagePostScript.slides.slice();
              slides[i] = { ...slides[i], ...p };
              onChangeImage({ ...imagePostScript, slides });
            };
            const isCover = (s as any).isCover || s.source === "Tổng hợp";
            const firstIsCover = (imagePostScript.slides[0] as any).isCover || imagePostScript.slides[0].source === "Tổng hợp";
            const displayIndex = firstIsCover ? i : i + 1;

            return (
              <div key={i} className="flex gap-3 rounded-xl border border-line bg-black/25 p-3">
                <div className="shrink-0 flex flex-col gap-3 w-32 sm:w-40 self-start">
                  <div 
                    className="relative overflow-hidden rounded-lg border border-line w-full"
                    style={{
                      aspectRatio: 
                        s.ratio === '1:1' ? '1 / 1' : 
                        s.ratio === '4:5' ? '4 / 5' : 
                        s.ratio === '9:16' ? '9 / 16' : 
                        s.ratio === '16:9' ? '16 / 9' : 
                        s.ratio === '2:1' ? '2 / 1' : '1 / 1',
                      height: 'auto', 
                    }}
                  >
                    {s.imageSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.imageSrc} alt={`Ảnh ${displayIndex}`} className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-base text-zinc-400 font-mono text-center px-2">
                        Chưa có ảnh
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <select
                      value={s.ratio}
                      disabled={running}
                      onChange={(e) => patch({ ratio: e.target.value as PostRatio })}
                      className="w-full rounded-lg px-2 py-1.5 text-base text-center outline-none disabled:opacity-60 tech-input-glass"
                    >
                      {POST_RATIOS.map((r) => (
                        <option key={r} value={r}>Tỉ lệ: {r}</option>
                      ))}
                    </select>
                    
                    <select
                      value={s.imageMode}
                      disabled={running}
                      onChange={(e) => patch({ imageMode: e.target.value as "photo" | "generated" })}
                      className="w-full rounded-lg px-2 py-1.5 text-base text-center outline-none disabled:opacity-60 tech-input-glass"
                    >
                      <option value="photo">📰 Ảnh thật</option>
                      <option value="generated">🎨 Tự gen</option>
                    </select>

                    {onFetchSingleImage && (
                      <button
                        onClick={() => onFetchSingleImage(i)}
                        disabled={running}
                        title="Lấy lại ảnh khác cho thẻ này"
                        className="w-full rounded-lg px-2 py-1.5 text-base outline-none disabled:opacity-60 tech-btn-glass text-white hover:text-emerald-400 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>🔄</span> Lấy ảnh khác
                      </button>
                    )}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-base font-mono uppercase tracking-wide text-[#6b7c96]">
                      {isCover ? "Ảnh 0 (Bìa)" : `Ảnh ${displayIndex}`}
                    </span>
                  </div>

                  <div className="mb-2">
                    <label className="mb-1 block text-base font-medium text-zinc-400 uppercase tracking-wider">Tiêu đề</label>
                    <input
                      value={s.headline}
                      disabled={running}
                      onChange={(e) => patch({ headline: e.target.value })}
                      placeholder="Tiêu đề"
                      className="w-full p-2 text-base font-semibold outline-none disabled:opacity-60 tech-input-glass"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="mb-1 block text-base font-medium text-zinc-400 uppercase tracking-wider">Mô tả / Tóm tắt (Trên ảnh)</label>
                    <textarea
                      value={s.summary ?? ""}
                      disabled={running}
                      onChange={(e) => patch({ summary: e.target.value })}
                      placeholder="Tóm tắt ngắn (1–2 câu)"
                      rows={2}
                      className="w-full resize-y p-2 text-base outline-none disabled:opacity-60 tech-input-glass"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="mb-1 block text-base font-medium text-emerald-500/80 uppercase tracking-wider">Nội dung chi tiết (Caption bài đăng)</label>
                    <textarea
                      value={s.caption ?? ""}
                      disabled={running}
                      onChange={(e) => patch({ caption: e.target.value })}
                      placeholder="Nội dung chi tiết sẽ làm caption đăng kèm ảnh..."
                      rows={4}
                      className="w-full resize-y p-2 text-base outline-none disabled:opacity-60 tech-input-glass"
                    />
                  </div>

                  <div className="flex gap-2">
                    <div className="w-32 shrink-0">
                      <label className="mb-1 block text-base font-medium text-zinc-400 uppercase tracking-wider">Nguồn</label>
                      <input
                        value={s.source ?? ""}
                        disabled={running}
                        onChange={(e) => patch({ source: e.target.value })}
                        placeholder="Nguồn (tuỳ chọn)"
                        className="w-full p-2 text-base outline-none disabled:opacity-60 tech-input-glass"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <label className="mb-1 block text-base font-medium text-zinc-400 uppercase tracking-wider">
                        {s.imageMode === "generated" ? "Prompt sinh ảnh" : "Từ khoá tìm ảnh"}
                      </label>
                      {s.imageMode === "generated" ? (
                        <input
                          value={s.imagePrompt ?? ""}
                          disabled={running}
                          onChange={(e) => patch({ imagePrompt: e.target.value })}
                          placeholder="Prompt ảnh (tiếng Anh)"
                          className="w-full p-2 text-base outline-none disabled:opacity-60 tech-input-glass"
                        />
                      ) : (
                        <input
                          value={s.imageQuery ?? ""}
                          disabled={running}
                          onChange={(e) => patch({ imageQuery: e.target.value })}
                          placeholder="Từ khoá tìm ảnh"
                          className="w-full p-2 text-base outline-none disabled:opacity-60 tech-input-glass"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-2 mt-4">
        {type === "video" && onNextLayout && (
          <button
            onClick={onNextLayout}
            disabled={running}
            className="flex-1 rounded-xl px-6 py-3 text-base font-bold disabled:opacity-50 cursor-pointer uppercase tracking-wider tech-btn-glass text-white hover:bg-zinc-800 transition-colors"
          >
            Tiếp → Chọn Layout
          </button>
        )}
        {type === "imagepost" && onFetchImages && (
          <button
            onClick={onFetchImages}
            disabled={running}
            className="flex-1 rounded-xl px-6 py-3 text-base font-bold disabled:opacity-50 cursor-pointer uppercase tracking-wider tech-btn-glass text-white hover:bg-zinc-800 transition-colors"
          >
            {running ? "⏳ Đang lấy..." : "🖼️ Lấy ảnh AI"}
          </button>
        )}
        <button
          onClick={onRender}
          disabled={running}
          className="flex-1 rounded-xl px-6 py-3 text-base font-bold disabled:opacity-50 cursor-pointer uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition-all duration-300"
          title={type === "video" && onNextLayout ? "Bỏ qua preview, render thẳng" : undefined}
        >
          {running ? "Đang tạo..." : type === "video" ? "⚡ Render thẳng" : "✅ Tạo bộ ảnh"}
        </button>
        <button
          onClick={onCancel}
          disabled={running}
          className="flex-1 rounded-xl px-4 py-3 text-base font-bold text-white disabled:opacity-50 cursor-pointer border border-line bg-black/40 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors duration-300 uppercase tracking-wider"
        >
          Huỷ
        </button>
      </div>
    </section>
  );
}
