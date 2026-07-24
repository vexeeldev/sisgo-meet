'use client';

import { useMemo } from 'react';
import { useUserColor } from '../../hooks/useUserColor';

interface VideoPlaceholderProps {
  name: string;
  isSpeaking?: boolean;
  image?: string;
  className?: string;
}

export default function VideoPlaceholder({ 
  name, 
  isSpeaking = false,
  image,
  className = ''
}: VideoPlaceholderProps) {
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  const { getColor } = useUserColor();
  const avatarBgColor = useMemo(() => getColor(name || 'Guest'), [getColor, name]);

  return (
    <div 
      className={`w-full h-full flex flex-col items-center justify-center relative bg-[#202124] rounded-2xl overflow-hidden ${className}`}
    >
      {image ? (
        <img 
          src={image} 
          alt={name} 
          className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden object-cover shadow-md"
        />
      ) : (
        <div 
          className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center text-white text-5xl sm:text-6xl font-semibold shadow-md select-none transition-all duration-300 border-2 ${isSpeaking ? 'border-[#8ab4f8] ring-2 ring-[#8ab4f8]/20 scale-105' : 'border-white/10'}`}
          style={{ backgroundColor: avatarBgColor }}
        >
          {initial}
        </div>
      )}
      
      <div className="absolute bottom-4 left-4 text-white text-[15px] font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
        {name || 'Guest'}
      </div>
      
      {isSpeaking && (
        <div className="absolute top-4 right-4">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
}