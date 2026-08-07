'use client';

import { useState, useEffect } from 'react';
import { CallEndFilled, KeyboardFilled, MicFilled, MicOffFilled, Videocam, VideocamOff, ExpandLess, Group, Chat, BackHand, MoreVert, PresentToAll, VisualEffects, PersonAdd as UserPlus } from '../icons';
import { VirtualBackgroundMode } from '@/lib/virtual-background';
import { Maximize, Check, Volume2, Copy, Pencil, Presentation } from 'lucide-react';
import AnnotationTriggerButton from '../AnnotationTriggerButton';

interface MeetingControlsProps {
  currentTime: string;
  roomId: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  showChat: boolean;
  showParticipants?: boolean;
  virtualBgMode: VirtualBackgroundMode;
  virtualBgImage?: string | null;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onToggleParticipants?: () => void;
  onChangeVirtualBg: (mode: VirtualBackgroundMode, image?: string) => void | Promise<void>;
  onEndCall: () => void;
  layout?: 'auto' | 'tiled' | 'spotlight' | 'sidebar' | 'speaker' | 'grid';
  onChangeLayout?: (mode: 'auto' | 'tiled' | 'spotlight' | 'sidebar' | 'speaker' | 'grid') => void;
  isHandRaised?: boolean;
  onToggleHand?: () => void;
  isRecording?: boolean;
  isHost?: boolean;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  recordingResult?: { blob: Blob; url: string } | null;
  onDownloadRecording?: () => void;
  onDiscardRecording?: () => void;
  joinRequestsCount?: number;
  showRequests?: boolean;
  onToggleRequests?: () => void;
  unreadChatCount?: number;
  localStream?: MediaStream | null;
  showBgPanel?: boolean;
  onToggleBgPanel?: () => void;
  showRecordingsPanel?: boolean;
  onToggleRecordingsPanel?: () => void;
  roomType?: string;
  onToggleWhiteboard?: () => void;
  isWhiteboardOpen?: boolean;
  onToggleScreenAnnotation?: () => void;
  isScreenAnnotationOpen?: boolean;
  audioInputDevices?: MediaDeviceInfo[];
  videoInputDevices?: MediaDeviceInfo[];
  audioOutputDevices?: MediaDeviceInfo[];
  selectedAudioDeviceId?: string;
  selectedVideoDeviceId?: string;
  selectedAudioOutputDeviceId?: string;
  onSwitchAudioDevice?: (deviceId: string) => void;
  onSwitchVideoDevice?: (deviceId: string) => void;
  onSwitchAudioOutputDevice?: (deviceId: string) => void;
  onCopyLink?: () => void;
}

/** Tombol panel kanan (People / Chat) — icon-only, bergaya pill Google Meet */
function PanelButton({
  icon,
  label,
  active,
  onClick,
  title,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick?: () => void;
  title?: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      title={title || label}
      aria-label={label}
      className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-all cursor-pointer duration-200 flex-shrink-0 ${
        active
          ? 'bg-[#c2e7ff] text-[#001d35]'
          : 'text-white hover:bg-white/10'
      }`}
    >
      {icon}
      {badge !== undefined && badge > 0 && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
          {badge > 9 ? '9+' : badge}
        </div>
      )}
      {/* Label disembunyikan secara visual, tetap ada untuk aksesibilitas */}
      <span className="sr-only">{label}</span>
    </button>
  );
}

export default function MeetingControls({
  currentTime,
  roomId,
  isMuted,
  isVideoOff,
  isScreenSharing,
  showChat,
  showParticipants = false,
  virtualBgMode,
  virtualBgImage,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  onToggleParticipants,
  onChangeVirtualBg,
  onEndCall,
  layout = 'auto',
  onChangeLayout,
  isHandRaised = false,
  onToggleHand,
  isRecording = false,
  onStartRecording,
  onStopRecording,
  recordingResult,
  onDownloadRecording,
  onDiscardRecording,
  joinRequestsCount = 0,
  showRequests = false,
  onToggleRequests,
  unreadChatCount = 0,
  isHost = false,
  localStream,
  showBgPanel = false,
  onToggleBgPanel,
  showRecordingsPanel,
  onToggleRecordingsPanel,
  roomType = 'private',
  onToggleWhiteboard,
  isWhiteboardOpen = false,
  onToggleScreenAnnotation,
  isScreenAnnotationOpen = false,
  audioInputDevices = [],
  videoInputDevices = [],
  audioOutputDevices = [],
  selectedAudioDeviceId,
  selectedVideoDeviceId,
  selectedAudioOutputDeviceId,
  onSwitchAudioDevice,
  onSwitchVideoDevice,
  onSwitchAudioOutputDevice,
  onCopyLink,
}: MeetingControlsProps) {
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  const [showVideoMenu, setShowVideoMenu] = useState(false);
  const [showShortcutsMenu, setShowShortcutsMenu] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const handleCopy = () => {
    if (onCopyLink) {
      onCopyLink();
    } else {
      navigator.clipboard.writeText(window.location.href);
      // Fallback toast if onCopyLink isn't provided
      const toast = document.createElement('div');
      toast.className =
        'fixed bottom-24 left-6 bg-[#3c3c3c] text-white px-5 py-3 rounded-full text-sm shadow-xl z-[9999] flex items-center gap-3 border border-[#4a4b4c] transition-all duration-300 animate-in fade-in slide-in-from-bottom-4';
      toast.innerHTML = `<span class="font-medium whitespace-nowrap">Link copied to clipboard!</span>`;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4');
        setTimeout(() => toast.remove(), 300);
      }, 5000);
    }
  };

  const isInterviewCandidate = roomType === 'interview' && !isHost;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // Raise/Lower hand: 'h'
      if (key === 'h' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        onToggleHand?.();
        return;
      }

      // Keyboard shortcuts popup: 'c' (or Shift + ?)
      if ((key === 'c' || key === '?') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setShowShortcutsMenu((prev) => !prev);
        return;
      }

      // Copy meeting link: Ctrl + C
      if ((e.ctrlKey || e.metaKey) && key === 'c' && !e.shiftKey && !e.altKey) {
        const selection = window.getSelection();
        // Only trigger if user hasn't highlighted text to copy
        if (!selection || selection.toString().trim().length === 0) {
          e.preventDefault();
          handleCopy();
          return;
        }
      }

      // Fullscreen mode: 'f'
      if (key === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(console.error);
        } else {
          document.documentElement.requestFullscreen().catch(console.error);
        }
        return;
      }

      // Mute / Unmute mic: Ctrl + D
      if ((e.ctrlKey || e.metaKey) && key === 'd') {
        e.preventDefault();
        if (!isInterviewCandidate) onToggleMute?.();
        return;
      }

      // Camera on / off: Ctrl + E
      if ((e.ctrlKey || e.metaKey) && key === 'e') {
        e.preventDefault();
        if (!isInterviewCandidate) onToggleVideo?.();
        return;
      }

      // Share screen: Ctrl + Shift + S
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 's') {
        e.preventDefault();
        onToggleScreenShare?.();
        return;
      }

      // Whiteboard (Papan Tulis): Ctrl + Shift + B (B = Board)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'b') {
        e.preventDefault();
        onToggleWhiteboard?.();
        return;
      }

      // Screen Annotation: Ctrl + Shift + A
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'a') {
        e.preventDefault();
        onToggleScreenAnnotation?.();
        return;
      }

      // Recording history: Ctrl + Shift + R (Host Only)
      if (isHost && (e.ctrlKey || e.metaKey) && e.shiftKey && key === 'r') {
        e.preventDefault();
        onToggleRecordingsPanel?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleHand, onToggleMute, onToggleVideo, onToggleScreenShare, onToggleWhiteboard, onToggleScreenAnnotation, onToggleRecordingsPanel, isHost, isInterviewCandidate]);

  useEffect(() => {
    if (isMuted || !localStream) {
      setAudioLevel(0);
      return;
    }

    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length === 0 || !audioTracks[0].enabled) {
      setAudioLevel(0);
      return;
    }

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let animationFrameId: number;

    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.4;

      source = audioContext.createMediaStreamSource(localStream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        analyser!.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const normalized = Math.min(1, average / 35);
        setAudioLevel(normalized);
        animationFrameId = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (e) {
      console.error('Audio level metering error:', e);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (source) source.disconnect();
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [localStream, isMuted]);

  return (
    <div className="flex-shrink-0 flex justify-between items-center px-2 sm:px-6 h-16 sm:h-24 bg-[#0f0f0f] text-white">
      {/* Left Section: Time & Meeting Code */}
      <div className="flex items-center gap-2 sm:gap-4 w-auto sm:w-1/4 min-w-0">
        <span className="text-base sm:text-lg font-medium whitespace-nowrap text-white">{currentTime}</span>
        <div className="hidden sm:block w-px h-5 bg-[#3c4043]" />
        
        {/* Info button containing Room ID and Copy icon */}
        <div 
          onClick={handleCopy}
          className="hidden sm:flex items-center gap-2 group cursor-pointer bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors border border-white/5"
          title="Salin info akses meeting"
        >
          <span className="text-sm font-medium truncate max-w-[150px] text-white select-all">{roomId}</span>
          <Copy className="w-3.5 h-3.5 text-gray-200" />
        </div>
      </div>

      {/* Center Section: Main Controls */}
      <div className="flex items-center justify-center flex-1">
        {/* Subtle background box wrapper for all center controls */}
        <div className="flex items-center gap-2 sm:gap-3 bg-[#1e1f22] rounded-3xl px-3 sm:px-4 py-2">
        
          {/* Mic split button: dots + mic share one pill background */}
          <div className="relative">
            <div className={`flex items-center transition-all ${
              isMuted ? 'rounded-2xl bg-[#842020]' : 'rounded-full bg-[#3c4043]'
            }`}>
              {/* Audio Indicator / Options Button */}
              <button 
                onClick={() => setShowAudioMenu(!showAudioMenu)}
                className="w-10 h-12 sm:w-10 sm:h-14 flex items-center justify-center rounded-lg transition-colors cursor-pointer"
                title="Audio options & indicator"
              >
                {!isMuted ? (
                  <div className="flex items-center justify-center gap-[3px] h-5 w-6">
                    <span 
                      className={`w-[3px] rounded-full transition-all duration-100 ease-out ${
                        audioLevel > 0.05 ? 'bg-[#8ab4f8]' : 'bg-white/80'
                      }`}
                      style={{ 
                        height: audioLevel > 0.05 
                          ? `${Math.max(3, Math.min(15, 3 + audioLevel * 14))}px` 
                          : '3px' 
                      }}
                    />
                    <span 
                      className={`w-[3px] rounded-full transition-all duration-100 ease-out ${
                        audioLevel > 0.05 ? 'bg-[#8ab4f8]' : 'bg-white/80'
                      }`}
                      style={{ 
                        height: audioLevel > 0.05 
                          ? `${Math.max(3, Math.min(19, 3 + audioLevel * 18))}px` 
                          : '3px' 
                      }}
                    />
                    <span 
                      className={`w-[3px] rounded-full transition-all duration-100 ease-out ${
                        audioLevel > 0.05 ? 'bg-[#8ab4f8]' : 'bg-white/80'
                      }`}
                      style={{ 
                        height: audioLevel > 0.05 
                          ? `${Math.max(3, Math.min(15, 3 + audioLevel * 14))}px` 
                          : '3px' 
                      }}
                    />
                  </div>
                ) : (
                  <svg className="w-4 h-4 text-[#f5c6c2]" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="6" cy="12" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="18" cy="12" r="1.5" />
                  </svg>
                )}
              </button>
              {/* Mic - inner circle, different color scheme when muted */}
              <div className="relative">
                <button
                  onClick={isInterviewCandidate ? undefined : onToggleMute}
                  disabled={isInterviewCandidate}
                  className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center transition-colors ${
                    isInterviewCandidate
                      ? 'rounded-full bg-[#4a4b4c] opacity-80 cursor-not-allowed'
                      : isMuted ? 'rounded-2xl bg-[#f5c6c2] hover:bg-[#f0b3ae] cursor-pointer' : 'rounded-full bg-[#4a4b4c] hover:bg-[#5a5b5e] cursor-pointer'
                  }`}
                  title={isInterviewCandidate ? 'Mikrofon wajib menyala pada sesi Interview' : isMuted ? 'Turn on microphone (Ctrl+D)' : 'Turn off microphone (Ctrl+D)'}
                >
                  {isMuted ? (
                    <MicOffFilled className="w-6 h-6 sm:w-7 sm:h-7 text-[#d93025]" />
                  ) : (
                    <MicFilled className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  )}
                </button>
                {isInterviewCandidate && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#5f6368] text-white border-2 border-[#1e1f22] flex items-center justify-center shadow-md pointer-events-none z-30" title="Mikrofon Terkunci (Wajib Menyala)">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                )}
              </div>
            </div>
            {showAudioMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowAudioMenu(false)} />
                <div className="absolute bottom-16 left-0 bg-[#202124] text-white rounded-2xl shadow-2xl border border-[#3c4043] p-2.5 w-80 sm:w-96 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  {/* Microphone Section */}
                  <div className="mb-2">
                    <div className="flex items-center gap-2 px-2 py-1 mb-0.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      <MicFilled className="w-3.5 h-3.5 text-gray-400" />
                      <span>Mikrofon</span>
                    </div>
                    <div className="space-y-0.5">
                      {audioInputDevices && audioInputDevices.length > 0 ? (
                        audioInputDevices.map((device, idx) => {
                          const label = device.label || `Mikrofon ${idx + 1}`;
                          const isSelected = selectedAudioDeviceId ? device.deviceId === selectedAudioDeviceId : idx === 0;
                          return (
                            <button
                              key={device.deviceId || idx}
                              onClick={() => {
                                onSwitchAudioDevice?.(device.deviceId);
                                setShowAudioMenu(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                isSelected ? 'bg-white/10 text-white font-semibold' : 'hover:bg-white/5 text-gray-300'
                              }`}
                            >
                              <span className="truncate pr-2">{label}</span>
                              {isSelected && <Check className="w-4 h-4 text-white flex-shrink-0" />}
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-3 py-2 text-xs text-gray-400 italic">Tidak ada mikrofon ditemukan</div>
                      )}
                    </div>
                  </div>

                  {/* Speaker / Audio Output Section */}
                  <div className="border-t border-[#3c4043]/80 pt-2">
                    <div className="flex items-center gap-2 px-2 py-1 mb-0.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                      <Volume2 className="w-3.5 h-3.5 text-gray-400" />
                      <span>Speaker (Output Suara)</span>
                    </div>
                    <div className="space-y-0.5">
                      {audioOutputDevices && audioOutputDevices.length > 0 ? (
                        audioOutputDevices.map((device, idx) => {
                          const label = device.label || `Speaker ${idx + 1}`;
                          const isSelected = selectedAudioOutputDeviceId ? device.deviceId === selectedAudioOutputDeviceId : idx === 0;
                          return (
                            <button
                              key={device.deviceId || idx}
                              onClick={() => {
                                onSwitchAudioOutputDevice?.(device.deviceId);
                                setShowAudioMenu(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                isSelected ? 'bg-white/10 text-white font-semibold' : 'hover:bg-white/5 text-gray-300'
                              }`}
                            >
                              <span className="truncate pr-2">{label}</span>
                              {isSelected && <Check className="w-4 h-4 text-white flex-shrink-0" />}
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-3 py-2 text-xs text-gray-400 italic">Speaker Default Sistem</div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Camera split button: chevron + camera share one pill background */}
          <div className="relative">
            <div className={`flex items-center transition-all ${
              isVideoOff ? 'rounded-2xl bg-[#842020]' : 'rounded-full bg-[#3c4043]'
            }`}>
              {/* Chevron - flat, slight rounded box, no hover */}
              <button
                onClick={() => setShowVideoMenu(!showVideoMenu)}
                className="w-10 h-12 sm:w-10 sm:h-14 flex items-center justify-center rounded-lg transition-colors cursor-pointer"
                title="Video options"
              >
                <ExpandLess className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </button>
              {/* Camera - inner circle, different color scheme when off */}
              <div className="relative">
                <button
                  onClick={isInterviewCandidate ? undefined : onToggleVideo}
                  disabled={isInterviewCandidate}
                  className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center transition-colors ${
                    isInterviewCandidate
                      ? 'rounded-full bg-[#4a4b4c] opacity-80 cursor-not-allowed'
                      : isVideoOff ? 'rounded-2xl bg-[#f5c6c2] hover:bg-[#f0b3ae] cursor-pointer' : 'rounded-full bg-[#4a4b4c] hover:bg-[#5a5b5e] cursor-pointer'
                  }`}
                  title={isInterviewCandidate ? 'Kamera wajib menyala pada sesi Interview' : isVideoOff ? 'Turn on camera (Ctrl+E)' : 'Turn off camera (Ctrl+E)'}
                >
                  {isVideoOff ? (
                    <VideocamOff className="w-6 h-6 sm:w-7 sm:h-7 text-[#d93025]" />
                  ) : (
                    <Videocam className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  )}
                </button>
                {isInterviewCandidate && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#5f6368] text-white border-2 border-[#1e1f22] flex items-center justify-center shadow-md pointer-events-none z-30" title="Kamera Terkunci (Wajib Menyala)">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                )}
              </div>
            </div>
            {showVideoMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowVideoMenu(false)} />
                <div className="absolute bottom-16 left-0 bg-[#202124] text-white rounded-2xl shadow-2xl border border-[#3c4043] p-2.5 w-80 sm:w-96 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="flex items-center gap-2 px-2 py-1 mb-0.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    <Videocam className="w-3.5 h-3.5 text-gray-400" />
                    <span>Kamera</span>
                  </div>
                  <div className="space-y-0.5">
                    {videoInputDevices && videoInputDevices.length > 0 ? (
                      videoInputDevices.map((device, idx) => {
                        const label = device.label || `Kamera ${idx + 1}`;
                        const isSelected = selectedVideoDeviceId ? device.deviceId === selectedVideoDeviceId : idx === 0;
                        return (
                          <button
                            key={device.deviceId || idx}
                            onClick={() => {
                              onSwitchVideoDevice?.(device.deviceId);
                              setShowVideoMenu(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected ? 'bg-white/10 text-white font-semibold' : 'hover:bg-white/5 text-gray-300'
                            }`}
                          >
                            <span className="truncate pr-2">{label}</span>
                            {isSelected && <Check className="w-4 h-4 text-white flex-shrink-0" />}
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-3 py-2 text-xs text-gray-400 italic">Tidak ada kamera ditemukan</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Screen Share */}
          <button
            onClick={onToggleScreenShare}
            className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center transition-all cursor-pointer ${
              isScreenSharing
                ? 'rounded-2xl bg-[#c2e7ff] text-[#001d35]'
                : 'rounded-full bg-[#3c4043] hover:bg-[#4a4b4c] text-white'
            }`}
            title={isScreenSharing ? 'Stop sharing (Ctrl+Shift+S)' : 'Share screen (Ctrl+Shift+S)'}
          >
            <PresentToAll className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>

          {/* CC / Captions & Keyboard Shortcuts */}
          <div className="relative">
            <button
              onClick={() => setShowShortcutsMenu((p) => !p)}
              className={`hidden md:flex w-12 h-12 sm:w-14 sm:h-14 items-center justify-center transition-all cursor-pointer ${
                showShortcutsMenu
                  ? 'rounded-2xl bg-[#c2e7ff] text-[#001d35]'
                  : 'rounded-full bg-[#3c4043] hover:bg-[#4a4b4c] text-white'
              }`}
              title="Pintasan papan ketik (c)"
            >
              <KeyboardFilled className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>

            {showShortcutsMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowShortcutsMenu(false)} 
                />
                <div className="absolute bottom-full mb-5 left-1/2 -translate-x-1/2 bg-[#202124] text-white rounded-[24px] shadow-[0_16px_50px_rgba(0,0,0,0.8)] p-5 w-[92vw] max-w-[560px] z-50 border border-[#3c4043]/80 animate-in fade-in slide-in-from-bottom-3 duration-250">
                  {/* Prominent speech bubble arrow pointing down */}
                  <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[14px] border-t-[#202124]" />

                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#3c4043]/80">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#3c4043] flex items-center justify-center">
                        <KeyboardFilled className="w-4 h-4 text-gray-200" />
                      </div>
                      <h4 className="text-white text-sm font-semibold tracking-wide">Pintasan Papan Ketik</h4>
                    </div>
                    <button 
                      onClick={() => setShowShortcutsMenu(false)} 
                      className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* 2-Column Grid Layout (Kanan Kiri 2 2 2) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-200">
                    <div className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-white/5 transition-colors">
                      <span className="font-medium text-gray-300">Mute / Unmute Mic</span>
                      <kbd className="px-2 py-0.5 bg-[#3c4043] text-white font-medium rounded-md border border-[#5f6368]/70 font-mono text-[10px] shadow-sm">Ctrl + D</kbd>
                    </div>

                    <div className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-white/5 transition-colors">
                      <span className="font-medium text-gray-300">Kamera On / Off</span>
                      <kbd className="px-2 py-0.5 bg-[#3c4043] text-white font-medium rounded-md border border-[#5f6368]/70 font-mono text-[10px] shadow-sm">Ctrl + E</kbd>
                    </div>

                    <div className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-white/5 transition-colors">
                      <span className="font-medium text-gray-300">Bagikan Layar</span>
                      <kbd className="px-2 py-0.5 bg-[#3c4043] text-white font-medium rounded-md border border-[#5f6368]/70 font-mono text-[10px] shadow-sm">Ctrl + Shift + S</kbd>
                    </div>

                    <div className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-white/5 transition-colors">
                      <span className="font-medium text-gray-300">Papan Tulis</span>
                      <kbd className="px-2 py-0.5 bg-[#3c4043] text-white font-medium rounded-md border border-[#5f6368]/70 font-mono text-[10px] shadow-sm">Ctrl + Shift + B</kbd>
                    </div>

                    <div className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-white/5 transition-colors">
                      <span className="font-medium text-gray-300">Anotasi Layar</span>
                      <kbd className="px-2 py-0.5 bg-[#3c4043] text-white font-medium rounded-md border border-[#5f6368]/70 font-mono text-[10px] shadow-sm">Ctrl + Shift + A</kbd>
                    </div>

                    {isHost && (
                      <div className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-white/5 transition-colors">
                        <span className="font-medium text-gray-300">Riwayat Rekaman</span>
                        <kbd className="px-2 py-0.5 bg-[#3c4043] text-white font-medium rounded-md border border-[#5f6368]/70 font-mono text-[10px] shadow-sm">Ctrl + Shift + R</kbd>
                      </div>
                    )}

                    <div className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-white/5 transition-colors">
                      <span className="font-medium text-gray-300">Angkat Tangan</span>
                      <kbd className="px-2 py-0.5 bg-[#3c4043] text-white font-medium rounded-md border border-[#5f6368]/70 font-mono text-[10px] shadow-sm">h</kbd>
                    </div>

                    <div className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-white/5 transition-colors">
                      <span className="font-medium text-gray-300">Fullscreen</span>
                      <kbd className="px-2 py-0.5 bg-[#3c4043] text-white font-medium rounded-md border border-[#5f6368]/70 font-mono text-[10px] shadow-sm">f</kbd>
                    </div>

                    <div className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-white/5 transition-colors">
                      <span className="font-medium text-gray-300">Aksi Host</span>
                      <kbd className="px-2 py-0.5 bg-[#3c4043] text-white font-medium rounded-md border border-[#5f6368]/70 font-mono text-[10px] shadow-sm">Ctrl + /</kbd>
                    </div>

                    <div className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-white/5 transition-colors">
                      <span className="font-medium text-gray-300">Salin Link Meeting</span>
                      <kbd className="px-2 py-0.5 bg-[#3c4043] text-white font-medium rounded-md border border-[#5f6368]/70 font-mono text-[10px] shadow-sm">Ctrl + C</kbd>
                    </div>

                    <div className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-white/5 transition-colors">
                      <span className="font-medium text-gray-300">Buka Pintasan Ini</span>
                      <kbd className="px-2 py-0.5 bg-[#3c4043] text-white font-medium rounded-md border border-[#5f6368]/70 font-mono text-[10px] shadow-sm">c</kbd>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Raise Hand */}
          <button
            onClick={onToggleHand}
            className={`hidden sm:flex w-12 h-12 sm:w-14 sm:h-14 items-center justify-center transition-all cursor-pointer ${
              isHandRaised
                ? 'rounded-2xl bg-[#c2e7ff] text-[#001d35]'
                : 'rounded-full bg-[#3c4043] hover:bg-[#4a4b4c] text-white'
            }`}
            title={isHandRaised ? 'Lower hand' : 'Raise hand'}
          >
            <BackHand className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
          {/* Desktop Overlay Coret-Coret (Electron Only) */}
          <AnnotationTriggerButton />

          {/* More Options */}
          <div className="relative">
            <button
              onClick={() => setShowMoreOptions((p) => !p)}
              className="w-10 h-12 sm:w-11 sm:h-14 flex items-center justify-center rounded-full bg-[#3c4043] hover:bg-[#4a4b4c] transition-all cursor-pointer"
              title="More options"
            >
              <MoreVert className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </button>

            {showMoreOptions && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMoreOptions(false)} />
                <div className="absolute bottom-full mb-3 left-0 bg-[#202124] rounded-xl shadow-2xl py-2 min-w-[300px] z-50 border border-[#3c3c3c]">
                  {/* Recording Menu Item */}
                  {isHost && (
                    <>
                      <button
                        onClick={() => {
                          if (isRecording) {
                            onStopRecording?.();
                          } else {
                            onStartRecording?.();
                          }
                          setShowMoreOptions(false);
                        }}
                        className="w-full px-4 py-3 text-left text-white hover:bg-[#3c4043] flex items-center gap-4 transition-colors cursor-pointer"
                      >
                        <div className="w-5 h-5 flex items-center justify-center">
                          <div className={`w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center ${isRecording ? 'border-red-500' : 'border-gray-300'}`}>
                            <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
                          </div>
                        </div>
                        <span className="text-sm font-medium">{isRecording ? 'Berhenti merekam' : 'Rekam panggilan'}</span>
                      </button>
                      <div className="h-px bg-[#444] my-1 mx-0" />
                    </>
                  )}

                  {/* Adjust View */}
                  <button
                    onClick={() => {
                      setShowLayoutMenu(true);
                      setShowMoreOptions(false);
                    }}
                    className="w-full px-4 py-3 text-left text-white hover:bg-[#3c4043] flex items-center gap-4 transition-colors cursor-pointer"
                  >
                    <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
                    </svg>
                    <span className="text-sm">Sesuaikan tampilan</span>
                  </button>

                  {/* Fullscreen */}
                  <button
                    onClick={() => {
                      if (document.fullscreenElement) {
                        document.exitFullscreen().catch(console.error);
                      } else {
                        document.documentElement.requestFullscreen().catch(console.error);
                      }
                      setShowMoreOptions(false);
                    }}
                    className="w-full px-4 py-3 text-left text-white hover:bg-[#3c4043] flex items-center gap-4 transition-colors cursor-pointer"
                  >
                    <Maximize className="w-5 h-5 text-gray-300" />
                    <span className="text-sm">Layar penuh</span>
                  </button>

                  {/* Whiteboard - Only available for Host to initiate */}
                  {isHost && (
                    <button
                      onClick={() => {
                        onToggleWhiteboard?.();
                        setShowMoreOptions(false);
                      }}
                      className="w-full px-4 py-3 text-left text-white hover:bg-[#3c4043] flex items-center gap-4 transition-colors cursor-pointer"
                    >
                      <Presentation className="w-5 h-5 text-[#8ab4f8]" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium flex items-center gap-2">
                          Papan Tulis (Whiteboard)
                          {isWhiteboardOpen && <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
                        </span>
                      </div>
                    </button>
                  )}

                  {/* Background and Effects */}
                  <button
                    onClick={() => {
                      onToggleBgPanel?.();
                      setShowMoreOptions(false);
                    }}
                    className="w-full px-4 py-3 text-left text-white hover:bg-[#3c4043] flex items-center gap-4 transition-colors cursor-pointer"
                  >
                    <VisualEffects className="w-5 h-5 text-gray-300" />
                    <span className="text-sm">Latar belakang dan efek</span>
                  </button>

                  {/* Riwayat Rekaman */}
                  {isHost && (
                    <button
                      onClick={() => {
                        onToggleRecordingsPanel?.();
                        setShowMoreOptions(false);
                      }}
                      className="w-full px-4 py-3 text-left text-white hover:bg-[#3c4043] flex items-center gap-4 transition-colors cursor-pointer"
                    >
                      <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">Riwayat rekaman</span>
                    </button>
                  )}
                </div>
              </>
            )}

            {showLayoutMenu && (
              <div 
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => { setShowLayoutMenu(false); setShowMoreOptions(false); }}
              >
                <div 
                  className="bg-[#28292c] rounded-2xl shadow-2xl overflow-hidden w-[90%] max-w-md z-[10000] border border-[#3c4043] animate-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-5 border-b border-[#3c4043] flex items-center justify-between">
                    <h3 className="text-white text-lg font-medium">Change layout</h3>
                    <button 
                      onClick={() => setShowLayoutMenu(false)} 
                      className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="py-3 px-3">
                    {[
                      { id: 'auto', label: 'Auto (dynamic)',
                        icon: (
                          <div className="flex gap-[2px] w-12 h-8 bg-[#1a1a1a] rounded-sm border border-[#3c3c3c] p-1">
                            <div className="flex-1 bg-[#3c3c3c] rounded-sm" />
                            <div className="flex-1 bg-[#3c3c3c] rounded-sm" />
                            <div className="flex-1 bg-[#3c3c3c] rounded-sm" />
                            <div className="flex-1 bg-[#3c3c3c] rounded-sm" />
                          </div>
                        )
                      },
                      { id: 'tiled', label: 'Tiled (legacy)',
                        icon: (
                          <div className="grid grid-cols-4 grid-rows-3 gap-[2px] w-12 h-8 bg-[#1a1a1a] rounded-sm border border-[#3c3c3c] p-1">
                            {[...Array(12)].map((_, i) => <div key={i} className="bg-[#3c3c3c] rounded-[1px]" />)}
                          </div>
                        )
                      },
                      { id: 'spotlight', label: 'Spotlight',
                        icon: (
                          <div className="w-12 h-8 bg-[#1a1a1a] rounded-sm border border-[#3c3c3c] p-1">
                            <div className="w-full h-full bg-[#3c3c3c] rounded-sm" />
                          </div>
                        )
                      },
                      { id: 'sidebar', label: 'Sidebar',
                        icon: (
                          <div className="flex gap-[2px] w-12 h-8 bg-[#1a1a1a] rounded-sm border border-[#3c3c3c] p-1">
                            <div className="flex-[3] bg-[#3c3c3c] rounded-sm" />
                            <div className="flex-1 flex flex-col gap-[2px]">
                              {[...Array(4)].map((_, i) => <div key={i} className="flex-1 bg-[#3c3c3c] rounded-[1px]" />)}
                            </div>
                          </div>
                        )
                      },
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          onChangeLayout?.(option.id as any);
                          setShowLayoutMenu(false);
                          setShowMoreOptions(false);
                        }}
                        className="w-full px-4 py-3 rounded-xl flex items-center justify-between transition-colors cursor-pointer hover:bg-[#3c4043]/60 mb-1"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${layout === option.id ? 'border-[#8ab4f8]' : 'border-gray-400'}`}>
                            {layout === option.id && <div className="w-2.5 h-2.5 rounded-full bg-[#8ab4f8]" />}
                          </div>
                          <span className={`text-[15px] ${layout === option.id ? 'text-white font-medium' : 'text-gray-300'}`}>
                            {option.label}
                            {option.id === 'auto' && <span className="ml-1 text-[#8ab4f8]">✦</span>}
                          </span>
                        </div>
                        {option.icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

        {/* End Call - outside the container, red pill */}
        <button
          onClick={onEndCall}
          className="w-12 h-12 sm:w-16 sm:h-14 flex items-center justify-center rounded-full bg-[#ea4335] hover:bg-[#d93025] transition-all cursor-pointer ml-2 sm:ml-4"
          title="Leave call"
        >
          <CallEndFilled className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
        </button>
        </div>
      </div>

      <div className="flex items-center gap-1 justify-end w-auto sm:w-1/4 pr-1 sm:pr-2">

        {/* Panel pill: Requests / People / Chat — dibungkus kapsul gelap, icon-only */}
        <div className="flex items-center gap-1 bg-[#3c4043] rounded-full p-1">
          {/* Requests */}
          {joinRequestsCount > 0 && (
            <PanelButton
              icon={<UserPlus className="w-5 h-5 fill-current" />}
              label="Requests"
              active={showRequests}
              onClick={onToggleRequests}
              title="Join requests"
              badge={joinRequestsCount}
            />
          )}

          {/* People */}
          <PanelButton
            icon={<Group className="w-5 h-5 fill-current" />}
            label="People"
            active={showParticipants}
            onClick={onToggleParticipants}
            title="People"
          />

          {/* Chat */}
          <PanelButton
            icon={<Chat className="w-5 h-5 fill-current" />}
            label="Chat"
            active={showChat}
            onClick={onToggleChat}
            title="In-call messages"
            badge={unreadChatCount}
          />
        </div>

        {/* Recording Result Notification Toast (Host Only) */}
        {isHost && recordingResult && (
          <div 
            onClick={() => onToggleRecordingsPanel?.()}
            className="absolute bottom-24 right-4 bg-[#292a2d] text-white rounded-2xl shadow-2xl border-none p-4 z-50 cursor-pointer hover:bg-[#323337] transition-all animate-in fade-in slide-in-from-bottom-4 duration-250 flex items-center gap-3.5"
            title="Klik untuk membuka Riwayat Rekaman"
          >
            <div className="w-9 h-9 rounded-full bg-[#3c4043] text-gray-200 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h4 className="text-white text-xs font-semibold">Rekaman telah disimpan</h4>
              <p className="text-gray-400 text-[11px] mt-0.5">
                Tekan <kbd className="px-1.5 py-0.5 bg-[#3c4043] text-white rounded text-[10px] font-mono border border-gray-600/50">Ctrl + Shift + R</kbd> untuk melihat riwayat
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}