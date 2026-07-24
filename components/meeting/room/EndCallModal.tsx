'use client';

interface EndCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEndForAll: () => void;
  onLeaveCall: () => void;
}

export default function EndCallModal({
  isOpen,
  onClose,
  onEndForAll,
  onLeaveCall,
}: EndCallModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#2d2d2d] rounded-2xl shadow-2xl border border-[#3c3c3c] w-[90%] max-w-sm overflow-hidden p-6 text-center animate-in fade-in zoom-in-95 duration-150">
        <h3 className="text-xl font-medium text-white mb-2">Akhiri Meeting</h3>
        <p className="text-[#9aa0a6] text-sm mb-6">
          Anda adalah host di meeting ini. Apakah Anda ingin mengakhiri meeting untuk semua orang atau hanya keluar sendiri?
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onEndForAll}
            className="w-full py-2.5 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer"
          >
            Akhiri untuk Semua
          </button>
          <button
            onClick={onLeaveCall}
            className="w-full py-2.5 rounded-lg font-medium text-[#e8eaed] bg-[#3c3c3c] hover:bg-[#4a4b4c] transition-colors cursor-pointer"
          >
            Keluar Saja
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg font-medium text-[#8ab4f8] hover:bg-[#8ab4f8]/10 transition-colors mt-1 cursor-pointer"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
