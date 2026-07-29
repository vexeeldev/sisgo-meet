'use client';

interface LobbyNotFoundProps {
  roomId: string;
  redirectCountdown: number;
  onBackToDashboard: () => void;
}

export default function LobbyNotFound({
  roomId,
  redirectCountdown,
  onBackToDashboard,
}: LobbyNotFoundProps) {
  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      <div className="flex items-center gap-3 px-8 pt-8">
        <div className="relative w-10 h-10 flex items-center justify-center">
          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="17" fill="none" stroke="#e8eaed" strokeWidth="3" />
            <circle
              cx="20"
              cy="20"
              r="17"
              fill="none"
              stroke="#1a73e8"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 17}
              strokeDashoffset={2 * Math.PI * 17 * (redirectCountdown / 3)}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <span className="absolute text-xs font-medium text-gray-600">{redirectCountdown}</span>
        </div>
        <button onClick={onBackToDashboard} className="text-gray-700 text-base hover:underline cursor-pointer">
          Kembali ke layar utama
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-16">
        <h1 className="text-[28px] text-gray-800 mb-6">Periksa kode rapat</h1>
        <p className="text-center text-gray-600 max-w-md mb-1">
          Pastikan Anda memasukkan kode rapat yang benar
        </p>
        <p className="text-center text-gray-600 max-w-md mb-8">
          Room <span className="font-medium text-gray-800">"{roomId}"</span> tidak ditemukan
        </p>

        <button
          onClick={onBackToDashboard}
          className="cursor-pointer px-6 py-2.5 bg-[#1a73e8] hover:bg-[#1765cc] text-white text-sm font-medium rounded-full transition mb-4"
        >
          Kembali ke layar utama
        </button>

        <button onClick={onBackToDashboard} className="cursor-pointer text-[#1a73e8] text-sm hover:underline mb-10">
          Kirim masukan
        </button>

        <div className="flex items-start gap-4 max-w-md border border-gray-200 rounded-xl p-4">
          <div className="w-9 h-9 rounded-full bg-[#1a73e8] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
            </svg>
          </div>
          <div>
            <p className="text-gray-800 text-sm font-medium mb-1">Rapat Anda aman</p>
            <p className="text-gray-500 text-sm">
              Tidak ada yang dapat bergabung ke rapat kecuali diundang atau diizinkan oleh penyelenggara
            </p>
            <button className="text-[#1a73e8] text-sm hover:underline mt-1">Pelajari lebih lanjut</button>
          </div>
        </div>
      </div>
    </div>
  );
}
