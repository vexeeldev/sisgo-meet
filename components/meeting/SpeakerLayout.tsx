'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { BackHand as Hand, MicOffFilled as MicOff } from './icons';
import { NetworkQuality } from '@/hooks/useWebRTC';
import NetworkIndicator from './room/NetworkIndicator';
import { getUserColors } from '@/lib/meeting';
import dynamic from 'next/dynamic';
import { Sparkles, X, Volume2, VolumeX, Pin, PinOff } from 'lucide-react';
import ParticipantsRail from './ParticipantsRail';

const ExcalidrawCanvas = dynamic(() => import('./ExcalidrawCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#1e1f22] text-white">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
      <span className="text-sm font-medium text-gray-300">Memuat Papan Tulis (Excalidraw)...</span>
    </div>
  ),
});

const ScreenAnnotation = dynamic(() => import('./ScreenAnnotation'), {
  ssr: false,
});

interface RemoteScreenShare {
  stream: MediaStream;
  participantId: string;
  participantName?: string;
}

function stringToColor(str: string): string {
  const colors = [
    '#1a73e8', '#0f9d58', '#f29900', '#d93025',
    '#7627bb', '#00897b', '#e37400', '#c2185b',
    '#1565c0', '#2e7d32',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

interface SpeakerLayoutProps {
  localStream: MediaStream | null;
  remoteStreams: MediaStream[];
  participantName?: string;
  participantNames?: Record<string, string>;
  isVideoOff?: boolean;
  isAudioOff?: boolean;
  isScreenSharing?: boolean;
  screenStream?: MediaStream | null;
  onStopSharing?: () => void;
  remoteVideoOff?: Record<string, boolean>;
  remoteScreenShare?: RemoteScreenShare | null;
  hidePip?: boolean;
  raisedHands?: Record<string, boolean>;
  remoteAudioOff?: Record<string, boolean>;
  speaking?: Record<string, boolean>;
  networkQuality?: Record<string, NetworkQuality>;
  isWhiteboardOpen?: boolean;
  isWhiteboardMinimized?: boolean;
  isHost?: boolean;
  whiteboardSnapshot?: any;
  onWhiteboardSnapshotChange?: (snapshot: any) => void;
  onCloseWhiteboard?: () => void;
  canDraw?: boolean;
  screenAnnotations?: any[];
  onChangeScreenAnnotations?: (annotations: any[]) => void;
  onScreenAnnotationStart?: (item: any) => void;
  onScreenAnnotationDraw?: (data: { id: string; points: number[] }) => void;
  onScreenAnnotationEnd?: (data: { id: string }) => void;
  onClearScreenAnnotations?: () => void;
  isScreenAnnotationOpen?: boolean;
  onCloseScreenAnnotation?: () => void;
  onOpenWhiteboard?: () => void;
  hostName?: string;
  pinnedParticipants?: string[];
  onTogglePin?: (id: string) => void;
}

export default function SpeakerLayout({
  localStream,
  remoteStreams,
  participantName = 'You',
  participantNames = {},
  isVideoOff = false,
  isAudioOff = false,
  isScreenSharing = false,
  screenStream = null,
  onStopSharing,
  remoteVideoOff = {},
  remoteScreenShare = null,
  hidePip = false,
  raisedHands = {},
  remoteAudioOff = {},
  speaking = {},
  networkQuality = {},
  isWhiteboardOpen = false,
  isWhiteboardMinimized = false,
  isHost = false,
  whiteboardSnapshot,
  onWhiteboardSnapshotChange,
  onCloseWhiteboard,
  canDraw = false,
  screenAnnotations = [],
  onChangeScreenAnnotations,
  onScreenAnnotationStart,
  onScreenAnnotationDraw,
  onScreenAnnotationEnd,
  onClearScreenAnnotations,
  isScreenAnnotationOpen = false,
  onCloseScreenAnnotation,
  onOpenWhiteboard,
  hostName = 'Host',
  pinnedParticipants = [],
  onTogglePin,
}: SpeakerLayoutProps) {
  const localMainVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Record<string, HTMLVideoElement>>({});
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const [blockedAutoplay, setBlockedAutoplay] = useState<Record<string, boolean>>({});
  const [isScreenAudioMuted, setIsScreenAudioMuted] = useState(false);
  const [isInitialMount, setIsInitialMount] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsInitialMount(false), 2000);
    return () => clearTimeout(t);
  }, []);

  const isLocalScreenSharing = isScreenSharing && screenStream !== null;

  const activeScreenStream = screenStream ?? remoteScreenShare?.stream ?? null;
  const showScreen = activeScreenStream !== null;

  // Note: remoteStreams passed here is already filtered in MeetingVideo (no screen stream)
  const cameraStreams = remoteStreams;

  const playWithAutoplayFallback = (video: HTMLVideoElement, streamId: string) => {
    video.play().catch((err) => {
      console.warn(`Autoplay blocked for ${streamId}, retrying muted:`, err?.name || err);
      video.muted = true;
      setBlockedAutoplay((prev) => ({ ...prev, [streamId]: true }));
      video.play().catch(console.error);
    });
  };

  const unmuteRemote = (streamId: string) => {
    const video = remoteVideoRefs.current[streamId];
    if (video) {
      video.muted = false;
      video.play().catch(console.error);
    }
    setBlockedAutoplay((prev) => {
      const next = { ...prev };
      delete next[streamId];
      return next;
    });
  };

  const attachRemoteStream = useCallback(
    (streamId: string, el: HTMLVideoElement | null) => {
      if (!el) {
        delete remoteVideoRefs.current[streamId];
        return;
      }
      remoteVideoRefs.current[streamId] = el;

      const stream = cameraStreams.find((s) => s.id === streamId);
      if (!stream) return;

      if (el.srcObject !== stream) {
        el.srcObject = stream;
        playWithAutoplayFallback(el, streamId);
      }
    },
    [cameraStreams]
  );

  useEffect(() => {
    const video = screenVideoRef.current;
    if (!video) return;

    if (!activeScreenStream) {
      video.pause();
      video.srcObject = null;
      video.load();
      return;
    }

    if (video.srcObject !== activeScreenStream) {
      video.srcObject = activeScreenStream;
      video.play().catch(console.error);
    }

    const track = activeScreenStream.getVideoTracks()[0];
    if (!track) return;

    const handleEnded = () => {
      if (screenVideoRef.current) {
        screenVideoRef.current.pause();
        screenVideoRef.current.srcObject = null;
        screenVideoRef.current.load();
      }
      if (screenStream && track === screenStream.getVideoTracks()[0]) {
        onStopSharing?.();
      }
    };

    track.addEventListener('ended', handleEnded);
    return () => track.removeEventListener('ended', handleEnded);
  }, [activeScreenStream, screenStream, onStopSharing]);

  useEffect(() => {
    setIsScreenAudioMuted(false);
  }, [activeScreenStream]);

  useEffect(() => {
    const video = localMainVideoRef.current;
    if (!video) return;

    if (localStream && !isVideoOff && cameraStreams.length === 0 && !activeScreenStream) {
      video.srcObject = localStream;
      video.play().catch(console.error);
    }
  }, [localStream, isVideoOff, cameraStreams.length, activeScreenStream]);

  useEffect(() => {
    cameraStreams.forEach((stream) => {
      const videoEl = remoteVideoRefs.current[stream.id];
      if (videoEl) {
        attachRemoteStream(stream.id, videoEl);
      }
    });
  }, [cameraStreams, attachRemoteStream]);

  const mainSpeaker = cameraStreams.length > 0 ? cameraStreams[0] : null;

  const hasVideoTrack = (stream: MediaStream | null) => {
    if (!stream) return false;
    return stream.getVideoTracks().length > 0;
  };

  const isRemoteVideoActive = (stream: MediaStream | null) => {
    if (!stream) return false;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return false;
    if (remoteVideoOff[stream.id]) return false;
    return true;
  };

  const getMainContent = () => {
    if (isWhiteboardOpen && !isWhiteboardMinimized) {
      return 'whiteboard';
    }
    if (showScreen) {
      return 'screen';
    }
    if (mainSpeaker) {
      return 'remote';
    }
    return 'local';
  };

  const mainContent = getMainContent();

  const renderMainContent = () => {
    if (mainContent === 'remote' && mainSpeaker) {
      const isOff = remoteVideoOff[mainSpeaker.id] || !hasVideoTrack(mainSpeaker);
      const isSpeaking = speaking[mainSpeaker.id] && !remoteAudioOff[mainSpeaker.id];
      const isMuted = remoteAudioOff[mainSpeaker.id];
      const name = participantNames[mainSpeaker.id] || 'Speaker';
      const colors = getUserColors(name);
      return (
        <div className={`group relative w-full h-full rounded-2xl overflow-hidden transition-all duration-300 border-2 border-transparent`}>
          <video
            ref={(el) => attachRemoteStream(mainSpeaker.id, el)}
            autoPlay
            playsInline
            className={`w-full h-full object-cover transition-opacity duration-300 ${isOff ? 'opacity-0' : 'opacity-100'}`}
          />
          {isOff && (
            <div
              className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center transition-opacity duration-300`}
              style={{ backgroundColor: colors.from, backgroundImage: `radial-gradient(circle farthest-corner at 50% 50%, transparent 0%, rgba(0,0,0,0.35) 120%)` }}
            >
              <div
                className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center text-white text-5xl sm:text-6xl font-normal ${colors.circle} shadow-sm transition-all duration-300 border-2 select-none ${isSpeaking && !isMuted ? 'border-[#8ab4f8] ring-2 ring-[#8ab4f8]/20 scale-105' : 'border-transparent'}`}
              >
                {name.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
          {raisedHands[mainSpeaker.id] ? (
            <div className="absolute bottom-4 left-4 bg-[#c4edd0] text-[#072711] px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2.5 shadow-xl z-30 border border-[#072711]/15 animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
              <Hand className="w-4.5 h-4.5 text-[#072711]" />
              <span>{name}</span>
              <NetworkIndicator quality={networkQuality[mainSpeaker.id]} />
              {pinnedParticipants.includes(mainSpeaker.id) && <Pin className="w-4.5 h-4.5 text-[#072711] ml-1" />}
            </div>
          ) : (
            <div className="absolute bottom-4 left-4 text-white text-[15px] font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] flex items-center gap-2 z-30 pointer-events-none">
              {name}
              <NetworkIndicator quality={networkQuality[mainSpeaker.id]} />
              {pinnedParticipants.includes(mainSpeaker.id) && <Pin className="w-4.5 h-4.5 text-white ml-1 drop-shadow-md" />}
            </div>
          )}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 flex items-center justify-center z-20 pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin?.(mainSpeaker.id);
              }}
              className="p-3 sm:p-4 rounded-full bg-black/60 text-white hover:bg-blue-500 transition-colors"
            >
              {pinnedParticipants.includes(mainSpeaker.id) ? <PinOff className="w-8 h-8" /> : <Pin className="w-8 h-8" />}
            </button>
          </div>
          {isMuted && (
            <div className="absolute top-4 right-4 bg-[#202124]/80 backdrop-blur-sm rounded-full p-1.5 z-10">
              <MicOff className="w-4 h-4 text-white" />
            </div>
          )}
          {blockedAutoplay[mainSpeaker.id] && !isOff && (
            <button
              onClick={() => unmuteRemote(mainSpeaker.id)}
              className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-xs hover:bg-black/80 transition"
            >
              Klik untuk unmute
            </button>
          )}
        </div>
      );
    }

    if (mainContent === 'local') {
      const isSpeaking = speaking['local'] && !isAudioOff;
      const colors = getUserColors(participantName);
      return (
        <div className={`group relative w-full h-full rounded-2xl overflow-hidden transition-all duration-300 border-2 border-transparent animate-tile-zoom`}>
          <style>{`
            @keyframes tileZoomEntry {
              0% {
                opacity: 0;
                transform: scale(0.35);
              }
              25% {
                opacity: 0.45;
                transform: scale(0.65);
              }
              55% {
                opacity: 0.85;
                transform: scale(0.88);
              }
              80% {
                opacity: 0.98;
                transform: scale(0.97);
              }
              100% {
                opacity: 1;
                transform: scale(1);
              }
            }
            @keyframes cameraReveal {
              0%, 80% {
                opacity: 0;
              }
              100% {
                opacity: 1;
              }
            }
            @keyframes placeholderFadeout {
              0%, 80% {
                opacity: 1;
              }
              100% {
                opacity: 0;
              }
            }
            .animate-tile-zoom {
              animation: tileZoomEntry 2000ms cubic-bezier(0.25, 1, 0.35, 1) forwards;
              transform-origin: center;
            }
            .animate-camera-reveal {
              animation: cameraReveal 2000ms ease-out forwards;
            }
            .animate-placeholder-fadeout {
              animation: placeholderFadeout 2000ms ease-out forwards;
            }
          `}</style>
          <video
            ref={localMainVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${isVideoOff ? 'opacity-0' : (isInitialMount ? 'animate-camera-reveal' : 'opacity-100')}`}
          />
          <div
            className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center transition-opacity duration-300 ${isVideoOff ? 'opacity-100' : (isInitialMount ? 'animate-placeholder-fadeout pointer-events-none' : 'opacity-0 pointer-events-none')}`}
            style={{ backgroundColor: colors.from, backgroundImage: `radial-gradient(circle farthest-corner at 50% 50%, transparent 0%, rgba(0,0,0,0.35) 120%)` }}
          >
            <div className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center text-white text-5xl sm:text-6xl font-normal ${colors.circle} shadow-sm transition-all duration-300 border-2 select-none ${isSpeaking && !isAudioOff ? 'border-[#8ab4f8] ring-2 ring-[#8ab4f8]/20 scale-105' : 'border-transparent'}`}>
              {participantName.charAt(0).toUpperCase()}
            </div>
          </div>
          {raisedHands['local'] ? (
            <div className="absolute bottom-4 left-4 bg-[#c4edd0] text-[#072711] px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2.5 shadow-xl z-30 border border-[#072711]/15 animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
              <Hand className="w-4.5 h-4.5 text-[#072711]" />
              <span>{participantName}</span>
              {pinnedParticipants.includes('local') && <Pin className="w-4.5 h-4.5 text-[#072711] ml-1" />}
            </div>
          ) : (
            <div className="absolute bottom-4 left-4 text-white text-[15px] font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] flex items-center gap-2 z-30 pointer-events-none">
              {participantName}
              <NetworkIndicator quality={networkQuality['local']} />
              {pinnedParticipants.includes('local') && <Pin className="w-4.5 h-4.5 text-white ml-1 drop-shadow-md" />}
            </div>
          )}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 flex items-center justify-center z-20 pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin?.('local');
              }}
              className="p-3 sm:p-4 rounded-full bg-black/60 text-white hover:bg-blue-500 transition-colors"
            >
              {pinnedParticipants.includes('local') ? <PinOff className="w-8 h-8" /> : <Pin className="w-8 h-8" />}
            </button>
          </div>
          {isAudioOff && (
            <div className="absolute top-4 right-4 bg-[#202124]/80 backdrop-blur-sm rounded-full p-1.5 z-10">
              <MicOff className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      );
    }

    return (() => {
      const colors = getUserColors(participantName);
      const isSpeakerActive = mainSpeaker ? (speaking[mainSpeaker.id] && !(mainSpeaker.id === 'local' ? isAudioOff : remoteAudioOff[mainSpeaker.id])) : false;
      return (
        <div className="w-full h-full bg-[#202124] flex flex-col items-center justify-center relative rounded-2xl overflow-hidden">
          <div
            className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center text-white text-5xl sm:text-6xl font-semibold shadow-md transition-all duration-300 border-2 select-none ${isSpeakerActive ? 'border-[#8ab4f8] ring-2 ring-[#8ab4f8]/20 scale-105' : 'border-transparent'}`}
            style={{ backgroundColor: colors.from }}
          >
            {participantName.charAt(0).toUpperCase()}
          </div>
          <div className="absolute bottom-4 left-4 text-white text-[15px] font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] flex items-center gap-2">
            {participantName}
            <NetworkIndicator quality={networkQuality['local']} />
          </div>
          {isAudioOff && (
            <div className={`absolute top-4 ${raisedHands['local'] ? 'right-14' : 'right-4'} bg-[#202124]/80 backdrop-blur-sm rounded-full p-1.5 z-10`}>
              <MicOff className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      );
    })();
  };

  return (
    <div className="w-full h-full relative bg-transparent rounded-xl overflow-hidden">
      {mainContent === 'whiteboard' ? (
        <div className="w-full h-full relative flex flex-col rounded-2xl overflow-hidden bg-[#1e1f22] border border-[#3c4043] shadow-2xl">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#2b2c30] border-b border-[#3c4043] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-white text-sm font-semibold flex items-center gap-2">
                  Papan Tulis Rapat (Whiteboard)
                  {isHost ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium">Host Control</span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live View
                    </span>
                  )}
                </h3>
              </div>
            </div>

            {onCloseWhiteboard && (
              <button
                onClick={onCloseWhiteboard}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-[#3c4043] hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
                title={isHost ? "Tutup Whiteboard (Untuk Semua Peserta)" : "Sembunyikan Whiteboard (Tampilan Lokal)"}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Canvas Body */}
          <div className="flex-1 w-full h-full relative overflow-hidden bg-white">
            <ExcalidrawCanvas
              isHost={!!isHost}
              participantName={participantName}
              initialSnapshot={whiteboardSnapshot}
              onSnapshotChange={onWhiteboardSnapshotChange}
              canDraw={canDraw}
            />
          </div>
        </div>
      ) : mainContent === 'screen' ? (
        <div className="w-full h-full relative flex items-center justify-center group bg-transparent overflow-hidden">
          <video
            ref={screenVideoRef}
            autoPlay
            playsInline
            muted={isLocalScreenSharing || isScreenAudioMuted}
            className="w-full h-full object-contain pointer-events-none"
          />

          {/* Realtime Screen Annotation Overlay (React Konva) */}
          {(screenAnnotations.length > 0 || onCloseScreenAnnotation) && (
            <ScreenAnnotation
              isSharingHost={isLocalScreenSharing}
              participantName={participantName}
              annotations={screenAnnotations}
              onChangeAnnotations={onChangeScreenAnnotations}
              onAnnotationStart={onScreenAnnotationStart}
              onAnnotationDraw={onScreenAnnotationDraw}
              onAnnotationEnd={onScreenAnnotationEnd}
              onClearAnnotations={onClearScreenAnnotations}
              onCloseAnnotation={onCloseScreenAnnotation}
            />
          )}

          <div className="absolute top-4 left-4 flex items-center gap-2 bg-[#202124]/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#3c4043]">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-white text-xs font-medium">
              {isLocalScreenSharing
                ? 'Anda sedang berbagi layar'
                : `${remoteScreenShare?.participantName ?? 'Peserta'} sedang berbagi layar`}
            </span>
          </div>

          {/* Screen Share Audio Mute/Unmute Toggle Button — Appears on Hover */}
          {activeScreenStream && activeScreenStream.getAudioTracks().length > 0 && (
            <button
              onClick={() => {
                setIsScreenAudioMuted((prev: boolean) => {
                  const nextState = !prev;
                  if (screenVideoRef.current) {
                    screenVideoRef.current.muted = isLocalScreenSharing || nextState;
                  }
                  activeScreenStream.getAudioTracks().forEach((track) => {
                    track.enabled = !nextState;
                  });
                  return nextState;
                });
              }}
              className={`absolute top-4 right-4 flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all shadow-xl cursor-pointer border opacity-0 group-hover:opacity-100 ${isScreenAudioMuted
                  ? 'bg-red-500/90 text-white border-red-400/50 hover:bg-red-600'
                  : 'bg-[#202124]/80 text-white border-[#3c4043] hover:bg-[#3c4043]'
                }`}
              title={isScreenAudioMuted ? 'Nyalakan audio layar' : 'Matikan audio layar'}
            >
              {isScreenAudioMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-white" />
                  <span>Audio Layar (Muted)</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-[#8ab4f8]" />
                  <span>Audio Layar (Aktif)</span>
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        <div className="w-full h-full relative">
          {renderMainContent()}

          {(mainContent === 'remote' && mainSpeaker && raisedHands[mainSpeaker.id]) || (mainContent === 'local' && raisedHands['local']) ? (
            <div className="absolute top-4 right-4 bg-[#8ab4f8] rounded-full p-2 shadow-lg shadow-black/50 animate-pulse border-2 border-white/20 z-20">
              <Hand className="w-6 h-6 text-[#202124]" />
            </div>
          ) : null}
        </div>
      )}

      {/* PiP local — sembunyikan kalau rail sudah menampilkan local */}
      {!hidePip && mainContent !== 'local' && localStream && (
        <div className={`absolute top-4 right-4 w-60 aspect-video bg-[#3c4043] rounded-xl overflow-hidden shadow-2xl z-10 transition-all duration-300 hover:scale-105 cursor-pointer group border-2 border-gray-600/30`}>
          <video
            ref={(el) => {
              if (el && el.srcObject !== localStream) {
                el.srcObject = localStream;
                el.play().catch(console.error);
              }
            }}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${isVideoOff ? 'opacity-0' : 'opacity-100'}`}
          />
          {isVideoOff && (() => {
            const colors = getUserColors(participantName);
            const isSpeaking = speaking['local'] && !isAudioOff;
            return (
              <div
                className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center transition-opacity duration-300`}
                style={{
                  backgroundColor: colors.from,
                  backgroundImage: `radial-gradient(circle farthest-corner at 50% 50%, transparent 0%, rgba(0,0,0,0.35) 120%)`
                }}
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white text-lg sm:text-xl font-normal ${colors.circle} shadow-sm transition-all duration-300 border-2 select-none ${isSpeaking ? 'border-[#8ab4f8] ring-2 ring-[#8ab4f8]/20 scale-105' : 'border-transparent'}`}>
                  {participantName.charAt(0).toUpperCase()}
                </div>
              </div>
            );
          })()}
          <div className="absolute bottom-2 left-2 text-white text-xs font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] flex items-center gap-1.5 z-30 pointer-events-none">
            Anda
            <NetworkIndicator quality={networkQuality['local']} />
            {pinnedParticipants.includes('local') && <Pin className="w-3.5 h-3.5 text-white ml-0.5 drop-shadow-md" />}
          </div>
          {isAudioOff && (
            <div className="absolute top-2 right-2 bg-[#202124]/80 backdrop-blur-sm rounded-full p-1 z-10">
              <MicOff className="w-3 h-3 text-white" />
            </div>
          )}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 flex items-center justify-center z-20 pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin?.('local');
              }}
              className="p-2 sm:p-3 rounded-full bg-black/60 text-white hover:bg-blue-500 transition-colors"
            >
              {pinnedParticipants.includes('local') ? <PinOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Pin className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}