'use client';

import { LoaderCircle, UserX } from 'lucide-react';
import VirtualBackgroundPanel from '../VirtualBackgroundPanel';
import ChatPopup from '../ChatPopup';
import { VirtualBackgroundMode } from '@/lib/virtual-background';

interface MeetingSidebarProps {
  showChat: boolean;
  showParticipants: boolean;
  showRequests: boolean;
  showBgPanel: boolean;
  isHost: boolean;
  joinRequests: any[];
  participants: any[];
  participantName: string;
  participantDetails: Record<string, any>;
  chatMessages: any[];
  processingJoin: Record<string, boolean>;
  virtualBgMode: VirtualBackgroundMode;
  virtualBgImage: string | null;
  localStream: MediaStream | null;
  isVideoOff?: boolean;
  setShowChat: (val: boolean) => void;
  setShowParticipants: (val: boolean) => void;
  setShowRequests: (val: boolean) => void;
  setShowBgPanel: (val: boolean) => void;
  handleSendMessage: (msg: string) => void;
  handleKickParticipant: (connId: string) => void;
  handleApproveJoin: (uuid: string) => void;
  handleRejectJoin: (uuid: string) => void;
  handleChangeVirtualBg: (mode: VirtualBackgroundMode, image?: string) => void | Promise<void>;
  stringToColor: (str: string) => string;
}

export default function MeetingSidebar({
  showChat,
  showParticipants,
  showRequests,
  showBgPanel,
  isHost,
  joinRequests,
  participants,
  participantName,
  participantDetails,
  chatMessages,
  processingJoin,
  virtualBgMode,
  virtualBgImage,
  localStream,
  isVideoOff,
  setShowChat,
  setShowParticipants,
  setShowRequests,
  setShowBgPanel,
  handleSendMessage,
  handleKickParticipant,
  handleApproveJoin,
  handleRejectJoin,
  handleChangeVirtualBg,
  stringToColor,
}: MeetingSidebarProps) {
  return (
    <div className="fixed inset-0 sm:relative sm:inset-auto sm:w-[320px] md:w-[360px] h-full bg-[#17181a] sm:rounded-2xl overflow-hidden flex flex-col shadow-2xl z-20 sm:z-auto animate-sidebar-entry">
      <style>{`
        @keyframes slideInSidebar {
          from {
            transform: translateX(30px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-sidebar-entry {
          animation: slideInSidebar 0.28s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
      {showBgPanel ? (
        <VirtualBackgroundPanel
          mode={virtualBgMode}
          activeImage={virtualBgImage}
          onChange={handleChangeVirtualBg}
          onClose={() => setShowBgPanel(false)}
          localStream={localStream}
          isVideoOff={isVideoOff}
          participantName={participantName.includes('(Anda)') ? participantName : `${participantName} (Anda)`}
        />
      ) : (
        <>
          {/* Header with Tab Switcher */}
          <div className="flex items-center justify-between px-4 pt-3 pb-0 flex-shrink-0">
            <div className="flex gap-1 overflow-x-auto no-scrollbar">
              {isHost && joinRequests.length > 0 && (
                <button
                  onClick={() => {
                    setShowRequests(true);
                    setShowChat(false);
                    setShowParticipants(false);
                    setShowBgPanel(false);
                  }}
                  className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors relative whitespace-nowrap ${
                    showRequests
                      ? 'text-[#8ab4f8] after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[3px] after:bg-[#8ab4f8] after:rounded-t-full'
                      : 'text-[#9aa0a6] hover:text-[#e8eaed]'
                  }`}
                >
                  Requests ({joinRequests.length})
                </button>
              )}
              <button
                onClick={() => {
                  setShowParticipants(true);
                  setShowChat(false);
                  setShowRequests(false);
                  setShowBgPanel(false);
                }}
                className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors relative whitespace-nowrap ${
                  showParticipants
                    ? 'text-[#8ab4f8] after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[3px] after:bg-[#8ab4f8] after:rounded-t-full'
                    : 'text-[#9aa0a6] hover:text-[#e8eaed]'
                }`}
              >
                People {participants.length > 0 && `(${participants.length + 1})`}
              </button>
              <button
                onClick={() => {
                  setShowChat(true);
                  setShowParticipants(false);
                  setShowRequests(false);
                  setShowBgPanel(false);
                }}
                className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors relative whitespace-nowrap ${
                  showChat
                    ? 'text-[#8ab4f8] after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[3px] after:bg-[#8ab4f8] after:rounded-t-full'
                    : 'text-[#9aa0a6] hover:text-[#e8eaed]'
                }`}
              >
                Chat
              </button>
            </div>
            <button
              onClick={() => {
                setShowChat(false);
                setShowParticipants(false);
                setShowRequests(false);
              }}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#3c3c3c] text-[#9aa0a6] hover:text-[#e8eaed] transition-colors mb-1 ml-2 flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto min-h-0 register-scrollbar">
            {showRequests && (
              <div className="p-3 space-y-2">
                <p className="text-[11px] font-semibold text-[#9aa0a6] uppercase tracking-wider px-3 pt-2 pb-1">
                  Menunggu untuk bergabung
                </p>
                {joinRequests.map((req, i) => {
                  const isLoading = processingJoin[req.participant_uuid];
                  return (
                    <div key={i} className="flex flex-col p-3 bg-[#3c3c3c] rounded-xl gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                          style={{ backgroundColor: stringToColor(req.name) }}
                        >
                          {req.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{req.name}</p>
                          <p className="text-[11px] text-[#9aa0a6] truncate">Meminta untuk bergabung</p>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full">
                        <button
                          onClick={() => handleRejectJoin(req.participant_uuid)}
                          disabled={isLoading}
                          className="flex-1 py-1.5 text-sm font-medium text-[#8ab4f8] hover:bg-[#8ab4f8]/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Tolak
                        </button>
                        <button
                          onClick={() => handleApproveJoin(req.participant_uuid)}
                          disabled={isLoading}
                          className="flex-1 py-1.5 text-sm font-medium bg-[#8ab4f8] text-[#202124] hover:bg-[#aecbfa] rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {isLoading ? (
                            <LoaderCircle className="w-4 h-4 animate-spin text-[#202124]" />
                          ) : (
                            'Izinkan'
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {joinRequests.length === 0 && (
                  <div className="text-center py-8 text-sm text-[#9aa0a6]">
                    Tidak ada yang menunggu untuk bergabung
                  </div>
                )}
              </div>
            )}
            {showChat && (
              <div className="h-full">
                <ChatPopup
                  isOpen={showChat}
                  onClose={() => setShowChat(false)}
                  messages={chatMessages}
                  onSendMessage={handleSendMessage}
                  participantName={participantName}
                />
              </div>
            )}
            {showParticipants && (
              <div className="p-3 space-y-0.5">
                <p className="text-[11px] font-semibold text-[#9aa0a6] uppercase tracking-wider px-3 pt-2 pb-1">
                  In this call ({participants.length + 1})
                </p>
                {/* Host / You */}
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#3c3c3c] transition-colors group">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                    style={{ backgroundColor: stringToColor(participantName) }}
                  >
                    {participantName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#e8eaed] truncate">{participantName}</p>
                    <p className="text-[11px] text-[#9aa0a6]">Anda {isHost ? '· Host' : ''}</p>
                  </div>
                  <svg
                    className="w-4 h-4 text-[#9aa0a6] opacity-0 group-hover:opacity-100 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </div>
                {/* Remote participants */}
                {participants.map((connId, i) => {
                  const detail = participantDetails[connId];
                  const name = detail?.name || `Participant ${i + 1}`;
                  const role = detail?.role || 'candidate';
                  const isRemoteHost = role === 'interviewer';

                  return (
                    <div
                      key={connId}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#3c3c3c] transition-colors group"
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                        style={{ backgroundColor: stringToColor(name) }}
                      >
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#e8eaed] truncate">{name}</p>
                        {isRemoteHost && <p className="text-[11px] text-[#9aa0a6]">Host</p>}
                      </div>
                      {isHost && !isRemoteHost && (
                        <button
                          onClick={() => handleKickParticipant(connId)}
                          className="p-1.5 text-[#9aa0a6] hover:text-red-500 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                          title="Keluarkan peserta"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}