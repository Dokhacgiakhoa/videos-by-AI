"use client";

import { useVideoGen } from "../../_context/VideoGenContext";
import { usePipeline } from "../../_hooks/usePipeline";
import { SwitchCard } from "../SwitchCard";

export function GenerateSetup() {
  const {
    step5Locked,
    preview,
    setPreview,
    setShowAutoConfirm,
    running,
    isVideo,
    setDraftCard,
    setDraftImage,
    setShowEditor,
    pushLog,
  } = useVideoGen();

  const { onPrimary, cancel, generate } = usePipeline();

  return (
    <div className={`flex flex-col gap-3 p-5 tech-card-glass transition-all duration-300 ${
      step5Locked ? "opacity-35 pointer-events-none" : ""
    }`}>
      <div className="flex items-center justify-between">
        <h3 className="text-[1.2rem] font-mono font-bold uppercase tracking-widest text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-hot" /> TẠO SẢN PHẨM
        </h3>
        {step5Locked ? (
          <span className="text-base font-mono text-zinc-400">🔒 Khóa</span>
        ) : (
          <span className="text-base font-mono text-emerald-400 font-bold">✅ Sẵn sàng</span>
        )}
      </div>



      <div className="flex gap-2 mt-1">
        <button
          onClick={onPrimary}
          disabled={running || step5Locked}
          className="w-full rounded-xl py-3 text-base font-display font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer uppercase tracking-wider tech-btn-liquid"
        >
          {running ? "Đang xử lý..." : preview ? "Soạn kịch bản →" : isVideo ? "Tạo Video" : "Tạo bộ ảnh"}
        </button>
      </div>
    </div>
  );
}
