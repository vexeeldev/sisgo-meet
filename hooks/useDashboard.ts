'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export interface Room {
  uuid?: string;
  room_name?: string;
  room_code: string;
  is_active?: boolean;
  notes?: string;
  created_at?: string;
}

function generateRoomCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const rand = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${rand(3)}-${rand(4)}-${rand(3)}`;
}

const ROOMS_KEY = 'sisgo_my_rooms';

function saveRoomLocal(room: Room) {
  try {
    const existing = JSON.parse(localStorage.getItem(ROOMS_KEY) || '[]') as Room[];
    const updated = [room, ...existing.filter((r) => r.room_code !== room.room_code)];
    localStorage.setItem(ROOMS_KEY, JSON.stringify(updated));
  } catch {}
}

function getRoomsLocal(): Room[] {
  try {
    return JSON.parse(localStorage.getItem(ROOMS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function useDashboard() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
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
      const result = await api.listRooms();
      if (result.success && result.rooms?.length > 0) {
        setRooms(result.rooms);
      } else {
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

      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      let currentUser = api.getCurrentUser();
      if (!currentUser) {
        try {
          const profileRes = await api.getMe();
          if (profileRes.success && profileRes.data) {
            currentUser = profileRes.data;
          }
        } catch (err) {
          console.error('Error fetching me:', err);
        }
      }

      if (!currentUser || !api.isAdmin()) {
        api.logout();
        router.push('/auth/login');
        return;
      }

      setUser(currentUser);
      setIsLoading(false);
      fetchRooms();
    };

    checkAuth();
  }, [router]);

  const handleNewMeeting = async (roomType: string = 'private') => {
    setIsCreating(true);
    setError(null);
    try {
      const typeLabel = roomType === 'interview' ? 'Interview' : roomType === 'anyone' ? 'Publik' : 'Private';
      const result = await api.createInterview({
        title: `Rapat ${typeLabel} ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}`,
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
        setCreatedRoom(roomCode);
        saveRoomLocal(newRoom);
        setRooms((prev) => [newRoom, ...prev.filter((r) => r.room_code !== roomCode)]);
      } else {
        const fallbackCode = generateRoomCode();
        setCreatedRoom(fallbackCode);
        setError(result?.message || 'Gagal membuat meeting, menggunakan kode lokal');
      }
    } catch (error: any) {
      console.error('Failed to create meeting:', error);
      const fallbackCode = generateRoomCode();
      setCreatedRoom(fallbackCode);
      setError(error?.message || 'Gagal membuat meeting');
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
        title: `Rapat Instan ${typeLabel} ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}`,
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
      console.error('Failed to create instant meeting:', error);
      const fallbackCode = generateRoomCode();
      router.push(`/${fallbackCode}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val.includes('http') || val.includes('/')) {
      setJoinCode(val);
      return;
    }

    val = val.toLowerCase().replace(/[^a-z0-9]/g, '');
    let formatted = val;
    if (val.length > 3 && val.length <= 7) {
      formatted = `${val.slice(0, 3)}-${val.slice(3)}`;
    } else if (val.length > 7) {
      formatted = `${val.slice(0, 3)}-${val.slice(3, 7)}-${val.slice(7, 10)}`;
    }

    setJoinCode(formatted);
  };

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
      prompt('Salin link ini:', link);
    }
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleLogout = () => {
    api.logout();
    router.push('/auth/login');
  };

  return {
    joinCode,
    createdRoom,
    setCreatedRoom,
    copied,
    user,
    isLoading,
    isCreating,
    error,
    rooms,
    loadingRooms,
    currentTime,
    showDropdown,
    setShowDropdown,
    isInputFocused,
    setIsInputFocused,
    showScheduleTypeModal,
    setShowScheduleTypeModal,
    selectedScheduleType,
    setSelectedScheduleType,
    handleNewMeeting,
    handleStartInstantMeeting,
    handleJoinCodeChange,
    handleJoin,
    handleCopy,
    handleLogout,
  };
}
