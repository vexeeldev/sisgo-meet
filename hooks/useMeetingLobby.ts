'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-new';

interface UseMeetingLobbyOptions {
  roomId: string;
  roomExists: boolean | null;
  roomType?: string;
  onJoin: (participantUUID: string, role?: string, cameraOn?: boolean, micOn?: boolean, name?: string) => void;
}

export function useMeetingLobby({ roomId, roomExists, roomType = 'private', onJoin }: UseMeetingLobbyOptions) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef(true);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isStarting, setIsStarting] = useState(true);
  const [deviceList, setDeviceList] = useState<{ cameras: MediaDeviceInfo[]; mics: MediaDeviceInfo[] }>({
    cameras: [],
    mics: [],
  });
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedMic, setSelectedMic] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioBarRefs = useRef<(HTMLDivElement | null)[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const [waitingApproval, setWaitingApproval] = useState(false);
  const [joining, setJoining] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const participantUUIDRef = useRef<string | null>(null);
  const roleRef = useRef<string | null>(null);

  const [user, setUser] = useState<any>(null);
  const [customGuestName, setCustomGuestName] = useState('');
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  const handleSwitchMic = async (deviceId: string) => {
    try {
      setSelectedMic(deviceId);
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      const newTrack = newStream.getAudioTracks()[0];
      if (!newTrack || !localStreamRef.current) return;

      const oldTrack = localStreamRef.current.getAudioTracks()[0];
      if (oldTrack) {
        localStreamRef.current.removeTrack(oldTrack);
        oldTrack.stop();
      }
      localStreamRef.current.addTrack(newTrack);

      const updatedStream = new MediaStream(localStreamRef.current.getTracks());
      localStreamRef.current = updatedStream;
      setLocalStream(updatedStream);
    } catch (e) {
      console.error('Error switching mic in lobby:', e);
    }
  };

  const handleSwitchCamera = async (deviceId: string) => {
    try {
      setSelectedCamera(deviceId);
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
          aspectRatio: { ideal: 1.7777777778 },
        },
      });
      const newTrack = newStream.getVideoTracks()[0];
      if (!newTrack || !localStreamRef.current) return;

      const oldTrack = localStreamRef.current.getVideoTracks()[0];
      if (oldTrack) {
        localStreamRef.current.removeTrack(oldTrack);
        oldTrack.stop();
      }
      localStreamRef.current.addTrack(newTrack);

      const updatedStream = new MediaStream(localStreamRef.current.getTracks());
      localStreamRef.current = updatedStream;
      setLocalStream(updatedStream);
    } catch (e) {
      console.error('Error switching camera in lobby:', e);
    }
  };

  const handleSwitchSpeaker = async (deviceId: string) => {
    try {
      setSelectedSpeaker(deviceId);
      if (videoRef.current && typeof (videoRef.current as any).setSinkId === 'function') {
        await (videoRef.current as any).setSinkId(deviceId);
      }
    } catch (e) {
      console.error('Error switching speaker in lobby:', e);
    }
  };

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch (e) {}

    if (typeof window !== 'undefined') {
      const savedGuestName =
        sessionStorage.getItem(`guestName_${roomId}`) ||
        localStorage.getItem(`guestName_${roomId}`);
      if (savedGuestName && savedGuestName.trim()) {
        setCustomGuestName(savedGuestName.trim());
      }
    }

    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [roomId]);

  // Redirect countdown
  useEffect(() => {
    if (roomExists === false && !isRedirecting) {
      setIsRedirecting(true);

      let count = 3;
      setRedirectCountdown(count);

      const timer = setInterval(() => {
        count -= 1;
        setRedirectCountdown(count);

        if (count <= 0) {
          clearInterval(timer);
          window.location.replace('/dashboard');
          return;
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [roomExists]);

  useEffect(() => {
    if (roomExists === false) {
      return;
    }

    const checkPermission = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        if (result.state === 'granted') {
          startCamera();
        } else if (result.state === 'denied') {
          setIsStarting(false);
          setError('Akses kamera ditolak. Mohon izinkan akses kamera di pengaturan browser.');
        } else {
          setIsStarting(false);
        }
      } catch (e) {
        setIsStarting(false);
      }
    };

    checkPermission();
  }, [roomExists]);

  // Clean up camera when component unmounts completely
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setIsStarting(true);
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
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
      });

      if (!isMountedRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      setLocalStream(stream);
      localStreamRef.current = stream;
      setHasPermission(true);
      setIsCameraOn(true);
      setIsMicOn(true);

      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((d) => d.kind === 'videoinput');
      const mics = devices.filter((d) => d.kind === 'audioinput');
      const audioOutputs = devices.filter((d) => d.kind === 'audiooutput');

      setDeviceList({ cameras, mics });
      setSpeakers(audioOutputs);

      if (cameras.length > 0 && !selectedCamera) setSelectedCamera(cameras[0].deviceId);
      if (mics.length > 0 && !selectedMic) setSelectedMic(mics[0].deviceId);
      if (audioOutputs.length > 0 && !selectedSpeaker) setSelectedSpeaker(audioOutputs[0].deviceId);
    } catch (err: any) {
      console.error('Error accessing media devices:', err);
      if (err.name === 'NotAllowedError') {
        setError('Akses kamera dan mikrofon diperlukan. Mohon izinkan akses lalu coba lagi.');
      } else if (err.name === 'NotFoundError') {
        setError('Kamera atau mikrofon tidak ditemukan. Mohon hubungkan perangkat.');
      } else {
        setError('Gagal mengakses kamera dan mikrofon. Silakan coba lagi.');
      }
    } finally {
      setIsStarting(false);
    }
  };

  useEffect(() => {
    if (!localStream || localStream.getAudioTracks().length === 0) return;

    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx: AudioContext = new AudioContextClass();
    const source = audioCtx.createMediaStreamSource(localStream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.7;
    source.connect(analyser);

    audioContextRef.current = audioCtx;
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length;
      const level = Math.min(1, avg / 70);

      audioBarRefs.current.forEach((bar, i) => {
        if (!bar) return;
        const weight = [0.6, 1, 0.75, 1.1, 0.65][i % 5];
        const scale = Math.max(0.18, Math.min(1, level * weight));
        bar.style.transform = `scaleY(${scale})`;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (audioCtx.state !== 'closed') audioCtx.close();
      audioContextRef.current = null;
      analyserRef.current = null;
    };
  }, [localStream]);

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
      videoRef.current.play().catch(console.error);
    }
  }, [localStream]);

  const isHostOrInterviewer = user?.role === 'host' || user?.role === 'interviewer';
  const isInterviewLocked = roomType === 'interview' && !isHostOrInterviewer;

  const toggleCamera = () => {
    if (isInterviewLocked) return;
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (isInterviewLocked) return;
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const getResolvedName = (providedName?: string) => {
    if (providedName && providedName !== 'Guest') return providedName;
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const uName = storedUser.name || storedUser.NamaLengkap || storedUser.nama_lengkap || storedUser.email || storedUser.username;
    if (uName) return uName;

    if (customGuestName && customGuestName.trim()) {
      const clean = customGuestName.trim();
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`guestName_${roomId}`, clean);
        localStorage.setItem(`guestName_${roomId}`, clean);
      }
      return clean;
    }

    const savedGuestName = typeof window !== 'undefined' 
      ? (sessionStorage.getItem(`guestName_${roomId}`) || localStorage.getItem(`guestName_${roomId}`))
      : null;

    return savedGuestName || 'Guest';
  };

  const connectWaitingSocket = (participantUUID: string, providedName?: string) => {
    wsRef.current?.close();

    const signalServer = process.env.NEXT_PUBLIC_SIGNAL_SERVER || 'wss://backspace-repurpose-fervor.ngrok-free.dev/ws';
    const ws = new WebSocket(
      `${signalServer}?room=${encodeURIComponent(roomId)}&participant_uuid=${encodeURIComponent(participantUUID)}`
    );

    ws.onopen = () => {
      const activeName = getResolvedName();
      ws.send(JSON.stringify({
        type: 'join_request',
        data: {
          name: activeName,
          role: roleRef.current || 'candidate',
        }
      }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'approved' && msg.data?.participant_uuid === participantUUID) {
        setWaitingApproval(false);
        setError('');

        if (localStream) {
          localStream.getTracks().forEach((track) => track.stop());
        }

        ws.close();
        const activeName = getResolvedName();
        onJoin(participantUUID, roleRef.current || 'candidate', isCameraOn, isMicOn, activeName);
      }

      if (msg.type === 'rejected' && msg.data?.participant_uuid === participantUUID) {
        setWaitingApproval(false);
        setError('Permintaan bergabung ditolak. Klik Gabung Sekarang untuk meminta ulang.');
        ws.close();
      }
    };

    ws.onerror = (err) => {
      console.error('WS error while waiting for approval:', err);
    };

    ws.onclose = () => {
      wsRef.current = null;
    };

    wsRef.current = ws;
  };

  const handleJoin = async () => {
    if (!hasPermission) {
      setError("Mohon nyalakan kamera terlebih dahulu");
      return;
    }

    const token = localStorage.getItem("token");
    const activeName = getResolvedName();

    if (typeof window !== 'undefined' && activeName && activeName !== 'Guest') {
      sessionStorage.setItem(`guestName_${roomId}`, activeName);
      localStorage.setItem(`guestName_${roomId}`, activeName);
    }

    if (participantUUIDRef.current && error.includes("ditolak")) {
      setError('');
      setWaitingApproval(true);
      connectWaitingSocket(participantUUIDRef.current, activeName);
      return;
    }

    setJoining(true);
    setError('');

    let result;
    if (token) {
      result = await api.joinRoom(roomId);
      if (!result.success && (result.message?.toLowerCase().includes("token") || result.message?.includes("401") || result.message?.toLowerCase().includes("unauthorized"))) {
        result = await api.joinRoomGuest(roomId, activeName);
      }
    } else {
      result = await api.joinRoomGuest(roomId, activeName);
    }

    setJoining(false);

    if (!result.success) {
      const storedUUID = sessionStorage.getItem(`uuid_${roomId}`);
      if (result.message.toLowerCase().includes("rejected") && storedUUID) {
        setError("Permintaan sebelumnya ditolak. Menghubungkan ulang...");
        setWaitingApproval(true);
        connectWaitingSocket(storedUUID, activeName);
        return;
      }
      setError(result.message);
      return;
    }

    if (result.participant.status === "pending") {
      participantUUIDRef.current = result.participant.participant_uuid;
      roleRef.current = result.participant.role;
      sessionStorage.setItem(`uuid_${roomId}`, result.participant.participant_uuid);
      setWaitingApproval(true);
      connectWaitingSocket(result.participant.participant_uuid, activeName);
      return;
    }

    if (result.participant.status === "rejected") {
      setError("Permintaan sebelumnya ditolak. Klik Gabung lagi untuk meminta ulang.");
      participantUUIDRef.current = result.participant.participant_uuid;
      roleRef.current = result.participant.role;
      sessionStorage.setItem(`uuid_${roomId}`, result.participant.participant_uuid);
      return;
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    onJoin(result.participant.participant_uuid, result.participant.role, isCameraOn, isMicOn, activeName);
  };

  const handleBackToDashboard = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    wsRef.current?.close();
    router.push('/dashboard');
  };

  return {
    error,
    setError,
    redirectCountdown,
    localStream,
    isCameraOn,
    isMicOn,
    hasPermission,
    isStarting,
    deviceList,
    speakers,
    selectedCamera,
    selectedMic,
    selectedSpeaker,
    videoRef,
    audioBarRefs,
    waitingApproval,
    joining,
    user,
    customGuestName,
    setCustomGuestName,
    currentTime,
    isInterviewLocked,
    toggleCamera,
    toggleMic,
    startCamera,
    handleSwitchCamera,
    handleSwitchMic,
    handleSwitchSpeaker,
    handleJoin,
    handleBackToDashboard,
  };
}
