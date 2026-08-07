// Global type declaration for Electron API (preload.js contextBridge)

interface AnnotationStroke {
  points: { x: number; y: number }[];
  color: string;
  size: number;
  eraser?: boolean;
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

      // Legacy no-ops
      setIgnoreMouse?: (ignore: boolean) => void;
      setDrawMode?: (mode: string) => void;
    };
  }
}

export {};
