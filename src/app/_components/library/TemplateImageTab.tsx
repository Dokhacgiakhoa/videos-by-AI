"use client";

interface Job {
  id: string;
  type: "video" | "imagepost";
  title: string;
  aspectRatio: string;
  createdAt: string;
  videoUrl?: string;
  images?: { url: string; ratio?: string; headline?: string }[];
  thumb?: string;
  scriptData?: any;
}

export function TemplateImageTab({
  jobs,
  expandedId,
  setExpandedId,
  onDelete
}: {
  jobs: Job[];
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  onDelete: (id: string) => void;
}) {
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-dashed border-line/50 rounded-3xl bg-black/20">
        <span className="text-4xl mb-4 opacity-50">📭</span>
        <p className="text-zinc-400 font-mono text-base">Thư viện của bạn đang trống ở mục này.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {jobs.map((j) => {
        const isExpanded = expandedId === j.id;
        const hasScript = !!j.scriptData;

        return (
          <section key={j.id} className="tech-card-glass flex flex-col overflow-hidden transition-all duration-300">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : j.id)}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 shrink-0 rounded-xl overflow-hidden bg-black/50 flex items-center justify-center border border-line">
                  {j.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={j.thumb} alt="thumb" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">🖼️</span>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <h2 className="text-lg font-bold text-white truncate" title={j.title}>{j.title}</h2>
                  <div className="flex items-center gap-3 text-base font-mono text-zinc-400 mt-1">
                    <span className="uppercase text-hot/80 bg-hot/10 px-1.5 py-0.5 rounded-md">Template Ảnh</span>
                    <span>{j.aspectRatio}</span>
                    <span>{new Date(j.createdAt).toLocaleString("vi-VN")}</span>
                    {hasScript && <span className="text-emerald-500/80">✓ Kịch bản</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(j.id); }}
                  className="p-2 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                  title="Xoá bản ghi"
                >
                  🗑️
                </button>
                <span className={`transition-transform duration-300 text-zinc-400 ${isExpanded ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </div>
            </div>

            {isExpanded && (
              <div className="flex flex-col gap-6 p-6 border-t border-line/60 bg-black/20 animate-in slide-in-from-top-2 duration-300">
                <div className="flex-1 flex flex-col gap-4">
                  <h3 className="text-base font-mono font-bold text-zinc-400 uppercase tracking-widest border-b border-line/50 pb-2">Kịch bản chi tiết</h3>
                  
                  {!hasScript && (
                    <p className="text-base text-zinc-400 italic">Bản ghi này không lưu trữ dữ liệu kịch bản.</p>
                  )}

                  {hasScript && (
                    <div className="flex flex-col gap-3">
                      <div className="bg-white/5 border border-line p-4 rounded-xl text-base mb-2">
                        <strong className="text-hot block mb-1">Chủ đề bài đăng:</strong>
                        <p className="font-bold">{j.scriptData.title}</p>
                      </div>
                      {j.scriptData.slides?.map((slide: any, i: number) => (
                        <div key={i} className="bg-black/30 border border-line/50 p-4 rounded-xl flex flex-col gap-2">
                          <h4 className="font-bold text-emerald-400">Slide {i + 1}: {slide.headline}</h4>
                          <p className="text-base text-white whitespace-pre-wrap">{slide.caption}</p>
                          <div className="mt-2 p-2 bg-black/50 rounded-md border border-line/30 text-base font-mono text-zinc-400">
                            <span className="block mb-1 text-hot/70">Prompt ảnh:</span>
                            {slide.imagePrompt || "Chưa có prompt"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
