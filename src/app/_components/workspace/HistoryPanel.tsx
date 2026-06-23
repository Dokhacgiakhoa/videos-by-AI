"use client";

import { useVideoGen } from "../../_context/VideoGenContext";
import { usePipeline } from "../../_hooks/usePipeline";
import { ProgressPanel } from "../ProgressPanel";

export function HistoryPanel() {
  const {
    running,
    title,
    status,
    log,
    thumbs,
    error,
    setError,
    countdown,
    setApiOption,
  } = useVideoGen();

  const { cancel } = usePipeline();

  return (
    <div className="lg:col-span-3 flex flex-col gap-5 sticky top-4 self-start h-fit max-h-[calc(100vh-2rem)] overflow-y-auto overflow-x-hidden p-1">
      <h2 className="text-2xl font-mono font-bold uppercase tracking-widest text-white flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-hot" /> TIẾN TRÌNH
      </h2>

      {/* Progress / Logs Panel */}
      <ProgressPanel running={running} title={title} status={status} log={log} thumbs={thumbs} onCancel={cancel} />

      {/* Error Message */}
      {error && (
        <section className="rounded-2xl border border-red-950 bg-red-950/20 p-4 text-base font-mono text-red-400 shadow-lg flex flex-col gap-2">
          <div>
            <strong className="text-red-500 font-bold block mb-1 uppercase tracking-wider">⚠️ System Error:</strong> {error}
          </div>
          {error.includes("ERR_429") && (
            <div className="mt-2 p-3 bg-black/40 border border-red-900/50 rounded-xl flex flex-col gap-3 animate-in slide-in-from-top-2 duration-300">
              {error.includes("ERR_429_MINUTE") && (
                <div className="flex items-center gap-2 text-amber-500">
                  <span className="text-lg">⏳</span>
                  <p>Hệ thống sẽ thử lại hoặc mở khoá sau: <strong className="text-xl text-white">{countdown}s</strong></p>
                </div>
              )}
              {error.includes("ERR_429_DAILY") && (
                <div className="flex items-center gap-2 text-rose-500">
                  <span className="text-lg">🚫</span>
                  <p className="font-bold">Đã hết sạch lượt dùng API hôm nay!</p>
                </div>
              )}
              <p className="text-zinc-400 text-[11px] leading-relaxed font-sans">
                {error.includes("ERR_429_DAILY") 
                  ? "Gemini API bản miễn phí chỉ cho phép một số lượng lệnh nhất định mỗi ngày. Bạn phải chờ đến ngày mai để có lại lượt, hoặc chuyển sang chế độ Quét tin Free để tiếp tục ngay bây giờ."
                  : "Gemini API phiên bản miễn phí quy định số lượt gọi giới hạn trong mỗi phút. Bạn có thể đợi đếm ngược kết thúc để gọi tiếp, hoặc chuyển sang chế độ Quét tin Free để vượt qua giới hạn này."}
              </p>
              <button
                onClick={() => {
                  setApiOption("no_api");
                  setError("");
                }}
                className="self-start mt-1 px-4 py-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/30 transition-colors uppercase font-bold tracking-wider text-base cursor-pointer"
              >
                👉 Chuyển sang Quét tin Free ngay
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
