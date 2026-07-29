'use client';

interface ScheduleTypeModalProps {
  show: boolean;
  onClose: () => void;
  selectedScheduleType: 'private' | 'anyone' | 'interview';
  setSelectedScheduleType: (type: 'private' | 'anyone' | 'interview') => void;
  onCreate: (type: string) => void;
}

export default function ScheduleTypeModal({
  show,
  onClose,
  selectedScheduleType,
  setSelectedScheduleType,
  onCreate,
}: ScheduleTypeModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <div className="bg-white rounded-3xl p-6 w-full max-w-[440px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 relative pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer p-1 rounded-full hover:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-xl font-medium text-[#202124] mb-1 pr-6 tracking-tight">Pilih Tipe Akses Rapat</h3>
        <p className="text-[13px] text-[#5f6368] mb-5">Tentukan bagaimana peserta akan bergabung ke ruangan rapat ini:</p>

        <div className="space-y-2.5 mb-6">
          {/* Option 1: Private */}
          <div
            onClick={() => setSelectedScheduleType('private')}
            className={`flex items-start gap-3.5 p-4 rounded-2xl cursor-pointer transition-all ${
              selectedScheduleType === 'private'
                ? 'bg-[#e8f0fe] border border-[#1a73e8]'
                : 'bg-[#f8f9fa] hover:bg-[#f1f3f4] border border-transparent'
            }`}
          >
            <div
              className={`p-2 rounded-xl mt-0.5 ${
                selectedScheduleType === 'private' ? 'bg-[#1a73e8] text-white' : 'bg-white text-[#5f6368] shadow-sm'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-medium text-[#202124]">Rapat Private</span>
                <span className="text-[11px] text-[#5f6368] bg-white px-2.5 py-0.5 rounded-full font-medium shadow-2xs">Standard</span>
              </div>
              <p className="text-[12px] text-[#5f6368] mt-1 leading-relaxed">Peserta/Guest wajib menunggu izin persetujuan dari Host untuk dapat bergabung.</p>
            </div>
          </div>

          {/* Option 2: Anyone */}
          <div
            onClick={() => setSelectedScheduleType('anyone')}
            className={`flex items-start gap-3.5 p-4 rounded-2xl cursor-pointer transition-all ${
              selectedScheduleType === 'anyone'
                ? 'bg-[#e8f0fe] border border-[#1a73e8]'
                : 'bg-[#f8f9fa] hover:bg-[#f1f3f4] border border-transparent'
            }`}
          >
            <div
              className={`p-2 rounded-xl mt-0.5 ${
                selectedScheduleType === 'anyone' ? 'bg-[#1a73e8] text-white' : 'bg-white text-[#5f6368] shadow-sm'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-medium text-[#202124]">Rapat Terbuka</span>
                <span className="text-[11px] text-[#5f6368] bg-white px-2.5 py-0.5 rounded-full font-medium shadow-2xs">Bebas Join</span>
              </div>
              <p className="text-[12px] text-[#5f6368] mt-1 leading-relaxed">Siapa saja yang memiliki link rapat langsung otomatis masuk tanpa antrean.</p>
            </div>
          </div>

          {/* Option 3: Interview */}
          <div
            onClick={() => setSelectedScheduleType('interview')}
            className={`flex items-start gap-3.5 p-4 rounded-2xl cursor-pointer transition-all ${
              selectedScheduleType === 'interview'
                ? 'bg-[#e8f0fe] border border-[#1a73e8]'
                : 'bg-[#f8f9fa] hover:bg-[#f1f3f4] border border-transparent'
            }`}
          >
            <div
              className={`p-2 rounded-xl mt-0.5 ${
                selectedScheduleType === 'interview' ? 'bg-[#1a73e8] text-white' : 'bg-white text-[#5f6368] shadow-sm'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-medium text-[#202124]">Khusus Interview</span>
                <span className="text-[11px] text-[#5f6368] bg-white px-2.5 py-0.5 rounded-full font-medium shadow-2xs">Cam/Mic Lock</span>
              </div>
              <p className="text-[12px] text-[#5f6368] mt-1 leading-relaxed">Membutuhkan izin Host. Kamera & Mic peserta wajib menyala dan terkunci.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-[14px] text-[#5f6368] hover:bg-[#f1f3f4] rounded-full transition font-medium cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onCreate(selectedScheduleType);
            }}
            className="px-6 py-2.5 text-[14px] text-white bg-[#0b57d0] hover:bg-[#0b57d0]/90 rounded-full transition font-medium shadow-sm cursor-pointer"
          >
            Buat Link Rapat
          </button>
        </div>
      </div>
    </div>
  );
}
