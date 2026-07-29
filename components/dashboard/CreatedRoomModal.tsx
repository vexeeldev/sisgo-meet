'use client';

interface CreatedRoomModalProps {
  createdRoom: string | null;
  onClose: () => void;
  copied: string | null;
  onCopy: (code: string) => void;
}

export default function CreatedRoomModal({ createdRoom, onClose, copied, onCopy }: CreatedRoomModalProps) {
  if (!createdRoom) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-lg p-6 w-[360px] shadow-[0_4px_24px_rgba(0,0,0,0.15)] border border-gray-100 relative pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer p-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-lg font-medium text-[#1f1f1f] mb-2 pr-6">Berikut info akses Anda</h3>

        <p className="text-[14px] text-[#444746] mb-5 leading-relaxed">
          Kirimkan link ini kepada orang yang ingin diajak rapat. Pastikan untuk menyimpannya agar Anda juga dapat menggunakannya nanti.
        </p>

        <div className="flex items-center gap-2 bg-[#f1f3f4] hover:bg-[#e8eaed] transition-colors p-1.5 pl-3 rounded-md">
          <p className="flex-1 text-[14px] font-medium text-[#1f1f1f] truncate select-all">
            {typeof window !== 'undefined' ? window.location.host : ''}/{createdRoom}
          </p>
          <button
            onClick={() => onCopy(createdRoom)}
            className="p-2 text-gray-600 hover:bg-gray-300/50 rounded-full transition-colors cursor-pointer"
            title="Salin link"
          >
            {copied === createdRoom ? (
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
