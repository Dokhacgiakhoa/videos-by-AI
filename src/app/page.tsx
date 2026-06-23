"use client";

import { SetupProcess } from "./_components/setup/SetupProcess";
import { WorkspaceArea } from "./_components/workspace/WorkspaceArea";
import { HistoryPanel } from "./_components/workspace/HistoryPanel";
import { useVideoGen } from "./_context/VideoGenContext";
import { usePipeline } from "./_hooks/usePipeline";
import { VideoGenProvider } from "./_context/VideoGenContext";

function MainContent() {
  const {
    apiOption,
    prefs,
    showAutoConfirm,
    setShowAutoConfirm,
    setPreview,
  } = useVideoGen();

  return (
    <div 
      className="min-h-screen w-full text-[#e2e8f0] relative font-sans"
      style={{
        backgroundImage: "url('/bg-studio-dark.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      }}
    >
      <div className="absolute inset-0 pointer-events-none bg-black/80" style={{ zIndex: 0 }} />
      
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div 
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      <main className="mx-auto flex w-[90%] max-w-[95vw] flex-col gap-6 py-8 relative" style={{ zIndex: 1 }}>
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line/60 pb-5">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ai91-logo-hi.png" alt="AI91 Logo" className="h-10 w-auto object-contain" />
              <div className="flex flex-col justify-center mt-1">
                <h1 className="text-2xl md:text-3xl font-display font-extrabold tracking-tight flex items-center">
                  <span className="text-white">MEDI</span>
                  <span className="text-hot">MATION</span>
                </h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="h-[2px] w-8 bg-gradient-to-r from-hot to-transparent rounded-full opacity-80"></div>
                  <span className="text-[11px] font-mono text-zinc-400 font-medium tracking-widest uppercase">AI làm Con Sen</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-1.5 bg-black/40 border border-line px-3 py-1.5 rounded-full text-base font-mono text-zinc-400">
              <span className={`w-1.5 h-1.5 rounded-full ${apiOption === "gemini" ? (prefs.geminiKey ? "bg-emerald-500" : "bg-amber-500") : apiOption === "openai" ? (prefs.openaiKey ? "bg-emerald-500" : "bg-amber-500") : "bg-purple-400"}`} />
              <span>{apiOption === "gemini" ? "Chế độ API (Gemini)" : apiOption === "openai" ? "Chế độ API (OpenAI)" : "Không API (Local AI)"}</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative">
          <SetupProcess />
          <WorkspaceArea />
          <HistoryPanel />
        </div>

        {showAutoConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-zinc-950 border border-cyan-500/30 rounded-2xl p-6 max-w-md w-full shadow-[0_0_40px_rgba(6,182,212,0.1)] flex flex-col gap-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 text-cyan-400">
                <span className="text-2xl">⚡</span>
                <h3 className="text-lg font-mono font-bold uppercase tracking-wider">Chế độ tự động</h3>
              </div>
              <p className="text-base text-zinc-300 leading-relaxed">
                Chế độ tự động toàn bộ sẽ bỏ qua bước xem trước kịch bản. Hệ thống sẽ tự động tìm kiếm tin, soạn nội dung, lấy ảnh AI và kết xuất sản phẩm cuối cùng. Quá trình này có thể tốn thời gian và tài nguyên hơn.
              </p>
              <p className="text-base text-zinc-400 font-bold">
                Bạn có chắc chắn muốn bật không?
              </p>
              <div className="flex items-center gap-3 mt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAutoConfirm(false)}
                  className="px-4 py-2 rounded-xl text-base font-semibold text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreview(false);
                    setShowAutoConfirm(false);
                  }}
                  className="px-4 py-2 rounded-xl text-base font-bold text-black bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
                >
                  Bật ngay
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default function Home() {
  return (
    <VideoGenProvider>
      <MainContent />
    </VideoGenProvider>
  );
}
