'use client';

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { Lock } from 'lucide-react';
import { stringToColor } from '@/lib/meeting';

interface ExcalidrawCanvasProps {
  isHost: boolean;
  canDraw?: boolean;
  participantName?: string;
  initialSnapshot?: any;
  onSnapshotChange?: (snapshot: any) => void;
  isMinimized?: boolean;
}

export default function ExcalidrawCanvas({
  isHost,
  canDraw = false,
  participantName,
  initialSnapshot,
  onSnapshotChange,
  isMinimized = false,
}: ExcalidrawCanvasProps) {
  const isUpdatingFromRemote = useRef(false);
  const excalidrawAPIRef = useRef<any>(null);
  const lastEmittedSnapshotStr = useRef<string>('');

  const assignedColor = useMemo(() => {
    const cleanName = (participantName || '').replace(/\s*\(Anda\)\s*/g, '').trim();
    return stringToColor(cleanName || 'Guest');
  }, [participantName]);

  // Apply remote snapshot updates for all users
  useEffect(() => {
    if (excalidrawAPIRef.current && initialSnapshot) {
      try {
        const snapshotStr = JSON.stringify(initialSnapshot.elements || []);
        if (snapshotStr !== lastEmittedSnapshotStr.current) {
          lastEmittedSnapshotStr.current = snapshotStr;
          isUpdatingFromRemote.current = true;
          excalidrawAPIRef.current.updateScene({
            elements: initialSnapshot.elements || [],
          });
        }
      } catch (err) {
        console.error('Failed to update Excalidraw scene:', err);
      } finally {
        setTimeout(() => {
          isUpdatingFromRemote.current = false;
        }, 50);
      }
    }
  }, [initialSnapshot]);

  const handleChange = useCallback(
    (elements: readonly any[], appState: any) => {
      if (isUpdatingFromRemote.current || !canDraw || !onSnapshotChange) return;

      try {
        const currentStr = JSON.stringify(elements);
        if (currentStr !== lastEmittedSnapshotStr.current) {
          lastEmittedSnapshotStr.current = currentStr;
          onSnapshotChange({
            elements: Array.from(elements),
            appState: {
              viewBackgroundColor: appState.viewBackgroundColor,
            },
          });
        }
      } catch (_) {}
    },
    [isHost, onSnapshotChange]
  );

  const initialData = useMemo(() => {
    return {
      elements: initialSnapshot?.elements || [],
      appState: {
        theme: 'light' as const,
        viewBackgroundColor: '#ffffff',
        currentItemStrokeColor: assignedColor,
        viewModeEnabled: !isHost,
      },
    };
  }, [assignedColor]); // Computed once or when assignedColor updates

  const setApi = useCallback((api: any) => {
    excalidrawAPIRef.current = api;
    if (api) {
      try {
        api.updateScene({
          appState: {
            currentItemStrokeColor: assignedColor,
          },
        });
      } catch (_) {}
    }
  }, [assignedColor]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-white excalidraw-whiteboard-container">
      <style>{`
        .excalidraw-whiteboard-container .excalidraw {
          --color-surface-low: #ffffff !important;
          --island-bg-color: #ffffff !important;
          --color-primary: #121212 !important;
          background-color: #ffffff !important;
        }
        .excalidraw-whiteboard-container .excalidraw .App-bottom-bar,
        .excalidraw-whiteboard-container .excalidraw .layer-ui__wrapper__footer,
        .excalidraw-whiteboard-container .excalidraw .footer-center {
          background-color: #ffffff !important;
          background: #ffffff !important;
          pointer-events: ${canDraw ? 'auto' : 'none'};
          touch-action: ${canDraw ? 'auto' : 'none'};
        }
      `}</style>
      <Excalidraw
        excalidrawAPI={setApi}
        viewModeEnabled={!canDraw}
        theme="light"
        onChange={handleChange}
        initialData={initialData}
      />

      {/* Penanda warna (hanya untuk yang bisa menggambar) */}
      {canDraw && !isMinimized && (
        <div className="absolute bottom-4 left-4 z-[500] pointer-events-none">
          <div className="bg-[#202124]/90 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-[#3c4043] shadow-xl flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full border border-white/60 shadow-sm shrink-0"
              style={{ backgroundColor: assignedColor }}
            />
            <span className="text-gray-200">
              Warna Otomatis: <strong className="text-white">{assignedColor}</strong>
            </span>
          </div>
        </div>
      )}

      {!canDraw && !isMinimized && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500] pointer-events-none">
          <div className="bg-[#202124]/90 backdrop-blur-md text-white text-[10px] sm:text-xs font-semibold px-4 py-2 rounded-full border border-[#3c4043] shadow-xl flex items-center gap-2 whitespace-nowrap">
            <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
            <span>Mode Lihat Saja</span>
          </div>
        </div>
      )}
    </div>
  );
}
