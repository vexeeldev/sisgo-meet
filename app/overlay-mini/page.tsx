"use client";

import React, { useState, useEffect } from "react";
import { Pencil, MousePointer } from "lucide-react";

export default function OverlayMiniPage() {
  const [state, setState] = useState<"drawing" | "paused">("drawing");

  useEffect(() => {
    if (!window.electronAPI?.onMiniState) return;
    const cleanup = window.electronAPI.onMiniState((s) => {
      setState(s as "drawing" | "paused");
    });
    return cleanup;
  }, []);

  const handleClick = () => {
    if (state === "drawing") {
      window.electronAPI?.pauseDrawing?.();
    } else {
      window.electronAPI?.resumeDrawing?.();
    }
  };

  const isPaused = state === "paused";

  return (
    <>
      <style>{`
        html, body {
          background: transparent !important;
          margin: 0; padding: 0; overflow: hidden;
        }
      `}</style>
      <div
        style={{
          width: 64,
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <button
          onClick={handleClick}
          title={isPaused ? "Resume drawing" : "Pause — use your mouse freely"}
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            border: `1px solid ${isPaused ? "rgba(79,142,247,0.3)" : "rgba(255,255,255,0.1)"}`,
            background: isPaused
              ? "rgba(13,17,23,0.92)"
              : "rgba(13,17,23,0.92)",
            color: isPaused ? "#4f8ef7" : "rgba(255,255,255,0.6)",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            transition: "all 0.2s",
          } as React.CSSProperties}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {isPaused ? <Pencil size={18} /> : <MousePointer size={18} />}
        </button>
      </div>
    </>
  );
}
