"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const node_path_1 = __importDefault(require("node:path"));
const _dirname = typeof __dirname !== "undefined" ? __dirname : process.cwd();

if (process.platform === "linux") {
    electron_1.app.commandLine.appendSwitch("enable-transparent-visuals");
    electron_1.app.commandLine.appendSwitch("ozone-platform", "x11");
    electron_1.app.disableHardwareAcceleration();
}

let mainWindow = null;
let overlayWindow = null;
let miniWindow = null;

function getVirtualScreenBounds() {
    const displays = electron_1.screen.getAllDisplays();
    let minX = displays[0].bounds.x;
    let minY = displays[0].bounds.y;
    let maxX = displays[0].bounds.x + displays[0].bounds.width;
    let maxY = displays[0].bounds.y + displays[0].bounds.height;
    displays.forEach((d) => {
        if (d.bounds.x < minX)
            minX = d.bounds.x;
        if (d.bounds.y < minY)
            minY = d.bounds.y;
        if (d.bounds.x + d.bounds.width > maxX)
            maxX = d.bounds.x + d.bounds.width;
        if (d.bounds.y + d.bounds.height > maxY)
            maxY = d.bounds.y + d.bounds.height;
    });
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
function getMiniWindowPos() {
    const primary = electron_1.screen.getPrimaryDisplay();
    return {
        x: primary.bounds.x + primary.bounds.width - 76,
        y: primary.bounds.y + 20,
    };
}
function updateOverlayBounds() {
    if (!overlayWindow || overlayWindow.isDestroyed())
        return;
    const v = getVirtualScreenBounds();
    overlayWindow.setBounds(v);
}
// ─── Window creation ──────────────────────────────────────────────────────────
function createWindows() {
    const isDev = !electron_1.app.isPackaged;
    const BASE_URL = isDev
        ? "http://localhost:3001"
        : (process.env.NEXT_PUBLIC_BASE_URL || "https://sisgomeet.vercel.app");
    // Sembunyikan default menu bar (File, Edit, View, Help)
    electron_1.Menu.setApplicationMenu(null);
    // 1. Main App Window
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        autoHideMenuBar: true,
        webPreferences: {
            preload: node_path_1.default.join(_dirname, "preload.js"),
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
    overlayWindow = new electron_1.BrowserWindow({
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
            preload: node_path_1.default.join(_dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            devTools: isDev,
        },
    });
    overlayWindow.loadURL(`${BASE_URL}/overlay`);
    overlayWindow.on("closed", () => { overlayWindow = null; });
    // Resize saat monitor berubah
    electron_1.screen.on("display-added", updateOverlayBounds);
    electron_1.screen.on("display-removed", updateOverlayBounds);
    electron_1.screen.on("display-metrics-changed", updateOverlayBounds);
    // 3. Mini Button — tombol kecil di sudut kanan atas, SELALU tampil & bisa diklik
    //    Ini jendela TERPISAH dari canvas → selalu interaktif apapun kondisi canvas
    const miniPos = getMiniWindowPos();
    miniWindow = new electron_1.BrowserWindow({
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
            preload: node_path_1.default.join(_dirname, "preload.js"),
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
electron_1.ipcMain.on("toggle-overlay", (_event, show) => {
    if (show) {
        overlayWindow?.show();
        miniWindow?.show();
        // Saat baru dibuka: canvas tampil = Draw mode
        miniWindow?.webContents.send("mini-state", "drawing");
    }
    else {
        overlayWindow?.hide();
        miniWindow?.hide();
    }
    mainWindow?.webContents.send("overlay-state-change", show);
});
// Pause drawing (sembunyikan canvas agar user bisa interaksi dengan OS)
// Mini button tetap muncul — user bisa klik untuk resume
electron_1.ipcMain.on("pause-drawing", () => {
    overlayWindow?.hide();
    miniWindow?.webContents.send("mini-state", "paused");
});
// Resume drawing (tampilkan canvas kembali)
electron_1.ipcMain.on("resume-drawing", () => {
    overlayWindow?.show();
    miniWindow?.webContents.send("mini-state", "drawing");
});
// Hapus semua coretan
electron_1.ipcMain.on("clear-canvas", () => {
    overlayWindow?.webContents.send("do-clear-canvas");
    mainWindow?.webContents.send("annotation-clear-local");
});
// Bridge: Canvas → Main (emit ke WebRTC)
electron_1.ipcMain.on("annotation-stroke-local", (_event, stroke) => {
    mainWindow?.webContents.send("annotation-stroke-local", stroke);
});
// Bridge: Main → Canvas (remote stroke dari WebRTC)
electron_1.ipcMain.on("annotation-stroke-remote", (_event, stroke) => {
    overlayWindow?.webContents.send("annotation-stroke-remote", stroke);
});
electron_1.ipcMain.on("annotation-clear-remote", () => {
    overlayWindow?.webContents.send("do-clear-canvas");
});
// Screen share handler
function setupScreenShareHandler() {
    electron_1.session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
        electron_1.desktopCapturer.getSources({ types: ["screen", "window"] }).then((sources) => {
            if (sources.length > 0)
                callback({ video: sources[0], audio: "loopback" });
        });
    });
}
electron_1.app.whenReady().then(() => {
    setupScreenShareHandler();
    createWindows();
});
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin")
        electron_1.app.quit();
});
