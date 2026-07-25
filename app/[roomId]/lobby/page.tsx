'use client';

import { useState, useEffect, useRef } from 'react';
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import MicOutlinedIcon from "@mui/icons-material/MicOutlined";
import VolumeUpOutlinedIcon from "@mui/icons-material/VolumeUpOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api-new';
import { LoaderCircle } from "lucide-react";

interface MeetingLobbyProps {
  roomId: string;
  roomExists: boolean | null;
  roomType?: string;
  onJoin: (participantUUID: string, role?: string, cameraOn?: boolean, micOn?: boolean, name?: string) => void;
}

export default function MeetingLobby({ roomId, roomExists, roomType = 'private', onJoin }: MeetingLobbyProps) {
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
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedMic, setSelectedMic] = useState('');
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

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch (e) {}

    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
      } catch (err) {
        setIsStarting(false);
      }
    };

    if (roomExists === true) {
      checkPermission();
    }

    return () => {
      wsRef.current?.close();
    };
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

      // Handle race condition: if component unmounted while waiting for camera
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
      setDeviceList({ cameras, mics });
      if (cameras.length > 0) setSelectedCamera(cameras[0].deviceId);
      if (mics.length > 0) setSelectedMic(mics[0].deviceId);
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
      source.disconnect();
      analyser.disconnect();
      audioCtx.close().catch(() => {});
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
      return customGuestName.trim();
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
          participant_uuid: participantUUID,
          name: activeName,
        }
      }));
    };

    ws.onmessage = (event) => {
      let msg: { type: string; [key: string]: any };
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      if (msg.type === 'host_joined') {
        const activeName = getResolvedName();
        ws.send(JSON.stringify({
          type: 'join_request',
          data: {
            participant_uuid: participantUUID,
            name: activeName,
          }
        }));
        return;
      }

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
      // Jika backend merespons rejected, beri pesan, 
      // tetapi user bisa mencoba konek WS lagi dengan klik tombol karena tombol tidak di-disable
      setError("Permintaan sebelumnya ditolak. Klik Gabung lagi untuk meminta ulang.");
      participantUUIDRef.current = result.participant.participant_uuid;
      roleRef.current = result.participant.role;
      sessionStorage.setItem(`uuid_${roomId}`, result.participant.participant_uuid);
      return;
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    onJoin(result.participant.participant_uuid, result.participant.role, isCameraOn, isMicOn);
  };

  const handleBackToDashboard = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    wsRef.current?.close();
    router.push('/dashboard');
  };

  if (roomExists === false) {
    return (
      <div className="min-h-screen w-full bg-white flex flex-col">
        <div className="flex items-center gap-3 px-8 pt-8">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="17" fill="none" stroke="#e8eaed" strokeWidth="3" />
              <circle
                cx="20"
                cy="20"
                r="17"
                fill="none"
                stroke="#1a73e8"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 17}
                strokeDashoffset={2 * Math.PI * 17 * (redirectCountdown / 3)}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <span className="absolute text-xs font-medium text-gray-600">{redirectCountdown}</span>
          </div>
          <button onClick={handleBackToDashboard} className="text-gray-700 text-base hover:underline">
            Kembali ke layar utama
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-16">
          <h1 className="text-[28px] text-gray-800 mb-6">Periksa kode rapat</h1>
          <p className="text-center text-gray-600 max-w-md mb-1">
            Pastikan Anda memasukkan kode rapat yang benar
          </p>
          <p className="text-center text-gray-600 max-w-md mb-8">
            Room <span className="font-medium text-gray-800">"{roomId}"</span> tidak ditemukan
          </p>

          <button
            onClick={handleBackToDashboard}
            className="cursor-pointer px-6 py-2.5 bg-[#1a73e8] hover:bg-[#1765cc] text-white text-sm font-medium rounded-full transition mb-4"
          >
            Kembali ke layar utama
          </button>

          <button onClick={handleBackToDashboard} className="cursor-pointer text-[#1a73e8] text-sm hover:underline mb-10">
            Kirim masukan
          </button>

          <div className="flex items-start gap-4 max-w-md border border-gray-200 rounded-xl p-4">
            <div className="w-9 h-9 rounded-full bg-[#1a73e8] flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-800 text-sm font-medium mb-1">Rapat Anda aman</p>
              <p className="text-gray-500 text-sm">
                Tidak ada yang dapat bergabung ke rapat kecuali diundang atau diizinkan oleh penyelenggara
              </p>
              <button className="text-[#1a73e8] text-sm hover:underline mt-1">Pelajari lebih lanjut</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative bg-white overflow-hidden flex flex-col">
      {/* Navbar */}
      <nav className="relative z-50 w-full bg-white">
        <div className="max-w-7xl mx-auto h-16 lg:h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/">
            <Image
              src="https://s3.sisgo.co.id/core/logo-sisgo.png"
              alt="SISGO Logo"
              width={220}
              height={64}
              className="h-10 lg:h-12 w-auto object-contain"
              priority
            />
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-[15px] font-medium text-[#5f6368] hidden sm:block">
              {currentTime ? currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':') : ''} • {currentTime ? currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }) : ''}
            </span>
            <span className="text-sm font-medium text-slate-700 hidden sm:block">
              {user?.name || user?.email || user?.Email || ""}
            </span>
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 lg:h-10 lg:w-10 rounded-full bg-primary-blue flex items-center justify-center text-white text-xs lg:text-sm font-semibold shadow-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : user?.username?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 w-full flex items-center justify-center px-4">
        <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-center">
          <div>
            {roomType === 'interview' && (
              <div className="mb-3 px-4 py-2.5 bg-[#fef7e0] border border-[#f5e0a3] rounded-2xl flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2.5 text-[#b06000] text-sm font-medium">
                  <svg className="w-4 h-4 shrink-0 text-[#b06000]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Sesi Interview: Kamera & Mikrofon Wajib Menyala</span>
                </div>
                <span className="text-[11px] text-[#b06000] bg-white/80 px-2.5 py-0.5 rounded-full font-semibold border border-[#f5e0a3]">Terkunci</span>
              </div>
            )}
            
            <div className="relative aspect-video bg-[#1c1c1e] rounded-2xl overflow-hidden w-full">
            
              {hasPermission && localStream ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  {!isCameraOn && (
                    <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-[#1a1a1a]">
                      <div className="w-16 h-16 rounded-full bg-[#2a2a2a] flex items-center justify-center mb-3">
                        <svg className="w-8 h-8 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                      <span className="text-white text-sm font-light">{user?.name || 'Anda'}</span>
                      <span className="text-gray-400 text-xs mt-1 mb-4">Camera is off</span>
                    </div>
                  )}
                </>
              ) : isStarting ? (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div className="w-10 h-10 rounded-full border-4 border-white/20 border-t-blue-500 animate-spin mb-4" />
                  <p className="text-gray-400 text-sm">Memuat kamera...</p>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#1a1a1a] rounded-xl relative">
                  <div className="w-16 h-16 rounded-full bg-[#2a2a2a] flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                  <span className="text-white text-sm font-light">{user?.name || 'Anda'}</span>
                  <span className="text-gray-400 text-xs mt-1 mb-4">Camera is off</span>
                  <button
                    onClick={startCamera}
                    disabled={isStarting}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 text-white rounded-full text-sm font-medium transition"
                  >
                    {isStarting ? 'Memulai...' : 'Nyalakan Kamera'}
                  </button>
                </div>
              )}

              {hasPermission && localStream && (
                <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-sm px-3 py-2">
                  {isMicOn ? (
                    <>
                      <svg className="w-4 h-4 text-white shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                      </svg>
                      <div className="flex items-end gap-[3px] h-4">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            ref={(el) => {
                              audioBarRefs.current[i] = el;
                            }}
                            className="w-[3px] h-full bg-green-400 rounded-full transition-transform duration-75 origin-bottom"
                            style={{ transform: 'scaleY(0.18)' }}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <svg className="w-4 h-4 text-red-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.93c.01-.1.02-.21.02-.32V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.75zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
                    </svg>
                  )}
                </div>
              )}              {hasPermission && localStream && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                  <button
                    onClick={toggleMic}
                    disabled={isInterviewLocked}
                    title={isInterviewLocked ? 'Mikrofon wajib menyala pada sesi Interview' : ''}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition ${
                      isInterviewLocked
                        ? 'bg-white/40 opacity-70 cursor-not-allowed text-gray-700'
                        : isMicOn ? 'bg-white/90 hover:bg-white cursor-pointer' : 'bg-red-600 hover:bg-red-700 cursor-pointer'
                    }`}
                  >
                    {isMicOn ? (
                      <MicOutlinedIcon sx={{ fontSize: 20 }} />
                    ) : (
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.93c.01-.1.02-.21.02-.32V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.75zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
                      </svg>
                    )}
                  </button>

                  <button
                    onClick={toggleCamera}
                    disabled={isInterviewLocked}
                    title={isInterviewLocked ? 'Kamera wajib menyala pada sesi Interview' : ''}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition ${
                      isInterviewLocked
                        ? 'bg-white/40 opacity-70 cursor-not-allowed text-gray-700'
                        : isCameraOn ? 'bg-white/90 hover:bg-white cursor-pointer' : 'bg-red-600 hover:bg-red-700 cursor-pointer'
                    }`}
                  >
                    {isCameraOn ? (
                      <VideocamOutlinedIcon
                        sx={{ fontSize: 20 }}
                      />
                    ) : (
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              )}
            </div>

            {hasPermission && localStream && (
              <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                <div className="flex h-11 items-center gap-2 rounded-full border border-gray-300 bg-white px-4 transition-colors hover:border-gray-400">
                  <MicOutlinedIcon sx={{ fontSize: 20,}} />

                  <select
                    value={selectedMic}
                    onChange={(e) => setSelectedMic(e.target.value)}
                    className="flex-1 appearance-none bg-transparent text-sm font-medium text-gray-800 outline-none cursor-pointer truncate"
                  >
                    {deviceList.mics.length === 0 && (
                      <option>Tidak ada mikrofon</option>
                    )}

                    {deviceList.mics.map((mic) => (
                      <option key={mic.deviceId} value={mic.deviceId}>
                        {mic.label?.length > 18
                          ? `${mic.label.slice(0, 18)}...`
                          : mic.label || `Mic ${mic.deviceId.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>

                  <svg
                    className="h-4 w-4 shrink-0 text-gray-500 pointer-events-none"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    />
                  </svg>
                </div>

                <div className="flex h-11 items-center gap-2 rounded-full border border-gray-300 bg-white px-4 transition-colors hover:border-gray-400">
                <VolumeUpOutlinedIcon sx={{ fontSize: 20, }} />

                  <span className="flex-1 truncate text-sm font-medium text-gray-800">
                    Default
                  </span>

                  <svg
                    className="h-4 w-4 text-gray-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>

                <div className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 hover:border-gray-400 transition-colors">
                  <VideocamOutlinedIcon
                    sx={{ fontSize: 20, }}
                  />

                  <select
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    className="
                      bg-transparent
                      text-sm
                      text-gray-800
                      outline-none
                      cursor-pointer
                      w-[140px]
                      appearance-none
                      truncate
                    "
                  >
                    {deviceList.cameras.length === 0 && (
                      <option>Tidak ada kamera</option>
                    )}

                    {deviceList.cameras.map((cam) => (
                      <option key={cam.deviceId} value={cam.deviceId}>
                        {cam.label || `Camera ${cam.deviceId.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>

                  <svg
                    className="h-4 w-4 text-gray-500 pointer-events-none"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            )}

            <p className="text-center text-gray-500 text-sm mt-4">
              {hasPermission ? 'Kamera dan mikrofon siap' : 'Nyalakan kamera untuk bergabung'}
            </p>
          </div>
          <div className="mb-20 flex flex-col items-center justify-center w-full max-w-sm mx-auto">
            <div className="text-center">
              <h2 className="text-4xl tracking-tight text-black-100">Siap bergabung?</h2>
              <p className="mt-2 text-sm text-gray-500">Room: <span className='font-bold text-black'>{roomId}</span></p>
            </div>

            {error && (
              <div className="mt-6 w-full rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {waitingApproval && (
              <div className="mt-6 flex flex-col items-center justify-center">
                <LoaderCircle className="h-10 w-10 animate-spin text-blue-500" />
                <p className="mt-4 text-sm font-medium text-black-400">
                  Menunggu persetujuan host...
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Kamu akan masuk secara otomatis setelah host menyetujui.
                </p>
              </div>
            )}

            {!user && (
              <div className="mt-6 w-full text-left">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Anda</label>
                <input
                  type="text"
                  value={customGuestName}
                  onChange={(e) => setCustomGuestName(e.target.value)}
                  placeholder="Masukkan nama Anda..."
                  className="w-full px-4 py-3 rounded-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm outline-none transition"
                />
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={!hasPermission || joining || waitingApproval}
              className="mt-6 h-14 w-[15rem] rounded-full bg-blue-600 text-base font-semibold text-white transition-colors duration-200 hover:bg-blue-500 active:bg-blue-600 disabled:bg-[#1c1c1e] disabled:text-gray-600 disabled:cursor-not-allowed cursor-pointer"
            >
              {joining ? 'Mengirim...' : waitingApproval ? 'Menunggu...' : 'Gabung sekarang'}
            </button>

            {!hasPermission && !isStarting && (
              <p className="mt-4 text-center text-sm text-amber-500">
                Nyalakan kamera terlebih dahulu untuk bergabung
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}