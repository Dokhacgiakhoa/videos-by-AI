"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SegmentedControl } from "./SegmentedControl";
import { TemplateVideoTab } from "./library/TemplateVideoTab";
import { TemplateImageTab } from "./library/TemplateImageTab";
import { VideoTab } from "./library/VideoTab";
import { ImageTab } from "./library/ImageTab";

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

type TabType = "template-video" | "template-image" | "video" | "image";

export function LibraryPanel() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabType>("video");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetch("/api/library")
      .then((r) => r.json())
      .then((d) => setJobs(d.jobs ?? []))
      .catch(() => {});
  }, []);

  async function del(id: string) {
    if (!confirm("Bạn có chắc chắn muốn xóa bản ghi này?")) return;
    await fetch(`/api/library?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setJobs(jobs.filter(j => j.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  const filteredJobs = jobs.filter((j) => {
    if (tab === "template-video") return j.type === "video" && !j.videoUrl;
    if (tab === "template-image") return j.type === "imagepost" && (!j.images || j.images.length === 0);
    if (tab === "video") return j.type === "video" && !!j.videoUrl;
    if (tab === "image") return j.type === "imagepost" && !!(j.images && j.images.length > 0);
    return false;
  });

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / ITEMS_PER_PAGE));
  const paginatedJobs = filteredJobs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const tabs: { id: TabType; label: string }[] = [
    { id: "template-video", label: "Kho video mẫu" },
    { id: "template-image", label: "Kho ảnh mẫu" },
    { id: "video", label: "Video sản phẩm" },
    { id: "image", label: "Ảnh sản phẩm" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <SegmentedControl<TabType>
        value={tab}
        onChange={(val) => {
          setTab(val);
          setPage(1);
          setExpandedId(null);
        }}
        accent="orange"
        options={tabs.map(t => {
          const count = jobs.filter((j) => {
            if (t.id === "template-video") return j.type === "video" && !j.videoUrl;
            if (t.id === "template-image") return j.type === "imagepost" && (!j.images || j.images.length === 0);
            if (t.id === "video") return j.type === "video" && !!j.videoUrl;
            if (t.id === "image") return j.type === "imagepost" && !!(j.images && j.images.length > 0);
            return false;
          }).length;
          
          return {
            value: t.id,
            label: (
              <div className="flex items-center gap-2">
                <span>{t.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${tab === t.id ? "bg-hot/20 text-hot" : "bg-black/40 text-zinc-400"}`}>
                  {count}
                </span>
              </div>
            )
          };
        })}
      />

      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tab === "template-video" && (
              <TemplateVideoTab jobs={paginatedJobs} expandedId={expandedId} setExpandedId={setExpandedId} onDelete={del} />
            )}
            {tab === "template-image" && (
              <TemplateImageTab jobs={paginatedJobs} expandedId={expandedId} setExpandedId={setExpandedId} onDelete={del} />
            )}
            {tab === "video" && (
              <VideoTab jobs={paginatedJobs} expandedId={expandedId} setExpandedId={setExpandedId} onDelete={del} />
            )}
            {tab === "image" && (
              <ImageTab jobs={paginatedJobs} expandedId={expandedId} setExpandedId={setExpandedId} onDelete={del} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4 bg-black/20 p-4 rounded-xl border border-line/50">
          <button 
            disabled={page === 1} 
            onClick={() => setPage((p) => Math.max(1, p - 1))} 
            className="px-4 py-2 rounded-lg bg-black/40 border border-line text-white font-mono hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Trang trước
          </button>
          <span className="text-base font-mono text-cyan-400 font-bold">
            Trang {page} / {totalPages}
          </span>
          <button 
            disabled={page === totalPages} 
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))} 
            className="px-4 py-2 rounded-lg bg-black/40 border border-line text-white font-mono hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Trang sau →
          </button>
        </div>
      )}
    </div>
  );
}
