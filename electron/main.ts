import { app, BrowserWindow, ipcMain, screen, session, desktopCapturer, Menu } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Linux: paksa X11 mode via XWayland untuk transparency yang stabil
if (process.platform === "linux") {
    app.commandLine.appendSwitch("enable-transparent-visuals");
    app.commandLine.appendSwitch("ozone-platform", "x11");
    app.disableHardwareAcceleration();
}

let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null; // Canvas coret-coret (fullscreen)
let miniWindow: BrowserWindow | null = null;    // Tombol mungil yang selalu bisa diklik

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
            preload: path.join(__dirname, "preload.js"),
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
        miniWindow?.close();
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
            preload: path.join(__dirname, "preload.js"),
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

    // 3. Mini Button — tombol kecil di sudut kanan atas, SELALU tampil & bisa diklik
    //    Ini jendela TERPISAH dari canvas → selalu interaktif apapun kondisi canvas
    const miniPos = getMiniWindowPos();
    miniWindow = new BrowserWindow({
        x: miniPos.x,
        y: miniPos.y,
        width: 64,
        height: 64,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        hasShadow: false,
        show: false, // Muncul hanya ketika overlay aktif
        resizable: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            devTools: isDev,
        },
    });
    miniWindow.loadURL(`${BASE_URL}/overlay-mini`);
    miniWindow.on("closed", () => { miniWindow = null; });
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

// Nyalakan / matikan seluruh overlay
ipcMain.on("toggle-overlay", (_event, show: boolean) => {
    if (show) {
        overlayWindow?.show();
        miniWindow?.show();
        // Saat baru dibuka: canvas tampil = Draw mode
        miniWindow?.webContents.send("mini-state", "drawing");
    } else {
        overlayWindow?.hide();
        miniWindow?.hide();
    }
    mainWindow?.webContents.send("overlay-state-change", show);
});

// Pause drawing (sembunyikan canvas agar user bisa interaksi dengan OS)
// Mini button tetap muncul — user bisa klik untuk resume
ipcMain.on("pause-drawing", () => {
    overlayWindow?.hide();
    miniWindow?.webContents.send("mini-state", "paused");
});

// Resume drawing (tampilkan canvas kembali)
ipcMain.on("resume-drawing", () => {
    overlayWindow?.show();
    miniWindow?.webContents.send("mini-state", "drawing");
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

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});