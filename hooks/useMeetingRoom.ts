'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useRecording } from '@/hooks/useRecording';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { api } from '@/lib/api-new';
import { getUser } from '@/lib/meeting';
import { VirtualBackgroundMode } from '@/lib/virtual-background';
import { saveRecordingToStorage } from '@/lib/recording-storage';

export interface UseMeetingRoomProps {
  roomId: string;
}

export function useMeetingRoom({ roomId }: UseMeetingRoomProps) {
  const router = useRouter();

  const [showLobby, setShowLobby] = useState(true);
  const [participantName, setParticipantName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [shouldStartWebRTC, setShouldStartWebRTC] = useState(false);
  const [participantUUID, setParticipantUUID] = useState<string | null>(null);
  const [roomExists, setRoomExists] = useState<boolean | null>(null);
  const [roomType, setRoomType] = useState<'private' | 'anyone' | 'interview'>('private');
  const [chatMessages, setChatMessages] = useState<{ id: string; name: string; message: string; time: string }[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [layout, setLayout] = useState<'auto' | 'tiled' | 'spotlight' | 'sidebar' | 'speaker' | 'grid'>('tiled');
  const [showEndCallModal, setShowEndCallModal] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [raisedHands, setRaisedHands] = useState<Record<string, boolean>>({});
  const [virtualBgImage, setVirtualBgImage] = useState<string | null>(null);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [processingJoin, setProcessingJoin] = useState<Record<string, boolean>>({});
  const [meetingRole, setMeetingRole] = useState<string | null>(null);

  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showBgPanel, setShowBgPanel] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isWhiteboardMinimized, setIsWhiteboardMinimized] = useState(false);
  const [whiteboardSnapshot, setWhiteboardSnapshot] = useState<any>(null);
  const [screenAnnotations, setScreenAnnotations] = useState<any[]>([]);
  const [isScreenAnnotationOpen, setIsScreenAnnotationOpen] = useState(false);
  const [pinnedParticipants, setPinnedParticipants] = useState<string[]>([]);

  const user = getUser();
  const isHost = meetingRole === 'interviewer';

  const handleScreenAnnotationChange = (annotations: any[]) => {
    setScreenAnnotations(annotations);
    sendMessage('screen_annotation_update', { annotations });
  };

  const handleScreenAnnotationStart = (item: any) => {
    setScreenAnnotations((prev) => [...prev, item]);
    sendMessage('screen_annotation_start', { item });
  };

  const handleScreenAnnotationDraw = (data: { id: string; points: number[] }) => {
    setScreenAnnotations((prev) => {
      if (prev.length === 0) return prev;
      const lastIndex = prev.length - 1;
      const lastItem = { ...prev[lastIndex] };

      if (lastItem.id === data.id) {
        if (lastItem.tool === 'pen') {
          lastItem.points = [...(lastItem.points || []), ...data.points];
        } else if (lastItem.tool === 'arrow') {
          lastItem.points = data.points;
        } else if (lastItem.tool === 'rect' || lastItem.tool === 'circle') {
          lastItem.width = data.points[0];
          lastItem.height = data.points[1];
          lastItem.radius = data.points[2];
        }
        const updated = [...prev];
        updated[lastIndex] = lastItem;
        return updated;
      }
      return prev;
    });

    sendMessage('screen_annotation_draw', data);
  };

  const handleScreenAnnotationEnd = (data: { id: string }) => {
    sendMessage('screen_annotation_end', data);
  };

  const handleClearScreenAnnotations = () => {
    setScreenAnnotations([]);
    sendMessage('screen_annotation_clear');
  };

  const [showScreenAnnotationPrompt, setShowScreenAnnotationPrompt] = useState(false);

  const {
    localStream,
    remoteStreams,
    participants,
    participantDetails,
    peerIdToStreamId,
    screenStream,
    remoteScreenStream,
    remoteScreenSharerId,
    remoteVideoOff,
    remoteAudioOff,
    speaking,
    virtualBgMode,
    joinRequests,
    setJoinRequests,
    isScreenSharing,
    startScreenSharing,
    stopScreenSharing,
    toggleMute: toggleMuteStream,
    toggleVideo: toggleVideoStream,
    setVirtualBackground,
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
    networkQuality,
  } = useWebRTC({
    roomId,
    participantUUID: participantUUID || '',
    userName: participantName,
    userRole: meetingRole || 'candidate',
    initialCameraOn: !isVideoOff,
    initialMicOn: !isMuted,
    onKicked: () => {
      window.location.href = '/dashboard';
    },
    onCallEnded: () => {
      window.location.href = '/dashboard';
    },
    onChatReceived: (msg: any) => {
      setChatMessages((prev) => [...prev, msg]);
      setUnreadChatCount((prev) => prev + 1);
    },
    onHandRaised: (msg: any, senderId?: string) => {
      const isRaised = !!msg.isRaised;
      if (senderId) {
        setRaisedHands((prev) => ({ ...prev, [senderId]: isRaised }));
      }
    },
    onWhiteboardToggle: (isOpen: boolean) => {
      setIsWhiteboardOpen(isOpen);
      if (isOpen) setIsWhiteboardMinimized(false);
    },
    onWhiteboardUpdate: (snapshot: any) => {
      setWhiteboardSnapshot(snapshot);
    },
    onScreenAnnotationUpdate: (annotations: any[]) => {
      setScreenAnnotations(annotations);
    },
    onScreenAnnotationStart: (item: any) => {
      setScreenAnnotations((prev) => [...prev, item]);
    },
    onScreenAnnotationDraw: (data: { id: string; points: number[] }) => {
      setScreenAnnotations((prev) => {
        if (prev.length === 0) return prev;
        const lastIndex = prev.length - 1;
        const lastItem = { ...prev[lastIndex] };

        if (lastItem.id === data.id) {
          if (lastItem.tool === 'pen') {
            lastItem.points = [...(lastItem.points || []), ...data.points];
          } else if (lastItem.tool === 'arrow') {
            lastItem.points = data.points;
          } else if (lastItem.tool === 'rect' || lastItem.tool === 'circle') {
            lastItem.width = data.points[0];
            lastItem.height = data.points[1];
            lastItem.radius = data.points[2];
          }
          const updated = [...prev];
          updated[lastIndex] = lastItem;
          return updated;
        }
        return prev;
      });
    },
    onScreenAnnotationEnd: () => {},
    onScreenAnnotationClear: () => {
      setScreenAnnotations([]);
    },
    screenAnnotations,
    isWhiteboardOpen,
    whiteboardSnapshot,
    signalServer: shouldStartWebRTC
      ? process.env.NEXT_PUBLIC_SIGNAL_SERVER || 'wss://backspace-repurpose-fervor.ngrok-free.dev/ws'
      : '',
  });

  const handleToggleScreenAnnotation = () => {
    const isAnyScreenSharing = isScreenSharing || !!remoteScreenStream;
    if (isAnyScreenSharing || isScreenAnnotationOpen) {
      setIsScreenAnnotationOpen((prev) => !prev);
    } else {
      setShowScreenAnnotationPrompt(true);
    }
  };

  const handleConfirmScreenAnnotationShare = () => {
    setShowScreenAnnotationPrompt(false);
    setIsScreenAnnotationOpen(true);
    startScreenSharing();
  };

  const {
    isRecording,
    isPaused,
    elapsedMs,
    result,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    downloadRecording,
    discardRecording,
  } = useRecording();

  const handleChangeVirtualBg = async (mode: VirtualBackgroundMode, image?: string) => {
    await setVirtualBackground(mode, image);
    setVirtualBgImage(mode === 'image' ? image ?? null : null);
  };

  const remoteScreenShare = remoteScreenStream
    ? {
        stream: remoteScreenStream,
        participantId: remoteScreenSharerId ?? '',
        participantName:
          remoteScreenSharerId && participantDetails[remoteScreenSharerId]
            ? participantDetails[remoteScreenSharerId].name
            : 'Someone',
      }
    : null;

  useEffect(() => {
    const checkRoom = async () => {
      try {
        const result = await api.checkRoom(roomId);
        const exists = result.success;
        setRoomExists(exists);
        if (result.roomType) {
          setRoomType(result.roomType as any);
        }
      } catch (error) {
        console.error('Error checking room:', error);
        setRoomExists(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkRoom();
  }, [roomId]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);



  useEffect(() => {
    const savedGuestName = typeof window !== 'undefined' 
      ? (sessionStorage.getItem(`guestName_${roomId}`) || localStorage.getItem(`guestName_${roomId}`))
      : null;

    const uName = user && (user.name || user.NamaLengkap || user.nama_lengkap || user.email || user.username);

    if (uName) {
      setParticipantName(uName);
    } else if (savedGuestName && savedGuestName.trim()) {
      setParticipantName(savedGuestName.trim());
    }
  }, [user, roomId, showLobby]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '/' || e.code === 'Slash')) {
        if (meetingRole === 'host' || meetingRole === 'interviewer') {
          e.preventDefault();
          setShowActionMenu((prev) => !prev);
        } else {
          console.warn('You are not a host! Role:', meetingRole);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [meetingRole, sendMessage]);

  const handleJoinFromLobby = (uuid: string, role?: string, cameraOn?: boolean, micOn?: boolean, name?: string) => {
    setParticipantUUID(uuid);
    if (role) {
      setMeetingRole(role);
    }
    if (name && name.trim()) {
      const cleanName = name.trim();
      setParticipantName(cleanName);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`guestName_${roomId}`, cleanName);
        localStorage.setItem(`guestName_${roomId}`, cleanName);
      }
    }
    if (cameraOn === false) setIsVideoOff(true);
    if (micOn === false) setIsMuted(true);
    setShowLobby(false);
    setShouldStartWebRTC(true);
  };

  const handleToggleLayout = () => {
    setLayout((prev) => (prev === 'speaker' ? 'grid' : 'speaker'));
  };

  const togglePin = (id: string) => {
    setPinnedParticipants((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleEndCall = () => {
    if (isRecording || isPaused) {
      const confirmLeave = confirm(
        'Kamu masih dalam sesi recording. Meninggalkan meeting akan menghentikan dan membuang rekaman yang belum di-download. Yakin mau keluar?'
      );
      if (!confirmLeave) return;
      stopRecording();
    } else if (result) {
      const confirmLeave = confirm(
        'Ada hasil rekaman yang belum di-download. Meninggalkan meeting akan membuang rekaman ini. Yakin mau keluar?'
      );
      if (!confirmLeave) return;
    }

    if (isHost) {
      setShowEndCallModal(true);
    } else {
      if (!confirm('Are you sure you want to leave the meeting?')) return;
      leaveCall();
    }
  };

  const leaveCall = () => {
    localStream?.getTracks().forEach((track) => track.stop());
    router.push('/dashboard');
  };

  useEffect(() => {
    if (showChat) {
      setUnreadChatCount(0);
    }
  }, [showChat, chatMessages]);

  useEffect(() => {
    if (result && result.blob) {
      saveRecordingToStorage(roomId, result.blob, result.durationMs).catch((err) => {
        console.error('Failed to auto-save recording to IndexedDB:', err);
      });
    }
  }, [result, roomId]);

  const handleEndForAll = () => {
    sendMessage('end_call', {});
    leaveCall();
  };

  const handleKickParticipant = (connId: string) => {
    if (confirm('Yakin ingin mengeluarkan peserta ini?')) {
      sendMessage('kick', {}, connId);
    }
  };

  const showToast = (message: string, type: 'info' | 'hand' = 'info') => {
    const toast = document.createElement('div');
    toast.className =
      'fixed bottom-24 left-6 bg-[#3c3c3c] text-white px-5 py-3 rounded-full text-sm shadow-xl z-[9999] flex items-center gap-3 border border-[#4a4b4c] transition-all duration-300 animate-in fade-in slide-in-from-bottom-4';

    if (type === 'hand') {
      toast.innerHTML = `
        <div class="bg-[#8ab4f8] rounded-full p-1.5 shadow-lg shadow-black/50 border-2 border-white/20">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#202124" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
            <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
            <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
            <path d="M15.5 17c1.3-1.6 3.6-2.5 5.5-3.6 1.4-.8 2-2.3 2-3.8 0-1.7-1.3-3.1-3-3.1-1.3 0-2.4.8-2.9 2L15.5 11"/>
            <path d="M2 15.2l5.2-5.4a3 3 0 0 1 4.5.1l.3.4"/>
          </svg>
        </div>
        <span class="font-medium whitespace-nowrap">${message}</span>
      `;
    } else {
      toast.innerHTML = `<span class="font-medium whitespace-nowrap">${message}</span>`;
    }

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-4');
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Link copied to clipboard!');
  };

  const handleToggleHand = () => {
    const newStatus = !isHandRaised;
    setIsHandRaised(newStatus);
    setRaisedHands((prev) => ({ ...prev, local: newStatus }));
    sendMessage('raise_hand', { isRaised: newStatus, name: participantName });
  };

  const handleApproveJoin = async (uuid: string) => {
    setProcessingJoin((prev) => ({ ...prev, [uuid]: true }));
    try {
      const res = await api.approveParticipant(uuid);
      if (
        res.success ||
        res.message === 'Participant approved' ||
        res.message === 'Participant is not pending'
      ) {
        setJoinRequests((prev) => prev.filter((req) => req.participant_uuid !== uuid));
        sendMessage('approved', { participant_uuid: uuid });
      } else {
        alert(res.message || 'Gagal menyetujui');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingJoin((prev) => ({ ...prev, [uuid]: false }));
    }
  };

  const handleRejectJoin = async (uuid: string) => {
    setProcessingJoin((prev) => ({ ...prev, [uuid]: true }));
    try {
      const res = await api.rejectParticipant(uuid);
      if (
        res.success ||
        res.message === 'Participant rejected' ||
        res.message === 'Participant is not pending'
      ) {
        setJoinRequests((prev) => prev.filter((req) => req.participant_uuid !== uuid));
        sendMessage('rejected', { participant_uuid: uuid });
      } else {
        alert(res.message || 'Gagal menolak');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingJoin((prev) => ({ ...prev, [uuid]: false }));
    }
  };

  const handleSendMessage = (message: string) => {
    const newMsg = {
      id: Date.now().toString(),
      name: participantName,
      message: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, newMsg]);
    sendMessage('chat', newMsg);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleToggleMute = () => {
    toggleMuteStream();
    setIsMuted((prev) => !prev);
  };

  const handleToggleVideo = () => {
    toggleVideoStream();
    setIsVideoOff((prev) => !prev);
  };

  const handleToggleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenSharing();
    } else {
      startScreenSharing();
    }
  };

  const handleToggleChat = () => {
    setShowChat((prev) => !prev);
    if (!showChat) {
      setShowParticipants(false);
      setShowRequests(false);
      setShowBgPanel(false);
    }
  };

  const handleToggleParticipants = () => {
    setShowParticipants((prev) => !prev);
    if (!showParticipants) {
      setShowChat(false);
      setShowRequests(false);
      setShowBgPanel(false);
    }
  };

  const handleToggleRequests = () => {
    setShowRequests((prev) => !prev);
    if (!showRequests) {
      setShowChat(false);
      setShowParticipants(false);
      setShowBgPanel(false);
    }
  };

  useKeyboardShortcuts({
    toggleMic: handleToggleMute,
    toggleCamera: handleToggleVideo,
    toggleScreenShare: handleToggleScreenShare,
  });

  const handleToggleWhiteboard = () => {
    if (isHost) {
      setIsWhiteboardOpen((prev) => {
        const nextState = !prev;
        sendMessage('whiteboard_toggle', { isOpen: nextState });
        if (!nextState) setIsWhiteboardMinimized(false);
        return nextState;
      });
    } else {
      // Untuk peserta biasa (non-host), klik close/toggle hanya me-minimize/maximize preview box lokal
      setIsWhiteboardMinimized((prev) => !prev);
    }
  };

  const handleWhiteboardSnapshotChange = (snapshot: any) => {
    setWhiteboardSnapshot(snapshot);
    sendMessage('whiteboard_update', { snapshot });
  };

  return {
    roomId,
    showLobby,
    participantName,
    isLoading,
    isMuted,
    isVideoOff,
    shouldStartWebRTC,
    participantUUID,
    roomExists,
    roomType,
    chatMessages,
    unreadChatCount,
    layout,
    showEndCallModal,
    currentTime,
    isHandRaised,
    raisedHands,
    virtualBgImage,
    showActionMenu,
    processingJoin,
    meetingRole,
    showChat,
    showParticipants,
    showRequests,
    showBgPanel,
    isHost,
    localStream,
    remoteStreams,
    participants,
    participantDetails,
    peerIdToStreamId,
    screenStream,
    remoteScreenStream,
    remoteScreenShare,
    remoteScreenSharerId,
    remoteVideoOff,
    remoteAudioOff,
    speaking,
    virtualBgMode,
    joinRequests,
    isScreenSharing,
    pinnedParticipants,
    togglePin,
    isRecording,
    isPaused,
    elapsedMs,
    result,
    setShowChat,
    setShowParticipants,
    setShowRequests,
    setShowBgPanel,
    setShowEndCallModal,
    setShowActionMenu,
    handleJoinFromLobby,
    handleToggleLayout,
    handleEndCall,
    leaveCall,
    handleEndForAll,
    handleKickParticipant,
    handleApproveJoin,
    handleRejectJoin,
    handleSendMessage,
    handleToggleFullscreen,
    handleToggleMute,
    handleToggleVideo,
    handleToggleScreenShare,
    handleToggleChat,
    handleToggleParticipants,
    handleToggleRequests,
    handleCopyLink,
    handleToggleHand,
    handleChangeVirtualBg,
    startRecording,
    stopRecording,
    downloadRecording,
    discardRecording,
    sendMessage,
    setLayout,
    isWhiteboardOpen,
    isWhiteboardMinimized,
    whiteboardSnapshot,
    handleToggleWhiteboard,
    handleWhiteboardSnapshotChange,
    screenAnnotations,
    handleScreenAnnotationChange,
    handleScreenAnnotationStart,
    handleScreenAnnotationDraw,
    handleScreenAnnotationEnd,
    handleClearScreenAnnotations,
    isScreenAnnotationOpen,
    handleToggleScreenAnnotation,
    showScreenAnnotationPrompt,
    setShowScreenAnnotationPrompt,
    handleConfirmScreenAnnotationShare,
    audioInputDevices,
    videoInputDevices,
    audioOutputDevices,
    selectedAudioDeviceId,
    selectedVideoDeviceId,
    selectedAudioOutputDeviceId,
    switchAudioDevice,
    switchVideoDevice,
    switchAudioOutputDevice,
    networkQuality,
  };
}
