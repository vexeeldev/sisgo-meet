"use client";

import React, { useEffect, useState } from "react";
import { Hand, AppWindow, X } from "lucide-react";
import ScreenAnnotation from "@/components/meeting/ScreenAnnotation";

export default function OverlayPage() {
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [participantName, setParticipantName] = useState("Overlay User");

  useEffect(() => {
    const cleanups: (() => void)[] = [];
    const api = window.electronAPI;
    if (!api) return;

    if (api.onSyncAnnotationsToOverlay) {
      cleanups.push(
        api.onSyncAnnotationsToOverlay((newAnnotations) => {
          setAnnotations(newAnnotations);
        })
      );
    }
    if (api.onClearOverlayRemote) {
      cleanups.push(
        api.onClearOverlayRemote(() => {
          setAnnotations([]);
        })
      );
    }
    if (api.onDoClearCanvas) {
      cleanups.push(
        api.onDoClearCanvas(() => {
          setAnnotations([]);
        })
      );
    }
    if (api.onTogglePauseState) {
      cleanups.push(
        api.onTogglePauseState((paused: boolean) => {
          setIsPaused(paused);
        })
      );
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  const handleChangeAnnotations = (newAnnotations: any[]) => {
    setAnnotations(newAnnotations);
    window.electronAPI?.syncAnnotationsToMain?.(newAnnotations);
  };

  const handleClearAnnotations = () => {
    setAnnotations([]);
    window.electronAPI?.syncAnnotationsToMain?.([]);
    window.electronAPI?.clearCanvas?.(); // Legacy support
  };

  const pause = () => {
    setIsPaused(true);
    window.electronAPI?.pauseDrawing?.();
  };

  const resume = () => {
    setIsPaused(false);
    window.electronAPI?.resumeDrawing?.();
  };

  const closeOverlay = () => window.electronAPI?.toggleOverlay?.(false);
  const returnToApp = () => window.electronAPI?.returnToApp?.();

  const iconBtn = (active = false, danger = false): string => {
    return `w-8 h-8 flex items-center justify-center rounded-lg border-none cursor-pointer transition-colors ${
      active
        ? "bg-blue-500/20 text-blue-400"
        : danger
        ? "hover:bg-red-500/20 text-red-400"
        : "hover:bg-white/10 text-white/70"
    }`;
  };

  const extraToolbarButtons = (
    <>
      <div className="h-[1px] w-5 bg-white/10 shrink-0 my-1" />

      {/* Pause/Resume Toggle */}
      <button
        onClick={isPaused ? resume : pause}
        className={iconBtn(isPaused)}
        title={isPaused ? "Lanjutkan menggambar" : "Jeda — agar bisa mengklik layar"}
        style={{
          background: isPaused ? "rgba(224, 92, 92, 0.2)" : undefined,
          color: isPaused ? "#e05c5c" : undefined,
        }}
      >
        <Hand size={18} />
      </button>

      {/* Return to App */}
      <button
        onClick={returnToApp}
        className={iconBtn()}
        title="Kembali ke Meetgo"
      >
        <AppWindow size={18} />
      </button>

      {/* Close */}
      <button onClick={closeOverlay} className={iconBtn(false, true)} title="Tutup Overlay">
        <X size={18} />
      </button>
    </>
  );

  return (
    <>
      <style>{`
        html, body {
          background: transparent !important;
          margin: 0; padding: 0; overflow: hidden;
        }
      `}</style>
      
      {/* Full screen wrapper, events disabled if paused */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: isPaused ? "none" : "auto" }}>
        
        {/* Zoom-like Screen Share Border Indicator */}
        <div className="absolute inset-0 border-[6px] border-emerald-500/80 pointer-events-none z-50 rounded-lg shadow-[inset_0_0_20px_rgba(16,185,129,0.5)]" />

        <ScreenAnnotation
          isSharingHost={true} // As this is the host's overlay
          participantName={participantName}
          annotations={annotations}
          onChangeAnnotations={handleChangeAnnotations}
          onClearAnnotations={handleClearAnnotations}
          extraToolbarButtons={extraToolbarButtons}
          // We do NOT hide toolbar, we use the ScreenAnnotation one!
          hideToolbar={false} 
        />
      </div>
    </>
  );
}
