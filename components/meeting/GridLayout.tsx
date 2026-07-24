'use client';

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { BackHand as Hand, MicOffFilled as MicOff } from './icons';
import VideoPlaceholder from './VideoPlaceholder';

interface GridLayoutProps {
  streams: MediaStream[];
  localStream?: MediaStream | null;
  participantNames?: Record<string, string>;
  isVideoOff?: boolean;
  isAudioOff?: boolean;
  remoteVideoOff?: Record<string, boolean>;
  remoteAudioOff?: Record<string, boolean>;
  speaking?: Record<string, boolean>;
  raisedHands?: Record<string, boolean>;
}

const GROUP_SIZE = 6;

const palettes = [
  { from: '#3f2b96', to: '#281c5f', circle: 'bg-[#5c40d6]' }, // Purple
  { from: '#0f4d44', to: '#0a3630', circle: 'bg-[#156d61]' }, // Teal
  { from: '#0b3d91', to: '#082b66', circle: 'bg-[#1254b0]' }, // Blue
  { from: '#b32e14', to: '#7d200e', circle: 'bg-[#d63f1e]' }, // Red
  { from: '#b05b0c', to: '#7d4008', circle: 'bg-[#d17015]' }, // Orange
  { from: '#145a32', to: '#0e3f23', circle: 'bg-[#1e8449]' }, // Green
  { from: '#880e4f', to: '#5e0a37', circle: 'bg-[#ad1457]' }, // Pink
];

function getUserColors(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palettes[Math.abs(hash) % palettes.length];
}

export default function GridLayout({
  streams,
  localStream,
  participantNames = {},
  isVideoOff = false,
  isAudioOff = false,
  remoteVideoOff = {},
  remoteAudioOff = {},
  speaking = {},
  raisedHands = {},
}: GridLayoutProps) {
  const videoRefs = useRef<Record<string, HTMLVideoElement>>({});
  const [page, setPage] = useState(0);
  const [blockedAutoplay, setBlockedAutoplay] = useState<Record<string, boolean>>({});


  const allStreams = useMemo(() => {
    const list = [
      ...(localStream ? [{ id: 'local', stream: localStream, name: participantNames.local || 'You' }] : []),
      ...streams.map((s, i) => ({
        id: s.id,
        stream: s,
        name: participantNames[s.id] || `Participant ${i + 1}`,
      })),
    ];
    return list;
  }, [streams, localStream, participantNames]);

  const attachStream = (id: string, el: HTMLVideoElement) => {
    const entry = allStreams.find((s) => s.id === id);
    if (!entry) return;

    if (el.srcObject !== entry.stream) {
      el.srcObject = entry.stream;
    }

    const isLocal = id === 'local';
    el.onloadedmetadata = () => {
      el.play().catch((err) => {
        if (isLocal) {
          console.error(err);
          return;
        }
        console.warn(`Autoplay blocked for ${id}, retrying muted:`, err?.name || err);
        el.muted = true;
        setBlockedAutoplay((prev) => ({ ...prev, [id]: true }));
        el.play().catch(console.error);
      });
    };
  };

  const registerVideo = useCallback((id: string, el: HTMLVideoElement | null) => {
    if (el) {
      videoRefs.current[id] = el;
      attachStream(id, el);
    } else {
      delete videoRefs.current[id];
    }
  }, [allStreams, isVideoOff]);

  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([id, el]) => {
      attachStream(id, el);
    });
  }, [streams, localStream, isVideoOff]);



  const unmute = (id: string) => {
    const el = videoRefs.current[id];
    if (el) {
      el.muted = false;
      el.play().catch(console.error);
    }
    setBlockedAutoplay((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const pageCount = useMemo(
    () => Math.ceil(allStreams.length / GROUP_SIZE),
    [allStreams]
  );

  const participantGroups = useMemo(() => {
    const groups = [];
    for (let i = 0; i < allStreams.length; i += GROUP_SIZE) {
      groups.push(allStreams.slice(i, i + GROUP_SIZE));
    }
    return groups;
  }, [allStreams]);

  const selectedGroup = participantGroups[page] || [];

  useEffect(() => {
    if (page > pageCount - 1) {
      setPage(Math.max(0, pageCount - 1));
    }
  }, [page, pageCount]);

  const getGridCols = (count: number) => {
    if (count <= 1) return 1;
    if (count <= 4) return 2;
    if (count <= 9) return 3;
    return 4;
  };

  const cols = getGridCols(selectedGroup.length);

  if (allStreams.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center rounded-xl">
        <VideoPlaceholder name="No participants" />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden">
      {selectedGroup.length === 1 ? (
        <div className="w-full h-full p-0 flex items-center justify-center">
          {selectedGroup.map(({ id, stream, name }) => {
            const isOff = id === 'local' ? isVideoOff : remoteVideoOff[id];
            const isMuted = id === 'local' ? isAudioOff : remoteAudioOff[id];
            const isSpeaking = id === 'local' ? speaking['local'] : speaking[id];
            return (
              <div
                key={id}
                className={`relative rounded-3xl overflow-hidden shadow-2xl bg-[#1a1a1a] transition-all duration-300 border-2 border-transparent m-auto flex-shrink-0 animate-tile-entry`}
                style={{
                  aspectRatio: '16/9',
                  height: '100%',
                  maxWidth: '100%',
                }}
              >
                <style>{`
                  @keyframes tileEntry {
                    0% {
                      opacity: 0;
                      transform: scale(0.35);
                    }
                    50% {
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
                  .animate-tile-entry {
                    animation: tileEntry 2000ms cubic-bezier(0.25, 1, 0.35, 1) forwards;
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
                  ref={(el) => registerVideo(id, el)}
                  autoPlay
                  playsInline
                  muted={id === 'local'}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${isOff ? 'opacity-0' : 'animate-camera-reveal'} ${id === 'local' ? 'scale-x-[-1]' : ''}`}
                />
                {(() => {
                  const colors = getUserColors(name);
                  return (
                    <div
                      className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center ${isOff ? 'opacity-100' : 'animate-placeholder-fadeout pointer-events-none'}`}
                      style={{ backgroundColor: colors.from, backgroundImage: `radial-gradient(circle farthest-corner at 50% 50%, transparent 0%, rgba(0,0,0,0.35) 120%)` }}
                    >
                      <div className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center text-white text-5xl sm:text-6xl font-normal ${colors.circle} shadow-sm transition-all duration-300 border-2 ${isSpeaking && !isMuted ? 'border-[#8ab4f8] ring-2 ring-[#8ab4f8]/20 scale-105' : 'border-transparent'}`}>
                        {name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  );
                })()}
                {raisedHands[id] ? (
                  <div className="absolute bottom-4 left-4 bg-[#c4edd0] text-[#072711] px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 shadow-xl z-10 border border-[#072711]/15 animate-in fade-in zoom-in-95 duration-200">
                    <Hand className="w-4 h-4 text-[#072711]" />
                    <span>{name}</span>
                  </div>
                ) : (
                  <div className="absolute bottom-4 left-4 text-white text-[15px] font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                    {name}
                  </div>
                )}
                {isMuted && (
                  <div className="absolute top-3 right-3 bg-[#202124]/80 backdrop-blur-sm rounded-full p-1.5 z-10">
                    <MicOff className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Multi view: grid layout ── */
        <div
          className="grid gap-2 p-2 w-full h-full"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridTemplateRows: `repeat(${Math.ceil(selectedGroup.length / cols)}, 1fr)`,
          }}
        >
          {selectedGroup.map(({ id, stream, name }) => {
            const isOff = id === 'local' ? isVideoOff : remoteVideoOff[id];
            const isMuted = id === 'local' ? isAudioOff : remoteAudioOff[id];
            const isSpeaking = id === 'local' ? speaking['local'] : speaking[id];

            return (
              <div key={id} className={`relative w-full h-full bg-[#1a1a1a] rounded-3xl overflow-hidden shadow-xl transition-all duration-300 border-2 border-transparent`}>
                <video
                  ref={(el) => registerVideo(id, el)}
                  autoPlay
                  playsInline
                  muted={id === 'local'}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${isOff ? 'opacity-0' : 'opacity-100'} ${id === 'local' ? 'scale-x-[-1]' : ''}`}
                />
                {isOff && (() => {
                  const colors = getUserColors(name);
                  return (
                    <div
                      className="absolute inset-0 w-full h-full flex flex-col items-center justify-center"
                      style={{ backgroundColor: colors.from, backgroundImage: `radial-gradient(circle farthest-corner at 50% 50%, transparent 0%, rgba(0,0,0,0.35) 120%)` }}
                    >
                      <div className={`w-20 h-20 sm:w-28 sm:h-28 rounded-full flex items-center justify-center text-white text-3xl sm:text-5xl font-normal ${colors.circle} shadow-sm transition-all duration-300 border-2 ${isSpeaking && !isMuted ? 'border-[#8ab4f8] ring-2 ring-[#8ab4f8]/20 scale-105' : 'border-transparent'}`}>
                        {name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  );
                })()}
                {raisedHands[id] ? (
                  <div className="absolute bottom-3 left-3 bg-[#c4edd0] text-[#072711] px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 shadow-xl z-10 border border-[#072711]/15 animate-in fade-in zoom-in-95 duration-200">
                    <Hand className="w-4 h-4 text-[#072711]" />
                    <span>{name}</span>
                  </div>
                ) : (
                  <div className="absolute bottom-3 left-4 text-white text-[14px] font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                    {name}
                  </div>
                )}
                {isMuted && (
                  <div className="absolute top-2 right-2 bg-[#202124]/80 backdrop-blur-sm rounded-full p-1.5 z-10">
                    <MicOff className="w-4 h-4 text-white" />
                  </div>
                )}
                {id !== 'local' && !isOff && blockedAutoplay[id] && (
                  <button
                    onClick={() => unmute(id)}
                    className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-white text-xs hover:bg-black/80 transition"
                  >
                    🔇
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pageCount > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-[#2d2d2d]/80 backdrop-blur-sm px-3 py-2 rounded-xl">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1 bg-[#3c3c3c] hover:bg-[#4a4a4a] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm transition"
          >
            ←
          </button>
          <span className="text-white text-sm flex items-center px-2">
            {page + 1} / {pageCount}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={page === pageCount - 1}
            className="px-3 py-1 bg-[#3c3c3c] hover:bg-[#4a4a4a] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm transition"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}