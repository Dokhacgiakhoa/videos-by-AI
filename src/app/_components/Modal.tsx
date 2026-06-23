"use client";

import { ReactNode, useState, useEffect } from "react";

export function Modal({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: ReactNode }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-[90%] max-w-md bg-zinc-900 border border-line rounded-2xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-line/50">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-md text-zinc-400 transition-colors">
            ✕
          </button>
        </div>
        <div className="p-5 flex flex-col gap-4">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, message: string }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-zinc-300 text-base">{message}</p>
      <div className="flex justify-end gap-3 mt-2">
        <button onClick={onClose} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors">Huỷ</button>
        <button onClick={() => { onConfirm(); onClose(); }} className="px-4 py-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-white font-bold transition-colors">Xác nhận</button>
      </div>
    </Modal>
  );
}

export function AlertModal({ isOpen, onClose, title, message }: { isOpen: boolean, onClose: () => void, title: string, message: string }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-zinc-300 text-base">{message}</p>
      <div className="flex justify-end mt-2">
        <button onClick={onClose} className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition-colors">Đóng</button>
      </div>
    </Modal>
  );
}

export function PromptModal({ isOpen, onClose, onSubmit, title, message, defaultValue = "" }: { isOpen: boolean, onClose: () => void, onSubmit: (val: string) => void, title: string, message: string, defaultValue?: string }) {
  const [val, setVal] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) setVal(defaultValue);
  }, [isOpen, defaultValue]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-zinc-300 text-base">{message}</p>
      <input 
        type="text" 
        value={val} 
        onChange={(e) => setVal(e.target.value)} 
        className="w-full bg-black/50 border border-line rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-500"
        autoFocus
        onKeyDown={(e) => {
            if (e.key === "Enter" && val.trim()) {
                onSubmit(val.trim());
                onClose();
            }
        }}
      />
      <div className="flex justify-end gap-3 mt-2">
        <button onClick={onClose} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors">Huỷ</button>
        <button onClick={() => { if (val.trim()) { onSubmit(val.trim()); onClose(); } }} className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold transition-colors">Lưu</button>
      </div>
    </Modal>
  );
}
