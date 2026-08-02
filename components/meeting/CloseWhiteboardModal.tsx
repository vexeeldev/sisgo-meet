'use client';

import { Sparkles, X, Users, EyeOff } from 'lucide-react';

interface CloseWhiteboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCloseAll: () => void;
  onConfirmMinimize: () => void;
}

export default function CloseWhiteboardModal({
  isOpen,
  onClose,
  onConfirmCloseAll,
  onConfirmMinimize,
}: CloseWhiteboardModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-[#202124] border border-[#3c4043] rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-base font-semibold text-white">Tutup Papan Tulis</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-gray-300 leading-relaxed">
          Sebagai Host, bagaimana Anda ingin menutup papan tulis rapat ini?
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              onConfirmMinimize();
              onClose();
            }}
            className="flex items-center gap-3 p-3.5 rounded-xl bg-[#2d2e31] hover:bg-[#3c4043] border border-[#3c4043] text-left transition-all group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-white/5 group-hover:bg-white/10 flex items-center justify-center shrink-0 text-gray-300">
              <EyeOff className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">Sembunyikan dari Tampilan Saya</span>
              <span className="text-xs text-gray-400 mt-0.5">
                Whiteboard akan diminimize ke sidebar. Peserta lain tetap dapat melihat papan tulis.
              </span>
            </div>
          </button>

          <button
            onClick={() => {
              onConfirmCloseAll();
              onClose();
            }}
            className="flex items-center gap-3 p-3.5 rounded-xl bg-[#2d2e31] hover:bg-[#3c4043] border border-[#3c4043] text-left transition-all group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 flex items-center justify-center shrink-0 text-red-400">
              <Users className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">Tutup untuk Semua Orang</span>
              <span className="text-xs text-gray-400 mt-0.5">
                Menghentikan dan menutup papan tulis rapat untuk seluruh peserta.
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
