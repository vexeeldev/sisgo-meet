'use client';

import dynamic from 'next/dynamic';
import { X, Sparkles } from 'lucide-react';

const TldrawCanvas = dynamic(() => import('./TldrawCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#1e1f22] text-white">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
      <span className="text-sm font-medium text-gray-300">Memuat Papan Tulis (TLDraw)...</span>
    </div>
  ),
});

interface WhiteboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  isHost: boolean;
  initialSnapshot?: any;
  onSnapshotChange?: (snapshot: any) => void;
}

export default function WhiteboardModal({
  isOpen,
  onClose,
  isHost,
  initialSnapshot,
  onSnapshotChange,
}: WhiteboardModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-250 p-2 sm:p-6">
      {/* FIX: h-[90vh] -> h-full, biar modal ngisi penuh area yang disediakan wrapper (padding luar yang ngasih jarak ke tepi layar), gak nyisa gap yang nampilin backdrop sebagai garis hitam */}
      <div className="bg-[#1e1f22] rounded-3xl w-full h-full max-w-6xl flex flex-col overflow-hidden shadow-2xl border border-[#3c4043]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#2b2c30] border-b border-[#3c4043] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white text-base font-semibold flex items-center gap-2">
                Papan Tulis Rapat (Whiteboard)
                {isHost ? (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium">Host Control</span>
                ) : (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live View
                  </span>
                )}
              </h3>
              <p className="text-gray-400 text-xs mt-0.5">
                {isHost ? 'Semua peserta rapat melihat papan tulis ini secara realtime.' : 'Menampilkan papan tulis yang digambar oleh Host secara langsung.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#3c4043] hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
            title="Tutup Whiteboard"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Body */}
        {/* FIX: hapus h-full yang tabrakan sama flex-1, cukup flex-1 aja biar ngisi sisa ruang setelah header */}
        <div className="flex-1 w-full relative overflow-hidden bg-white min-h-0">
          <TldrawCanvas
            isHost={isHost}
            initialSnapshot={initialSnapshot}
            onSnapshotChange={onSnapshotChange}
          />
        </div>
      </div>
    </div>
  );
}