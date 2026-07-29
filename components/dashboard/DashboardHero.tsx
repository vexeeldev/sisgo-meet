'use client';

interface DashboardHeroProps {
  error: string | null;
  isCreating: boolean;
  showDropdown: boolean;
  setShowDropdown: (show: boolean) => void;
  onStartInstantMeeting: (type: string) => void;
  onOpenScheduleModal: () => void;
  joinCode: string;
  onJoinCodeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isInputFocused: boolean;
  setIsInputFocused: (focused: boolean) => void;
  onJoin: (e: React.FormEvent) => void;
}

export default function DashboardHero({
  error,
  isCreating,
  showDropdown,
  setShowDropdown,
  onStartInstantMeeting,
  onOpenScheduleModal,
  joinCode,
  onJoinCodeChange,
  isInputFocused,
  setIsInputFocused,
  onJoin,
}: DashboardHeroProps) {
  return (
    <>
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl lg:text-[44px] text-[#1f1f1f] leading-[1.2] mb-4 font-normal tracking-tight">
          Rapat dan panggilan video <br className="hidden sm:block" /> untuk semua orang
        </h1>
        <p className="text-[#444746] mt-4 text-[17px] sm:text-[19px] font-normal leading-relaxed">
          Terhubung, berkolaborasi, dan merayakan dari mana saja <br className="hidden sm:block" /> dengan{' '}
          <span style={{ fontFamily: 'var(--font-neighbor)' }} className="text-xl sm:text-2xl mx-1 text-black">
            Sisgo
          </span>{' '}
          Meet
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
          {error}
        </div>
      )}

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
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
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
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}></div>
              <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-gray-100 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                <div className="px-4 py-1.5 text-[11px] font-semibold text-[#5f6368] uppercase tracking-wider">Mulai Rapat Instan</div>

                <button
                  onClick={() => onStartInstantMeeting('private')}
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
                  onClick={() => onStartInstantMeeting('anyone')}
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
                  onClick={() => onStartInstantMeeting('interview')}
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
                  onClick={onOpenScheduleModal}
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

        <form onSubmit={onJoin} className="flex gap-2 items-center">
          <div className="relative bg-white rounded-[10px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#444746] z-10 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M10 18h4" />
              </svg>
            </span>
            {isInputFocused && !joinCode.includes('http') && !joinCode.includes('/') && joinCode.length < 12 && (
              <div className="absolute inset-y-0 left-10 flex items-center pointer-events-none select-none text-[15px] z-10 overflow-hidden whitespace-pre">
                <span className="text-transparent">{joinCode}</span>
                {'aaa-bbbb-ccc'.split('').slice(joinCode.length).map((char, i) => {
                  const globalIndex = joinCode.length + i;
                  if (char === '-') {
                    return (
                      <span key={globalIndex} className="font-bold text-[#444746] mx-[1px]">
                        -
                      </span>
                    );
                  }
                  return (
                    <span key={globalIndex} className="text-[#444746]/50">
                      {char}
                    </span>
                  );
                })}
              </div>
            )}

            <input
              type="text"
              value={joinCode}
              onChange={onJoinCodeChange}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              maxLength={40}
              placeholder={isInputFocused ? '' : 'Masukkan kode atau link'}
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
    </>
  );
}
