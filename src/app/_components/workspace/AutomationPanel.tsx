"use client";

import { useEffect, useState } from "react";
import { useVideoGen } from "../../_context/VideoGenContext";
import { SwitchCard } from "../SwitchCard";
import { ConfirmModal } from "../Modal";

const formatDateTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const hh = d.getHours();
  const ampm = hh >= 12 ? 'PM' : 'AM';
  const h = hh % 12 || 12;
  const mm = d.getMinutes().toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${h.toString().padStart(2, '0')}:${mm} ${ampm} ${day}/${month}/${year}`;
};

export function AutomationPanel() {
  const { preview, setPreview, setShowAutoConfirm, running, updatePrefs, setTopic, setWorkspaceTab } = useVideoGen();
  const [templates, setTemplates] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/automation");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleRun = (t: any) => {
    updatePrefs({ type: t.type, aspect: t.aspectRatio });
    setTopic(t.scriptStructure?.title || t.name);
    setWorkspaceTab("workspace");
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/automation?id=${deleteId}`, { method: "DELETE" });
      if (res.ok) fetchTemplates();
    } catch (e) {
      console.error(e);
    }
    setDeleteId(null);
  };

  return (
    <section className="flex flex-col gap-6 p-6 tech-card-glass shadow-xl relative overflow-hidden h-full">
      <ConfirmModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={confirmDelete} 
        title="Xác nhận xoá" 
        message="Bạn có chắc chắn muốn xoá mẫu này không?" 
      />
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 to-transparent" />
      
      <div className="flex flex-col gap-2 border-b border-line/60 pb-4">
        <h3 className="text-2xl font-mono font-bold text-white flex items-center gap-2 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> TỰ ĐỘNG HÓA
        </h3>
        <p className="text-base text-zinc-400">
          Cấu hình các tác vụ tự động để tăng tốc quy trình sản xuất nội dung của bạn.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="p-4 bg-black/40 border border-line rounded-xl flex gap-4">
          <div className="mt-1 flex-shrink-0 text-cyan-400 text-xl">
            💡
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="text-base font-bold text-white">Chế độ tự động toàn bộ</h4>
            <p className="text-base text-zinc-400 leading-relaxed">
              Khi kích hoạt, hệ thống sẽ tự động tạo kịch bản, tìm kiếm hình ảnh, lồng tiếng và kết xuất video mà không cần bạn phê duyệt ở từng bước. Phù hợp khi bạn sản xuất số lượng lớn và muốn tiết kiệm thời gian.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 bg-black/20 rounded-xl border border-line p-3">
          <SwitchCard
            checked={!preview}
            onChange={(val) => {
              if (val) {
                setShowAutoConfirm(true);
              } else {
                setPreview(true);
              }
            }}
            disabled={running}
            iconOn="⚡"
            iconOff="⚙️"
            title="Tự động toàn bộ (Auto-Pilot)"
            description={!preview ? "Hệ thống sẽ chạy một mạch đến khi ra kết quả cuối cùng" : "Bạn sẽ được xem và chỉnh sửa kịch bản/hình ảnh trước khi tạo video"}
            color="cyan"
          />
        </div>

        {/* Templates List */}
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-line/50 pb-2">
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <span>📋</span> Mẫu tự động của bạn ({templates.length})
            </h4>
            <button 
              onClick={fetchTemplates}
              className="p-1 hover:bg-white/10 rounded-md transition-colors text-zinc-400 hover:text-white"
              title="Làm mới danh sách"
            >
              🔄
            </button>
          </div>
          
          {templates.length === 0 ? (
            <div className="p-8 rounded-xl border border-dashed border-line/50 bg-black/20 flex flex-col items-center justify-center gap-2">
              <span className="text-3xl opacity-50">📑</span>
              <p className="text-zinc-400 font-mono text-base">Chưa có mẫu nào.</p>
              <p className="text-zinc-500 text-sm max-w-sm text-center mt-1">
                Để tạo mẫu, hãy chuyển sang tab Thư viện Media, chọn một sản phẩm đã hoàn thành và bấm "Lưu mẫu tự động".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((t) => (
                <div key={t.id} className="p-4 rounded-xl border border-line bg-black/40 flex flex-col gap-3 group hover:bg-black/60 transition-colors">
                  <div className="flex items-start justify-between">
                    <h5 className="font-bold text-white text-base truncate pr-2" title={t.name}>{t.name}</h5>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="bg-white/10 px-1.5 py-0.5 rounded text-zinc-300">{t.type === "video" ? "Video" : "Ảnh"}</span>
                      <span className="bg-white/10 px-1.5 py-0.5 rounded text-zinc-300">{t.aspectRatio}</span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-zinc-400 line-clamp-2">
                    {t.scriptStructure?.title || "Không có tiêu đề kịch bản"}
                  </div>
                  
                  <div className="mt-1 pt-3 border-t border-line/50 flex items-center justify-between">
                    <span className="text-xs text-zinc-500 font-mono">
                      {formatDateTime(t.createdAt)}
                    </span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setDeleteId(t.id)}
                        className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-md transition-colors"
                        title="Xóa mẫu"
                      >
                        🗑️
                      </button>
                      <button 
                        onClick={() => handleRun(t)}
                        className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 rounded-md font-bold text-sm tracking-wide transition-colors"
                      >
                        ▶️ CHẠY MẪU
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
