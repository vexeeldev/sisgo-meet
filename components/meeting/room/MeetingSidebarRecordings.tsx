'use client';

import { useEffect, useState } from 'react';
import { 
  getRecordingsFromStorage, 
  deleteRecordingFromStorage, 
  SavedRecording 
} from '@/lib/recording-storage';

interface MeetingSidebarRecordingsProps {
  roomId: string;
  onClose: () => void;
  latestRecordingResult?: { blob: Blob; url: string } | null;
}

export default function MeetingSidebarRecordings({
  roomId,
  onClose,
  latestRecordingResult,
}: MeetingSidebarRecordingsProps) {
  const [recordings, setRecordings] = useState<SavedRecording[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecordings = async () => {
    setLoading(true);
    try {
      const data = await getRecordingsFromStorage(roomId);
      setRecordings(data);
    } catch (err) {
      console.error('Failed to load recordings history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecordings();
  }, [roomId, latestRecordingResult]);

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus video rekaman ini dari riwayat?')) {
      await deleteRecordingFromStorage(id);
      setRecordings((prev) => prev.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="fixed inset-0 sm:relative sm:inset-auto sm:w-[320px] md:w-[360px] h-full bg-[#17181a] sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl z-20 sm:z-auto border-none animate-sidebar-entry">
      <style>{`
        @keyframes slideInSidebar {
          from {
            transform: translateX(30px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-sidebar-entry {
          animation: slideInSidebar 0.28s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-[#3c4043] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#3c4043] text-gray-200 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white text-base font-semibold">Riwayat Rekaman</h3>
            <p className="text-[#9aa0a6] text-xs">Tersimpan otomatis di perangkat</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-[#9aa0a6] hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          title="Tutup"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm gap-2">
            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            <span>Memuat riwayat rekaman...</span>
          </div>
        ) : recordings.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#2d2e31] flex items-center justify-center text-gray-500">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h4 className="text-gray-200 text-sm font-medium">Belum ada riwayat rekaman</h4>
              <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                Video rekaman rapat akan otomatis tersimpan di sini saat Anda menyelesaikan perekaman panggilan.
              </p>
            </div>
          </div>
        ) : (
          recordings.map((item) => (
            <div
              key={item.id}
              className="bg-[#2d2e31] rounded-2xl p-3.5 border border-[#3c4043] space-y-3 shadow-lg hover:border-[#5f6368] transition-all"
            >
              {/* Video Player */}
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-black/40">
                {item.url && (
                  <video
                    src={item.url}
                    controls
                    preload="metadata"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Info Badges & Title */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-white text-xs font-semibold">{item.dateFormatted}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-[#3c4043] text-gray-300 text-[10px] px-2 py-0.5 rounded-full font-mono">
                      ⏱️ {item.durationFormatted}
                    </span>
                    <span className="bg-[#3c4043] text-gray-300 text-[10px] px-2 py-0.5 rounded-full font-mono">
                      💾 {item.sizeFormatted}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {item.url && (
                    <a
                      href={item.url}
                      download={`sisgo-meet-recording-${item.roomId}-${item.id}.webm`}
                      className="bg-[#8ab4f8] hover:bg-[#a8c7fa] text-[#001d35] p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                      title="Unduh Video"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="bg-[#3c4043] hover:bg-red-500/20 text-gray-300 hover:text-red-400 p-2 rounded-xl text-xs transition-colors cursor-pointer"
                    title="Hapus"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
