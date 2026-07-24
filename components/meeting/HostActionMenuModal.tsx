'use client';

import { PartyPopper, Gift, Cat, Terminal, Rocket } from "lucide-react";
import { launchConfetti } from '@/lib/confetti';
import { launchBalloons } from '@/lib/balloons';
import { launchWalkingCat } from '@/lib/cat';
import { launchTux } from '@/lib/tux';
import { launchUFO } from '@/lib/ufo';

interface HostActionMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  sendMessage: (type: string, payload?: any) => void;
}

export default function HostActionMenuModal({
  isOpen,
  onClose,
  sendMessage,
}: HostActionMenuModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" 
      onClick={onClose}
    >
      <div 
        className="bg-[#202124] rounded-2xl p-6 shadow-2xl border border-[#3c4043] w-80 text-center animate-in fade-in zoom-in duration-200" 
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-medium text-white mb-5">Host Actions</h3>
        <div className="space-y-3">

          <button 
            onClick={() => {
              sendMessage('confetti_time', {});
              launchConfetti();
              onClose();
            }}
            className="w-full bg-[#3c4043] hover:bg-[#4a4b4c] text-white rounded-xl py-3 px-4 flex items-center justify-center gap-3 transition-colors border border-transparent hover:border-gray-500 cursor-pointer"
          >
            <PartyPopper size={20} className="text-yellow-400" />
            <span className="font-medium text-sm">Launch Confetti</span>
          </button>

          <button 
            onClick={() => {
              sendMessage('balloon_time', {});
              launchBalloons();
              onClose();
            }}
            className="w-full bg-[#3c4043] hover:bg-[#4a4b4c] text-white rounded-xl py-3 px-4 flex items-center justify-center gap-3 transition-colors border border-transparent hover:border-gray-500 cursor-pointer"
          >
            <Gift size={20} className="text-pink-400" />
            <span className="font-medium text-sm">Balloon Party</span>
          </button>

          <button 
            onClick={() => {
              sendMessage('cat_time', {});
              launchWalkingCat();
              onClose();
            }}
            className="w-full bg-[#3c4043] hover:bg-[#4a4b4c] text-white rounded-xl py-3 px-4 flex items-center justify-center gap-3 transition-colors border border-transparent hover:border-gray-500 cursor-pointer"
          >
            <Cat size={20} className="text-orange-400" />
            <span className="font-medium text-sm">Walking Cat</span>
          </button>

          <button 
            onClick={() => {
              sendMessage('tux_time', {});
              launchTux();
              onClose();
            }}
            className="w-full bg-[#3c4043] hover:bg-[#4a4b4c] text-white rounded-xl py-3 px-4 flex items-center justify-center gap-3 transition-colors border border-transparent hover:border-gray-500 cursor-pointer"
          >
            <Terminal size={20} className="text-blue-400" />
            <span className="font-medium text-sm">Tux Linux</span>
          </button>

          <button 
            onClick={() => {
              sendMessage('ufo_time', {});
              launchUFO();
              onClose();
            }}
            className="w-full bg-[#3c4043] hover:bg-[#4a4b4c] text-white rounded-xl py-3 px-4 flex items-center justify-center gap-3 transition-colors border border-transparent hover:border-gray-500 cursor-pointer"
          >
            <Rocket size={20} className="text-purple-400" />
            <span className="font-medium text-sm">UFO Invasion</span>
          </button>
        </div>
      </div>
    </div>
  );
}
