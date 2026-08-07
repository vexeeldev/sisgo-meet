const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,

  // ─── Overlay on/off (dari tombol di Main App) ───────────────────────────
  toggleOverlay: (show) => ipcRenderer.send("toggle-overlay", show),

  pauseDrawing: () => ipcRenderer.send("pause-drawing"),
  resumeDrawing: () => ipcRenderer.send("resume-drawing"),

  // ─── Tool / Clear ────────────────────────────────────────────────────────
  clearCanvas: () => ipcRenderer.send("clear-canvas"),
  returnToApp: () => ipcRenderer.send("return-to-app"),

  // ─── Listeners: Main App menerima state overlay ──────────────────────────
  onOverlayStateChange: (callback) => {
    const handler = (_event, visible) => callback(visible);
    ipcRenderer.on("overlay-state-change", handler);
    return () => ipcRenderer.removeListener("overlay-state-change", handler);
  },

  // ─── Listeners: Mini button menerima state ───────────────────────────────
  onMiniState: (callback) => {
    const handler = (_event, state) => callback(state);
    ipcRenderer.on("mini-state", handler);
    return () => ipcRenderer.removeListener("mini-state", handler);
  },

  // ─── Listeners: Canvas menerima clear command dari main ──────────────────
  onDoClearCanvas: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("do-clear-canvas", handler);
    return () => ipcRenderer.removeListener("do-clear-canvas", handler);
  },

  // ─── Annotation sync (WebRTC) ────────────────────────────────────────────
  sendLocalStroke: (stroke) => ipcRenderer.send("annotation-stroke-local", stroke),
  onRemoteStroke: (callback) => {
    const handler = (_event, stroke) => callback(stroke);
    ipcRenderer.on("annotation-stroke-remote", handler);
    return () => ipcRenderer.removeListener("annotation-stroke-remote", handler);
  },
  onClearOverlayRemote: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("annotation-clear-remote", handler);
    return () => ipcRenderer.removeListener("annotation-clear-remote", handler);
  },
  sendRemoteStroke: (stroke) => ipcRenderer.send("annotation-stroke-remote", stroke),
  clearOverlayRemote: () => ipcRenderer.send("annotation-clear-remote"),

  // ─── Dynamic Click-Through ───────────────────────────────────────────────
  setIgnoreMouse: (ignore) => ipcRenderer.send("set-ignore-mouse", ignore),
  onTogglePauseState: (callback) => {
    const handler = (_event, isPaused) => callback(isPaused);
    ipcRenderer.on("toggle-pause-state", handler);
    return () => ipcRenderer.removeListener("toggle-pause-state", handler);
  },
});