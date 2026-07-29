'use client';

import { LoaderCircle } from "lucide-react";

interface LobbyJoinCardProps {
  roomId: string;
  user: any;
  customGuestName: string;
  setCustomGuestName: (name: string) => void;
  error: string;
  joining: boolean;
  waitingApproval: boolean;
  hasPermission: boolean;
  isStarting: boolean;
  onJoin: () => void;
}

export default function LobbyJoinCard({
  roomId,
  user,
  customGuestName,
  setCustomGuestName,
  error,
  joining,
  waitingApproval,
  hasPermission,
  isStarting,
  onJoin,
}: LobbyJoinCardProps) {
  return (
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
        onClick={onJoin}
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
  );
}
