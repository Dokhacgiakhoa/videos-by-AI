"use client";

import { Player } from "@remotion/player";
import { GsapSampleSlide } from "../../../remotion/GsapSampleSlide";

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

export function TemplateVideoTab({
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
  const totalMockupDuration = 300;

  return (
    <div className="flex flex-col gap-6">
      {/* System Template: Live GSAP Player Section */}
      <section className="flex flex-col gap-4 p-5 tech-card-glass tech-card-glow-orange shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-hot to-transparent" />

        <div className="flex items-center justify-between border-b border-line/60 pb-2">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
              <span>🎨</span> Mẫu Hoạt ảnh GSAP (Remotion Player)
            </h3>
            <p className="text-sm text-zinc-400 font-mono">Mẫu hệ thống (System Template)</p>
          </div>
          <span className="rounded-full bg-hot/10 px-2 py-0.5 text-base font-mono font-semibold text-hot border border-hot/20">
            BẢN XEM TRƯỚC
          </span>
        </div>
        
        {/* Mobile Phone Mockup Device Wrapper */}
        <div className="self-center flex flex-col rounded-3xl border border-line bg-[#030408] shadow-2xl relative max-w-[280px] w-full overflow-hidden my-2">
          {/* Device Speaker & Camera dots */}
          <div className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-black/60 border-b border-line">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
            <span className="ml-2 font-mono text-base text-zinc-400 uppercase tracking-widest">Viewport</span>
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
              acknowledgeRemotionLicense
              autoPlay
            />
          </div>
        </div>
        
        <p className="text-base text-[#69748a] text-center leading-relaxed font-sans mt-1">
          Timeline GSAP đồng bộ Remotion. Code mẫu tại:{" "}
          <a href="file:///d:/Videos-by-AI/src/remotion/GsapSampleSlide.tsx" className="text-hot hover:underline font-mono text-base">
            GsapSampleSlide.tsx
          </a>
        </p>
      </section>

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-line/50 rounded-3xl bg-black/20">
          <span className="text-4xl mb-4 opacity-50">📭</span>
          <p className="text-zinc-400 font-mono text-base">Bạn chưa lưu mẫu video cá nhân nào.</p>
        </div>
      ) : (
        jobs.map((j) => {
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
                    <span className="text-2xl">🎬</span>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <h2 className="text-lg font-bold text-white truncate" title={j.title}>{j.title}</h2>
                  <div className="flex items-center gap-3 text-base font-mono text-zinc-400 mt-1">
                    <span className="uppercase text-hot/80 bg-hot/10 px-1.5 py-0.5 rounded-md">Kho video m?u</span>
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
                    <div className="flex flex-col gap-4 text-base leading-relaxed">
                      <div className="bg-white/5 border border-line p-4 rounded-xl">
                        <strong className="text-hot block mb-1">Tiêu đề:</strong>
                        <p className="font-bold">{j.scriptData.title}</p>
                      </div>
                      <div className="bg-white/5 border border-line p-4 rounded-xl">
                        <strong className="text-hot block mb-1">Hook (Mở bài):</strong>
                        <p>{j.scriptData.hook}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <strong className="text-hot block">Các phân cảnh ({j.scriptData.sections?.length || 0}):</strong>
                        {j.scriptData.sections?.map((sec: any, i: number) => (
                          <div key={i} className="bg-black/30 border border-line/50 p-3 rounded-lg text-base font-mono flex flex-col gap-1.5">
                            <span className="text-emerald-400">"{sec.narration}"</span>
                            <span className="text-zinc-400">[{sec.keyword}]</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        );
      }))}
    </div>
  );
}
