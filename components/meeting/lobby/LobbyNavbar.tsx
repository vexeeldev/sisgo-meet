'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api-new';

interface LobbyNavbarProps {
  currentTime: Date | null;
  user: any;
}

export default function LobbyNavbar({ currentTime, user }: LobbyNavbarProps) {
  const [hasAuthToken, setHasAuthToken] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      setHasAuthToken(!!token);
    }
  }, [user]);

  const handleLogout = async () => {
    await api.logout();
    window.location.reload();
  };

  return (
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
            {currentTime
              ? currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':')
              : ''}{' '}
            •{' '}
            {currentTime
              ? currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })
              : ''}
          </span>
          <span className="text-sm font-medium text-slate-700 hidden sm:block">
            {user?.name || user?.email || user?.Email || ''}
          </span>
          <div className="flex items-center gap-2">
            {hasAuthToken ? (
              <>
                <span className="h-8 w-8 lg:h-10 lg:w-10 rounded-full bg-primary-blue flex items-center justify-center text-white text-xs lg:text-sm font-semibold shadow-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : user?.username?.charAt(0).toUpperCase() || 'U'}
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
              </>
            ) : (
              <Link
                href={`/auth/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '')}`}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary-blue hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-xs"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
