'use client';

import { useEffect, useRef, useState } from 'react';
import Image from "next/image";

interface RecordingResult {
  blob: Blob;
  url: string;
  mimeType: string;
  durationMs: number;
}

interface MeetingHeaderProps {
  currentTime: string;
  roomId: string;
  participantsCount: number;
  onToggleLayout: () => void;
  onToggleFullscreen: () => void;
  onCopyLink: () => void;
  isRecording: boolean;
  isPaused: boolean;
  elapsedMs: number;
  recordingResult: RecordingResult | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onDownloadRecording: (filename?: string) => void;
  onDiscardRecording: () => void;
}

function formatElapsed(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export default function MeetingHeader({
  currentTime,
  roomId,
  participantsCount,
  onToggleLayout,
  onToggleFullscreen,
  onCopyLink,
  isRecording,
  isPaused,
  elapsedMs,
  recordingResult,
  onStartRecording,
  onStopRecording,
  onDownloadRecording,
  onDiscardRecording,
}: MeetingHeaderProps) {
  const [showResultPopover, setShowResultPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (recordingResult) setShowResultPopover(true);
  }, [recordingResult]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowResultPopover(false);
      }
    };
    if (showResultPopover) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showResultPopover]);

  const handleRecordClick = () => {
    if (isRecording) {
      onStopRecording();
    } else if (recordingResult) {
      setShowResultPopover((prev) => !prev);
    } else {
      onStartRecording();
    }
  };

  return (
    <div className="flex-shrink-0 grid grid-cols-3 items-center px-2 sm:px-4 py-1 sm:py-2 bg-[#0f0f0f] z-[999]">
      <div className="flex items-center justify-self-start">
        <div className="flex flex-col">
          <Image
            src="https://s3.sisgo.co.id/core/logo-sisgo-white.png"
            alt="SISGO"
            width={190}
            height={300}
            className="h-8 sm:h-12 w-auto"
          />
        </div>
      </div>

      {/* Center */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-3 mt-1">
          {/* 🆕 Indikator recording */}
          {(isRecording || isPaused) && (
            <>
              <div className="flex items-center gap-2 bg-[#3c1414] px-3 py-1 rounded-full">
                <span
                  className={`w-2.5 h-2.5 rounded-full bg-red-500 ${
                    isRecording ? 'animate-pulse' : ''
                  }`}
                />
                <span className="text-sm text-red-300 font-mono">
                  {formatElapsed(elapsedMs)}
                </span>
                {isPaused && <span className="text-xs text-red-300">(Paused)</span>}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-self-end gap-3">
        {/* Right side features removed per user request */}
      </div>
    </div>
  );
}