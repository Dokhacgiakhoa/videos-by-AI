"use client";

import { useVideoGen, LogoPosition } from "../../_context/VideoGenContext";
import { BrandUploader } from "../BrandUploader";
import { SwitchCard } from "../SwitchCard";

export function BrandSetup() {
  const {
    step4Locked,
    brandExpanded,
    setBrandExpanded,
    brand,
    setBrand,
    prefs,
    updatePrefs,
    running,
  } = useVideoGen();

  return (
    <div className={`flex flex-col gap-3 p-5 tech-card-glass transition-all duration-300 ${
      step4Locked ? "opacity-35 pointer-events-none" : ""
    }`}>
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setBrandExpanded(!brandExpanded)}
      >
        <h3 className="text-[1.2rem] font-mono font-bold uppercase tracking-widest text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-hot" /> MÀU THƯƠNG HIỆU
          <span className={`text-zinc-400 transition-transform duration-300 ${brandExpanded ? "rotate-90" : ""} ml-1`}>▶</span>
        </h3>
        <div className="flex items-center gap-3">
          {step4Locked ? (
            <span className="text-base font-mono text-zinc-400">🔒 Khóa</span>
          ) : brand ? (
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-sm border border-black/20 shadow-[0_0_0_1px_rgba(255,255,255,0.1)]" style={{ background: brand.palette.primary }} />
              <span className="text-base font-mono text-emerald-400 font-bold uppercase">{brand.palette.primary}</span>
            </div>
          ) : (
            <span className="text-base font-mono font-bold text-red-500 animate-pulse drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">Chưa thiết lập</span>
          )}
        </div>
      </div>
      {brandExpanded && (
        <div className="animate-in slide-in-from-top-2 duration-300 flex flex-col gap-3">
          <BrandUploader onChange={setBrand} />
          
          {brand && brand.logoUrl && (
            <div className="flex flex-col gap-2 bg-black/20 rounded-xl border border-line p-2.5 mt-1">
              <SwitchCard
                checked={prefs.insertLogo}
                onChange={(c) => updatePrefs({ insertLogo: c })}
                disabled={running}
                iconOn="✨"
                iconOff="❌"
                title="Chèn logo vào sản phẩm"
                description={prefs.insertLogo ? "Hiển thị logo trên khung hình" : "Không chèn logo"}
                color="amber"
              />

              {prefs.insertLogo && (
                <div className="flex flex-col gap-2 mt-2 px-1 pb-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  <span className="text-base font-mono text-zinc-400 uppercase tracking-wider">Vị trí chèn logo:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "top-left", label: "↖ Trái trên" },
                      { id: "top-center", label: "⬆ Giữa trên" },
                      { id: "top-right", label: "↗ Phải trên" },
                      { id: "bottom-left", label: "↙ Trái dưới" },
                      { id: "bottom-center", label: "⬇ Giữa dưới" },
                      { id: "bottom-right", label: "↘ Phải dưới" }
                    ].map((pos) => {
                      const isSelected = prefs.logoPosition === pos.id;
                      return (
                        <button
                          key={pos.id}
                          onClick={() => updatePrefs({ logoPosition: pos.id as LogoPosition })}
                          disabled={running}
                          className={`flex items-center justify-center py-2.5 px-2 text-base font-mono rounded-lg border transition-all ${
                            isSelected 
                              ? "bg-amber-500/10 border-amber-500/50 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.15)]" 
                              : "bg-black/40 border-line text-zinc-400 hover:border-amber-500/30 hover:text-amber-500/70"
                          }`}
                        >
                          {pos.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
