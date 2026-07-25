'use client';

import { useEffect, useRef } from 'react';
import { Tldraw, Editor, getSnapshot, loadSnapshot } from 'tldraw';
import 'tldraw/tldraw.css';
import { Lock } from 'lucide-react';

interface TldrawCanvasProps {
  isHost: boolean;
  initialSnapshot?: any;
  onSnapshotChange?: (snapshot: any) => void;
}

export default function TldrawCanvas({ isHost, initialSnapshot, onSnapshotChange }: TldrawCanvasProps) {
  const editorRef = useRef<Editor | null>(null);
  const isUpdatingFromRemote = useRef<boolean>(false);

  const handleMount = (editor: Editor) => {
    editorRef.current = editor;

    if (!isHost) {
      editor.updateInstanceState({ isReadonly: true });
    }

    if (initialSnapshot && typeof initialSnapshot === 'object') {
      try {
        isUpdatingFromRemote.current = true;
        loadSnapshot(editor.store, initialSnapshot);
      } catch (err) {
        console.error('Failed to load initial tldraw snapshot:', err);
      } finally {
        isUpdatingFromRemote.current = false;
      }
    }

    // Listen to store changes
    const cleanup = editor.store.listen(
      () => {
        if (isUpdatingFromRemote.current) return;
        if (onSnapshotChange && isHost && editorRef.current) {
          try {
            const rawSnapshot = getSnapshot(editorRef.current.store);
            const serializableSnapshot = JSON.parse(JSON.stringify(rawSnapshot));
            onSnapshotChange(serializableSnapshot);
          } catch (e) {
            console.error('Error taking snapshot:', e);
          }
        }
      },
      { source: 'user', scope: 'all' }
    );

    return () => {
      cleanup();
    };
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateInstanceState({ isReadonly: !isHost });
    }
  }, [isHost]);

  useEffect(() => {
    if (editorRef.current && initialSnapshot && typeof initialSnapshot === 'object' && !isHost) {
      try {
        isUpdatingFromRemote.current = true;
        loadSnapshot(editorRef.current.store, initialSnapshot);
      } catch (err) {
        console.error('Error applying remote tldraw snapshot:', err);
      } finally {
        isUpdatingFromRemote.current = false;
      }
    }
  }, [initialSnapshot, isHost]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '500px' }}>
      <Tldraw onMount={handleMount} />

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

