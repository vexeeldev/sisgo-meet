export interface SavedRecording {
  id: string;
  roomId: string;
  timestamp: number;
  dateFormatted: string;
  durationMs: number;
  durationFormatted: string;
  sizeBytes: number;
  sizeFormatted: string;
  blob: Blob;
  url?: string;
}

const DB_NAME = 'sisgo_meet_recordings_db';
const STORE_NAME = 'recordings';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('roomId', 'roomId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function formatDuration(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function saveRecordingToStorage(
  roomId: string,
  blob: Blob,
  durationMs: number
): Promise<SavedRecording> {
  const db = await openDB();
  const id = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const dateFormatted = now.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const record: SavedRecording = {
    id,
    roomId,
    timestamp: now.getTime(),
    dateFormatted,
    durationMs,
    durationFormatted: formatDuration(durationMs),
    sizeBytes: blob.size,
    sizeFormatted: formatFileSize(blob.size),
    blob,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.add(record);

    req.onsuccess = () => {
      resolve({
        ...record,
        url: URL.createObjectURL(blob),
      });
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getRecordingsFromStorage(roomId?: string): Promise<SavedRecording[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        let results: SavedRecording[] = req.result || [];
        if (roomId) {
          results = results.filter((r) => r.roomId === roomId);
        }
        // Sort newest first
        results.sort((a, b) => b.timestamp - a.timestamp);
        
        // Attach blob URLs
        results = results.map((item) => ({
          ...item,
          url: URL.createObjectURL(item.blob),
        }));

        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to get recordings from IndexedDB:', err);
    return [];
  }
}

export async function deleteRecordingFromStorage(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
