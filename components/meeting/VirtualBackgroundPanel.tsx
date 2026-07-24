'use client';

import { useEffect, useRef, useState } from 'react';
import { VirtualBackgroundMode } from '@/lib/virtual-background';
import { VisualEffects } from './icons';
import { getUserColors } from '@/lib/meeting';

interface PresetBg {
  name: string;
  url: string;
}

const PRESET_BACKGROUNDS: PresetBg[] = [
  { name: 'Office', url: '/background/office_background.jpg' },
  { name: 'Living Room', url: '/background/livingroom_background.jpg' },
  { name: 'Nature', url: '/background/nature_background.jpg' },
  { name: 'Cafe', url: '/background/cafe_background.jpg' },
];

const SISGO_BACKGROUNDS: PresetBg[] = [
  { name: 'SISGO Original', url: '/background/sisgo-background.png' },
  { name: 'SISGO Mirror', url: '/background/sisgo-background-mirror.png' },
];

interface VirtualBackgroundPanelProps {
  mode: VirtualBackgroundMode;
  activeImage?: string | null;
  onChange: (mode: VirtualBackgroundMode, image?: string) => void | Promise<void>;
  onClose: () => void;
  localStream?: MediaStream | null;
  isVideoOff?: boolean;
  participantName?: string;
}

export default function VirtualBackgroundPanel({
  mode,
  activeImage,
  onChange,
  onClose,
  localStream,
  isVideoOff,
  participantName = 'Anda',
}: VirtualBackgroundPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [customImages, setCustomImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'latar'|'filter'|'tampilan'>('latar');

  // Attach local stream to video preview
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Tutup panel kalau klik di luar (if not clicking More Options menu as well, wait we just rely on outside click, but More Options is outside, so it handles properly).
  // Actually, since it's a fixed sidebar, clicking outside shouldn't necessarily close it, but it's fine for now.
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSelect = async (nextMode: VirtualBackgroundMode, image?: string) => {
    setError(null);
    setLoading(true);
    try {
      await onChange(nextMode, image);
    } catch (e) {
      console.error('Gagal set virtual background:', e);
      setError('Gagal memuat background. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Ukuran gambar maksimal 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCustomImages((prev) => [dataUrl, ...prev].slice(0, 6)); // simpan max 6 riwayat
      handleSelect('image', dataUrl);
    };
    reader.onerror = () => setError('Gagal membaca file.');
    reader.readAsDataURL(file);

    e.target.value = '';
  };

  return (
    <div
      ref={panelRef}
      className="flex flex-col h-full w-full bg-[#17181a]"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <h3 className="text-white text-[15px] font-medium">Latar belakang</h3>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-[#3c3c3c] transition-colors cursor-pointer">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 register-scrollbar">
        {/* Video Preview */}
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-inner mb-6 border border-[#3c3c3c]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${isVideoOff ? 'opacity-0' : 'opacity-100'}`}
          />
          {isVideoOff && (() => {
            const colors = getUserColors(participantName);
            return (
              <div 
                className="absolute inset-0 w-full h-full flex flex-col items-center justify-center"
                style={{ 
                  backgroundColor: colors.from, 
                  backgroundImage: `radial-gradient(circle farthest-corner at 50% 50%, transparent 0%, rgba(0,0,0,0.35) 120%)` 
                }}
              >
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-normal ${colors.circle} shadow-sm`}>
                  {participantName.charAt(0).toUpperCase()}
                </div>
              </div>
            );
          })()}
          <div className="absolute bottom-2 right-2 p-1.5 bg-[#1a1a1a]/80 backdrop-blur-sm rounded-lg border border-white/10 z-10">
             <VisualEffects className="w-4 h-4 text-white" />
          </div>
          {loading && (
             <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
               <span className="text-xs text-white bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm">Menerapkan...</span>
             </div>
          )}
        </div>

        {error && (
          <div className="text-xs text-red-400 mb-4 bg-red-900/20 px-3 py-2 rounded-lg border border-red-900/50">
            {error}
          </div>
        )}

        {/* Content (Latar Belakang only) */}
        <div className="space-y-6">
            {/* Buram */}
            <div>
              <h4 className="text-[#9aa0a6] text-xs font-medium mb-3 uppercase tracking-wider">Buram</h4>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleSelect('none')}
                  disabled={loading}
                  className={`aspect-square rounded-xl flex items-center justify-center text-xs text-white border-2 transition-all cursor-pointer ${
                    mode === 'none' ? 'border-[#8ab4f8] bg-[#4a4b4c]' : 'border-transparent bg-[#3c4043] hover:bg-[#4a4b4c]'
                  }`}
                  title="Matikan latar belakang"
                >
                  <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </button>
                <button
                  onClick={() => handleSelect('blur')}
                  disabled={loading}
                  className={`aspect-square rounded-xl flex items-center justify-center text-xs text-white border-2 transition-all cursor-pointer ${
                    mode === 'blur' ? 'border-[#8ab4f8] bg-[#001d35]' : 'border-transparent bg-[#3c4043] hover:bg-[#4a4b4c]'
                  }`}
                  title="Buramkan latar belakang Anda"
                >
                  <div className="grid grid-cols-3 gap-[2px] opacity-70">
                    {[...Array(9)].map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 bg-current rounded-full ${i===4 ? 'opacity-100' : 'opacity-40 blur-[1px]'}`} />
                    ))}
                  </div>
                </button>
              </div>
            </div>

            {/* SISGO Backgrounds */}
            <div>
              <h4 className="text-[#8ab4f8] text-xs font-semibold mb-3 uppercase tracking-wider flex items-center gap-1.5">
                <span>SISGO</span>
                <span className="text-[10px] bg-[#8ab4f8]/20 text-[#8ab4f8] px-1.5 py-0.5 rounded-full font-bold">Official</span>
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {SISGO_BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.url}
                    onClick={() => handleSelect('image', bg.url)}
                    disabled={loading}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
                      mode === 'image' && activeImage === bg.url ? 'border-[#8ab4f8]' : 'border-transparent hover:border-[#8ab4f8]/50'
                    }`}
                    title={bg.name}
                  >
                    <img src={bg.url} alt={bg.name} className="w-full h-full object-cover" />
                    {/* Bottom label overlay */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-1 pt-3 text-center">
                      <span className="text-[10px] font-semibold text-white truncate block">
                        {bg.name.includes('Mirror') ? 'Mirror' : 'Original'}
                      </span>
                    </div>
                    {mode === 'image' && activeImage === bg.url && (
                      <div className="absolute top-1 right-1 bg-[#8ab4f8] rounded-full p-0.5 shadow-sm z-10">
                        <svg className="w-3 h-3 text-[#001d35]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Profesional */}
            <div>
              <h4 className="text-[#9aa0a6] text-xs font-medium mb-3 uppercase tracking-wider">Profesional</h4>
              <div className="grid grid-cols-4 gap-2">
                {/* Upload button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1 text-[#e8eaed] border-2 border-dashed border-[#5f6368] bg-transparent hover:bg-[#3c4043] transition-all cursor-pointer"
                  title="Upload gambar dari perangkat"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>

                {/* Downloaded Backgrounds */}
                {PRESET_BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.url}
                    onClick={() => handleSelect('image', bg.url)}
                    disabled={loading}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
                      mode === 'image' && activeImage === bg.url ? 'border-[#8ab4f8]' : 'border-transparent hover:border-gray-500'
                    }`}
                    title={bg.name}
                  >
                    <img src={bg.url} alt={bg.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-1 pt-3 text-center">
                      <span className="text-[10px] font-semibold text-white truncate block">
                        {bg.name}
                      </span>
                    </div>
                    {mode === 'image' && activeImage === bg.url && (
                      <div className="absolute top-1 right-1 bg-[#8ab4f8] rounded-full p-0.5 shadow-sm z-10">
                        <svg className="w-3 h-3 text-[#001d35]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Riwayat Upload */}
            {customImages.length > 0 && (
              <div>
                <h4 className="text-[#9aa0a6] text-xs font-medium mb-3 uppercase tracking-wider">Gambar Sendiri</h4>
                <div className="grid grid-cols-4 gap-2">
                  {customImages.map((img, idx) => (
                    <button
                      key={img}
                      onClick={() => handleSelect('image', img)}
                      disabled={loading}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        mode === 'image' && activeImage === img ? 'border-[#8ab4f8]' : 'border-transparent hover:border-gray-500'
                      }`}
                    >
                      <img src={img} alt="Custom background" className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-1 pt-3 text-center">
                        <span className="text-[10px] font-semibold text-white truncate block">
                          Upload {idx + 1}
                        </span>
                      </div>
                      {mode === 'image' && activeImage === img && (
                        <div className="absolute top-1 right-1 bg-[#8ab4f8] rounded-full p-0.5 shadow-sm z-10">
                          <svg className="w-3 h-3 text-[#001d35]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}