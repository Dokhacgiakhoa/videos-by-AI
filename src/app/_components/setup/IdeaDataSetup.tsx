"use client";

import { useVideoGen } from "../../_context/VideoGenContext";
import { SegmentedControl } from "../SegmentedControl";
import { NewsTimeFrame } from "../../_context/VideoGenContext";

export function IdeaDataSetup() {
  const {
    step2Locked,
    step2Incomplete,
    newsSourceType,
    setNewsSourceType,
    newsQuery,
    setNewsQuery,
    newsQueryFocused,
    setNewsQueryFocused,
    topic,
    setTopic,
    topicFocused,
    setTopicFocused,
    manualUrlsText,
    setManualUrlsText,
    manualUrlsFocused,
    setManualUrlsFocused,
    prefs,
    updatePrefs,
    running,
  } = useVideoGen();

  return (
    <div className={`flex flex-col gap-4 p-5 tech-card-glass transition-all duration-300 ${
      step2Locked ? "opacity-35 pointer-events-none" : ""
    }`}>
      <div className="flex items-center justify-between">
        <h3 className="text-[1.2rem] font-mono font-bold uppercase tracking-widest text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-hot" /> Ý TƯỞNG & DỮ LIỆU
        </h3>
        {step2Locked ? (
          <span className="text-base font-mono text-zinc-400">🔒 Khóa</span>
        ) : !step2Incomplete ? (
          <span className="text-base font-mono text-emerald-400 font-bold">✅ Đã nhập</span>
        ) : (
          <span className="text-base font-mono font-bold text-red-500 animate-pulse drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]">⚠️ Thiếu dữ liệu</span>
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-line bg-black/20 p-2.5">
        <SegmentedControl<"auto" | "none" | "manual">
          label="Cách thức tạo nội dung"
          value={newsSourceType}
          onChange={(v) => {
            setNewsSourceType(v);
            localStorage.setItem("NEWS_SOURCE_TYPE", v);
          }}
          disabled={running}
          options={[
            { value: "auto", label: "🌐 Chủ đề" },
            { value: "none", label: "📝 Kịch bản" },
            { value: "manual", label: "🔗 Nguồn" },
          ]}
          accent="orange"
        />

        {newsSourceType === "auto" && (
          <div className="flex flex-col gap-3 mt-1.5 border-t border-line/40 pt-3 px-1 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1 relative">
              <div className="flex justify-between items-end">
                <label className="text-base font-mono font-bold uppercase tracking-wider text-zinc-400">Từ khóa chủ đề (VD: trí tuệ nhân tạo)</label>
                <span className={`text-base font-mono ${newsQuery.length >= 50 ? 'text-red-400' : 'text-zinc-400'}`}>{newsQuery.length}/50</span>
              </div>
              <input
                maxLength={50}
                type="text"
                value={newsQuery}
                onChange={(e) => {
                  setNewsQuery(e.target.value);
                  localStorage.setItem("NEWS_QUERY", e.target.value);
                }}
                onFocus={() => setNewsQueryFocused(true)}
                onBlur={() => setNewsQueryFocused(false)}
                disabled={running}
                className={`w-full px-3 py-2 text-base bg-black/40 border border-line rounded-lg text-white font-sans outline-none focus:border-orange-500/50 transition-colors shadow-inner ${
                  step2Incomplete ? "border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse" : ""
                }`}
                placeholder={newsQueryFocused ? "" : "Nhập từ khóa ngắn để AI tìm kiếm tin..."}
              />
            </div>
            
            <div className="flex flex-col gap-2 mt-1">
              <SegmentedControl<NewsTimeFrame>
                label="Phạm vi thời gian quét tin online"
                value={prefs.newsTimeFrame}
                onChange={(v) => updatePrefs({ newsTimeFrame: v })}
                disabled={running}
                options={[
                  { value: "24h", label: "24 Giờ" },
                  { value: "7d", label: "7 Ngày" },
                  { value: "1m", label: "1 Tháng" },
                  { value: "3m", label: "1 Quý" },
                  { value: "1y", label: "1 Năm" },
                  { value: "custom", label: "Tuỳ chọn" },
                ]}
                accent="orange"
              />
              {prefs.newsTimeFrame === "custom" && (
                <div className="flex items-center gap-3 px-1 mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  <span className="text-base font-mono text-zinc-400 uppercase tracking-wide">Nhập số ngày quét:</span>
                  <input
                    type="number"
                    min={1}
                    max={3650}
                    value={prefs.newsCustomDays}
                    onChange={(e) => updatePrefs({ newsCustomDays: parseInt(e.target.value) || 1 })}
                    disabled={running}
                    className="w-24 px-3 py-1.5 text-base bg-black/40 border border-line rounded-lg text-amber-400 font-mono outline-none focus:border-amber-500/50 transition-colors shadow-inner"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {newsSourceType === "none" && (
          <div className="flex flex-col gap-1.5 mt-2 border-t border-line/40 pt-3 px-1 relative animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex justify-between items-end">
              <label className="text-base font-mono uppercase tracking-wider text-zinc-400">Kịch bản / Ý tưởng chi tiết</label>
              <span className={`text-base font-mono ${topic.length >= 1000 ? 'text-red-400' : 'text-zinc-400'}`}>{topic.length}/1000</span>
            </div>
            <textarea
              maxLength={1000}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onFocus={() => setTopicFocused(true)}
              onBlur={() => setTopicFocused(false)}
              disabled={running}
              rows={6}
              className={`w-full resize-y p-3 text-base outline-none disabled:opacity-60 transition-colors placeholder:text-zinc-400 font-sans text-white tech-input-glass ${
                step2Incomplete ? "border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse" : ""
              }`}
              placeholder={topicFocused ? "" : "Nhập kịch bản thô hoặc ý tưởng chi tiết để AI biên tập thành video..."}
            />
          </div>
        )}

        {newsSourceType === "manual" && (
          <div className="flex flex-col gap-2 mt-2 border-t border-line/40 pt-3 px-1 relative animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex justify-between items-end">
              <label className="text-base font-mono uppercase tracking-wider text-zinc-400">Đường dẫn (Link) hoặc Văn bản</label>
              <span className={`text-base font-mono ${manualUrlsText.length >= 15000 ? 'text-red-400' : 'text-zinc-400'}`}>{manualUrlsText.length}/15000</span>
            </div>
            <textarea
              maxLength={15000}
              value={manualUrlsText}
              onChange={(e) => setManualUrlsText(e.target.value)}
              onFocus={() => setManualUrlsFocused(true)}
              onBlur={() => setManualUrlsFocused(false)}
              disabled={running}
              rows={6}
              placeholder={
                manualUrlsFocused
                  ? ""
                  : "https://vnexpress.net/tin-tuc-vi-du-1\nHoặc dán toàn bộ tài liệu vào đây để AI tóm tắt..."
              }
              className={`w-full p-3 text-base outline-none disabled:opacity-60 transition-colors font-sans text-white placeholder:text-zinc-400 resize-y tech-input-glass ${
                step2Incomplete ? "border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse" : ""
              }`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
