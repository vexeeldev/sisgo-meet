'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { BackHand as Hand, MicOffFilled as MicOff } from './icons';
import { getUserColors } from '@/lib/meeting';

interface RailTile {
  id: string;
  stream: MediaStream;
  name: string;
  isLocal?: boolean;
}

interface ParticipantsRailProps {
  localStream: MediaStream | null;
  remoteStreams: MediaStream[];
  participantName?: string;
  participantNames?: Record<string, string>;
  isVideoOff?: boolean;
  isAudioOff?: boolean;
  remoteVideoOff?: Record<string, boolean>;
  remoteAudioOff?: Record<string, boolean>;
  speaking?: Record<string, boolean>;
  excludeId?: string | null;
  raisedHands?: Record<string, boolean>;
}

export default function ParticipantsRail({
  localStream,
  remoteStreams,
  participantName = 'You',
  participantNames = {},
  isVideoOff = false,
  isAudioOff = false,
  remoteVideoOff = {},
  remoteAudioOff = {},
  speaking = {},
  excludeId = null,
  raisedHands = {},
}: ParticipantsRailProps) {
  const videoRefs = useRef<Record<string, HTMLVideoElement>>({});
  const [blockedAutoplay, setBlockedAutoplay] = useState<Record<string, boolean>>({});

  const visibleRemotes = remoteStreams.filter((s) => s.id !== excludeId);

  const tiles: RailTile[] = [
    ...(localStream
      ? [{ id: 'local', stream: localStream, name: participantName, isLocal: true }]
      : []),
    ...visibleRemotes.map((s) => ({
      id: s.id,
      stream: s,
      name: participantNames[s.id] || 'Participant',
    })),
  ];

  const attachStream = useCallback(
    (id: string, el: HTMLVideoElement, stream: MediaStream, isLocal: boolean) => {
      if (el.srcObject !== stream) {
        el.srcObject = stream;
      }
      el.onloadedmetadata = () => {
        el.play().catch((err) => {
          if (isLocal) {
            console.error(err);
            return;
          }
          el.muted = true;
          setBlockedAutoplay((prev) => ({ ...prev, [id]: true }));
          el.play().catch(() => {});
        });
      };
    },
    [isVideoOff]
  );

  const registerVideo = useCallback(
    (id: string, stream: MediaStream, isLocal: boolean, el: HTMLVideoElement | null) => {
      if (el) {
        videoRefs.current[id] = el;
        attachStream(id, el, stream, isLocal);
      } else {
        delete videoRefs.current[id];
      }
    },
    [attachStream]
  );
  useEffect(() => {
    tiles.forEach(({ id, stream, isLocal }) => {
      const el = videoRefs.current[id];
      if (el) attachStream(id, el, stream, !!isLocal);
    });
  }, [localStream, remoteStreams, isVideoOff]);

  const unmute = (id: string) => {
    const el = videoRefs.current[id];
    if (el) {
      el.muted = false;
      el.play().catch(() => {});
    }
    setBlockedAutoplay((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  if (tiles.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 h-full overflow-y-auto pl-4 register-scrollbar">
      {tiles.map((tile) => {
        const isOff = tile.isLocal ? isVideoOff : remoteVideoOff[tile.id];
        const isMuted = tile.isLocal ? isAudioOff : remoteAudioOff[tile.id];
        const isSpeaking = tile.isLocal ? speaking['local'] : speaking[tile.id];

        return (
          <div
            key={tile.id}
            className={`relative w-full aspect-video flex-shrink-0 bg-transparent rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 hover:border-[#3a3a3a] border-2 border-[#2a2a2a]`}
          >
            <video
              ref={(el) => registerVideo(tile.id, tile.stream, !!tile.isLocal, el)}
              autoPlay
              playsInline
              muted={!!tile.isLocal}
              className={`w-full h-full object-cover transition-opacity duration-300 ${isOff ? 'opacity-0' : 'opacity-100'} ${tile.isLocal ? 'scale-x-[-1]' : ''}`}
            />
            {isOff && (() => {
              const colors = getUserColors(tile.name);
              return (
                <div 
                  className="absolute inset-0 w-full h-full flex flex-col items-center justify-center"
                  style={{ 
                    backgroundColor: colors.from, 
                    backgroundImage: `radial-gradient(circle farthest-corner at 50% 50%, transparent 0%, rgba(0,0,0,0.35) 120%)` 
                  }}
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white text-lg sm:text-xl font-normal ${colors.circle} shadow-sm transition-all duration-300 border-2 ${isSpeaking && !isMuted ? 'border-[#8ab4f8] ring-2 ring-[#8ab4f8]/30 scale-105' : 'border-transparent'}`}>
                    {(tile.name || 'G').charAt(0).toUpperCase()}
                  </div>
                </div>
              );
            })()}

            {raisedHands[tile.id] ? (
              <div className="absolute bottom-2 left-2 bg-[#c4edd0] text-[#072711] px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 shadow-md max-w-[85%] truncate z-10 animate-in fade-in zoom-in-95 duration-200">
                <Hand className="w-3 h-3 text-[#072711] shrink-0" />
                <span className="truncate">{tile.name}</span>
              </div>
            ) : (
              <div className="absolute bottom-2 left-2 text-white text-xs font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] max-w-[80%] truncate">
                {tile.name}
              </div>
            )}
            {isMuted && (
              <div className="absolute top-2 right-2 bg-[#202124]/80 backdrop-blur-sm rounded-full p-1.5 z-10">
                <MicOff className="w-3.5 h-3.5 text-white" />
              </div>
            )}

            {!tile.isLocal && !isOff && blockedAutoplay[tile.id] && (
              <button
                onClick={() => unmute(tile.id)}
                className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition"
              >
                <span className="bg-white text-black px-3 py-1 rounded-full text-xs font-bold">Unmute Audio</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}