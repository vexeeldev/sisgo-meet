'use client';

import { useMemo } from 'react';
import SpeakerLayout from '../SpeakerLayout';
import GridLayout from '../GridLayout';
import ParticipantsRail from '../ParticipantsRail';
import { BackHand } from '../icons';

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
  isHost?: boolean;
  whiteboardSnapshot?: any;
  onWhiteboardSnapshotChange?: (snapshot: any) => void;
  onCloseWhiteboard?: () => void;
  screenAnnotations?: any[];
  onChangeScreenAnnotations?: (annotations: any[]) => void;
  onClearScreenAnnotations?: () => void;
}

export default function MeetingVideo({
  layout,
  localStream,
  remoteStreams,
  participantName,
  isVideoOff,
  isAudioOff = false,
  speaking = {},
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
  isHost = false,
  whiteboardSnapshot,
  onWhiteboardSnapshotChange,
  onCloseWhiteboard,
  screenAnnotations = [],
  onChangeScreenAnnotations,
  onClearScreenAnnotations,
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

  const hasScreenShare = screenStream !== null || remoteScreenShare !== null || isWhiteboardOpen; 

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

  const isSpeakerMode = ['speaker', 'spotlight', 'sidebar'].includes(activeLayout) || isWhiteboardOpen;

  const mainSpeakerId =
    isSpeakerMode && !hasScreenShare && cameraStreams.length > 0
      ? cameraStreams[0].id
      : null;

  // Show rail whenever screen share is active OR in speaker/spotlight/sidebar mode with 1+ cameras
  const showRail = isSpeakerMode && (hasScreenShare || cameraStreams.length >= 1);
  const railRemoteStreams = showRail ? cameraStreams : [];
  // Only exclude main speaker from rail when NO screen share and 2+ cameras
  // (so the first camera occupies main area and rest go to rail)
  const mainSpeakerStreamId = showRail && !hasScreenShare && cameraStreams.length > 1 ? cameraStreams[0].id : null;

  // Get all names of participants with raised hands
  const raisedHandNames = useMemo(() => {
    const names: string[] = [];
    if (!raisedHands) return names;
    
    if (raisedHands['local']) {
      names.push(participantName.includes('(Anda)') ? participantName : `${participantName} (Anda)`);
    }
    
    Object.entries(raisedHands).forEach(([id, isRaised]) => {
      if (id !== 'local' && isRaised) {
        const streamId = peerIdToStreamId?.[id] || id;
        const name = participantDetails?.[streamId]?.name || 'Peserta';
        names.push(name);
      }
    });
    
    return names;
  }, [raisedHands, participantName, peerIdToStreamId, participantDetails]);

  return (
    <div className="flex-1 w-full h-full bg-transparent flex justify-center min-h-0 relative">
      <div className="flex-1 h-full relative">
        {isSpeakerMode ? (
          <SpeakerLayout
            localStream={activeLayout === 'sidebar' ? null : localStream}
            remoteStreams={cameraStreams}
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
            raisedHands={raisedHandsByStreamId}
            isWhiteboardOpen={isWhiteboardOpen}
            isHost={isHost}
            whiteboardSnapshot={whiteboardSnapshot}
            onWhiteboardSnapshotChange={onWhiteboardSnapshotChange}
            onCloseWhiteboard={onCloseWhiteboard}
            screenAnnotations={screenAnnotations}
            onChangeScreenAnnotations={onChangeScreenAnnotations}
            onClearScreenAnnotations={onClearScreenAnnotations}
          />
        ) : (
          <GridLayout
            streams={cameraStreams}
            localStream={localStream}
            participantNames={{
              ...remoteNames,
              local: `${participantName} (Anda)`,
            }}
            isVideoOff={isVideoOff}
            isAudioOff={isAudioOff}
            remoteVideoOff={remoteVideoOff}
            remoteAudioOff={remoteAudioOff}
            speaking={speaking}
            raisedHands={raisedHandsByStreamId}
          />
        )}
      </div>

      {showRail && (
        <div className="hidden sm:block w-[160px] md:w-[200px] lg:w-[240px] xl:w-[260px] flex-shrink-0 h-full">
          <ParticipantsRail
            localStream={localStream}
            remoteStreams={railRemoteStreams}
            participantName={`${participantName} (Anda)`}
            participantNames={remoteNames}
            isVideoOff={isVideoOff}
            isAudioOff={isAudioOff}
            remoteVideoOff={remoteVideoOff}
            remoteAudioOff={remoteAudioOff}
            speaking={speaking}
            excludeId={mainSpeakerStreamId}
            raisedHands={raisedHandsByStreamId}
          />
        </div>
      )}
      {/* Raised Hand Top-Right Notification Badge (Google Meet Style) */}
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