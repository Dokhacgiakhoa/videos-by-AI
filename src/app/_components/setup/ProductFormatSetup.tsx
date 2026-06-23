"use client";

import { useVideoGen, ProductType, Aspect, PostRatio, Duration, Rate } from "../../_context/VideoGenContext";
import { SegmentedControl } from "../SegmentedControl";
import { SwitchCard } from "../SwitchCard";

export function ProductFormatSetup() {
  const {
    step3Locked,
    prefs,
    updatePrefs,
    running,
    isVideo,
    music,
    setMusic,
    musicAvailable,
  } = useVideoGen();

  return (
    <div className={`flex flex-col gap-4 p-5 tech-card-glass transition-all duration-300 ${
      step3Locked ? "opacity-35 pointer-events-none" : ""
    }`}>
      <div className="flex items-center justify-between">
        <h3 className="text-[1.2rem] font-mono font-bold uppercase tracking-widest text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-hot" /> ĐỊNH DẠNG SẢN PHẨM
        </h3>
        {step3Locked && (
          <span className="text-base font-mono text-zinc-400">🔒 Khóa</span>
        )}
      </div>
      
      <SegmentedControl<ProductType>
        label="Loại sản phẩm"
        value={prefs.type}
        onChange={(v) => updatePrefs({ type: v })}
        disabled={running}
        options={[
          { value: "video", label: "🎬 Video", hint: "Motion card & voice" },
          { value: "imagepost", label: "🖼️ Ảnh post", hint: "Bộ ảnh bài viết" },
        ]}
        accent="orange"
      />

      {isVideo ? (
        <SegmentedControl<Aspect>
          label="Tỉ lệ khung hình"
          value={prefs.aspect}
          onChange={(v) => updatePrefs({ aspect: v })}
          disabled={running}
          accent="orange"
          options={[
            { value: "9:16", label: "9:16 (Dọc)", hint: "Shorts/Reels" },
            { value: "1:1", label: "1:1 (Vuông)", hint: "Post mạng xã hội" },
            { value: "16:9", label: "16:9 (Ngang)", hint: "YouTube/Web" },
          ]}
        />
      ) : (
        <>
          <SegmentedControl<PostRatio>
            label="Tỉ lệ mặc định"
            value={prefs.postRatio}
            onChange={(v) => updatePrefs({ postRatio: v })}
            disabled={running}
            accent="orange"
            options={[
              { value: "4:5", label: "4:5", hint: "IG/FB feed" },
              { value: "1:1", label: "1:1", hint: "Vuông" },
              { value: "9:16", label: "9:16", hint: "TikTok/Story" },
              { value: "2:1", label: "2:1", hint: "Bìa ngang" },
              { value: "16:9", label: "16:9", hint: "Ngang" },
            ]}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-base font-mono uppercase tracking-wider text-zinc-400">
              Số lượng ảnh: <span className="text-hot font-bold">{prefs.count}</span>
            </label>
            <input
              type="range"
              min={2}
              max={10}
              step={1}
              value={prefs.count}
              disabled={running}
              onChange={(e) => updatePrefs({ count: Number(e.target.value) })}
              className="w-full accent-amber-500 disabled:opacity-60 cursor-pointer"
            />
            <SwitchCard
              checked={prefs.useCoverImage}
              onChange={(val) => updatePrefs({ useCoverImage: val })}
              disabled={running}
              iconOn="🌟"
              iconOff="📰"
              title="Tạo ảnh bìa tự động"
              description="Ảnh đầu tiên mang tiêu đề tổng hợp"
              color="amber"
              className="mt-4"
            />
          </div>
        </>
      )}

      {isVideo && (
        <SegmentedControl<Duration>
          label="Thời lượng"
          value={prefs.duration}
          onChange={(v) => updatePrefs({ duration: v })}
          disabled={running}
          accent="orange"
          options={[
            { value: "short", label: "Ngắn", hint: "90 giây" },
            { value: "long", label: "Dài", hint: "3 phút" },
          ]}
        />
      )}

      {isVideo && (
        <div className="flex flex-col gap-3">
          <SegmentedControl
            label="Giọng đọc"
            value={prefs.voice}
            onChange={(v) => updatePrefs({ voice: v })}
            disabled={running}
            accent="orange"
            options={[
              { value: "en-US-GuyNeural", label: "Nam" },
              { value: "en-US-JennyNeural", label: "Nữ" },
            ]}
          />
          <SegmentedControl<Rate>
            label="Tốc độ"
            value={prefs.rate}
            onChange={(v) => updatePrefs({ rate: v })}
            disabled={running}
            accent="orange"
            options={[
              { value: "slow", label: "Chậm" },
              { value: "normal", label: "Vừa" },
              { value: "fast", label: "Nhanh" },
            ]}
          />
          <SwitchCard
            checked={music}
            onChange={(val) => setMusic(val)}
            disabled={running || !musicAvailable}
            iconOn="🎵"
            iconOff="🔇"
            title="Nhạc nền thoại"
            description={
              musicAvailable ? (
                <span className="text-zinc-400">(có sẵn)</span>
              ) : (
                <span className="text-amber-500">(chưa có file)</span>
              )
            }
            color="emerald"
          />
        </div>
      )}
    </div>
  );
}
