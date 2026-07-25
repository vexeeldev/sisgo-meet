"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface Room {
  uuid?: string;
  room_name?: string;
  room_code: string;
  is_active?: boolean;
  notes?: string;
  created_at?: string;
}

function generateRoomCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const rand = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${rand(3)}-${rand(4)}-${rand(3)}`;
}

const ROOMS_KEY = "sisgo_my_rooms";

function saveRoomLocal(room: Room) {
  try {
    const existing = JSON.parse(localStorage.getItem(ROOMS_KEY) || "[]") as Room[];
    const updated = [room, ...existing.filter((r) => r.room_code !== room.room_code)];
    localStorage.setItem(ROOMS_KEY, JSON.stringify(updated));
  } catch { }
}

function getRoomsLocal(): Room[] {
  try {
    return JSON.parse(localStorage.getItem(ROOMS_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function MeetingHomePage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [createdRoom, setCreatedRoom] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showScheduleTypeModal, setShowScheduleTypeModal] = useState(false);
  const [selectedScheduleType, setSelectedScheduleType] = useState<'private' | 'anyone' | 'interview'>('private');

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      // Coba ambil dari backend (admin bisa lihat semua, user biasa dari local)
      const result = await api.listRooms();
      if (result.success && result.rooms?.length > 0) {
        setRooms(result.rooms);
      } else {
        // Fallback: tampilkan dari localStorage
        setRooms(getRoomsLocal());
      }
    } catch {
      setRooms(getRoomsLocal());
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get('token');
        if (urlToken) {
          localStorage.setItem('token', urlToken);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const currentUser = api.getCurrentUser();
      if (!currentUser || !api.isAdmin()) {
        api.logout();
        router.push("/auth/login");
        return;
      }

      setUser(currentUser);
      setIsLoading(false);
      fetchRooms();
    };

    checkAuth();
  }, [router]);

  // 🔥 Create Meeting via API
  const handleNewMeeting = async (roomType: string = 'private') => {
    setIsCreating(true);
    setError(null);
    try {
      const typeLabel = roomType === 'interview' ? 'Interview' : roomType === 'anyone' ? 'Publik' : 'Private';
      const result = await api.createInterview({
        title: `Rapat ${typeLabel} ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}`,
        scheduled_at: new Date().toISOString(),
        room_type: roomType,
      });

      if (result.success && result.data?.room_name) {
        const roomCode = result.data.room_name; // room_code dari backend
        const newRoom: Room = {
          uuid: result.room?.uuid,
          room_code: roomCode,
          room_name: result.room?.room_name,
          is_active: true,
          created_at: new Date().toISOString(),
        };
        setCreatedRoom(roomCode);
        saveRoomLocal(newRoom);
        setRooms((prev) => [newRoom, ...prev.filter((r) => r.room_code !== roomCode)]);
      } else {
        // Fallback: generate random
        const fallbackCode = generateRoomCode();
        setCreatedRoom(fallbackCode);
        setError(result?.message || "Gagal membuat meeting, menggunakan kode lokal");
      }
    } catch (error: any) {
      console.error("Failed to create meeting:", error);
      const fallbackCode = generateRoomCode();
      setCreatedRoom(fallbackCode);
      setError(error?.message || "Gagal membuat meeting");
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartInstantMeeting = async (roomType: string = 'private') => {
    setShowDropdown(false);
    setIsCreating(true);
    setError(null);
    try {
      const typeLabel = roomType === 'interview' ? 'Interview' : roomType === 'anyone' ? 'Publik' : 'Private';
      const result = await api.createInterview({
        title: `Rapat Instan ${typeLabel} ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}`,
        scheduled_at: new Date().toISOString(),
        room_type: roomType,
      });
      if (result.success && result.data?.room_name) {
        const roomCode = result.data.room_name;
        const newRoom: Room = {
          uuid: result.room?.uuid,
          room_code: roomCode,
          room_name: result.room?.room_name,
          is_active: true,
          created_at: new Date().toISOString(),
        };
        saveRoomLocal(newRoom);
        router.push(`/${roomCode}`);
      } else {
        const fallbackCode = generateRoomCode();
        router.push(`/${fallbackCode}`);
      }
    } catch (error: any) {
      console.error("Failed to create instant meeting:", error);
      const fallbackCode = generateRoomCode();
      router.push(`/${fallbackCode}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Biarkan URL utuh jika user paste link
    if (val.includes('http') || val.includes('/')) {
      setJoinCode(val);
      return;
    }

    // Format menjadi xxx-xxxx-xxx
    val = val.toLowerCase().replace(/[^a-z0-9]/g, '');
    let formatted = val;
    if (val.length > 3 && val.length <= 7) {
      formatted = `${val.slice(0, 3)}-${val.slice(3)}`;
    } else if (val.length > 7) {
      formatted = `${val.slice(0, 3)}-${val.slice(3, 7)}-${val.slice(7, 10)}`;
    }
    
    setJoinCode(formatted);
  };

  // 🔥 Join Meeting
  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim();
    if (!code) return;
    router.push(`/${code}`);
  };

  const handleCopy = async (code: string) => {
    const link = `${window.location.origin}/${code}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      prompt("Salin link ini:", link);
    }
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleLogout = () => {
    api.logout();
    router.push("/auth/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative bg-white overflow-hidden">
      {/* Navbar */}
      <nav className="w-full bg-white relative z-10">
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
              <button
                onClick={handleLogout}
                className="cursor-pointer text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-slate-100"
                title="Logout"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 lg:h-6 lg:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-32 sm:pt-40 pb-24">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-[44px] text-[#1f1f1f] leading-[1.2] mb-4 font-normal tracking-tight">
            Rapat dan panggilan video <br className="hidden sm:block" /> untuk semua orang
          </h1>
          <p className="text-[#444746] mt-4 text-[17px] sm:text-[19px] font-normal leading-relaxed">
            Terhubung, berkolaborasi, dan merayakan dari mana saja <br className="hidden sm:block" /> dengan <span style={{ fontFamily: 'var(--font-neighbor)' }} className="text-xl sm:text-2xl mx-1 text-black">Sisgo</span> Meet
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10 relative">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={isCreating}
              className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-full bg-[#0b57d0] hover:bg-[#0b57d0]/90 transition-colors text-white text-[15px] font-medium px-5 py-3 h-[48px] min-w-[145px] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Membuat...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Rapat baru
                </>
              )}
            </button>

            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowDropdown(false)}
                ></div>
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-gray-100 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                  <div className="px-4 py-1.5 text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider">Mulai Rapat Instan</div>
                  
                  <button
                    onClick={() => handleStartInstantMeeting('private')}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#f1f3f4] flex items-center justify-between text-[14px] font-normal text-[#1f1f1f] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-[#5f6368]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="font-medium text-[#202124]">Rapat Private</span>
                    </div>
                    <span className="text-[11px] text-[#5f6368] bg-[#f1f3f4] px-2.5 py-0.5 rounded-full font-medium">Izin Host</span>
                  </button>

                  <button
                    onClick={() => handleStartInstantMeeting('anyone')}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#f1f3f4] flex items-center justify-between text-[14px] font-normal text-[#1f1f1f] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-[#5f6368]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium text-[#202124]">Rapat Terbuka</span>
                    </div>
                    <span className="text-[11px] text-[#5f6368] bg-[#f1f3f4] px-2.5 py-0.5 rounded-full font-medium">Langsung Masuk</span>
                  </button>

                  <button
                    onClick={() => handleStartInstantMeeting('interview')}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#f1f3f4] flex items-center justify-between text-[14px] font-normal text-[#1f1f1f] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-[#5f6368]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium text-[#202124]">Rapat Khusus Interview</span>
                    </div>
                    <span className="text-[11px] text-[#5f6368] bg-[#f1f3f4] px-2.5 py-0.5 rounded-full font-medium">Cam/Mic Lock</span>
                  </button>

                  <div className="my-1.5 border-t border-gray-100" />
                  <div className="px-4 py-1 text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider">Buat Link Nanti</div>

                  <button
                    onClick={() => { setShowDropdown(false); setShowScheduleTypeModal(true); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#f1f3f4] flex items-center gap-3 text-[14px] font-normal text-[#1f1f1f] cursor-pointer transition-colors"
                  >
                    <svg className="w-5 h-5 text-[#5f6368]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span className="font-medium text-[#202124]">Buat link rapat untuk nanti</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <form onSubmit={handleJoin} className="flex gap-2 items-center">
            <div className="relative bg-white rounded-[10px]">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#444746] z-10 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M10 18h4" />
                </svg>
              </span>
              {/* Custom Styled Placeholder for Focus State */}
              {isInputFocused && !joinCode.includes('http') && !joinCode.includes('/') && joinCode.length < 12 && (
                <div className="absolute inset-y-0 left-10 flex items-center pointer-events-none select-none text-[15px] z-10 overflow-hidden whitespace-pre">
                  <span className="text-transparent">{joinCode}</span>
                  {"aaa-bbbb-ccc".split('').slice(joinCode.length).map((char, i) => {
                    const globalIndex = joinCode.length + i;
                    if (char === '-') {
                      return <span key={globalIndex} className="font-bold text-[#444746] mx-[1px]">-</span>;
                    }
                    return <span key={globalIndex} className="text-[#444746]/50">{char}</span>;
                  })}
                </div>
              )}
              
              <input
                type="text"
                value={joinCode}
                onChange={handleJoinCodeChange}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                maxLength={40}
                placeholder={isInputFocused ? "" : "Masukkan kode atau link"}
                className="w-full sm:w-[260px] h-12 rounded-[10px] border border-[#747775] pl-10 pr-4 text-[15px] text-[#1f1f1f] placeholder:text-[#444746] focus:outline-none focus:border-[#0b57d0] focus:ring-1 focus:ring-[#0b57d0] transition-colors bg-transparent relative z-20"
              />
            </div>
            <button
              type="submit"
              disabled={!joinCode.trim()}
              className="cursor-pointer rounded-md px-4 py-2 h-10 text-[15px] font-medium text-[#0b57d0] hover:bg-[#f3f7fe] disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
            >
              Gabung
            </button>
          </form>
        </div>

        {/* Modal Pilih Tipe Rapat Untuk Nanti */}
        {showScheduleTypeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
            <div className="bg-white rounded-3xl p-6 w-full max-w-[440px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 relative pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setShowScheduleTypeModal(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer p-1 rounded-full hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h3 className="text-xl font-medium text-[#202124] mb-1 pr-6 tracking-tight">
                Pilih Tipe Akses Rapat
              </h3>
              <p className="text-[13px] text-[#5f6368] mb-5">
                Tentukan bagaimana peserta akan bergabung ke ruangan rapat ini:
              </p>

              <div className="space-y-2.5 mb-6">
                {/* Option 1: Private */}
                <div
                  onClick={() => setSelectedScheduleType('private')}
                  className={`flex items-start gap-3.5 p-4 rounded-2xl cursor-pointer transition-all ${
                    selectedScheduleType === 'private'
                      ? 'bg-[#e8f0fe] border border-[#1a73e8]'
                      : 'bg-[#f8f9fa] hover:bg-[#f1f3f4] border border-transparent'
                  }`}
                >
                  <div className={`p-2 rounded-xl mt-0.5 ${selectedScheduleType === 'private' ? 'bg-[#1a73e8] text-white' : 'bg-white text-[#5f6368] shadow-sm'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] font-medium text-[#202124]">Rapat Private</span>
                      <span className="text-[11px] text-[#5f6368] bg-white px-2.5 py-0.5 rounded-full font-medium shadow-2xs">Standard</span>
                    </div>
                    <p className="text-[12px] text-[#5f6368] mt-1 leading-relaxed">Peserta/Guest wajib menunggu izin persetujuan dari Host untuk dapat bergabung.</p>
                  </div>
                </div>

                {/* Option 2: Anyone */}
                <div
                  onClick={() => setSelectedScheduleType('anyone')}
                  className={`flex items-start gap-3.5 p-4 rounded-2xl cursor-pointer transition-all ${
                    selectedScheduleType === 'anyone'
                      ? 'bg-[#e8f0fe] border border-[#1a73e8]'
                      : 'bg-[#f8f9fa] hover:bg-[#f1f3f4] border border-transparent'
                  }`}
                >
                  <div className={`p-2 rounded-xl mt-0.5 ${selectedScheduleType === 'anyone' ? 'bg-[#1a73e8] text-white' : 'bg-white text-[#5f6368] shadow-sm'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] font-medium text-[#202124]">Rapat Terbuka</span>
                      <span className="text-[11px] text-[#5f6368] bg-white px-2.5 py-0.5 rounded-full font-medium shadow-2xs">Bebas Join</span>
                    </div>
                    <p className="text-[12px] text-[#5f6368] mt-1 leading-relaxed">Siapa saja yang memiliki link rapat langsung otomatis masuk tanpa antrean.</p>
                  </div>
                </div>

                {/* Option 3: Interview */}
                <div
                  onClick={() => setSelectedScheduleType('interview')}
                  className={`flex items-start gap-3.5 p-4 rounded-2xl cursor-pointer transition-all ${
                    selectedScheduleType === 'interview'
                      ? 'bg-[#e8f0fe] border border-[#1a73e8]'
                      : 'bg-[#f8f9fa] hover:bg-[#f1f3f4] border border-transparent'
                  }`}
                >
                  <div className={`p-2 rounded-xl mt-0.5 ${selectedScheduleType === 'interview' ? 'bg-[#1a73e8] text-white' : 'bg-white text-[#5f6368] shadow-sm'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] font-medium text-[#202124]">Khusus Interview</span>
                      <span className="text-[11px] text-[#5f6368] bg-white px-2.5 py-0.5 rounded-full font-medium shadow-2xs">Cam/Mic Lock</span>
                    </div>
                    <p className="text-[12px] text-[#5f6368] mt-1 leading-relaxed">Membutuhkan izin Host. Kamera & Mic peserta wajib menyala dan terkunci.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleTypeModal(false)}
                  className="px-5 py-2.5 text-[14px] text-[#5f6368] hover:bg-[#f1f3f4] rounded-full transition font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowScheduleTypeModal(false);
                    handleNewMeeting(selectedScheduleType);
                  }}
                  className="px-6 py-2.5 text-[14px] text-white bg-[#0b57d0] hover:bg-[#0b57d0]/90 rounded-full transition font-medium shadow-sm cursor-pointer"
                >
                  Buat Link Rapat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Room Baru */}
        {createdRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-lg p-6 w-[360px] shadow-[0_4px_24px_rgba(0,0,0,0.15)] border border-gray-100 relative pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setCreatedRoom(null)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h3 className="text-lg font-medium text-[#1f1f1f] mb-2 pr-6">
                Berikut info akses Anda
              </h3>

              <p className="text-[14px] text-[#444746] mb-5 leading-relaxed">
                Kirimkan link ini kepada orang yang ingin diajak rapat. Pastikan untuk menyimpannya agar Anda juga dapat menggunakannya nanti.
              </p>

              <div className="flex items-center gap-2 bg-[#f1f3f4] hover:bg-[#e8eaed] transition-colors p-1.5 pl-3 rounded-md">
                <p className="flex-1 text-[14px] font-medium text-[#1f1f1f] truncate select-all">
                  {typeof window !== 'undefined' ? window.location.host : ''}/{createdRoom}
                </p>
                <button
                  onClick={() => handleCopy(createdRoom)}
                  className="p-2 text-gray-600 hover:bg-gray-300/50 rounded-full transition-colors cursor-pointer"
                  title="Salin link"
                >
                  {copied === createdRoom ? (
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
}