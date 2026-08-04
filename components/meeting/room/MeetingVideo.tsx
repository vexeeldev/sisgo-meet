'use client';

import { useMemo } from 'react';
import SpeakerLayout from '../SpeakerLayout';
import GridLayout from '../GridLayout';
import ParticipantsRail from '../ParticipantsRail';
import { BackHand } from '../icons';
import { NetworkQuality } from '@/hooks/useWebRTC';

interface RemoteScreenShare {
  stream: MediaStream;
  participantId: string;
  participantName?: string;
}

interface MeetingVideoProps {
  layout: 'auto' | 'tiled' | 'spotlight' | 'sidebar' | 'speaker' | 'grid';
  localStream: MediaStream | null;
  remoteStreams: MediaStream[];
  participantName: string;
  isVideoOff: boolean;
  isAudioOff?: boolean;
  speaking?: Record<string, boolean>;
  networkQuality?: Record<string, NetworkQuality>;
  isScreenSharing?: boolean;
  screenStream?: MediaStream | null;
  onStopSharing?: () => void;
  remoteVideoOff?: Record<string, boolean>;
  remoteAudioOff?: Record<string, boolean>;
  remoteScreenShare?: RemoteScreenShare | null; 
  participantDetails?: Record<string, {name: string}>;
  peerIdToStreamId?: Record<string, string>;
  raisedHands?: Record<string, boolean>;
  isWhiteboardOpen?: boolean;
  isWhiteboardMinimized?: boolean;
  isHost?: boolean;
  whiteboardSnapshot?: any;
  onWhiteboardSnapshotChange?: (snapshot: any) => void;
  onCloseWhiteboard?: () => void;
  onOpenWhiteboard?: () => void;
  hostName?: string;
  screenAnnotations?: any[];
  onChangeScreenAnnotations?: (annotations: any[]) => void;
  onScreenAnnotationStart?: (item: any) => void;
  onScreenAnnotationDraw?: (data: { id: string; points: number[] }) => void;
  onScreenAnnotationEnd?: (data: { id: string }) => void;
  onClearScreenAnnotations?: () => void;
  canDrawOnWhiteboard?: boolean;
  isScreenAnnotationOpen?: boolean;
  onCloseScreenAnnotation?: () => void;
  pinnedParticipants?: string[];
  onTogglePin?: (id: string) => void;
}

export default function MeetingVideo({
  layout,
  localStream,
  remoteStreams,
  participantName,
  isVideoOff,
  isAudioOff = false,
  speaking = {},
  networkQuality = {},
  isScreenSharing = false,
  screenStream = null,
  onStopSharing,
  remoteVideoOff = {},
  remoteAudioOff = {},
  remoteScreenShare = null,
  participantDetails = {},
  peerIdToStreamId = {},
  raisedHands = {},
  isWhiteboardOpen = false,
  isWhiteboardMinimized = false,
  isHost = false,
  whiteboardSnapshot,
  onWhiteboardSnapshotChange,
  onCloseWhiteboard,
  onOpenWhiteboard,
  hostName,
  screenAnnotations = [],
  onChangeScreenAnnotations,
  onScreenAnnotationStart,
  onScreenAnnotationDraw,
  onScreenAnnotationEnd,
  onClearScreenAnnotations,
  canDrawOnWhiteboard = false,
  isScreenAnnotationOpen = false,
  onCloseScreenAnnotation,
  pinnedParticipants = [],
  onTogglePin,
}: MeetingVideoProps) {
  const cameraStreams = useMemo(() => {
    const streams = remoteScreenShare
      ? remoteStreams.filter((s) => s.id !== remoteScreenShare.stream.id)
      : remoteStreams;

    const streamIdToPeerId = Object.entries(peerIdToStreamId || {}).reduce((acc, [connId, streamId]) => {
      acc[streamId] = connId;
      return acc;
    }, {} as Record<string, string>);

    return [...streams].sort((a, b) => {
      const peerA = streamIdToPeerId[a.id];
      const peerB = streamIdToPeerId[b.id];
      const raisedA = peerA ? raisedHands[peerA] : false;
      const raisedB = peerB ? raisedHands[peerB] : false;
      
      if (raisedA && !raisedB) return -1;
      if (!raisedA && raisedB) return 1;
      return 0;
    });
  }, [remoteStreams, remoteScreenShare, peerIdToStreamId, raisedHands]);

  const remoteNames = useMemo(() => {
    const names: Record<string, string> = {};
    const streamIdToPeerId = Object.entries(peerIdToStreamId || {}).reduce((acc, [connId, streamId]) => {
      acc[streamId] = connId;
      return acc;
    }, {} as Record<string, string>);

    cameraStreams.forEach((s, i) => {
      const connId = streamIdToPeerId[s.id];
      const detail = connId ? participantDetails?.[connId] : null;
      names[s.id] = detail?.name || `Participant ${i + 1}`;
    });
    return names;
  }, [cameraStreams, participantDetails, peerIdToStreamId]);

  const isWhiteboardActive = isWhiteboardOpen && !isWhiteboardMinimized;
  const mappedNetworkQuality = useMemo(() => {
    const map: Record<string, NetworkQuality> = {};
    if (networkQuality['local']) {
      map['local'] = networkQuality['local'];
    }
    Object.entries(networkQuality).forEach(([peerId, quality]) => {
      if (peerId !== 'local' && peerIdToStreamId?.[peerId]) {
        map[peerIdToStreamId[peerId]] = quality;
      }
    });
    return map;
  }, [networkQuality, peerIdToStreamId]);

  const hasScreenShare = screenStream !== null || remoteScreenShare !== null || isWhiteboardActive; 

  const raisedHandsByStreamId = useMemo(() => {
    const result: Record<string, boolean> = { local: raisedHands['local'] || false };
    Object.entries(peerIdToStreamId || {}).forEach(([peerId, streamId]) => {
      if (raisedHands[peerId]) {
        result[streamId] = true;
      }
    });
    return result;
  }, [raisedHands, peerIdToStreamId]);

  let activeLayout = layout;
  if (hasScreenShare) {
    activeLayout = 'sidebar';
  } else if (layout === 'auto') {
    activeLayout = 'tiled';
  }

  const isPinnedMode = pinnedParticipants.length > 0;
  const isLocalPinned = pinnedParticipants.includes('local');
  
  const pinnedStreams = useMemo(() => {
    return cameraStreams.filter(s => pinnedParticipants.includes(s.id));
  }, [cameraStreams, pinnedParticipants]);

  const unpinnedStreams = useMemo(() => {
    return cameraStreams.filter(s => !pinnedParticipants.includes(s.id));
  }, [cameraStreams, pinnedParticipants]);

  const isSpeakerMode = ['speaker', 'spotlight', 'sidebar'].includes(activeLayout) || isWhiteboardActive;

  const showRail = isPinnedMode 
    ? (unpinnedStreams.length > 0 || !isLocalPinned)
    : (isSpeakerMode && activeLayout !== 'spotlight' && (hasScreenShare || cameraStreams.length >= 1));

  const railRemoteStreams = isPinnedMode ? unpinnedStreams : (showRail ? cameraStreams : []);
  
  let mainSpeakerStreamId: string | null = null;
  if (isPinnedMode) {
    mainSpeakerStreamId = pinnedStreams.length === 1 && !isLocalPinned ? pinnedStreams[0].id : null;
  } else {
    mainSpeakerStreamId = showRail && !hasScreenShare && cameraStreams.length > 0 ? cameraStreams[0].id : null;
  }

  const raisedHandNames = useMemo(() => {
    const names: string[] = [];
    if (!raisedHands) return names;
    
    if (raisedHands['local']) {
      names.push(participantName.includes('(Anda)') ? participantName : `${participantName} (Anda)`);
    }
    
    Object.entries(raisedHands).forEach(([id, isRaised]) => {
      if (id !== 'local' && isRaised) {
        const streamId = peerIdToStreamId?.[id] || id;
        const name = participantDetails?.[id]?.name || participantDetails?.[streamId]?.name || remoteNames[streamId] || remoteNames[id] || 'Peserta';
        names.push(name);
      }
    });
    
    return names;
  }, [raisedHands, participantName, peerIdToStreamId, participantDetails, remoteNames]);

  const renderMode = isPinnedMode 
    ? (pinnedStreams.length === 1 && !isLocalPinned ? 'speaker' : 'grid')
    : (isSpeakerMode ? 'speaker' : 'grid');

  const mainRemoteStreams = isPinnedMode ? pinnedStreams : cameraStreams;
  
  const mainLocalStream = isPinnedMode && renderMode === 'grid'
    ? (isLocalPinned ? localStream : null)
    : localStream;

  return (
    <div className="flex-1 w-full h-full bg-transparent flex justify-center min-h-0 relative">
      <div className="flex-1 h-full relative">
        {renderMode === 'speaker' ? (
          <SpeakerLayout
            localStream={activeLayout === 'sidebar' && !isPinnedMode ? null : mainLocalStream}
            remoteStreams={mainRemoteStreams}
            participantName={`${participantName} (Anda)`}
            participantNames={remoteNames}
            isVideoOff={isVideoOff}
            isAudioOff={isAudioOff}
            isScreenSharing={isScreenSharing}
            screenStream={screenStream}
            onStopSharing={onStopSharing}
            remoteVideoOff={remoteVideoOff}
            remoteAudioOff={remoteAudioOff}
            remoteScreenShare={remoteScreenShare}
            hidePip={hasScreenShare || showRail}
            speaking={speaking}
            networkQuality={mappedNetworkQuality}
            raisedHands={raisedHandsByStreamId}
            isWhiteboardOpen={isWhiteboardOpen}
            isWhiteboardMinimized={isWhiteboardMinimized}
            isHost={isHost}
            whiteboardSnapshot={whiteboardSnapshot}
            onWhiteboardSnapshotChange={onWhiteboardSnapshotChange}
            onCloseWhiteboard={onCloseWhiteboard}
            onOpenWhiteboard={onOpenWhiteboard}
            hostName={hostName || (isHost ? participantName : 'Host')}
            screenAnnotations={screenAnnotations}
            onChangeScreenAnnotations={onChangeScreenAnnotations}
            onScreenAnnotationStart={onScreenAnnotationStart}
            onScreenAnnotationDraw={onScreenAnnotationDraw}
            onScreenAnnotationEnd={onScreenAnnotationEnd}
            onClearScreenAnnotations={onClearScreenAnnotations}
            canDraw={canDrawOnWhiteboard}
            onCloseScreenAnnotation={isScreenAnnotationOpen ? onCloseScreenAnnotation : undefined}
            pinnedParticipants={pinnedParticipants}
            onTogglePin={onTogglePin}
          />
        ) : (
          <GridLayout
            streams={mainRemoteStreams}
            localStream={mainLocalStream}
            participantNames={{
              ...remoteNames,
              local: `${participantName} (Anda)`,
            }}
            isVideoOff={isVideoOff}
            isAudioOff={isAudioOff}
            remoteVideoOff={remoteVideoOff}
            remoteAudioOff={remoteAudioOff}
            speaking={speaking}
            networkQuality={mappedNetworkQuality}
            raisedHands={raisedHandsByStreamId}
            isWhiteboardMinimized={isWhiteboardOpen && isWhiteboardMinimized}
            onOpenWhiteboard={onOpenWhiteboard}
            hostName={isHost ? participantName : (Object.values(participantDetails).find((p: any) => p.role === 'interviewer' || p.role === 'host')?.name || 'Host')}
            whiteboardSnapshot={whiteboardSnapshot}
            pinnedParticipants={pinnedParticipants}
            onTogglePin={onTogglePin}
          />
        )}
      </div>

      {showRail && (
        <div className="hidden sm:block w-[160px] md:w-[200px] lg:w-[240px] xl:w-[260px] flex-shrink-0 h-full">
          <ParticipantsRail
            localStream={isPinnedMode ? (isLocalPinned ? null : localStream) : localStream}
            remoteStreams={railRemoteStreams}
            participantName={`${participantName} (Anda)`}
            participantNames={remoteNames}
            isVideoOff={isVideoOff}
            isAudioOff={isAudioOff}
            remoteVideoOff={remoteVideoOff}
            remoteAudioOff={remoteAudioOff}
            speaking={speaking}
            networkQuality={mappedNetworkQuality}
            excludeId={mainSpeakerStreamId}
            raisedHands={raisedHandsByStreamId}
            pinnedParticipants={pinnedParticipants}
            onTogglePin={onTogglePin}
            isWhiteboardOpen={isWhiteboardOpen}
            isWhiteboardMinimized={isWhiteboardMinimized}
            whiteboardSnapshot={whiteboardSnapshot}
            onOpenWhiteboard={onOpenWhiteboard}
            hostName={hostName || (isHost ? participantName : 'Host')}
          />
        </div>
      )}
      {raisedHandNames.length > 0 && (
        <div className="absolute top-4 right-4 z-[90] flex flex-col gap-2 pointer-events-none">
          {raisedHandNames.map((name, idx) => (
            <div 
              key={idx} 
              className="bg-[#c4edd0] text-[#072711] px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2.5 shadow-2xl border border-[#072711]/15 animate-in fade-in slide-in-from-top-2 duration-300"
            >
              <div className="w-6 h-6 rounded-full bg-[#072711]/10 flex items-center justify-center shrink-0">
                <BackHand className="w-4 h-4 text-[#072711]" />
              </div>
              <span>{name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}