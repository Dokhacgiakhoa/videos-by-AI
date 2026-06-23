"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  running: boolean;
  title: string;
  status: string;
  log: string[];
  thumbs: string[];
  onCancel?: () => void;
}

export function ProgressPanel({ running, title, status, log, thumbs, onCancel }: Props) {
  const logRef = useRef<HTMLDivElement>(null);
  const [elapsed, setElapsed] = useState(0);
  const estimatedTotal = 25; // Ước tính khoảng 25s cho một quá trình render tiêu chuẩn

  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight);
  }, [log]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (running) {
      setElapsed(0);
      interval = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [running]);

  if (!running && log.length === 0) {
    return (
      <section className="flex flex-col gap-3 p-4 tech-card-glass overflow-hidden relative transition-all opacity-70">
        <div className="flex items-center justify-between border-b border-line/40 pb-2 relative z-10">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57] shadow-[0_0_5px_rgba(255,95,87,0.5)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e] shadow-[0_0_5px_rgba(254,188,46,0.5)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840] shadow-[0_0_5px_rgba(40,200,64,0.5)]" />
            <span className="text-[11px] font-mono text-zinc-500 ml-2 uppercase tracking-widest font-semibold">
              THEO DÕI TIẾN TRÌNH
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center p-8 text-center gap-2">
          <span className="text-3xl opacity-50">💤</span>
          <p className="text-base font-mono text-zinc-500 italic tracking-wide">
            Chưa có tác vụ nào đang chạy.
          </p>
        </div>
      </section>
    );
  }

  let progress = running ? Math.min(99, Math.round((elapsed / estimatedTotal) * 100)) : 0;
  if (!running && log.some((l) => l.includes("✅"))) progress = 100;
  
  const remaining = Math.max(0, estimatedTotal - elapsed);

  return (
    <section 
      className={`flex flex-col gap-3 p-4 tech-card-glass overflow-hidden relative transition-all ${running ? "ring-2 ring-hot/60 shadow-[0_0_20px_rgba(250,163,9,0.4)] animate-pulse" : ""}`}
      style={running ? { animationDuration: '3s' } : {}}
    >


      {/* Terminal window header */}
      <div className="flex items-center justify-between border-b border-line/40 pb-2 relative z-10">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57] shadow-[0_0_5px_rgba(255,95,87,0.5)]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e] shadow-[0_0_5px_rgba(254,188,46,0.5)]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840] shadow-[0_0_5px_rgba(40,200,64,0.5)]" />
          <span className="text-[11px] font-mono text-zinc-400 ml-2 uppercase tracking-widest font-semibold">
            {title ? `THEO DÕI TIẾN TRÌNH: ${title}` : "THEO DÕI TIẾN TRÌNH"}
          </span>
        </div>
        {running && (
          <div className="flex items-center gap-2">
            <span className="text-base font-mono text-cy animate-pulse uppercase tracking-wider font-bold bg-cy/10 px-2 py-0.5 rounded border border-cy/20">
              ĐANG CHẠY
            </span>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded text-base font-mono font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer px-1"
              >
                [✕] Hủy
              </button>
            )}
          </div>
        )}
      </div>

      <p className="text-base font-mono text-cy font-semibold tracking-wide relative z-10" aria-live="polite">
        {running ? "⚡ " : "✓ "} {status}
      </p>

      {/* Progress Bar & Timers */}
      {(running || progress > 0) && (
        <div className="flex flex-col gap-1.5 relative z-10 mb-1">
          <div className="flex items-center justify-between text-base font-mono text-zinc-400">
            <span>Đã chạy: {elapsed}s</span>
            <span className="text-cy font-bold text-base">{progress}%</span>
            <span>Còn lại: {running ? `${remaining}s` : "0s"}</span>
          </div>
          <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-cy to-pur transition-all duration-1000 ease-linear rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>
      )}
      
      {/* Console Logs */}
      <div
        ref={logRef}
        role="log"
        className="max-h-44 overflow-y-auto rounded-xl bg-black/20 border border-white/5 p-3 font-mono text-[11px] leading-relaxed text-white shadow-inner relative z-10"
      >
        {log.map((l, i) => {
          if (l.includes("[ERR_")) {
            return <SystemErrorUI key={i} text={l} />;
          }
          return (
            <div key={i} className="flex gap-2">
              <span className="text-zinc-400 select-none">&gt;</span>
              <span className={l.startsWith("✅") ? "text-emerald-400 font-semibold" : l.startsWith("⚠️") ? "text-amber-400" : ""}>{l}</span>
            </div>
          );
        })}
      </div>

      {thumbs.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-line/40 relative z-10">
          {thumbs.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt={`Ảnh ${i + 1}`} className="h-16 w-auto rounded-lg border border-white/10 shadow-lg" />
          ))}
        </div>
      )}
    </section>
  );
}

function SystemErrorUI({ text }: { text: string }) {
  const is429_minute = text.includes("ERR_429_MINUTE");
  const is429_daily = text.includes("ERR_429_DAILY");
  const is429 = is429_minute || is429_daily || text.includes("ERR_429");
  
  const is50X = text.includes("ERR_50X");
  const isAuth = text.includes("ERR_AUTH");
  const is400 = text.includes("ERR_400");
  
  const hasCountdown = is429_minute || is50X || (is429 && !is429_daily);
  const initialTime = is50X ? 30000 : (is429_minute || is429) ? 60000 : 0;
  
  const [msRemaining, setMsRemaining] = useState(initialTime);

  useEffect(() => {
    if (!hasCountdown) return;
    const targetTime = Date.now() + initialTime;
    const interval = setInterval(() => {
      const remaining = Math.max(0, targetTime - Date.now());
      setMsRemaining(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [hasCountdown, initialTime]);

  const sec = Math.floor(msRemaining / 1000);
  const ms = msRemaining % 1000;
  
  // Parse error context
  let title = "⚠️ LỖI HỆ THỐNG";
  let message = text.replace("⚠️ SYSTEM ERROR: ", "");
  let bgClass = "bg-red-500/10 border-red-500/30";
  let textClass = "text-red-500";
  let descClass = "text-red-400";
  
  if (is429_daily) {
    title = "🚫 HẾT LƯỢT GỌI GOOGLE AI (429)";
    message = "Đã sử dụng hết TOÀN BỘ lượt gọi API trong ngày của bản miễn phí. Cậu chờ đến ngày mai hoặc chuyển sang Quét tin Free nhé!";
    bgClass = "bg-rose-500/10 border-rose-500/30";
    textClass = "text-rose-500";
    descClass = "text-rose-400";
  } else if (is429_minute || is429) {
    title = "⏳ GOOGLE AI ĐANG QUÁ TẢI (429)";
    message = "Vì chúng ta đang xài API miễn phí nên Google đã tạm thời 'kéo phanh'. Cậu chờ hết đồng hồ rồi bấm chạy lại nhé!";
  } else if (is50X) {
    title = "🚧 MÁY CHỦ GOOGLE SẬP (50X)";
    message = "Hệ thống AI của Google đang bị nghẽn mạng toàn cầu. Cậu không làm gì sai cả! Hãy chờ một chút rồi thử gọi lại xem sao.";
    bgClass = "bg-amber-500/10 border-amber-500/30";
    textClass = "text-amber-500";
    descClass = "text-amber-400";
  } else if (isAuth) {
    title = "🗝️ TỪ CHỐI TRUY CẬP (401/403)";
    message = "API Key của cậu bị từ chối! Khả năng cao là do copy bị thiếu chữ, hoặc thẻ tín dụng/tài khoản Google liên kết đã bị huỷ. Hãy thử cập nhật Key mới.";
    bgClass = "bg-rose-500/10 border-rose-500/30";
    textClass = "text-rose-500";
    descClass = "text-rose-400";
  } else if (is400) {
    title = "🛑 NỘI DUNG BỊ TỪ CHỐI (400)";
    message = "Google đã chặn truy vấn này! Nguyên nhân có thể do chủ đề nhạy cảm, vi phạm chính sách của AI, hoặc dữ liệu tin tức đầu vào bị lỗi.";
    bgClass = "bg-yellow-500/10 border-yellow-500/30";
    textClass = "text-yellow-500";
    descClass = "text-yellow-400";
  }

  return (
    <div className={`flex flex-col gap-2 p-3 mt-1 mb-2 border rounded-xl relative overflow-hidden group ${bgClass}`}>
      <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl rounded-full pointer-events-none ${bgClass.split(' ')[0]}`} />
      
      <div className="flex flex-col gap-1.5 relative z-10">
        <span className={`font-bold uppercase tracking-wider ${textClass}`}>{title}</span>
        <span className={`text-base font-semibold leading-relaxed ${descClass}`}>{message}</span>
      </div>
      
      {hasCountdown && (
        <div className={`flex items-center justify-between bg-black/60 rounded-lg p-2.5 border relative z-10 mt-1 ${bgClass.split(' ')[1]}`}>
          <span className="text-base text-zinc-400 font-mono tracking-wide uppercase">Vui lòng đợi trước khi thử lại...</span>
          <span className={`font-mono text-xl font-black tracking-widest tabular-nums drop-shadow-md ${textClass}`}>
            {sec.toString().padStart(2, '0')}<span className="opacity-50">:</span>{ms.toString().padStart(3, '0')}
          </span>
        </div>
      )}
      
      {hasCountdown && msRemaining === 0 && (
        <span className="text-emerald-400 text-base font-bold animate-pulse text-center mt-1 relative z-10">
          ✅ Đã có thể thử lại! Cậu bấm nút lại nhé.
        </span>
      )}
    </div>
  );
}
