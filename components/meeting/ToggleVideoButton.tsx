'use client';

import { Videocam, VideocamOff, ExpandLess as ChevronUp } from './icons';

interface ToggleVideoButtonProps {
  onClick: () => void;
  onMenuClick?: () => void;
  isVideoOff?: boolean;
}

export default function ToggleVideoButton({ 
  onClick,
  onMenuClick,
  isVideoOff = false 
}: ToggleVideoButtonProps) {
  return (
    <div className={`flex items-center rounded-full overflow-hidden transition-all ${
      isVideoOff 
        ? 'bg-[#ea4335]' 
        : 'bg-[#3c4043]'
    }`}>
      <button 
        onClick={onMenuClick}
        className={`h-12 sm:h-14 px-2 flex items-center justify-center transition-colors cursor-pointer border-r ${
          isVideoOff ? 'border-white/20 hover:bg-[#d93025]' : 'border-[#5f6368] hover:bg-[#4a4b4c]'
        }`}
        title="Video options"
      >
        <ChevronUp className="w-4 h-4 text-white" />
      </button>
      <button
        onClick={onClick}
        className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center transition-colors cursor-pointer ${
          isVideoOff ? 'hover:bg-[#d93025]' : 'hover:bg-[#4a4b4c]'
        }`}
        title={isVideoOff ? 'Turn on camera (Ctrl+E)' : 'Turn off camera (Ctrl+E)'}
      > 
        {isVideoOff ? (
          <VideocamOff className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
        ) : (
          <Videocam className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
        )}
      </button>
    </div>
  );
}