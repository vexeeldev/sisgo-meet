'use client';

import { Pencil } from 'lucide-react';

interface ScreenAnnotationPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ScreenAnnotationPromptModal({
  isOpen,
  onClose,
  onConfirm,
}: ScreenAnnotationPromptModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#202124] border border-[#3c4043] rounded-2xl p-6 max-w-md w-full shadow-2xl text-white space-y-4 m-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
            <Pencil className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Anotasi Layar</h3>
            <p className="text-xs text-gray-400">Anotasi layar memerlukan Berbagi Layar (Share Screen).</p>
          </div>
        </div>
        <p className="text-sm text-gray-300">
          Apakah Anda ingin mulai <strong>Berbagi Layar (Share Screen)</strong> sekarang untuk menggunakan Anotasi Layar?
        </p>
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-[#3c4043] rounded-xl transition cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition shadow-md shadow-blue-600/30 cursor-pointer"
          >
            Mulai Share Screen
          </button>
        </div>
      </div>
    </div>
  );
}
