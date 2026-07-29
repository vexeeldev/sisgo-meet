'use client';

import Image from 'next/image';
import Link from 'next/link';

interface LobbyNavbarProps {
  currentTime: Date | null;
  user: any;
}

export default function LobbyNavbar({ currentTime, user }: LobbyNavbarProps) {
  return (
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
  );
}
