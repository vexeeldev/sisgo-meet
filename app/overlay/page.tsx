"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pencil, Eraser, Trash2, X, Hand, AppWindow } from "lucide-react";

interface Point { x: number; y: number }
interface Stroke { points: Point[]; color: string; size: number; eraser: boolean }

export default function OverlayPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<Point[]>([]);
  const strokesRef = useRef<Stroke[]>([]);
  const colorRef = useRef("#4f8ef7");
  const [color, setColor] = useState("#4f8ef7");
  const sizeRef = useRef(4);
  const [size, setSize] = useState(4);
  const [tool, setTool] = useState<"pencil" | "eraser">("pencil");
  const toolRef = useRef<"pencil" | "eraser">("pencil");
  const [isPaused, setIsPaused] = useState(false);


  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokesRef.current.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.save();
      if (stroke.eraser) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = stroke.color;
      }
      ctx.lineWidth = stroke.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    });
  }, []);

  const doClear = useCallback(() => {
    strokesRef.current = [];
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  // ─── Resize ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      redraw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [redraw]);

  // ─── IPC listeners ─────────────────────────────────────────────────────────

  useEffect(() => {
    const cleanups: (() => void)[] = [];
    const api = window.electronAPI;
    if (!api) return;

    if (api.onRemoteStroke) {
      cleanups.push(api.onRemoteStroke((s) => {
        strokesRef.current = [...strokesRef.current, { ...s, eraser: !!s.eraser }];
        redraw();
      }));
    }
    if (api.onClearOverlayRemote) {
      cleanups.push(api.onClearOverlayRemote(() => doClear()));
    }
    if (api.onDoClearCanvas) {
      cleanups.push(api.onDoClearCanvas(() => doClear()));
    }
    if (api.onTogglePauseState) {
      cleanups.push(api.onTogglePauseState((paused: boolean) => setIsPaused(paused)));
    }
    return () => cleanups.forEach((fn) => fn());
  }, [doClear, redraw]);

  // ─── Drawing handlers ──────────────────────────────────────────────────────

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    currentStrokeRef.current = [{ x: e.clientX, y: e.clientY }];
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const newPoint = { x: e.clientX, y: e.clientY };
    currentStrokeRef.current.push(newPoint);
    const pts = currentStrokeRef.current;
    const isEraser = toolRef.current === "eraser";

    ctx.globalCompositeOperation = isEraser ? "destination-out" : "source-over";
    ctx.strokeStyle = isEraser ? "rgba(0,0,0,1)" : colorRef.current;
    ctx.lineWidth = sizeRef.current;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (pts.length > 1) {
      const prev = pts[pts.length - 2];
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(newPoint.x, newPoint.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (currentStrokeRef.current.length > 0) {
      const isEraser = toolRef.current === "eraser";
      const newStroke: Stroke = {
        points: [...currentStrokeRef.current],
        color: colorRef.current,
        size: sizeRef.current,
        eraser: isEraser,
      };
      strokesRef.current = [...strokesRef.current, newStroke];
      window.electronAPI?.sendLocalStroke?.({
        points: newStroke.points,
        color: newStroke.color,
        size: newStroke.size,
        eraser: newStroke.eraser,
      });
    }
    currentStrokeRef.current = [];
  };

  // ─── Toolbar actions ───────────────────────────────────────────────────────

  const clearCanvas = () => {
    doClear(); // Clear immediately locally
    window.electronAPI?.clearCanvas?.(); // Notify remote participants
  };

  const pickColor = (c: string) => {
    setColor(c);
    colorRef.current = c;
    setTool("pencil");
    toolRef.current = "pencil";
  };

  const pickTool = (t: "pencil" | "eraser") => {
    setTool(t);
    toolRef.current = t;
  };

  const pause = () => {
    setIsPaused(true);
    window.electronAPI?.pauseDrawing?.();
  };
  
  const resume = () => {
    setIsPaused(false);
    window.electronAPI?.resumeDrawing?.();
  };

  const close = () => window.electronAPI?.toggleOverlay?.(false);
  const returnToApp = () => window.electronAPI?.returnToApp?.();
  const COLORS = [
    { hex: "#e05c5c", label: "Red" },
    { hex: "#4f8ef7", label: "Blue" },
    { hex: "#45b37a", label: "Green" },
    { hex: "#e8a838", label: "Amber" },
    { hex: "#ffffff", label: "White" },
  ];

  const toolbarBg = "rgba(13, 17, 23, 0.88)";
  const border = "rgba(255,255,255,0.08)";

  const iconBtn = (active = false, danger = false): React.CSSProperties => ({
    width: 34,
    height: 34,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    border: "none",
    background: active ? "rgba(79,142,247,0.18)" : "transparent",
    color: danger ? "#e05c5c" : active ? "#4f8ef7" : "rgba(255,255,255,0.55)",
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
    flexShrink: 0,
  });

  const sep: React.CSSProperties = {
    width: 1,
    height: 18,
    background: "rgba(255,255,255,0.08)",
    flexShrink: 0,
  };

  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  return (
    <>
      <style>{`
        html, body {
          background: transparent !important;
          margin: 0; padding: 0; overflow: hidden;
        }
        button:hover { opacity: 0.85; }
      `}</style>

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={(e) => {
          setMousePos({ x: e.clientX, y: e.clientY });
          draw(e);
        }}
        onMouseUp={stopDrawing}
        onMouseLeave={() => {
          setMousePos(null);
          stopDrawing();
        }}
        style={{
          position: "fixed",
          inset: 0,
          cursor: tool === "eraser" ? "none" : "crosshair",
          touchAction: "none",
          pointerEvents: isPaused ? "none" : "auto",
        }}
      />

      {/* Eraser Cursor Circle Preview */}
      {tool === "eraser" && mousePos && (
        <div
          style={{
            position: "fixed",
            left: mousePos.x,
            top: mousePos.y,
            width: size * 2,
            height: size * 2,
            borderRadius: "50%",
            border: "1.5px solid rgba(255, 255, 255, 0.85)",
            backgroundColor: "rgba(255, 255, 255, 0.15)",
            boxShadow: "0 0 4px rgba(0, 0, 0, 0.5)",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: 9998,
          }}
        />
      )}

      {/* Toolbar */}
      <div
        onMouseEnter={() => {
          if (isPaused) window.electronAPI?.setIgnoreMouse?.(false);
        }}
        onMouseLeave={() => {
          if (isPaused) window.electronAPI?.setIgnoreMouse?.(true);
        }}
        style={{
          position: "fixed",
          top: 18,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: 4,
          background: toolbarBg,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: `1px solid ${border}`,
          borderRadius: 12,
          padding: "5px 10px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
          userSelect: "none",
        }}
      >
        {/* Pencil */}
        <button
          onClick={() => pickTool("pencil")}
          style={iconBtn(tool === "pencil")}
          title="Pencil"
        >
          <Pencil size={15} />
        </button>

        {/* Eraser */}
        <button
          onClick={() => pickTool("eraser")}
          style={iconBtn(tool === "eraser")}
          title="Eraser"
        >
          <Eraser size={15} />
        </button>

        <div style={sep} />

        {/* Colors */}
        {COLORS.map(({ hex, label }) => (
          <button
            key={hex}
            onClick={() => pickColor(hex)}
            title={label}
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              border: color === hex && tool === "pencil"
                ? "2px solid rgba(255,255,255,0.9)"
                : "2px solid rgba(255,255,255,0.12)",
              background: hex,
              cursor: "pointer",
              flexShrink: 0,
              transform: color === hex && tool === "pencil" ? "scale(1.2)" : "scale(1)",
              transition: "transform 0.12s",
              boxShadow: color === hex && tool === "pencil" ? `0 0 0 2px ${hex}44` : "none",
            }}
          />
        ))}

        <div style={sep} />

        {/* Size */}
        <input
          type="range"
          min="2"
          max="20"
          value={size}
          onChange={(e) => {
            const v = Number(e.target.value);
            setSize(v);
            sizeRef.current = v;
          }}
          style={{ width: 56, accentColor: "#4f8ef7", cursor: "pointer" }}
        />

        {/* Size preview dot */}
        <div style={{
          width: Math.max(4, Math.min(size, 14)),
          height: Math.max(4, Math.min(size, 14)),
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
        }} />

        <div style={sep} />

        {/* Clear */}
        <button onClick={clearCanvas} style={iconBtn(false, true)} title="Clear all">
          <Trash2 size={15} />
        </button>

        <div style={sep} />

        {/* Pause/Resume Toggle */}
        <button
          onClick={isPaused ? resume : pause}
          style={{
            ...iconBtn(isPaused),
            background: isPaused ? "rgba(224, 92, 92, 0.2)" : "rgba(255,255,255,0.06)",
            color: isPaused ? "#e05c5c" : "rgba(255,255,255,0.7)",
          }}
          title={isPaused ? "Resume drawing" : "Pause — interact with your screen"}
        >
          <Hand size={15} />
        </button>

        <div style={sep} />

        {/* Return to App */}
        <button
          onClick={returnToApp}
          style={{
            ...iconBtn(false),
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.9)",
          }}
          title="Return to Meetgo App"
        >
          <AppWindow size={15} />
        </button>

        {/* Close */}
        <button onClick={close} style={iconBtn(false)} title="Close overlay">
          <X size={15} />
        </button>
      </div>
    </>
  );
}
