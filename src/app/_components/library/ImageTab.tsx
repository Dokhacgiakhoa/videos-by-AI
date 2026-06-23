"use client";

import { useState, useEffect } from "react";
import { PromptModal, AlertModal } from "../Modal";

const formatDateTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const hh = d.getHours();
  const ampm = hh >= 12 ? 'PM' : 'AM';
  const h = hh % 12 || 12;
  const mm = d.getMinutes().toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${h.toString().padStart(2, '0')}:${mm} ${ampm} ${day}/${month}/${year}`;
};

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

export function ImageTab({
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
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [promptJob, setPromptJob] = useState<Job | null>(null);
  const [alertMsg, setAlertMsg] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("savedTemplateJobIds");
    if (saved) {
      try {
        setSavedIds(new Set(JSON.parse(saved)));
      } catch (e) {}
    }
  }, []);

  const handleSaveTemplateClick = (j: Job) => {
    if (savedIds.has(j.id)) return;
    setPromptJob(j);
  };

  const doSaveTemplate = async (name: string) => {
    if (!promptJob) return;
    try {
      const res = await fetch("/api/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          name,
          type: promptJob.type,
          aspectRatio: promptJob.aspectRatio,
          scriptStructure: promptJob.scriptData,
          createdAt: new Date().toISOString()
        })
      });
      if (res.ok) {
        setSavedIds(prev => {
          const next = new Set(prev).add(promptJob.id);
          localStorage.setItem("savedTemplateJobIds", JSON.stringify([...next]));
          return next;
        });
        setAlertMsg("Lưu mẫu tự động thành công! Bạn có thể xem trong tab Tự Động Hóa.");
      } else {
        setAlertMsg("Lỗi khi lưu mẫu");
      }
    } catch (e) {
      setAlertMsg("Lỗi mạng khi lưu mẫu");
    }
  };

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-dashed border-line/50 rounded-3xl bg-black/20">
        <span className="text-4xl mb-4 opacity-50">📭</span>
        <p className="text-zinc-400 font-mono text-base">Thư viện của bạn đang trống ở mục này.</p>
      </div>
    );
  }

  return (
    <>
      <PromptModal 
        isOpen={!!promptJob} 
        onClose={() => setPromptJob(null)} 
        onSubmit={doSaveTemplate} 
        title="Lưu mẫu tự động" 
        message="Nhập tên cho mẫu tự động này (VD: Bộ ảnh tin tức):" 
        defaultValue={promptJob?.title || ""} 
      />
      <AlertModal 
        isOpen={!!alertMsg} 
        onClose={() => setAlertMsg("")} 
        title="Thông báo" 
        message={alertMsg} 
      />
      <div className="flex flex-col gap-6">
      {jobs.map((j) => {
        const isExpanded = expandedId === j.id;

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
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold mt-1.5">
                    <span className="uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      {j.images?.length || 0} Ảnh
                    </span>
                    {(() => {
                      const ratioCounts = j.images?.reduce((acc, img) => {
                        const r = img.ratio || j.aspectRatio || "1:1";
                        acc[r] = (acc[r] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);

                      return ratioCounts && Object.keys(ratioCounts).length > 0 ? (
                        Object.entries(ratioCounts).map(([ratio, count]) => (
                          <span key={ratio} className="text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                            {ratio} × {count}
                          </span>
                        ))
                      ) : (
                        <span className="text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                          {j.aspectRatio}
                        </span>
                      );
                    })()}
                    <span className="text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                      {formatDateTime(j.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleSaveTemplateClick(j); }}
                  className={`whitespace-nowrap px-3 py-1.5 text-sm font-mono rounded-lg border transition-colors hidden sm:block ${
                    savedIds.has(j.id) 
                      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 cursor-default" 
                      : "text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20"
                  }`}
                  title="Lưu cấu trúc này để chạy tự động về sau"
                >
                  {savedIds.has(j.id) ? "✓ Đã lưu mẫu" : "✨ Lưu mẫu tự động"}
                </button>
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
              <div className="flex flex-col xl:flex-row gap-6 p-6 border-t border-line/60 bg-black/20 animate-in slide-in-from-top-2 duration-300">
                <div className="flex-1 flex flex-col gap-4 max-w-full xl:max-w-[45%]">
                  <h3 className="text-base font-mono font-bold text-zinc-400 uppercase tracking-widest border-b border-line/50 pb-2">Thành phẩm Ảnh</h3>
                  
                  {j.images && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {j.images.map((img, i) => (
                        <div key={i} className="flex flex-col gap-2 rounded-xl bg-black/40 border border-line/50 p-2 relative group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.url} alt={`Slide ${i}`} className="w-full h-auto rounded-lg object-contain" />
                          {img.headline && (
                            <p className="text-base text-zinc-400 font-mono italic px-1 line-clamp-2">{img.headline}</p>
                          )}
                          <a href={img.url} download className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-line text-base text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            Tải ảnh
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-4">
                  <h3 className="text-base font-mono font-bold text-zinc-400 uppercase tracking-widest border-b border-line/50 pb-2">Kịch bản đính kèm</h3>
                  
                  {j.scriptData ? (
                    <div className="flex flex-col gap-3">
                      <div className="bg-white/5 border border-line p-4 rounded-xl text-base mb-2">
                        <strong className="text-hot block mb-1">Chủ đề bài đăng:</strong>
                        <p className="font-bold">{j.scriptData.title}</p>
                      </div>
                      {j.scriptData.slides?.map((slide: any, i: number) => (
                        <div key={i} className="bg-black/30 border border-line/50 p-4 rounded-xl flex flex-col gap-2">
                          <h4 className="font-bold text-emerald-400">Slide {i + 1}: {slide.headline}</h4>
                          <p className="text-base text-white whitespace-pre-wrap">{slide.caption}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-base text-zinc-400 italic">Bản ghi này không lưu trữ dữ liệu kịch bản.</p>
                  )}
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
    </>
  );
}
