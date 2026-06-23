"use client";

import { useVideoGen } from "../../_context/VideoGenContext";
import { usePipeline } from "../../_hooks/usePipeline";
import { ScriptEditor } from "../ScriptEditor";
import { LayoutStudio } from "../LayoutStudio";
import { VideoResult } from "../VideoResult";
import { ImageGallery } from "../ImageGallery";
import { LibraryPanel } from "../LibraryPanel";
import { AutomationPanel } from "./AutomationPanel";
import { useState } from "react";

export function WorkspaceArea() {
  const {
    isVideo,
    showEditor,
    setShowEditor,
    showLayoutStudio,
    setShowLayoutStudio,
    draftCard,
    setDraftCard,
    draftImage,
    setDraftImage,
    images,
    running,
    prefs,
    videoUrl,
    brand,
  } = useVideoGen();

  const { fetchImages, fetchSingleImage, generate } = usePipeline();
  
  const [workspaceTab, setWorkspaceTab] = useState<"workspace" | "automation" | "library">("workspace");

  // Hardcode for mockup since config isn't needed here for UI
  const totalMockupDuration = 300;

  return (
    <div id="workspace-canvas" className="lg:col-span-5 xl:col-span-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setWorkspaceTab("workspace")}
            className={`text-2xl font-mono font-bold uppercase tracking-widest flex items-center gap-2 px-1 transition-colors ${workspaceTab === "workspace" ? "text-white" : "text-[#69748a] hover:text-zinc-400"}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full transition-colors ${workspaceTab === "workspace" ? "bg-hot" : "bg-zinc-600"}`} /> KHÔNG GIAN LÀM VIỆC
          </button>
          <button 
            onClick={() => setWorkspaceTab("automation")}
            className={`text-2xl font-mono font-bold uppercase tracking-widest flex items-center gap-2 px-1 transition-colors ${workspaceTab === "automation" ? "text-white" : "text-[#69748a] hover:text-zinc-400"}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full transition-colors ${workspaceTab === "automation" ? "bg-cyan-500" : "bg-zinc-600"}`} /> TỰ ĐỘNG HÓA
          </button>
          <button 
            onClick={() => setWorkspaceTab("library")}
            className={`text-2xl font-mono font-bold uppercase tracking-widest flex items-center gap-2 px-1 transition-colors ${workspaceTab === "library" ? "text-white" : "text-[#69748a] hover:text-zinc-400"}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full transition-colors ${workspaceTab === "library" ? "bg-hot" : "bg-zinc-600"}`} /> THƯ VIỆN MEDIA
          </button>
        </div>
      </div>

      {workspaceTab === "workspace" && (
        <>

          {/* Video: trạng thái chờ */}
          {isVideo && !showEditor && !showLayoutStudio && !videoUrl && (
            <section className="flex flex-col items-center justify-center gap-3 border border-dashed border-line bg-black/20 p-10 text-center rounded-3xl min-h-[280px]">
              <span className="text-3xl">{running ? "⏳" : "🎬"}</span>
              <p className="text-base font-semibold text-white">
                {running ? "Đang xử lý dữ liệu..." : "Không gian làm việc Video"}
              </p>
              <p className="max-w-sm text-base text-zinc-400 leading-relaxed mt-2">
                {running
                  ? "AI đang tiến hành tạo kịch bản dựa trên ý tưởng của bạn. Kết quả sẽ sớm được hiển thị tại đây."
                  : 'Khu vực này sẽ hiển thị bảng điều khiển và nội dung sau khi bạn hoàn tất thiết lập ở cột bên trái và bấm nút bắt đầu.'}
              </p>
            </section>
          )}

          {/* Ảnh post: trạng thái chờ */}
          {!isVideo && !showEditor && !showLayoutStudio && images.length === 0 && (
            <section className="flex flex-col items-center justify-center gap-3 border border-dashed border-line bg-black/20 p-10 text-center rounded-3xl min-h-[280px]">
              <span className="text-3xl">{running ? "⏳" : "🖼️"}</span>
              <p className="text-base font-semibold text-white">
                {running ? "Đang soạn nội dung bộ ảnh..." : "Bộ ảnh bài viết"}
              </p>
              <p className="max-w-xs text-base text-zinc-400 leading-relaxed">
                {running
                  ? "AI đang tạo tiêu đề + tóm tắt cho từng slide. Xong sẽ hiện ra để bạn duyệt trước khi lấy ảnh."
                  : 'Nhập chủ đề, chọn số lượng & tỉ lệ rồi bấm "Soạn nội dung" để bắt đầu.'}
              </p>
            </section>
          )}

          {/* Script Editor */}
          {showEditor && !showLayoutStudio && (draftCard || draftImage) && (
            <ScriptEditor
              type={prefs.type}
              cardScript={draftCard ?? undefined}
              imagePostScript={draftImage ?? undefined}
              onChangeCard={setDraftCard}
              onChangeImage={setDraftImage}
              onCancel={() => setShowEditor(false)}
              running={running}
              onFetchImages={prefs.type === "imagepost" ? fetchImages : undefined}
              onFetchSingleImage={prefs.type === "imagepost" ? fetchSingleImage : undefined}
              onNextLayout={prefs.type === "video" && draftCard ? () => {
                setShowEditor(false);
                setShowLayoutStudio(true);
              } : undefined}
              onRender={() =>
                generate(
                  prefs.type === "video"
                    ? { cardScript: draftCard ?? undefined }
                    : { imagePostScript: draftImage ?? undefined },
                )
              }
            />
          )}

          {/* Layout Studio */}
          {showLayoutStudio && draftCard && (
            <LayoutStudio
              cardScript={draftCard}
              onChange={setDraftCard}
              geminiKey={prefs.geminiKey}
              brand={brand}
              running={running}
              onBack={() => {
                setShowLayoutStudio(false);
                setShowEditor(true);
              }}
              onRender={() => {
                setShowLayoutStudio(false);
                generate({ cardScript: draftCard ?? undefined });
              }}
            />
          )}

          {/* Final Rendered Outputs */}
          {videoUrl && <VideoResult videoUrl={videoUrl} aspect={prefs.aspect} />}
          {!isVideo && <ImageGallery images={images} />}
        </>
      )}

      {workspaceTab === "automation" && (
        <div className="animate-in fade-in duration-300 h-full">
          <AutomationPanel />
        </div>
      )}

      {workspaceTab === "library" && (
        <div className="animate-in slide-in-from-left-2 duration-300">
          <LibraryPanel />
        </div>
      )}
    </div>
  );
}
