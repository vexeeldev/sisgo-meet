import { app, BrowserWindow, ipcMain, screen, session, desktopCapturer, Menu, globalShortcut } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const _dirname = typeof __dirname !== "undefined" ? __dirname : process.cwd();

// Linux: paksa X11 mode via XWayland untuk transparency yang stabil
if (process.platform === "linux") {
    app.commandLine.appendSwitch("enable-transparent-visuals");
    app.commandLine.appendSwitch("ozone-platform", "x11");
    app.disableHardwareAcceleration();
}

let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null; // Canvas coret-coret (fullscreen)
let isPausedMain = false; // State pelacak pause/resume untuk shortcut

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getVirtualScreenBounds() {
    const displays = screen.getAllDisplays();
    let minX = displays[0].bounds.x;
    let minY = displays[0].bounds.y;
    let maxX = displays[0].bounds.x + displays[0].bounds.width;
    let maxY = displays[0].bounds.y + displays[0].bounds.height;
    displays.forEach((d) => {
        if (d.bounds.x < minX) minX = d.bounds.x;
        if (d.bounds.y < minY) minY = d.bounds.y;
        if (d.bounds.x + d.bounds.width > maxX) maxX = d.bounds.x + d.bounds.width;
        if (d.bounds.y + d.bounds.height > maxY) maxY = d.bounds.y + d.bounds.height;
    });
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function getMiniWindowPos() {
    const primary = screen.getPrimaryDisplay();
    return {
        x: primary.bounds.x + primary.bounds.width - 76,
        y: primary.bounds.y + 20,
    };
}

function updateOverlayBounds() {
    if (!overlayWindow || overlayWindow.isDestroyed()) return;
    const v = getVirtualScreenBounds();
    overlayWindow.setBounds(v);
}

// ─── Window creation ──────────────────────────────────────────────────────────

function createWindows() {
    const isDev = !app.isPackaged;
    const BASE_URL = isDev 
      ? "http://localhost:3001" 
      : (process.env.NEXT_PUBLIC_BASE_URL || "https://sisgomeet.vercel.app");

    // Sembunyikan default menu bar (File, Edit, View, Help)
    Menu.setApplicationMenu(null);

    // 1. Main App Window
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(_dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            devTools: isDev, // DevTools/Inspect Element hanya aktif di development mode
        },
    });

    // Disable DevTools shortcut (Ctrl+Shift+I / F12) di production
    if (!isDev) {
        mainWindow.webContents.on("before-input-event", (event, input) => {
            if ((input.control || input.meta) && input.shift && input.key.toLowerCase() === "i") {
                event.preventDefault();
            }
            if (input.key === "F12") {
                event.preventDefault();
            }
        });
    }

    mainWindow.loadURL(BASE_URL);
    mainWindow.on("closed", () => {
        overlayWindow?.close();
        mainWindow = null;
    });

    // 2. Canvas Overlay — fullscreen, tampil saat Draw mode, disembunyikan saat Pointer mode
    //    Tidak perlu setIgnoreMouseEvents sama sekali!
    const vscreen = getVirtualScreenBounds();
    overlayWindow = new BrowserWindow({
        x: vscreen.x,
        y: vscreen.y,
        width: vscreen.width,
        height: vscreen.height,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        hasShadow: false,
        show: false, // Mulai tersembunyi
        webPreferences: {
            preload: path.join(_dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            devTools: isDev,
        },
    });
    overlayWindow.loadURL(`${BASE_URL}/overlay`);
    overlayWindow.on("closed", () => { overlayWindow = null; });

    // Resize saat monitor berubah
    screen.on("display-added", updateOverlayBounds);
    screen.on("display-removed", updateOverlayBounds);
    screen.on("display-metrics-changed", updateOverlayBounds);
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

// Nyalakan / matikan seluruh overlay
ipcMain.on("toggle-overlay", (_event, show: boolean) => {
    if (show) {
        overlayWindow?.setIgnoreMouseEvents(false);
        overlayWindow?.show();
        isPausedMain = false;
        
        // Sembunyikan main window agar tidak menghalangi proses coret-coret
        mainWindow?.minimize();
        
        // Daftarkan global shortcut (misal: Ctrl/Cmd + Shift + P)
        globalShortcut.register("CommandOrControl+Shift+P", () => {
            isPausedMain = !isPausedMain;
            if (isPausedMain) {
                overlayWindow?.setIgnoreMouseEvents(true, { forward: true });
            } else {
                overlayWindow?.setIgnoreMouseEvents(false);
            }
            overlayWindow?.webContents.send("toggle-pause-state", isPausedMain);
        });
    } else {
        overlayWindow?.hide();
        globalShortcut.unregister("CommandOrControl+Shift+P");
        
        // Kembalikan main window ke depan
        mainWindow?.restore();
        mainWindow?.focus();
    }
    mainWindow?.webContents.send("overlay-state-change", show);
});

ipcMain.on("pause-drawing", () => {
    isPausedMain = true;
    overlayWindow?.setIgnoreMouseEvents(true, { forward: true });
});

// Resume drawing (tampilkan canvas kembali)
ipcMain.on("resume-drawing", () => {
    isPausedMain = false;
    overlayWindow?.setIgnoreMouseEvents(false);
});

// Kembali ke aplikasi utama (tanpa mematikan overlay)
ipcMain.on("return-to-app", () => {
    mainWindow?.restore();
    mainWindow?.focus();
});

// Dynamic click-through toggle dari UI overlay
ipcMain.on("set-ignore-mouse", (_event, ignore: boolean) => {
    if (ignore) {
        overlayWindow?.setIgnoreMouseEvents(true, { forward: true });
    } else {
        overlayWindow?.setIgnoreMouseEvents(false);
    }
});

// Hapus semua coretan
ipcMain.on("clear-canvas", () => {
    overlayWindow?.webContents.send("do-clear-canvas");
    mainWindow?.webContents.send("annotation-clear-local");
});

// Bridge: Canvas → Main (emit ke WebRTC)
ipcMain.on("annotation-stroke-local", (_event, stroke) => {
    mainWindow?.webContents.send("annotation-stroke-local", stroke);
});

// Bridge: Main → Canvas (remote stroke dari WebRTC)
ipcMain.on("annotation-stroke-remote", (_event, stroke) => {
    overlayWindow?.webContents.send("annotation-stroke-remote", stroke);
});

ipcMain.on("annotation-clear-remote", () => {
    overlayWindow?.webContents.send("do-clear-canvas");
});

// Full array sync
ipcMain.on("sync-annotations-to-overlay", (_event, annotations) => {
    overlayWindow?.webContents.send("sync-annotations-to-overlay", annotations);
});

ipcMain.on("sync-annotations-to-main", (_event, annotations) => {
    mainWindow?.webContents.send("sync-annotations-to-main", annotations);
});

// Screen share handler
function setupScreenShareHandler() {
    session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
        desktopCapturer.getSources({ types: ["screen", "window"] }).then((sources) => {
            if (sources.length > 0) callback({ video: sources[0], audio: "loopback" });
        });
    });
}

app.whenReady().then(() => {
    setupScreenShareHandler();
    createWindows();
});

app.on("will-quit", () => {
    globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});