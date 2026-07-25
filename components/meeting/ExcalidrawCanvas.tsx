'use client';

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { Lock } from 'lucide-react';

interface ExcalidrawCanvasProps {
  isHost: boolean;
  initialSnapshot?: any;
  onSnapshotChange?: (snapshot: any) => void;
}

export default function ExcalidrawCanvas({
  isHost,
  initialSnapshot,
  onSnapshotChange,
}: ExcalidrawCanvasProps) {
  const isUpdatingFromRemote = useRef(false);
  const excalidrawAPIRef = useRef<any>(null);
  const lastEmittedSnapshotStr = useRef<string>('');

  // Apply remote snapshot updates for non-hosts
  useEffect(() => {
    if (excalidrawAPIRef.current && initialSnapshot && !isHost) {
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
  }, [initialSnapshot, isHost]);

  const handleChange = useCallback(
    (elements: readonly any[], appState: any) => {
      if (isUpdatingFromRemote.current || !isHost || !onSnapshotChange) return;

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
        viewModeEnabled: !isHost,
      },
    };
  }, []); // Computed once on mount

  const setApi = useCallback((api: any) => {
    excalidrawAPIRef.current = api;
  }, []);

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
        }
      `}</style>
      <Excalidraw
        excalidrawAPI={setApi}
        viewModeEnabled={!isHost}
        theme="light"
        onChange={handleChange}
        initialData={initialData}
      />

      {!isHost && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500] pointer-events-none">
          <div className="bg-[#202124]/90 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-full border border-[#3c4043] shadow-xl flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Mode Lihat Saja (Hanya Host yang dapat menggambar)</span>
          </div>
        </div>
      )}
    </div>
  );
}
