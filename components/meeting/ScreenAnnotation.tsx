'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Stage, Layer, Line, Arrow, Rect, Circle } from 'react-konva';
import { stringToColor } from '@/lib/meeting';
import { 
  Pencil, 
  Eraser, 
  Trash2, 
  ArrowRight, 
  Square, 
  Circle as CircleIcon, 
  Minimize2,
  X
} from 'lucide-react';

export interface AnnotationItem {
  id: string;
  tool: 'pen' | 'arrow' | 'rect' | 'circle';
  points?: number[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  color: string;
  strokeWidth: number;
}

interface ScreenAnnotationProps {
  isSharingHost: boolean;
  participantName?: string;
  annotations: AnnotationItem[];
  onChangeAnnotations?: (annotations: AnnotationItem[]) => void;
  onAnnotationStart?: (item: AnnotationItem) => void;
  onAnnotationDraw?: (data: { id: string; points: number[] }) => void;
  onAnnotationEnd?: (data: { id: string }) => void;
  onClearAnnotations?: () => void;
  onCloseAnnotation?: () => void;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  hideToolbar?: boolean;
  extraToolbarButtons?: React.ReactNode;
}

const COLOR_PALETTE = [
  '#ef4444',
  '#f97316', 
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#a855f7', 
  '#ffffff',
];

const ERASER_RADIUS_PX = 24;

function distToSegment(
  p: { x: number; y: number },
  v: { x: number; y: number },
  w: { x: number; y: number }
): number {
  const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

function isAnnotationInEraser(
  item: AnnotationItem,
  pointerX: number,
  pointerY: number,
  stageWidth: number,
  stageHeight: number,
  eraserRadius: number
): boolean {
  if (stageWidth <= 0 || stageHeight <= 0) return false;

  // Check Pen / Freehand line
  if (item.tool === 'pen' && item.points) {
    for (let i = 0; i < item.points.length - 1; i += 2) {
      const x1 = item.points[i] * stageWidth;
      const y1 = item.points[i + 1] * stageHeight;
      if (Math.hypot(x1 - pointerX, y1 - pointerY) <= eraserRadius) return true;
      if (i + 3 < item.points.length) {
        const x2 = item.points[i + 2] * stageWidth;
        const y2 = item.points[i + 3] * stageHeight;
        if (distToSegment({ x: pointerX, y: pointerY }, { x: x1, y: y1 }, { x: x2, y: y2 }) <= eraserRadius) {
          return true;
        }
      }
    }
  }

  // Check Arrow
  if (item.tool === 'arrow' && item.points && item.points.length >= 4) {
    const x1 = item.points[0] * stageWidth;
    const y1 = item.points[1] * stageHeight;
    const x2 = item.points[2] * stageWidth;
    const y2 = item.points[3] * stageHeight;
    if (distToSegment({ x: pointerX, y: pointerY }, { x: x1, y: y1 }, { x: x2, y: y2 }) <= eraserRadius) {
      return true;
    }
  }

  // Check Rectangle
  if (item.tool === 'rect' && item.x !== undefined && item.y !== undefined && item.points) {
    const rx = item.x * stageWidth;
    const ry = item.y * stageHeight;
    const rw = item.points[0] * stageWidth;
    const rh = item.points[1] * stageHeight;
    const minX = Math.min(rx, rx + rw);
    const maxX = Math.max(rx, rx + rw);
    const minY = Math.min(ry, ry + rh);
    const maxY = Math.max(ry, ry + rh);

    const closestX = Math.max(minX, Math.min(pointerX, maxX));
    const closestY = Math.min(minY, Math.min(pointerY, maxY));
    if (Math.hypot(pointerX - closestX, pointerY - closestY) <= eraserRadius) {
      return true;
    }
  }

  // Check Circle
  if (item.tool === 'circle' && item.x !== undefined && item.y !== undefined) {
    const cx = item.x * stageWidth;
    const cy = item.y * stageHeight;
    const avgDim = (stageWidth + stageHeight) / 2;
    const r = (item.radius ?? item.points?.[2] ?? 0) * avgDim;
    const dist = Math.hypot(pointerX - cx, pointerY - cy);
    if (dist <= r + eraserRadius) return true;
  }

  return false;
}

export default function ScreenAnnotation({
  isSharingHost,
  participantName,
  annotations,
  onChangeAnnotations,
  onAnnotationStart,
  onAnnotationDraw,
  onAnnotationEnd,
  onClearAnnotations,
  onCloseAnnotation,
  videoRef,
  hideToolbar,
  extraToolbarButtons,
}: ScreenAnnotationProps) {
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const assignedColor = useMemo(() => {
    const cleanName = (participantName || '').replace(/\s*\(Anda\)\s*/g, '').trim();
    return stringToColor(cleanName || 'Guest');
  }, [participantName]);

  const [activeTool, setActiveTool] = useState<'pen' | 'arrow' | 'rect' | 'circle' | 'eraser'>('pen');
  const [activeColor, setActiveColor] = useState(assignedColor);
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [eraserRadius, setEraserRadius] = useState(14); // 8 = Small, 14 = Medium, 28 = Large
  const [eraserPos, setEraserPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setActiveColor(assignedColor);
  }, [assignedColor]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);
  const activeItemRef = useRef<AnnotationItem | null>(null);
  const lastDrawTimeRef = useRef<number>(0);
  const pendingPointsRef = useRef<number[]>([]);

  const [videoRect, setVideoRect] = useState({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const cWidth = containerRef.current.offsetWidth;
        const cHeight = containerRef.current.offsetHeight;
        setStageSize({ width: cWidth, height: cHeight });

        // Calculate actual video bounding box (object-fit: contain)
        const videoElement = videoRef?.current;
        if (videoElement && videoElement.videoWidth && videoElement.videoHeight) {
          const vWidth = videoElement.videoWidth;
          const vHeight = videoElement.videoHeight;
          const containerRatio = cWidth / cHeight;
          const videoRatio = vWidth / vHeight;

          let renderWidth = cWidth;
          let renderHeight = cHeight;
          let renderX = 0;
          let renderY = 0;

          if (videoRatio > containerRatio) {
            // Letterboxing (black bars top/bottom)
            renderHeight = cWidth / videoRatio;
            renderY = (cHeight - renderHeight) / 2;
          } else {
            // Pillarboxing (black bars left/right)
            renderWidth = cHeight * videoRatio;
            renderX = (cWidth - renderWidth) / 2;
          }

          setVideoRect({ x: renderX, y: renderY, width: renderWidth, height: renderHeight });
        } else {
          setVideoRect({ x: 0, y: 0, width: cWidth, height: cHeight });
        }
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    
    // Also update when video metadata loads (resolution becomes available)
    const videoEl = videoRef?.current;
    if (videoEl) {
      videoEl.addEventListener('loadedmetadata', updateSize);
      // Fallback polling in case we missed it or it changes
      const interval = setInterval(updateSize, 1000);
      return () => {
        window.removeEventListener('resize', updateSize);
        videoEl.removeEventListener('loadedmetadata', updateSize);
        clearInterval(interval);
      };
    }

    return () => window.removeEventListener('resize', updateSize);
  }, [videoRef]);

  const annotationsRef = useRef(annotations);
  useEffect(() => {
    annotationsRef.current = annotations;
  }, [annotations]);

  const eraseInRadius = (pointerX: number, pointerY: number) => {
    const toRemoveIds = new Set<string>();
    annotationsRef.current.forEach((item) => {
      if (isAnnotationInEraser(item, pointerX, pointerY, stageSize.width, stageSize.height, eraserRadius)) {
        toRemoveIds.add(item.id);
      }
    });

    if (toRemoveIds.size > 0) {
      const filtered = annotationsRef.current.filter((item) => !toRemoveIds.has(item.id));
      annotationsRef.current = filtered;
      onChangeAnnotations?.(filtered);
    }
  };

  const handleMouseDown = (e: any) => {
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (!point) return;

    // Use videoRect to calculate true normalized coordinates
    let normX = 0;
    let normY = 0;
    
    if (videoRect.width > 0 && videoRect.height > 0) {
      // Offset point by the letterbox margins
      const trueX = point.x - videoRect.x;
      const trueY = point.y - videoRect.y;
      
      // Normalize against the actual video bounding box
      normX = trueX / videoRect.width;
      normY = trueY / videoRect.height;
    } else {
      // Fallback if video isn't loaded
      normX = point.x / stageSize.width;
      normY = point.y / stageSize.height;
    }

    setIsDrawing(true);

    if (activeTool === 'eraser') {
      setEraserPos({ x: point.x, y: point.y });
      eraseInRadius(point.x, point.y);
      return;
    }

    const newItem: AnnotationItem = {
      id: `ann-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tool: activeTool,
      color: activeColor,
      strokeWidth,
      points: [normX, normY],
      x: normX,
      y: normY,
      width: 0,
      height: 0,
      radius: 0,
    };

    activeItemRef.current = newItem;
    pendingPointsRef.current = [];
    lastDrawTimeRef.current = Date.now();

    if (onAnnotationStart) {
      onAnnotationStart(newItem);
    } else {
      onChangeAnnotations?.([...annotationsRef.current, newItem]);
    }
  };

  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (!point) return;

    if (activeTool === 'eraser') {
      setEraserPos({ x: point.x, y: point.y });
      if (isDrawing) {
        eraseInRadius(point.x, point.y);
      }
      return;
    }

    if (!isDrawing || !activeItemRef.current) return;

    let normX = 0;
    let normY = 0;
    
    if (videoRect.width > 0 && videoRect.height > 0) {
      const trueX = point.x - videoRect.x;
      const trueY = point.y - videoRect.y;
      normX = trueX / videoRect.width;
      normY = trueY / videoRect.height;
    } else {
      normX = point.x / stageSize.width;
      normY = point.y / stageSize.height;
    }

    const item = activeItemRef.current;
    let payloadPoints: number[] = [];

    if (activeTool === 'pen') {
      pendingPointsRef.current.push(normX, normY);
      payloadPoints = [...pendingPointsRef.current];
    } else if (activeTool === 'arrow') {
      const startX = item.points ? item.points[0] : normX;
      const startY = item.points ? item.points[1] : normY;
      payloadPoints = [startX, startY, normX, normY];
    } else if (activeTool === 'rect') {
      const startX = item.x ?? normX;
      const startY = item.y ?? normY;
      const w = normX - startX;
      const h = normY - startY;
      payloadPoints = [w, h, 0];
    } else if (activeTool === 'circle') {
      const startX = item.x ?? normX;
      const startY = item.y ?? normY;
      const dx = normX - startX;
      const dy = normY - startY;
      const r = Math.sqrt(dx * dx + dy * dy);
      payloadPoints = [0, 0, r];
    }

    const now = Date.now();
    // Throttled ~16ms (60fps) delta streaming
    if (now - lastDrawTimeRef.current >= 16) {
      lastDrawTimeRef.current = now;
      if (onAnnotationDraw) {
        onAnnotationDraw({ id: item.id, points: payloadPoints });
        if (activeTool === 'pen') {
          pendingPointsRef.current = [];
        }
      } else {
        const currentList = annotationsRef.current;
        if (currentList.length > 0) {
          const lastIndex = currentList.length - 1;
          const lastItem = { ...currentList[lastIndex] };
          if (activeTool === 'pen') {
            lastItem.points = [...(lastItem.points || []), normX, normY];
          } else if (activeTool === 'arrow') {
            lastItem.points = payloadPoints;
          } else if (activeTool === 'rect') {
            lastItem.width = payloadPoints[0];
            lastItem.height = payloadPoints[1];
          } else if (activeTool === 'circle') {
            lastItem.radius = payloadPoints[2];
          }
          const updated = [...currentList];
          updated[lastIndex] = lastItem;
          onChangeAnnotations?.(updated);
        }
      }
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && activeItemRef.current) {
      if (onAnnotationEnd) {
        onAnnotationEnd({ id: activeItemRef.current.id });
      }
    }
    setIsDrawing(false);
    activeItemRef.current = null;
    pendingPointsRef.current = [];
  };

  const getDenormalizedPoints = (points?: number[]) => {
    if (!points) return [];
    const vWidth = videoRect.width > 0 ? videoRect.width : stageSize.width;
    const vHeight = videoRect.height > 0 ? videoRect.height : stageSize.height;
    const vX = videoRect.width > 0 ? videoRect.x : 0;
    const vY = videoRect.height > 0 ? videoRect.y : 0;

    return points.map((val, idx) =>
      idx % 2 === 0 ? (val * vWidth) + vX : (val * vHeight) + vY
    );
  };

  return (
    <div
      ref={containerRef}
      onMouseLeave={() => setEraserPos(null)}
      className="absolute inset-0 w-full h-full z-20 pointer-events-auto"
    >
      {stageSize.width > 0 && stageSize.height > 0 && (
        <Stage
          width={stageSize.width}
          height={stageSize.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          style={{ cursor: activeTool === 'eraser' ? 'none' : 'crosshair' }}
        >
          <Layer>
            {annotations.map((item) => {
              if (item.tool === 'pen') {
                return (
                  <Line
                    key={item.id}
                    id={item.id}
                    points={getDenormalizedPoints(item.points)}
                    stroke={item.color}
                    strokeWidth={item.strokeWidth}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                  />
                );
              }
              if (item.tool === 'arrow') {
                const pts = getDenormalizedPoints(item.points);
                if (pts.length < 4) return null;
                return (
                  <Arrow
                    key={item.id}
                    id={item.id}
                    points={pts}
                    stroke={item.color}
                    fill={item.color}
                    strokeWidth={item.strokeWidth}
                    pointerLength={12}
                    pointerWidth={12}
                  />
                );
              }
              if (item.tool === 'rect') {
                const vWidth = videoRect.width > 0 ? videoRect.width : stageSize.width;
                const vHeight = videoRect.height > 0 ? videoRect.height : stageSize.height;
                const vX = videoRect.width > 0 ? videoRect.x : 0;
                const vY = videoRect.height > 0 ? videoRect.y : 0;
                return (
                  <Rect
                    key={item.id}
                    id={item.id}
                    x={(item.x ?? 0) * vWidth + vX}
                    y={(item.y ?? 0) * vHeight + vY}
                    width={(item.width ?? 0) * vWidth}
                    height={(item.height ?? 0) * vHeight}
                    stroke={item.color}
                    strokeWidth={item.strokeWidth}
                    cornerRadius={4}
                  />
                );
              }
              if (item.tool === 'circle') {
                const vWidth = videoRect.width > 0 ? videoRect.width : stageSize.width;
                const vHeight = videoRect.height > 0 ? videoRect.height : stageSize.height;
                const vX = videoRect.width > 0 ? videoRect.x : 0;
                const vY = videoRect.height > 0 ? videoRect.y : 0;
                const avgDim = (vWidth + vHeight) / 2;
                return (
                  <Circle
                    key={item.id}
                    id={item.id}
                    x={(item.x ?? 0) * vWidth + vX}
                    y={(item.y ?? 0) * vHeight + vY}
                    radius={(item.radius ?? 0) * avgDim}
                    stroke={item.color}
                    strokeWidth={item.strokeWidth}
                  />
                );
              }
              return null;
            })}

            {/* Visual Eraser Circle Cursor Ring */}
            {activeTool === 'eraser' && eraserPos && (
              <Circle
                x={eraserPos.x}
                y={eraserPos.y}
                radius={eraserRadius}
                stroke="#ef4444"
                strokeWidth={2}
                dash={[4, 4]}
                fill="rgba(239, 68, 68, 0.2)"
                listening={false}
              />
            )}
          </Layer>
        </Stage>
      )}

      {!hideToolbar && onCloseAnnotation && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Floating Eraser Radius Size Controller (Appears directly above toolbar when eraser is active) */}
          {activeTool === 'eraser' && !isToolbarCollapsed && (
            <div className="absolute -top-13 left-1/2 -translate-x-1/2 bg-[#1e1f22]/95 backdrop-blur-md border border-[#3c4043] rounded-xl shadow-2xl px-3.5 py-2 flex items-center gap-3 text-white animate-in fade-in slide-in-from-bottom-2 duration-150 whitespace-nowrap">
              <span className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
                <Eraser className="w-3.5 h-3.5 text-red-400" />
                <span>Ukuran Penghapus:</span>
              </span>

              {/* Slider Input (Bisa digeser) */}
              <div className="flex items-center gap-2.5">
                <input
                  type="range"
                  min="5"
                  max="45"
                  value={eraserRadius}
                  onChange={(e) => setEraserRadius(Number(e.target.value))}
                  onInput={(e: any) => setEraserRadius(Number(e.target.value))}
                  className="w-28 h-1.5 bg-[#3c4043] rounded-lg appearance-none cursor-pointer accent-red-500 hover:accent-red-400 transition-all"
                />
                
                {/* Live Circle Preview Dot */}
                <div className="w-6 h-6 flex items-center justify-center bg-[#2b2c30] rounded-md border border-[#3c4043]">
                  <div 
                    className="rounded-full bg-red-500/80 border border-red-300 transition-all duration-75"
                    style={{ 
                      width: `${Math.max(4, Math.min(20, eraserRadius * 0.5))}px`,
                      height: `${Math.max(4, Math.min(20, eraserRadius * 0.5))}px` 
                    }}
                  />
                </div>

                <span className="text-xs font-bold text-red-400 min-w-[32px] text-right">{eraserRadius * 2}px</span>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1 border-l border-[#3c4043] pl-2.5">
                {[
                  { label: 'S', r: 8 },
                  { label: 'M', r: 14 },
                  { label: 'L', r: 24 },
                  { label: 'XL', r: 36 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setEraserRadius(preset.r)}
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold transition cursor-pointer ${
                      eraserRadius === preset.r ? 'bg-red-600 text-white shadow-sm ring-1 ring-red-400' : 'hover:bg-[#3c4043] text-gray-400'
                    }`}
                    title={`Ukuran ${preset.label} (${preset.r * 2}px)`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-[#1e1f22]/90 backdrop-blur-md border border-[#3c4043] rounded-2xl shadow-2xl p-2 flex items-center gap-1.5 text-white">
          {!isToolbarCollapsed ? (
            <>
              <div className="flex items-center gap-1 pr-2 border-r border-[#3c4043]">
                <button
                  onClick={() => setActiveTool('pen')}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    activeTool === 'pen'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'hover:bg-[#3c4043]/70 text-gray-300'
                  }`}
                  title="Coretan (Pen)"
                >
                  <Pencil className="w-4.5 h-4.5" />
                </button>

                <button
                  onClick={() => setActiveTool('arrow')}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    activeTool === 'arrow'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'hover:bg-[#3c4043]/70 text-gray-300'
                  }`}
                  title="Panah (Arrow)"
                >
                  <ArrowRight className="w-4.5 h-4.5" />
                </button>

                <button
                  onClick={() => setActiveTool('rect')}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    activeTool === 'rect'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'hover:bg-[#3c4043]/70 text-gray-300'
                  }`}
                  title="Kotak (Rectangle)"
                >
                  <Square className="w-4.5 h-4.5" />
                </button>

                <button
                  onClick={() => setActiveTool('circle')}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    activeTool === 'circle'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'hover:bg-[#3c4043]/70 text-gray-300'
                  }`}
                  title="Lingkaran (Circle)"
                >
                  <CircleIcon className="w-4.5 h-4.5" />
                </button>

                <button
                  onClick={() => setActiveTool('eraser')}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    activeTool === 'eraser'
                      ? 'bg-red-600 text-white shadow-lg shadow-red-500/30'
                      : 'hover:bg-[#3c4043]/70 text-gray-300'
                  }`}
                  title="Hapus Garis (Eraser)"
                >
                  <Eraser className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="flex items-center gap-1.5 px-2 border-r border-[#3c4043]">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => setActiveColor(c)}
                    className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                      activeColor === c ? 'scale-125 ring-2 ring-white shadow-md' : 'hover:scale-110 opacity-80'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1 px-2 border-r border-[#3c4043]">
                {[2, 4, 8].map((w) => {
                  const targetRadius = w === 2 ? 8 : w === 4 ? 14 : 28;
                  const isActive = activeTool === 'eraser' ? eraserRadius === targetRadius : strokeWidth === w;
                  return (
                    <button
                      key={w}
                      onClick={() => {
                        if (activeTool === 'eraser') {
                          setEraserRadius(targetRadius);
                        } else {
                          setStrokeWidth(w);
                        }
                      }}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-semibold cursor-pointer transition ${
                        isActive ? 'bg-blue-500 text-white shadow-md' : 'hover:bg-[#3c4043] text-gray-400'
                      }`}
                      title={activeTool === 'eraser' ? `Ukuran Penghapus: ${w === 2 ? 'Kecil' : w === 4 ? 'Sedang' : 'Besar'}` : `Ketebalan Garis`}
                    >
                      {w === 2 ? 'S' : w === 4 ? 'M' : 'L'}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={onClearAnnotations}
                className="p-2 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors cursor-pointer"
                title="Hapus Semua Anotasi"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>

              <button
                onClick={() => setIsToolbarCollapsed(true)}
                className="p-2 text-gray-400 hover:text-white hover:bg-[#3c4043] rounded-xl transition-colors cursor-pointer"
                title="Kecilkan Toolbar"
              >
                <Minimize2 className="w-4 h-4" />
              </button>

              {onCloseAnnotation && (
                <button
                  onClick={onCloseAnnotation}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer border-l border-[#3c4043] pl-2 pr-1"
                  title="Tutup Anotasi Layar"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              )}

              {extraToolbarButtons}
            </>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsToolbarCollapsed(false)}
                className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-xl transition-colors cursor-pointer flex items-center gap-2 text-xs font-semibold"
                title="Buka Tools Anotasi"
              >
                <Pencil className="w-4 h-4" />
                <span>Screen Annotation</span>
              </button>
              {onCloseAnnotation && (
                <button
                  onClick={onCloseAnnotation}
                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                  title="Tutup Anotasi Layar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
