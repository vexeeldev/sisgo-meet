'use client';

import { playSound } from '@/lib/brimo';
import { Volume2 } from 'lucide-react';

interface BrimoPrankProps {
  /** Custom sound duration in milliseconds (Default: 1000 = 1 second) */
  durationMs?: number;
  /** Custom MP3 file path (Default: '/sayaakanlawan.mp3') */
  soundPath?: string;
  /** Optional button label text */
  label?: string;
  /** Optional callback after triggering sound */
  onTrigger?: () => void;
  className?: string;
}

export default function BrimoPrank({
  durationMs = 1000,
  soundPath = '/sayaakanlawan.mp3',
  label = 'Sound Effect',
  onTrigger,
  className = 'w-full bg-[#3c4043] hover:bg-[#4a4b4c] text-white rounded-xl py-3 px-4 flex items-center justify-center gap-3 transition-colors border border-transparent hover:border-gray-500 cursor-pointer',
}: BrimoPrankProps) {
  const handleClick = () => {
    playSound(durationMs, soundPath);
    if (onTrigger) onTrigger();
  };

  return (
    <button onClick={handleClick} className={className} title="Play Sound">
      <Volume2 size={20} className="text-blue-400" />
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
}

export { playSound };
