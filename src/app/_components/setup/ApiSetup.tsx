"use client";

import { useVideoGen } from "../../_context/VideoGenContext";
import { usePipeline } from "../../_hooks/usePipeline";
import { SegmentedControl } from "../SegmentedControl";
import { GeminiKeyField } from "../GeminiKeyField";

export function ApiSetup() {
  const {
    apiExpanded,
    setApiExpanded,
    apiOption,
    setApiOption,
    prefs,
    updatePrefs,
    tempGeminiKey,
    setTempGeminiKey,
    tempOpenaiKey,
    setTempOpenaiKey,
    running,
    hwLoading,
    hwSafe,
    hwStatus,
  } = useVideoGen();

  const { checkHardware } = usePipeline();

  return (
    <div className="flex flex-col gap-3 p-5 tech-card-glass transition-all duration-300">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setApiExpanded(!apiExpanded)}
      >
        <h3 className="text-[1.2rem] font-mono font-bold uppercase tracking-widest text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-hot" /> KẾT NỐI API
          <span className={`text-zinc-400 transition-transform duration-300 ${apiExpanded ? "rotate-90" : ""} ml-1`}>▶</span>
        </h3>
        <div className="flex items-center gap-3">
          {apiOption === "ollama" ? (
            <span className="text-base font-mono text-emerald-400 font-bold">✅ Local AI</span>
          ) : (apiOption === "gemini" && prefs.geminiKey) || (apiOption === "openai" && prefs.openaiKey) ? (
            <span className="text-base font-mono text-emerald-400 font-bold">✅ Đã kết nối</span>
          ) : (
            <span className="text-base font-mono text-amber-500 font-bold">⚠️ Chưa kết nối</span>
          )}
        </div>
      </div>

      {apiExpanded && (
        <div className="flex flex-col gap-3 animate-in slide-in-from-top-2 duration-300">
          <SegmentedControl<"local" | "cloud">
            value={apiOption === "ollama" ? "local" : "cloud"}
            onChange={(v) => {
              if (v === "local") {
                setApiOption("ollama");
                localStorage.setItem("API_OPTION", "ollama");
              } else {
                setApiOption("gemini");
                localStorage.setItem("API_OPTION", "gemini");
              }
            }}
            disabled={running}
            options={[
              { value: "local", label: "🖥️ Không API" },
              { value: "cloud", label: "⚡ Có API" },
            ]}
            accent="indigo"
          />

          {apiOption === "ollama" && (
            <div className="bg-black/20 rounded-xl p-3 border border-line/60 animate-in slide-in-from-top-2 duration-300 flex flex-col gap-3">
              <p className="text-base text-zinc-400 italic leading-relaxed">
                * Mặc định sử dụng AI Local (Ollama) bảo mật nhưng sẽ **ngốn rất nhiều CPU/GPU** của máy. Hãy chuyển sang "Có API" nếu máy yếu.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={checkHardware}
                  disabled={hwLoading}
                  className={`px-3 py-1.5 self-start rounded-lg tech-btn-glass text-[11px] font-mono transition-colors flex items-center gap-1.5 ${
                    hwLoading ? "text-zinc-400" :
                    hwSafe === true ? "text-emerald-400 hover:text-emerald-300" : 
                    "text-amber-400 hover:text-amber-300"
                  }`}
                >
                  {hwLoading ? (
                    <>
                      <span className="animate-spin text-base">⏳</span> Đang test...
                    </>
                  ) : hwSafe === true ? (
                    <>
                      <span>✅</span> Cấu hình đạt chuẩn
                    </>
                  ) : (
                    <>
                      <span>⚠️</span> Test phần cứng
                    </>
                  )}
                </button>
                {hwStatus && (
                  <p className={`text-[11px] font-mono whitespace-pre-wrap leading-relaxed border-l-2 pl-2 ${
                    hwSafe === true ? "text-emerald-400/80 border-emerald-500/50" : "text-amber-400/80 border-amber-500/50"
                  }`}>
                    {hwStatus}
                  </p>
                )}
              </div>
            </div>
          )}

          {apiOption !== "ollama" && (
            <div className="flex flex-col gap-2 animate-in slide-in-from-top-2 duration-300">
              <SegmentedControl<"gemini" | "openai">
                value={apiOption as "gemini" | "openai"}
                onChange={(v) => {
                  setApiOption(v);
                  localStorage.setItem("API_OPTION", v);
                }}
                disabled={running}
                options={[
                  { value: "gemini", label: "Gemini (Miễn phí)" },
                  { value: "openai", label: "OpenAI (Trả phí)" },
                ]}
                accent="orange"
              />
              <div className="bg-black/20 rounded-xl p-3 border border-line/60">
                {apiOption === "gemini" ? (
                  <GeminiKeyField
                    provider="gemini"
                    value={prefs.geminiKey}
                    onChange={(k) => updatePrefs({ geminiKey: k })}
                  />
                ) : (
                  <GeminiKeyField
                    provider="openai"
                    value={prefs.openaiKey}
                    onChange={(k) => updatePrefs({ openaiKey: k })}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
