'use client';

import { MicFilled, MicOffFilled, ExpandLess as ChevronUp } from './icons';

interface ToggleAudioButtonProps {
  onClick: () => void;
  onMenuClick?: () => void;
  isMuted?: boolean;
}

export default function ToggleAudioButton({ 
  onClick,
  onMenuClick,
  isMuted = false 
}: ToggleAudioButtonProps) {
  return (
    <div className={`flex items-center rounded-full overflow-hidden transition-all ${
      isMuted 
        ? 'bg-[#ea4335]' 
        : 'bg-[#3c4043]'
    }`}>
      <button 
        onClick={onMenuClick}
        className={`h-12 sm:h-14 px-2 flex items-center justify-center transition-colors cursor-pointer border-r ${
          isMuted ? 'border-white/20 hover:bg-[#d93025]' : 'border-[#5f6368] hover:bg-[#4a4b4c]'
        }`}
        title="Audio options"
      >
        <ChevronUp className="w-4 h-4 text-white" />
      </button>
      <button
        onClick={onClick}
        className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center transition-colors cursor-pointer ${
          isMuted ? 'hover:bg-[#d93025]' : 'hover:bg-[#4a4b4c]'
        }`}
        title={isMuted ? 'Turn on microphone (Ctrl+D)' : 'Turn off microphone (Ctrl+D)'}
      >
        {isMuted ? (
          <MicOffFilled className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
        ) : (
          <MicFilled className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
        )}
      </button>
    </div>
  );
}