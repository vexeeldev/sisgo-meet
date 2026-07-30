"use client";

import React, { useEffect, useState } from "react";
import { Monitor, PenTool } from "lucide-react";

export default function AnnotationTriggerButton() {
  const [isOverlayActive, setIsOverlayActive] = useState(false);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      setIsElectron(true);
      const cleanup = (window as any).electronAPI.onOverlayStateChange((active: boolean) => {
        setIsOverlayActive(active);
      });
      return cleanup;
    }
  }, []);

  const toggleAnnotationOverlay = () => {
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      const nextState = !isOverlayActive;
      (window as any).electronAPI.toggleOverlay(nextState);
      setIsOverlayActive(nextState);
    }
  };

  if (!isElectron) return null; // Hanya muncul jika dijalankan di Electron App

  return (
    <button
      onClick={toggleAnnotationOverlay}
      className={`relative flex w-12 h-12 sm:w-14 sm:h-14 items-center justify-center transition-all cursor-pointer overflow-hidden ${
        isOverlayActive
          ? "rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 border-2 border-indigo-400"
          : "rounded-full bg-gradient-to-br from-[#4a4b4c] to-[#3c4043] hover:from-[#5a5b5c] hover:to-[#4a4b4c] text-teal-400 shadow-md border border-gray-600"
      }`}
      title={isOverlayActive ? "Matikan Desktop Overlay" : "Coret-Coret Desktop (Overlay)"}
    >
      <div className="relative flex items-center justify-center">
        <Monitor className={`w-6 h-6 sm:w-7 sm:h-7 transition-all ${isOverlayActive ? "opacity-30 scale-90" : "opacity-100 scale-100"}`} />
        <PenTool className={`absolute transition-all ${isOverlayActive ? "w-7 h-7 text-white scale-110 drop-shadow-md" : "w-4 h-4 bottom-[-4px] right-[-6px] text-yellow-400 drop-shadow-sm rotate-[-15deg]"}`} />
      </div>
    </button>
  );
}
