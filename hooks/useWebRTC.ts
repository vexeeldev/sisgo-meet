'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { VirtualBackgroundProcessor, VirtualBackgroundMode } from '@/lib/virtual-background';
import Peer from 'simple-peer';
import hark from 'hark';
import { launchConfetti } from '@/lib/confetti';
import { launchBalloons } from '@/lib/balloons';
import { launchWalkingCat } from '@/lib/cat';
import { launchTux } from '@/lib/tux';
import { launchUFO } from '@/lib/ufo';
import { playSound } from '@/lib/brimo';

interface UseWebRTCProps {
  roomId: string;
  participantUUID: string;
  userName: string;
  userRole: string;
  onCallEnded?: () => void;
  onKicked?: () => void;
  onChatReceived?: (msg: any) => void;
  onHandRaised?: (msg: any, senderId?: string) => void;
  signalServer?: string;
  initialCameraOn?: boolean;
  initialMicOn?: boolean;
  onWhiteboardToggle?: (isOpen: boolean) => void;
  onWhiteboardUpdate?: (snapshot: any) => void;
  isWhiteboardOpen?: boolean;
  whiteboardSnapshot?: any;
  whiteboardAllowedIds?: string[];
  screenAnnotations?: any[];
  onScreenAnnotationUpdate?: (annotations: any[]) => void;
  onScreenAnnotationStart?: (item: any) => void;
  onScreenAnnotationDraw?: (data: { id: string; points: number[] }) => void;
  onScreenAnnotationEnd?: (data: { id: string }) => void;
  onScreenAnnotationClear?: () => void;
  onWhiteboardPermissionUpdate?: (allowedIds: string[]) => void;
}

export type NetworkQuality = 'excellent' | 'good' | 'poor' | 'unknown';

interface WSMessage {
  room_id: string;
  sender_id: string;
  target_id?: string;
  type: string;
  data?: any;
}

interface RoomInfoParticipant {
  id: string;
  participant_id: string;
}

export interface JoinRequest {
  participant_uuid: string;
  name: string;
}

const ICE_SERVERS: RTCIceServer[] = [
  // Hapus komentar di bawah ini jika ingin mengaktifkan P2P kembali
  // { urls: 'stun:stun.l.google.com:19302' },
  // { urls: 'stun:stun1.l.google.com:19302' },
  // { urls: 'stun:stun2.l.google.com:19302' },
  {
    urls: 'turn:meetgp.metered.live:80',
    username: '7616f2a029cf2aeedf140af2',
    credential: '6YV3iLwOUqSNc5ul',
  },
  {
    urls: 'turn:meetgp.metered.live:443',
    username: '7616f2a029cf2aeedf140af2',
    credential: '6YV3iLwOUqSNc5ul',
  },
  {
    urls: 'turn:meetgp.metered.live:443?transport=tcp',
    username: '7616f2a029cf2aeedf140af2',
    credential: '6YV3iLwOUqSNc5ul',
  },
];

const isScreenShareStream = (stream: MediaStream) => {

  const videoTrack = stream.getVideoTracks()[0];
  if (!videoTrack) return false;

  const displaySurface = videoTrack.getSettings?.()?.displaySurface;
  if (displaySurface) return true;

  const label = videoTrack.label?.toLowerCase() || '';
  if (/screen|window|monitor|display|tab/.test(label)) return true;

  return false;
};

export function useWebRTC({
  roomId,
  participantUUID,
  userName,
  userRole,
  onCallEnded,
  onKicked,
  onChatReceived,
  onHandRaised,
  onWhiteboardToggle,
  onWhiteboardUpdate,
  isWhiteboardOpen,
  whiteboardSnapshot,
  whiteboardAllowedIds = [],
  screenAnnotations = [],
  onScreenAnnotationUpdate,
  onScreenAnnotationStart,
  onScreenAnnotationDraw,
  onScreenAnnotationEnd,
  onScreenAnnotationClear,
  onWhiteboardPermissionUpdate,
  signalServer = process.env.NEXT_PUBLIC_SIGNAL_SERVER || 'wss://verified-democratic-shaw-vsnet.trycloudflare.com/ws',
  initialCameraOn = true,
  initialMicOn = true,
}: UseWebRTCProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const [participantDetails, setParticipantDetails] = useState<Record<string, {name: string, role?: string}>>({});
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [remoteScreenStream, setRemoteScreenStream] = useState<MediaStream | null>(null);
  const [remoteScreenSharerId, setRemoteScreenSharerId] = useState<string | null>(null);
  const [isVideoOff, setIsVideoOffState] = useState(false);
  const [remoteVideoOffByUser, setRemoteVideoOffByUser] = useState<Record<string, boolean>>({});
  const [isAudioOff, setIsAudioOffState] = useState(!initialMicOn);
  const [remoteAudioOffByUser, setRemoteAudioOffByUser] = useState<Record<string, boolean>>({});
  const [peerIdToStreamId, setPeerIdToStreamId] = useState<Record<string, string>>({});
  const [speaking, setSpeaking] = useState<Record<string, boolean>>({});
  const [networkQuality, setNetworkQuality] = useState<Record<string, NetworkQuality>>({ local: 'unknown' });
  const [myConnId, setMyConnId] = useState<string | null>(null);

  const ws = useRef<WebSocket | null>(null);
  const peers = useRef<Record<string, Peer.Instance>>({});
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerStreams = useRef<Record<string, MediaStream>>({});
  const isWebRTCStarted = useRef(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const roomIdRef = useRef<string>(roomId);
  const userIdRef = useRef<string>(`user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  const remoteScreenSharerIdRef = useRef<string | null>(null);
  const remoteScreenStreamRef = useRef<MediaStream | null>(null);
  const isScreenSharingRef = useRef(false);
  const whiteboardAllowedIdsRef = useRef(whiteboardAllowedIds);

  const isWhiteboardOpenRef = useRef(isWhiteboardOpen);
  const whiteboardSnapshotRef = useRef(whiteboardSnapshot);

  useEffect(() => {
    isWhiteboardOpenRef.current = isWhiteboardOpen;
    whiteboardSnapshotRef.current = whiteboardSnapshot;
    whiteboardAllowedIdsRef.current = whiteboardAllowedIds;
  }, [isWhiteboardOpen, whiteboardSnapshot, whiteboardAllowedIds]);

  const screenAnnotationsRef = useRef(screenAnnotations);
  useEffect(() => {
    screenAnnotationsRef.current = screenAnnotations;
  }, [screenAnnotations]);

  const pendingStreamActions = useRef<Array<() => void>>([]);
  const pendingSignals = useRef<Record<string, any[]>>({});

  const vbProcessorRef = useRef<VirtualBackgroundProcessor | null>(null);
  const rawVideoTrackRef = useRef<MediaStreamTrack | null>(null);
  const [virtualBgMode, setVirtualBgModeState] = useState<VirtualBackgroundMode>('none');
  const harkEvents = useRef<Record<string, hark.Harker>>({});

  const runWhenStreamReady = (action: () => void) => {
    if (localStreamRef.current) {
      action();
    } else {
      pendingStreamActions.current.push(action);
    }
  };

  const flushPendingStreamActions = () => {
    const queued = pendingStreamActions.current;
    pendingStreamActions.current = [];
    queued.forEach(action => action());
  };

  const clearRemoteScreenShare = () => {
    remoteScreenSharerIdRef.current = null;
    remoteScreenStreamRef.current = null;
    setRemoteScreenSharerId(null);
    setRemoteScreenStream(null);
  };

  // Keep remoteScreenStreamRef in sync with state updates
  const setRemoteScreenStreamSync = (stream: MediaStream | null) => {
    remoteScreenStreamRef.current = stream;
    setRemoteScreenStream(stream);
  };

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  useEffect(() => {
    if (localStream) {
      // Must check if there are audio tracks before passing to hark
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const speech = hark(localStream, { play: false, threshold: -65 });
        speech.on('speaking', () => {
          setSpeaking(prev => ({ ...prev, local: true }));
        });
        speech.on('stopped_speaking', () => {
          setSpeaking(prev => ({ ...prev, local: false }));
        });
        harkEvents.current['local'] = speech;
        
        return () => {
          speech.stop();
          delete harkEvents.current['local'];
          setSpeaking(prev => ({ ...prev, local: false }));
        };
      }
    }
  }, [localStream]);

  useEffect(() => {
    remoteStreams.forEach(stream => {
      if (!harkEvents.current[stream.id] && stream.getAudioTracks().length > 0) {
        const speech = hark(stream, { play: false, threshold: -65 });
        speech.on('speaking', () => {
          setSpeaking(prev => ({ ...prev, [stream.id]: true }));
        });
        speech.on('stopped_speaking', () => {
          setSpeaking(prev => ({ ...prev, [stream.id]: false }));
        });
        harkEvents.current[stream.id] = speech;
      }
    });
    
    Object.keys(harkEvents.current).forEach(id => {
      if (id !== 'local' && !remoteStreams.find(s => s.id === id)) {
        harkEvents.current[id].stop();
        delete harkEvents.current[id];
        setSpeaking(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    });
  }, [remoteStreams]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(peers.current).length === 0) {
        setNetworkQuality(prev => prev.local === 'excellent' ? prev : { local: 'excellent' });
        return;
      }
      
      const newQuality: Record<string, NetworkQuality> = {};
      let totalRtt = 0;
      let rttCount = 0;

      const promises = Object.keys(peers.current).map(async (userId) => {
        const peer = peers.current[userId];
        if (!peer || !(peer as any)._pc) {
          newQuality[userId] = 'excellent'; // Fallback
          return;
        }

        try {
          const pc = (peer as any)._pc as RTCPeerConnection;
          const stats = await pc.getStats();
          let rtt: number | null = null;
          
          stats.forEach(report => {
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              if (report.currentRoundTripTime !== undefined) {
                // currentRoundTripTime is in seconds, convert to ms
                rtt = report.currentRoundTripTime * 1000;
              }
            }
          });

          if (rtt !== null) {
            totalRtt += rtt;
            rttCount++;
            if (rtt < 150) newQuality[userId] = 'excellent';
            else if (rtt < 400) newQuality[userId] = 'good';
            else newQuality[userId] = 'poor';
          } else {
            newQuality[userId] = 'excellent'; // Fallback jika tidak ada data RTT
          }
        } catch (e) {
          console.warn('Error fetching stats for peer', userId, e);
          newQuality[userId] = 'excellent'; // Fallback
        }
      });

      Promise.all(promises).then(() => {
        // Local network quality based on average RTT of remote peers
        if (rttCount > 0) {
          const avgRtt = totalRtt / rttCount;
          if (avgRtt < 150) newQuality['local'] = 'excellent';
          else if (avgRtt < 400) newQuality['local'] = 'good';
          else newQuality['local'] = 'poor';
        } else {
          newQuality['local'] = 'excellent';
        }
        
        setNetworkQuality(prev => {
          // Only update if changed
          let changed = false;
          const merged = { ...prev };
          Object.keys(newQuality).forEach(k => {
            if (merged[k] !== newQuality[k]) {
              merged[k] = newQuality[k];
              changed = true;
            }
          });
          return changed ? merged : prev;
        });
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!signalServer || isWebRTCStarted.current) {
      return;
    }

    isWebRTCStarted.current = true;
    let isUnmounted = false;

    const startLocalStream = async () => {
      try {
        const constraints = {
          video: {
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            frameRate: { ideal: 60, min: 30 },
            aspectRatio: { ideal: 1.7777777778 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Apply initial camera/mic states
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          if ('contentHint' in videoTrack) {
            (videoTrack as any).contentHint = 'motion';
          }
          try {
            videoTrack.applyConstraints({
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 60 },
            }).catch(() => {});
          } catch (e) {}
          if (initialCameraOn === false) {
            videoTrack.enabled = false;
          }
        }
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack && initialMicOn === false) {
          audioTrack.enabled = false;
        }

        setLocalStream(stream);
        localStreamRef.current = stream;
      } catch (error) {
        console.error('Error getting media devices:', error);
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
          
          const audioTrack = stream.getAudioTracks()[0];
          if (audioTrack && initialMicOn === false) {
            audioTrack.enabled = false;
          }

          setLocalStream(stream);
          localStreamRef.current = stream;
        } catch (e) {
          console.error('Error getting audio only:', e);
        }
      } finally {
        flushPendingStreamActions();
      }
    };
    startLocalStream();

    const connectWebSocket = () => {
      const wsUrl = `${signalServer}?room=${roomId}&participant_uuid=${participantUUID}&status=approved`;
      ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      sendMessage('profile', { name: userName, role: userRole });
      
      if (userRole === 'host' || userRole === 'interviewer') {
        sendMessage('host_joined');
      }
      playSound();
    };

    ws.current.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);

        switch (msg.type) {
          case 'room-info': {
            setMyConnId(msg.sender_id);
            const list: RoomInfoParticipant[] = msg.data?.participants ?? [];
            setParticipants(prev => {
              const ids = list.map(p => p.id);
              const merged = [...prev];
              ids.forEach(id => { if (!merged.includes(id)) merged.push(id); });
              return merged;
            });
            list.forEach(p => {
              runWhenStreamReady(() => createPeer(p.id, true));
            });
            break;
          }

          case 'join': {
            const connId = msg.sender_id;
            setParticipants(prev => (prev.includes(connId) ? prev : [...prev, connId]));
            // Beritahu orang yang baru join siapa kita
            sendMessage('profile', { name: userName, role: userRole }, connId);
            playSound(); // Entry chime sound when a new participant enters

            // Jika kita adalah Host dan Whiteboard sedang terbuka, kirim status & snapshot ke orang baru yang join
            if ((userRole === 'interviewer' || userRole === 'host') && isWhiteboardOpenRef.current) {
              sendMessage('whiteboard_toggle', { isOpen: true }, connId);
              if (whiteboardSnapshotRef.current) {
                sendMessage('whiteboard_update', { snapshot: whiteboardSnapshotRef.current }, connId);
              }
              if (whiteboardAllowedIdsRef.current.length > 0) {
                sendMessage('whiteboard_permission_update', { allowedIds: whiteboardAllowedIdsRef.current }, connId);
              }
            }
            if (isScreenSharingRef.current && screenAnnotationsRef.current.length > 0) {
              sendMessage('screen_annotation_sync', { annotations: screenAnnotationsRef.current }, connId);
            }
            break;
          }
          
          case 'profile': {
            const connId = msg.sender_id;
            const name = msg.data?.name;
            const role = msg.data?.role;
            if (name) {
              setParticipantDetails(prev => ({ ...prev, [connId]: { name, role } }));
            }
            if ((userRole === 'interviewer' || userRole === 'host') && isWhiteboardOpenRef.current) {
              sendMessage('whiteboard_toggle', { isOpen: true }, connId);
              if (whiteboardSnapshotRef.current) {
                sendMessage('whiteboard_update', { snapshot: whiteboardSnapshotRef.current }, connId);
              }
            }
            if (isScreenSharingRef.current && screenAnnotationsRef.current.length > 0) {
              sendMessage('screen_annotation_sync', { annotations: screenAnnotationsRef.current }, connId);
            }
            break;
          }

          case 'leave': {
            const connId = msg.sender_id;
            setParticipants(prev => prev.filter(id => id !== connId));
            if (peers.current[connId]) {
              peers.current[connId].destroy();
              delete peers.current[connId];
            }
            delete pendingSignals.current[connId];
            const leftStream = peerStreams.current[connId];
            if (leftStream) {
              setRemoteStreams(prev => prev.filter(s => s.id !== leftStream.id));
              delete peerStreams.current[connId];
            }
            if (remoteScreenSharerIdRef.current === connId) {
              clearRemoteScreenShare();
            }
            setRemoteVideoOffByUser(prev => {
              const next = { ...prev };
              delete next[connId];
              return next;
            });
            setParticipantDetails(prev => {
              const next = { ...prev };
              delete next[connId];
              return next;
            });
            setPeerIdToStreamId(prev => {
              const next = { ...prev };
              delete next[connId];
              return next;
            });
            break;
          }

          case 'end_call': {
            if (onCallEnded) {
              onCallEnded();
            }
            break;
          }

          case 'kick': {
            if (onKicked) {
              onKicked();
            }
            break;
          }

          case 'chat': {
            if (onChatReceived && msg.data) {
              onChatReceived(msg.data);
            }
            break;
          }

          case 'raise_hand': {
            if (onHandRaised && msg.data) {
              onHandRaised(msg.data, msg.sender_id);
            }
            break;
          }

          case 'video_off': {
            const connId = msg.sender_id;
            setRemoteVideoOffByUser(prev => ({ ...prev, [connId]: true }));
            break;
          }

          case 'video_on': {
            const connId = msg.sender_id;
            setRemoteVideoOffByUser(prev => ({ ...prev, [connId]: false }));
            break;
          }

          case 'audio_off': {
            const connId = msg.sender_id;
            setRemoteAudioOffByUser(prev => ({ ...prev, [connId]: true }));
            break;
          }

          case 'audio_on': {
            const connId = msg.sender_id;
            setRemoteAudioOffByUser(prev => ({ ...prev, [connId]: false }));
            break;
          }

          case 'offer': {
            const signal = msg.data?.signal ?? msg.data;
            const connId = msg.sender_id;
            if (peers.current[connId]) {
              peers.current[connId].signal(signal);
            } else {
              runWhenStreamReady(() => createPeer(connId, false, signal));
            }
            break;
          }

          case 'answer': {
            const signal = msg.data?.signal ?? msg.data;
            const connId = msg.sender_id;
            if (peers.current[connId]) {
              peers.current[connId].signal(signal);
            } else {
              (pendingSignals.current[connId] ||= []).push(signal);
            }
            break;
          }

          case 'ice-candidate': {
            const signal = msg.data?.signal ?? msg.data;
            const connId = msg.sender_id;
            if (peers.current[connId]) {
              peers.current[connId].signal(signal);
            } else {
              (pendingSignals.current[connId] ||= []).push(signal);
            }
            break;
          }

          case 'screen_share': {
            // If WE are currently sharing and someone else starts sharing, stop ours
            if (screenStreamRef.current && msg.sender_id !== userIdRef.current) {
              stopScreenSharing();
            }
            remoteScreenSharerIdRef.current = msg.sender_id;
            setRemoteScreenSharerId(msg.sender_id);
            break;
          }

          case 'screen_stop': {
            if (remoteScreenSharerIdRef.current === msg.sender_id) {
              const stoppedStreamId = remoteScreenStreamRef.current?.id ?? null;
              clearRemoteScreenShare();
              if (stoppedStreamId) {
                setRemoteStreams(prev => prev.filter(s => s.id !== stoppedStreamId));
              }
            }
            break;
          }

          case 'join_request': {
            if (msg.data && msg.data.participant_uuid) {
              const reqData = {
                ...msg.data,
                name: msg.data.name && msg.data.name.trim() ? msg.data.name.trim() : 'Guest',
              };
              setJoinRequests(prev => {
                const existingIndex = prev.findIndex(r => r.participant_uuid === reqData.participant_uuid);
                if (existingIndex >= 0) {
                  const updated = [...prev];
                  updated[existingIndex] = reqData;
                  return updated;
                }
                return [...prev, reqData];
              });
            }
            break;
          }

          case 'confetti_time': {
            launchConfetti();
            break;
          }

          case 'balloon_time': {
            launchBalloons();
            break;
          }

          case 'cat_time': {
            launchWalkingCat();
            break;
          }

          case 'tux_time': {
            launchTux();
            break;
          }

          case 'ufo_time': {
            launchUFO();
            break;
          }

          case 'brimo_time': {
            playSound();
            break;
          }

          case 'whiteboard_toggle': {
            if (onWhiteboardToggle) {
              onWhiteboardToggle(!!msg.data?.isOpen);
            }
            break;
          }

          case 'whiteboard_update': {
            if (onWhiteboardUpdate && msg.data?.snapshot) {
              onWhiteboardUpdate(msg.data.snapshot);
            }
            break;
          }

          case 'whiteboard_permission_update': {
            if (onWhiteboardPermissionUpdate && Array.isArray(msg.data?.allowedIds)) {
              onWhiteboardPermissionUpdate(msg.data.allowedIds);
            }
            break;
          }

          case 'screen_annotation_update':
          case 'screen_annotation_sync': {
            if (onScreenAnnotationUpdate && Array.isArray(msg.data?.annotations)) {
              onScreenAnnotationUpdate(msg.data.annotations);
            }
            break;
          }

          case 'screen_annotation_start': {
            if (onScreenAnnotationStart && msg.data?.item) {
              onScreenAnnotationStart(msg.data.item);
            }
            break;
          }

          case 'screen_annotation_draw': {
            if (onScreenAnnotationDraw && msg.data?.id && Array.isArray(msg.data?.points)) {
              onScreenAnnotationDraw(msg.data);
            }
            break;
          }

          case 'screen_annotation_end': {
            if (onScreenAnnotationEnd && msg.data?.id) {
              onScreenAnnotationEnd(msg.data);
            }
            break;
          }

          case 'screen_annotation_clear': {
            if (onScreenAnnotationClear) {
              onScreenAnnotationClear();
            }
            break;
          }

          default:
        }
      } catch (e) {
        console.error('Error parsing message:', e);
      }
    };

    ws.current.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    ws.current.onclose = (event) => {
      if (!isUnmounted) {
        console.warn('WebSocket closed, attempting to reconnect in 3s...');
        Object.keys(peers.current).forEach(key => {
          try {
            peers.current[key]?.destroy();
            delete peers.current[key];
          } catch (e) {}
        });
        peers.current = {};
        setParticipants([]);
        setRemoteStreams([]);
        setParticipantDetails({});
        clearRemoteScreenShare();
        setTimeout(connectWebSocket, 3000);
      }
    };

    };
    
    connectWebSocket();

    return () => {
      isUnmounted = true;
      if (ws.current) {
        try {
          ws.current.close();
        } catch (e) {
          console.warn('Error closing WebSocket:', e);
        }
        ws.current = null;
      }

      Object.keys(peers.current).forEach(key => {
        try {
          peers.current[key]?.destroy();
          delete peers.current[key];
        } catch (e) {
          console.warn('Error destroying peer:', e);
        }
      });
      peers.current = {};

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            console.warn(`Error stopping ${track.kind} track:`, e);
          }
        });
        localStreamRef.current = null;
        setLocalStream(null);
      }

      // 4. Stop screen stream
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            console.warn('Error stopping screen track:', e);
          }
        });
        screenStreamRef.current = null;
        setScreenStream(null);
      }

      // 5. Clean remote streams
      setRemoteStreams([]);
      setParticipants([]);
      setParticipantDetails({});
      clearRemoteScreenShare();
      
      // 6. Clean Virtual Background & Raw Track
      if (rawVideoTrackRef.current) {
        rawVideoTrackRef.current.stop();
        rawVideoTrackRef.current = null;
      }
      if (vbProcessorRef.current) {
        vbProcessorRef.current.destroy();
        vbProcessorRef.current = null;
      }

      // 7. Clear pending actions
      pendingStreamActions.current = [];
      pendingSignals.current = {};
      
      isWebRTCStarted.current = false;
    };
  }, [roomId, signalServer]);

  // Helper: kirim pesan
  const sendMessage = (type: string, data?: any, targetId?: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          room_id: roomIdRef.current,
          sender_id: userIdRef.current,
          target_id: targetId,
          type,
          data,
        } as WSMessage)
      );
    }
  };

function preferH264(sdp: string): string {
  const lines = sdp.split('\r\n');
  const mLineIndex = lines.findIndex(line => line.startsWith('m=video'));
  if (mLineIndex === -1) return sdp;

  const h264Payloads: string[] = [];
  lines.forEach(line => {
    if (line.startsWith('a=rtpmap:') && line.includes('H264/90000')) {
      const parts = line.split(' ');
      const payload = parts[0].split(':')[1];
      h264Payloads.push(payload);
    }
  });

  if (h264Payloads.length === 0) return sdp;

  const mLineParts = lines[mLineIndex].split(' ');
  const header = mLineParts.slice(0, 3);
  const existingPayloads = mLineParts.slice(3);

  const newPayloads = [
    ...h264Payloads,
    ...existingPayloads.filter(p => !h264Payloads.includes(p))
  ];

  lines[mLineIndex] = [...header, ...newPayloads].join(' ');
  return lines.join('\r\n');
}

  const createPeer = (userId: string, initiator: boolean, signal?: any) => {
    if (!localStreamRef.current) {
      console.warn('No local stream yet, queueing peer creation for', userId);
      pendingStreamActions.current.push(() => createPeer(userId, initiator, signal));
      return;
    }
    if (peers.current[userId]) {
      console.warn('Peer already exists for:', userId);
      if (signal) peers.current[userId].signal(signal);
      return;
    }

    const peer = new Peer({
      initiator,
      stream: localStreamRef.current,
      trickle: true,
      config: {
        iceServers: ICE_SERVERS,
        iceTransportPolicy: 'all',
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
      },
      sdpTransform: preferH264,
    });

    peer.on('signal', (signalData: any) => {

      if (signalData.type === 'offer') {
        sendMessage('offer', { signal: signalData }, userId);
      } else if (signalData.type === 'answer') {
        sendMessage('answer', { signal: signalData }, userId);
      } else {
        sendMessage('ice-candidate', { signal: signalData }, userId);
      }
    });

    peer.on('stream', (stream) => {
      const alreadyHasCameraStream = !!peerStreams.current[userId];
      const detectedByMetadata = isScreenShareStream(stream);
      // Only treat as screen share if WS has already told us this user is sharing,
      // or if browser metadata confirms it. Don't use alreadyHasCameraStream alone
      // because fast sequential camera streams from different peers could be mistaken.
      const wsSignaledSharing = remoteScreenSharerIdRef.current === userId;
      const isLikelyScreenShare = detectedByMetadata || (alreadyHasCameraStream && wsSignaledSharing);

      if (isLikelyScreenShare) {
        remoteScreenSharerIdRef.current = userId;
        setRemoteScreenSharerId(userId);
        setRemoteScreenStreamSync(stream);

        const videoTrack = stream.getVideoTracks()[0];
        videoTrack?.addEventListener('ended', () => {
          if (remoteScreenSharerIdRef.current === userId) {
            clearRemoteScreenShare();
          }
        });
        return;
      }

      peerStreams.current[userId] = stream;
      setPeerIdToStreamId(prev => ({ ...prev, [userId]: stream.id }));
      setRemoteStreams(prev => {
        if (prev.some(s => s.id === stream.id)) return prev;
        return [...prev, stream];
      });
    });

    // Note: 'track' event removed — 'stream' event is the authoritative handler.
    // Having both caused double-classification race conditions.

    peer.on('connect', () => {
      const pc: RTCPeerConnection | undefined = (peer as any)._pc;
      if (pc) {
        pc.getSenders().forEach(sender => {
          if (sender.track?.kind === 'video') {
            try {
              const params = sender.getParameters();
              (params as any).degradationPreference = 'maintain-resolution';
              if (params.encodings && params.encodings.length > 0) {
                params.encodings[0].maxBitrate = 3000000; 
                params.encodings[0].maxFramerate = 60;
              }
              sender.setParameters(params).catch(err => console.warn('Failed setting sender parameters:', err));
            } catch (err) {
              console.warn('Error configuring RTCRtpSender:', err);
            }
          }
        });
      }

      const videoTrack = localStreamRef.current?.getVideoTracks()[0];
      if (videoTrack && !videoTrack.enabled) {
        sendMessage('video_off', undefined, userId);
      }

      const audioTrack = localStreamRef.current?.getAudioTracks()[0];
      if (audioTrack && !audioTrack.enabled) {
        sendMessage('audio_off', undefined, userId);
      }

      // Proactively send screen share tracks to the new peer if we are already sharing
      if (isScreenSharingRef.current && screenStreamRef.current) {
        try {
          screenStreamRef.current.getTracks().forEach(track => {
            peer.addTrack(track, screenStreamRef.current!);
          });
          sendMessage('screen_share', undefined, userId);
        } catch (err) {
          console.error('Failed to add screen track to new peer:', err);
        }
      }
    });

    peer.on('close', () => {
      // Clean up this peer's stream in case we didn't get a 'leave' message
      const orphanStream = peerStreams.current[userId];
      if (orphanStream) {
        setRemoteStreams(prev => prev.filter(s => s.id !== orphanStream.id));
        delete peerStreams.current[userId];
      }
      if (remoteScreenSharerIdRef.current === userId) {
        const screenId = remoteScreenStreamRef.current?.id ?? null;
        clearRemoteScreenShare();
        if (screenId) {
          setRemoteStreams(prev => prev.filter(s => s.id !== screenId));
        }
      }
      delete peers.current[userId];
    });

    peer.on('error', (err) => {
      console.error(`Peer ${userId} error:`, err);
    });

    peers.current[userId] = peer;

    if (signal) {
      peer.signal(signal);
    }

    const queued = pendingSignals.current[userId];
    if (queued && queued.length) {
      queued.forEach(s => peer.signal(s));
      delete pendingSignals.current[userId];
    }

    return peer;
  };

  const startScreenSharing = async () => {
    try {
      if (isScreenSharingRef.current) {
        return;
      }


      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (err: any) {
        if (err?.name === 'NotAllowedError') throw err;
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
      }


      screenStreamRef.current = stream;
      setScreenStream(stream);
      setIsScreenSharing(true);
      isScreenSharingRef.current = true;

      sendMessage('screen_share');

      Object.values(peers.current).forEach(peer => {
        if (peer && !peer.destroyed) {
          try {
            stream.getTracks().forEach(track => {
              peer.addTrack(track, stream);
            });
          } catch (err) {
            console.error('Failed to add stream:', err);
          }
        }
      });

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.addEventListener('ended', () => {
          stopScreenSharing();
        });
      }
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };

  const stopScreenSharing = () => {

    const streamToRemove = screenStreamRef.current;
    streamToRemove?.getTracks().forEach(track => track.stop());
    screenStreamRef.current = null;
    setScreenStream(null);
    setIsScreenSharing(false);
    isScreenSharingRef.current = false;

    if (streamToRemove) {
      Object.values(peers.current).forEach(peer => {
        if (peer && !peer.destroyed) {
          try {
            streamToRemove.getTracks().forEach(track => {
              peer.removeTrack(track, streamToRemove);
            });
          } catch (err) {
            console.warn('Error removing screen stream:', err);
          }
        }
      });
    }

    sendMessage('screen_stop');
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOffState(!audioTrack.enabled);
        sendMessage(audioTrack.enabled ? 'audio_on' : 'audio_off');
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOffState(!videoTrack.enabled);
        sendMessage(videoTrack.enabled ? 'video_on' : 'video_off');
      }
    }
  };

  const remoteVideoOff = useMemo(() => {
    const map: Record<string, boolean> = {};
    Object.entries(remoteVideoOffByUser).forEach(([userId, off]) => {
      const streamId = peerIdToStreamId[userId];
      if (streamId) map[streamId] = off;
    });
    return map;
  }, [remoteVideoOffByUser, peerIdToStreamId]);

  const remoteAudioOff = useMemo(() => {
    const map: Record<string, boolean> = {};
    Object.entries(remoteAudioOffByUser).forEach(([userId, off]) => {
      const streamId = peerIdToStreamId[userId];
      if (streamId) map[streamId] = off;
    });
    return map;
  }, [remoteAudioOffByUser, peerIdToStreamId]);

  const applyOutgoingVideoTrack = (newTrack: MediaStreamTrack) => {
    const oldTrack = rawVideoTrackRef.current;
    Object.values(peers.current).forEach((peer) => {
      if (oldTrack) {
        try {
          peer.replaceTrack(oldTrack, newTrack, localStreamRef.current!);
        } catch (e) {
          console.warn('replaceTrack gagal:', e);
        }
      }
    });
    rawVideoTrackRef.current = newTrack;
  };

  const setVirtualBackground = async (mode: VirtualBackgroundMode, backgroundImage?: string) => {
    if (!localStreamRef.current) return;

    if (mode === 'none') {
      const originalTrack = localStreamRef.current.getVideoTracks()[0];
      if (originalTrack) applyOutgoingVideoTrack(originalTrack);
      
      setLocalStream(localStreamRef.current);

      vbProcessorRef.current?.stop();
      setVirtualBgModeState('none');
      return;
    }

    if (!vbProcessorRef.current) {
      vbProcessorRef.current = new VirtualBackgroundProcessor();
    }

    if (mode === 'image' && backgroundImage) {
      await vbProcessorRef.current.setBackgroundImage(backgroundImage);
    }

    const processedStream = await vbProcessorRef.current.start(localStreamRef.current, { mode });
    const processedTrack = processedStream.getVideoTracks()[0];

    if (!rawVideoTrackRef.current) {
      rawVideoTrackRef.current = localStreamRef.current.getVideoTracks()[0];
    }
    applyOutgoingVideoTrack(processedTrack);

    setLocalStream(processedStream);

    setVirtualBgModeState(mode);
  };
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoInputDevices, setVideoInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>('');
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string>('');
  const [selectedAudioOutputDeviceId, setSelectedAudioOutputDeviceId] = useState<string>('');

  const updateDeviceList = async () => {
    try {
      if (typeof window === 'undefined' || !navigator?.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const aInputs = devices.filter((d) => d.kind === 'audioinput');
      const vInputs = devices.filter((d) => d.kind === 'videoinput');
      const aOutputs = devices.filter((d) => d.kind === 'audiooutput');

      setAudioInputDevices(aInputs);
      setVideoInputDevices(vInputs);
      setAudioOutputDevices(aOutputs);

      setSelectedAudioDeviceId((prev) => prev || (aInputs[0]?.deviceId ?? ''));
      setSelectedVideoDeviceId((prev) => prev || (vInputs[0]?.deviceId ?? ''));
      setSelectedAudioOutputDeviceId((prev) => prev || (aOutputs[0]?.deviceId ?? ''));
    } catch (err) {
      console.error('Error enumerating devices:', err);
    }
  };

  useEffect(() => {
    updateDeviceList();
    if (typeof window !== 'undefined' && navigator?.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', updateDeviceList);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', updateDeviceList);
      };
    }
  }, []);

  const switchAudioDevice = async (deviceId: string) => {
    try {
      setSelectedAudioDeviceId(deviceId);
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      const newAudioTrack = newStream.getAudioTracks()[0];
      if (!newAudioTrack || !localStreamRef.current) return;

      const oldAudioTrack = localStreamRef.current.getAudioTracks()[0];

      Object.values(peers.current).forEach((peer: any) => {
        if (oldAudioTrack) {
          try {
            peer.replaceTrack(oldAudioTrack, newAudioTrack, localStreamRef.current!);
          } catch (e) {
            console.warn('Failed to replace audio track in peer:', e);
          }
        }
      });

      if (oldAudioTrack) {
        localStreamRef.current.removeTrack(oldAudioTrack);
        oldAudioTrack.stop();
      }
      localStreamRef.current.addTrack(newAudioTrack);

      const updatedStream = new MediaStream(localStreamRef.current.getTracks());
      localStreamRef.current = updatedStream;
      setLocalStream(updatedStream);

      await updateDeviceList();
    } catch (err) {
      console.error('Error switching audio device:', err);
    }
  };

  const switchVideoDevice = async (deviceId: string) => {
    try {
      setSelectedVideoDeviceId(deviceId);
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      if (!newVideoTrack || !localStreamRef.current) return;

      const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];

      Object.values(peers.current).forEach((peer: any) => {
        if (oldVideoTrack) {
          try {
            peer.replaceTrack(oldVideoTrack, newVideoTrack, localStreamRef.current!);
          } catch (e) {
            console.warn('Failed to replace video track in peer:', e);
          }
        }
      });

      if (oldVideoTrack) {
        localStreamRef.current.removeTrack(oldVideoTrack);
        oldVideoTrack.stop();
      }
      localStreamRef.current.addTrack(newVideoTrack);

      const updatedStream = new MediaStream(localStreamRef.current.getTracks());
      localStreamRef.current = updatedStream;
      setLocalStream(updatedStream);

      await updateDeviceList();
    } catch (err) {
      console.error('Error switching video device:', err);
    }
  };

  const switchAudioOutputDevice = async (deviceId: string) => {
    try {
      setSelectedAudioOutputDeviceId(deviceId);
      const mediaElements = document.querySelectorAll('audio, video');
      for (const elem of Array.from(mediaElements) as any[]) {
        if (typeof elem.setSinkId === 'function') {
          try {
            await elem.setSinkId(deviceId);
          } catch (e) {
            console.warn('Error setting sinkId on media element:', e);
          }
        }
      }
    } catch (err) {
      console.error('Error switching audio output device:', err);
    }
  };

  return {
    localStream,
    remoteStreams,
    participants,
    participantDetails,
    peerIdToStreamId,
    isScreenSharing,
    screenStream,
    remoteScreenStream,
    remoteScreenSharerId,
    remoteVideoOff,
    remoteAudioOff,
    speaking,
    virtualBgMode,
    joinRequests,
    setJoinRequests,
    startScreenSharing,
    stopScreenSharing,
    setVirtualBackground,
    toggleMute,
    toggleVideo,
    sendMessage,
    audioInputDevices,
    videoInputDevices,
    audioOutputDevices,
    selectedAudioDeviceId,
    selectedVideoDeviceId,
    selectedAudioOutputDeviceId,
    switchAudioDevice,
    switchVideoDevice,
    switchAudioOutputDevice,
    updateDeviceList,
    networkQuality,
    myConnId,
  };
}
