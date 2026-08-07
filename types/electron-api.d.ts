// Global type declaration for Electron API (preload.js contextBridge)

interface AnnotationStroke {
  id?: string;
  tool?: string;
  points?: number[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  color: string;
  strokeWidth?: number;
  size?: number; // Legacy
  eraser?: boolean; // Legacy
}

declare global {
  interface Window {
    electronAPI?: {
      platform?: string;

      // Overlay control
      toggleOverlay: (show: boolean) => void;
      pauseDrawing: () => void;
      resumeDrawing: () => void;
      clearCanvas: () => void;
      returnToApp: () => void;

      // State listeners
      onOverlayStateChange: (cb: (visible: boolean) => void) => () => void;
      onMiniState: (cb: (state: string) => void) => () => void;
      onDoClearCanvas: (cb: () => void) => () => void;
      onTogglePauseState?: (cb: (isPaused: boolean) => void) => () => void;

      // Annotation WebRTC sync
      sendLocalStroke: (stroke: AnnotationStroke) => void;
      onRemoteStroke: (cb: (stroke: AnnotationStroke) => void) => () => void;
      onClearOverlayRemote: (cb: () => void) => () => void;
      sendRemoteStroke?: (stroke: AnnotationStroke) => void;
      clearOverlayRemote?: () => void;
      setIgnoreMouseEvents: (ignore: boolean) => void;
      
      // Full Sync
      syncAnnotationsToOverlay?: (annotations: any[]) => void;
      onSyncAnnotationsToOverlay?: (cb: (annotations: any[]) => void) => () => void;
      syncAnnotationsToMain?: (annotations: any[]) => void;
      onSyncAnnotationsToMain?: (cb: (annotations: any[]) => void) => () => void;

      // Legacy no-ops
      setIgnoreMouse?: (ignore: boolean) => void;
      setDrawMode?: (mode: string) => void;
    };
  }
}

export {};
