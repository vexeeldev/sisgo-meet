# SISGO Meet (MeetGo)

SISGO Meet adalah platform komunikasi video konferensi real-time berbasis WebRTC yang terintegrasi secara native dengan aplikasi desktop lintas platform (Windows, macOS, dan Linux). Platform ini dirancang untuk memfasilitasi kolaborasi interaktif melalui fitur unggulan Live Screen Annotation Overlay, yang memungkinkan pengguna melakukan coret-coret di atas layar desktop secara real-time dan tersinkronisasi antar seluruh peserta rapat.

---

## Daftar Isi

1. [Arsitektur Sistem](#arsitektur-sistem)
2. [Fitur Unggulan](#fitur-unggulan)
3. [Teknologi dan Dependensi Utama](#teknologi-dan-dependensi-utama)
4. [Struktur Direktori Proyek](#struktur-direktori-proyek)
5. [Prasyarat Sistem](#prasyarat-sistem)
6. [Konfigurasi Environment Variable](#konfigurasi-environment-variable)
7. [Panduan Pengembangan (Development)](#panduan-pengembangan-development)
8. [Panduan Kompilasi dan Distro (Production Build)](#panduan-kompilasi-dan-distro-production-build)
9. [Otomatisasi CI/CD Release via GitHub Actions](#otomatisasi-cicd-release-via-github-actions)
10. [Troubleshooting dan Catatan Kompatibilitas](#troubleshooting-dan-catatan-kompatibilitas)

---

## Arsitektur Sistem

Aplikasi ini menggunakan arsitektur Hybrid Cloud-Desktop yang memisahkan logika UI/WebRTC dengan runtime bawaan sistem operasi.

```
+-------------------------------------------------------------------+
|                        Client Layer (Electron)                    |
|  +------------------------+      +-----------------------------+  |
|  |     Main App Window    |      |    Transparent Overlay      |  |
|  | (Next.js / WebRTC Core)|      | (Canvas & Interaksi Screen) |  |
|  +-----------+------------+      +--------------+--------------+  |
+--------------|----------------------------------|-----------------+
               | Electron IPC Bridge              |
               +----------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                      Signaling & Network Layer                    |
|  +------------------------+      +-----------------------------+  |
|  | WebSocket Signaling    |      | WebRTC Peer-to-Peer Data    |  |
|  | (wss.sisgo.co.id)      |      | (DataChannel Sync Garis)    |  |
|  +------------------------+      +-----------------------------+  |
+-------------------------------------------------------------------+
```

- **Electron Main Process (`electron/main.ts`)**: Bertanggung jawab atas pengelolaan jendela transparan (Overlay), deteksi resolusi multi-monitor, konfigurasi flag X11/XWayland di Linux, serta pembuatan menu native.
- **Preload Script (`electron/preload.js`)**: Menyediakan jembatan IPC yang aman dengan menerapkan `contextIsolation: true` dan menyuntikkan metode `window.electronAPI`.
- **Renderer Process (Next.js App Router)**: Menjalankan logika antarmuka pengguna, komunikasi suara/video WebRTC (SimplePeer), serta rendering Canvas 2D untuk fungsi corat-coret.

---

## Fitur Unggulan

### 1. Live Screen Annotation Overlay
- **Multi-Monitor Bounds Detection**: Sistem secara otomatis menghitung koordinat virtual screen gabungan dari seluruh monitor yang terhubung (termasuk monitor dengan koordinat offset negatif).
- **Mode Interaksi dan Jeda (Pause / Resume)**: Pengguna dapat menjeda layar corat-coret secara instan untuk berinteraksi langsung dengan aplikasi di belakangnya (seperti Notion, VS Code, Browser), kemudian melanjutkan sesi corat-coret tanpa kehilangan riwayat gambar.
- **Visual Cursor Preview**: Saat mode penghapus (*Eraser*) aktif, kursor crosshair akan secara otomatis berubah menjadi penunjuk lingkaran transparan yang menyesuaikan dengan ukuran ketebalan stroke.

### 2. Real-Time DataChannel Synchronization
- Setiap goresan garis, perubahan warna, ukuran stroke, maupun aksi pembersihan kanvas (*Clear All*) dikirimkan melalui saluran data WebRTC ke seluruh anggota ruang rapat.

### 3. Keamanan dan Desain Antarmuka
- **Desain Minimalis Dark Glassmorphism**: Toolbar melayang yang ergonomis tanpa elemen mengganggu.
- **Keamanan Aplikasi**: Menu bar bawaan sistem disembunyikan (`Menu.setApplicationMenu(null)`), dan akses DevTools/Inspect Element secara otomatis dimatikan pada mode produksi.

---

## Teknologi dan Dependensi Utama

- **Framework Web**: Next.js 16 (App Router), React 19.
- **Desktop Engine**: Electron 43.
- **Komunikasi Real-Time**: WebRTC (SimplePeer), WebSockets.
- **Styling dan Ikon**: Vanilla Inline CSS, Lucide React Icons.
- **Packaging Tool**: Electron Builder (NSIS untuk Windows, DMG untuk macOS, AppImage untuk Linux).

---

## Struktur Direktori Proyek

```
meetgo/
├── .github/
│   └── workflows/
│       └── build-desktop.yml      # Konfigurasi CI/CD GitHub Actions multi-OS
├── app/
│   ├── overlay/
│   │   └── page.tsx               # Halaman Canvas Overlay corat-coret utama
│   ├── overlay-mini/
│   │   └── page.tsx               # Halaman Floating Mini Button (Pause/Resume)
│   ├── [roomId]/
│   │   └── page.tsx               # Ruang Pertemuan Video WebRTC
│   └── layout.tsx                 # Root Layout Next.js
├── electron/
│   ├── main.ts                    # Main process Electron & manajemen jendela
│   ├── preload.js                 # Bridge IPC contextBridge antara Main & Renderer
│   └── tsconfig.json              # Konfigurasi TypeScript khusus Electron
├── hooks/
│   └── useWebRTC.ts               # Hook penanganan koneksi P2P WebRTC & DataChannel
├── types/
│   └── electron-api.d.ts          # Deklarasi tipe global untuk window.electronAPI
├── package.json                   # Dependensi dan skrip proyek
└── tsconfig.json                  # Konfigurasi TypeScript utama
```

---

## Prasyarat Sistem

- **Node.js**: Versi `20.x` atau `22.x` (LTS direkomendasikan).
- **npm**: Versi `10.x` atau yang lebih baru.
- **OS Kompatibilitas**:
  - Windows 10 / 11 (64-bit)
  - macOS 11 Big Sur atau yang lebih baru (Apple Silicon & Intel)
  - Linux (Ubuntu/Debian) dengan dukungan X11 atau XWayland

---

## Konfigurasi Environment Variable

Buat file `.env.local` pada direktori akar proyek dengan menyertakan konfigurasi URL server Anda:

```env
NEXT_PUBLIC_BASE_URL=your_web_base_url
NEXT_PUBLIC_API_SOCKET_URL=your_socket_url
NEXT_PUBLIC_SIGNAL_SERVER=your_signaling_server_url
```

---

## Panduan Pengembangan (Development)

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Jalankan Mode Web (Next.js Server)
```bash
npm run dev
```
Server lokal akan berjalan pada `http://localhost:3001`.

### 3. Jalankan Mode Desktop (Next.js + Electron Environment)
```bash
npm run desktop:dev
```
Perintah ini akan mengompilasi TypeScript Electron dan membuka jendela aplikasi desktop secara simultan.

---

## Panduan Kompilasi dan Distro (Production Build)

Sebelum melakukan packaging, pastikan TypeScript Electron dapat terkompilasi dengan menjalankan:
```bash
npm run build:electron
```

### 1. Build Paket Windows (.exe)
```bash
npm run desktop:build:win
```
Hasil file installer NSIS (`SISGO Meet Setup X.X.X.exe`) akan tersimpan di direktori `dist/`.

### 2. Build Paket Linux (.AppImage)
```bash
npm run desktop:build:linux
```
Hasil file executable `SISGO Meet-X.X.X.AppImage` akan tersimpan di direktori `dist/`.

### 3. Build Paket macOS (.dmg)
```bash
npm run desktop:build:mac
```
*(Catatan: Build macOS membutuhkan lingkungan OS macOS native).*

---

## Otomatisasi CI/CD Release via GitHub Actions

Proyek ini telah dikonfigurasi dengan pipeline otomatisasi pembuatan paket rilis lintas platform (Windows, macOS, dan Linux) menggunakan GitHub Actions.

### Cara Memicu Release Baru:

1. Pastikan seluruh perubahan kode telah di-commit ke branch `main`:
   ```bash
   git add .
   git commit -m "penyesuaian fitur rilis"
   git push origin main
   ```

2. Buat tag versi baru (menggunakan format `v*`):
   ```bash
   git tag v1.0.5
   git push origin v1.0.5
   ```

3. Pipeline GitHub Actions akan secara otomatis menjalankan 3 runner terpisah (`windows-latest`, `macos-latest`, dan `ubuntu-latest`) serta mengunggah file installer ke halaman **GitHub Releases**.

---

## Troubleshooting dan Catatan Kompatibilitas

### 1. Transparansi Layar pada Linux (Wayland)
Pada lingkungan desktop Linux yang menggunakan sesi Wayland, fungsi `setIgnoreMouseEvents` Electron dibatasi oleh protokol Wayland. Aplikasi ini secara otomatis menangani batasan ini dengan:
- Memaksa eksekusi melalui skrip `ozone-platform=x11` (XWayland).
- Menggunakan arsitektur Show/Hide pada window Canvas daripada bergantung pada passthrough event mouse sistem.

### 2. Penanganan Ukuran Installer Paket (.exe / .AppImage)
Untuk menjaga ukuran installer tetap kecil (~70MB - 90MB), konfigurasi `package.json` secara eksplisit mengecualikan folder `.next` dan `node_modules` yang tidak diperlukan oleh aplikasi desktop client.

---

## Lisensi

Hak Cipta (c) 2026 Tim SISGO Meet. Seluruh hak cipta dilindungi undang-undang.
