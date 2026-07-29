'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'stopped';

interface UseRecordingOptions {
  mimeType?: string;
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
  includeMicAudio?: boolean; // default true — mixing mic ke rekaman
}

interface RecordingResult {
  blob: Blob;
  url: string;
  mimeType: string;
  durationMs: number;
}

const PREFERRED_MIME_TYPES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
  'video/mp4',
];

function pickSupportedMimeType(preferred?: string): string {
  if (preferred && MediaRecorder.isTypeSupported(preferred)) return preferred;
  for (const type of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

export function useRecording(options: UseRecordingOptions = {}) {
  const {
    mimeType,
    videoBitsPerSecond = 3_000_000,
    audioBitsPerSecond = 128_000,
    includeMicAudio = true,
  } = options;

  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecordingResult | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const compositeStreamRef = useRef<MediaStream | null>(null);

  const startTimeRef = useRef<number>(0);
  const pausedAccumRef = useRef<number>(0);
  const pauseStartRef = useRef<number>(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    startTimeRef.current = Date.now();
    pausedAccumRef.current = 0;
    timerIntervalRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current - pausedAccumRef.current);
    }, 500);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const cleanupInternal = () => {
    stopTimer();

    displayStreamRef.current?.getTracks().forEach((t) => t.stop());
    displayStreamRef.current = null;

    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;

    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;

    compositeStreamRef.current = null;
  };

  /**
   * Mulai rekam layar/tab. Browser akan menampilkan dialog pilih
   * tab/window/screen bawaan browser — user pilih sendiri apa yang
   * mau direkam (biasanya: tab ini / seluruh layar).
   */
  const startRecording = useCallback(async () => {
    if (status === 'recording' || status === 'paused') {
      console.warn('Recording sudah berjalan');
      return;
    }

    try {
      setError(null);
      setResult(null);
      chunksRef.current = [];

      // 1. Minta izin capture layar/tab (dialog bawaan browser)
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: { ideal: 30 },
        },
        audio: true, // audio sistem/tab kalau user pilih & browser dukung (Chrome: audio tab)
      });
      displayStreamRef.current = displayStream;

      let finalStream = displayStream;

      // 2. Opsional: mixing audio mic supaya suara kamu ikut kerekam
      if (includeMicAudio) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          micStreamRef.current = micStream;

          const audioCtx = new AudioContext();
          const dest = audioCtx.createMediaStreamDestination();

          const displayAudioTracks = displayStream.getAudioTracks();
          if (displayAudioTracks.length > 0) {
            const displayAudioSource = audioCtx.createMediaStreamSource(
              new MediaStream(displayAudioTracks)
            );
            displayAudioSource.connect(dest);
          }

          const micSource = audioCtx.createMediaStreamSource(micStream);
          micSource.connect(dest);

          audioContextRef.current = audioCtx;

          finalStream = new MediaStream([
            ...displayStream.getVideoTracks(),
            ...dest.stream.getAudioTracks(),
          ]);
        } catch (micErr) {
          console.warn('Gagal ambil audio mic, lanjut tanpa mic:', micErr);
          // tetap lanjut rekam pakai displayStream apa adanya
        }
      }

      compositeStreamRef.current = finalStream;

      // 3. Kalau user klik "Stop sharing" dari browser toolbar/dialog,
      // otomatis hentikan recording juga.
      const videoTrack = displayStream.getVideoTracks()[0];
      videoTrack?.addEventListener('ended', () => {
        stopRecording();
      });

      // 4. Setup MediaRecorder
      const resolvedMimeType = pickSupportedMimeType(mimeType);
      const recorder = new MediaRecorder(finalStream, {
        mimeType: resolvedMimeType || undefined,
        videoBitsPerSecond,
        audioBitsPerSecond,
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onerror = (e) => {
        console.error('MediaRecorder error:', e);
        setError('Terjadi kesalahan saat merekam.');
      };

      recorder.onstop = () => {
        const finalMimeType = resolvedMimeType || 'video/webm';
        const blob = new Blob(chunksRef.current, { type: finalMimeType });
        const url = URL.createObjectURL(blob);
        const durationMs = Date.now() - startTimeRef.current - pausedAccumRef.current;
        setResult({ blob, url, mimeType: finalMimeType, durationMs });
        setStatus('stopped');
      };

      recorder.start(1000);
      recorderRef.current = recorder;

      startTimer();
      setStatus('recording');
    } catch (e: any) {
      // user klik "Cancel" di dialog pilih layar itu juga masuk sini (NotAllowedError)
      if (e?.name === 'NotAllowedError') {
      } else {
        console.error('Gagal memulai recording:', e);
        setError('Gagal memulai perekaman layar.');
      }
      cleanupInternal();
    }
  }, [status, mimeType, videoBitsPerSecond, audioBitsPerSecond, includeMicAudio]);

  const pauseRecording = useCallback(() => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.pause();
      pauseStartRef.current = Date.now();
      stopTimer();
      setStatus('paused');
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (recorderRef.current?.state === 'paused') {
      recorderRef.current.resume();
      pausedAccumRef.current += Date.now() - pauseStartRef.current;
      timerIntervalRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTimeRef.current - pausedAccumRef.current);
      }, 500);
      setStatus('recording');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    cleanupInternal();
    recorderRef.current = null;
  }, []);

  const downloadRecording = useCallback((filename?: string) => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = filename || `meeting-recording-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [result]);

  const discardRecording = useCallback(() => {
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setStatus('idle');
    setElapsedMs(0);
  }, [result]);

  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
      cleanupInternal();
      if (result) URL.revokeObjectURL(result.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (status === 'recording' || status === 'paused') {
        e.preventDefault();
        e.returnValue = ''; // wajib di-set walau teksnya gak dipakai browser modern
        return '';
        }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
 }, [status]);

  return {
    status,
    isRecording: status === 'recording',
    isPaused: status === 'paused',
    elapsedMs,
    error,
    result,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    downloadRecording,
    discardRecording,
  };
}
