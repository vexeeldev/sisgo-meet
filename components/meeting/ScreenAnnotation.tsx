'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line, Arrow, Rect, Circle } from 'react-konva';
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
  annotations: AnnotationItem[];
  onChangeAnnotations?: (annotations: AnnotationItem[]) => void;
  onClearAnnotations?: () => void;
  onCloseAnnotation?: () => void;
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

export default function ScreenAnnotation({
  isSharingHost,
  annotations,
  onChangeAnnotations,
  onClearAnnotations,
  onCloseAnnotation,
}: ScreenAnnotationProps) {
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeTool, setActiveTool] = useState<'pen' | 'arrow' | 'rect' | 'circle' | 'eraser'>('pen');
  const [activeColor, setActiveColor] = useState('#ef4444');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const annotationsRef = useRef(annotations);
  useEffect(() => {
    annotationsRef.current = annotations;
  }, [annotations]);

  const handleMouseDown = (e: any) => {
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (!point) return;

    const normX = point.x / stageSize.width;
    const normY = point.y / stageSize.height;

    setIsDrawing(true);

    if (activeTool === 'eraser') {
      const clickedShape = e.target;
      if (clickedShape && clickedShape.attrs && clickedShape.attrs.id) {
        const shapeId = clickedShape.attrs.id;
        const filtered = annotationsRef.current.filter((item) => item.id !== shapeId);
        onChangeAnnotations?.(filtered);
      }
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

    onChangeAnnotations?.([...annotationsRef.current, newItem]);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (!point) return;

    const normX = point.x / stageSize.width;
    const normY = point.y / stageSize.height;

    if (activeTool === 'eraser') {
      const clickedShape = e.target;
      if (clickedShape && clickedShape.attrs && clickedShape.attrs.id) {
        const shapeId = clickedShape.attrs.id;
        const filtered = annotationsRef.current.filter((item) => item.id !== shapeId);
        onChangeAnnotations?.(filtered);
      }
      return;
    }

    const currentList = annotationsRef.current;
    if (currentList.length === 0) return;

    const lastIndex = currentList.length - 1;
    const lastItem = { ...currentList[lastIndex] };

    if (activeTool === 'pen') {
      lastItem.points = [...(lastItem.points || []), normX, normY];
    } else if (activeTool === 'arrow') {
      const startX = lastItem.points ? lastItem.points[0] : normX;
      const startY = lastItem.points ? lastItem.points[1] : normY;
      lastItem.points = [startX, startY, normX, normY];
    } else if (activeTool === 'rect') {
      const startX = lastItem.x ?? normX;
      const startY = lastItem.y ?? normY;
      lastItem.width = normX - startX;
      lastItem.height = normY - startY;
    } else if (activeTool === 'circle') {
      const startX = lastItem.x ?? normX;
      const startY = lastItem.y ?? normY;
      const dx = normX - startX;
      const dy = normY - startY;
      lastItem.radius = Math.sqrt(dx * dx + dy * dy);
    }

    const updated = [...currentList];
    updated[lastIndex] = lastItem;
    onChangeAnnotations?.(updated);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const getDenormalizedPoints = (points?: number[]) => {
    if (!points) return [];
    return points.map((val, idx) =>
      idx % 2 === 0 ? val * stageSize.width : val * stageSize.height
    );
  };

  return (
    <div
      ref={containerRef}
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
          style={{ cursor: isSharingHost ? (activeTool === 'eraser' ? 'crosshair' : 'crosshair') : 'default' }}
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
                return (
                  <Rect
                    key={item.id}
                    id={item.id}
                    x={(item.x ?? 0) * stageSize.width}
                    y={(item.y ?? 0) * stageSize.height}
                    width={(item.width ?? 0) * stageSize.width}
                    height={(item.height ?? 0) * stageSize.height}
                    stroke={item.color}
                    strokeWidth={item.strokeWidth}
                    cornerRadius={4}
                  />
                );
              }
              if (item.tool === 'circle') {
                const avgDim = (stageSize.width + stageSize.height) / 2;
                return (
                  <Circle
                    key={item.id}
                    id={item.id}
                    x={(item.x ?? 0) * stageSize.width}
                    y={(item.y ?? 0) * stageSize.height}
                    radius={(item.radius ?? 0) * avgDim}
                    stroke={item.color}
                    strokeWidth={item.strokeWidth}
                  />
                );
              }
              return null;
            })}
          </Layer>
        </Stage>
      )}

      {onCloseAnnotation && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-200">
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
                {[2, 4, 8].map((w) => (
                  <button
                    key={w}
                    onClick={() => setStrokeWidth(w)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-semibold cursor-pointer transition ${
                      strokeWidth === w ? 'bg-blue-500 text-white' : 'hover:bg-[#3c4043] text-gray-400'
                    }`}
                  >
                    {w === 2 ? 'S' : w === 4 ? 'M' : 'L'}
                  </button>
                ))}
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
