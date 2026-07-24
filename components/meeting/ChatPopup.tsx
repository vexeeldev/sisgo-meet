'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface Message {
  id: string;
  name: string;
  message: string;
  time: string;
}

interface ChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onSendMessage: (message: string) => void;
  participantName: string;
}

/** Warna avatar konsisten per nama */
function nameToColor(str: string): string {
  const colors = [
    '#1a73e8', '#0f9d58', '#f29900', '#d93025',
    '#7627bb', '#00897b', '#e37400', '#c2185b',
    '#1565c0', '#2e7d32',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function ChatPopup({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  participantName,
}: ChatPopupProps) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (newMessage.trim()) {
        onSendMessage(newMessage.trim());
        setNewMessage('');
      }
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-transparent">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin scrollbar-thumb-[#5f6368] scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
            <div className="w-14 h-14 rounded-full bg-[#3c3c3c] flex items-center justify-center">
              <svg className="w-7 h-7 text-[#9aa0a6]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              </svg>
            </div>
            <p className="text-[#9aa0a6] text-sm text-center">
              Messages sent here will be<br/>seen by everyone in this call
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isOwn = msg.name === participantName;
              const prevMsg = messages[idx - 1];
              const isGrouped = prevMsg && prevMsg.name === msg.name;

              return (
                <div key={msg.id} className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar — only show for first of group */}
                  {!isGrouped ? (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mt-0.5 self-start"
                      style={{ backgroundColor: nameToColor(msg.name) }}
                    >
                      {msg.name.charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    <div className="w-8 flex-shrink-0" />
                  )}

                  <div className={`flex flex-col max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
                    {/* Sender name */}
                    {!isGrouped && (
                      <span className={`text-[11px] font-medium mb-1 ${isOwn ? 'text-[#9aa0a6]' : 'text-[#a8c7fa]'}`}>
                        {isOwn ? 'You' : msg.name}
                      </span>
                    )}

                    {/* Bubble */}
                    <div
                      className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                        isOwn
                          ? 'bg-[#c2e7ff] text-[#001d35] rounded-tr-sm'
                          : 'bg-[#3c3c3c] text-[#e8eaed] rounded-tl-sm'
                      }`}
                    >
                      {msg.message}
                    </div>

                    {/* Timestamp */}
                    <span className="text-[10px] text-[#9aa0a6] mt-1 px-1">{msg.time}</span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area — no divider/border, seamless with messages area like Google Meet */}
      <div className="flex-shrink-0 px-3 py-3">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1 bg-[#3c3c3c] rounded-2xl px-4 py-2.5 flex items-end gap-2 focus-within:ring-1 focus-within:ring-[#8ab4f8]/40 transition-all">
            <textarea
              ref={inputRef}
              rows={1}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                // auto-resize
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
              }}
              onKeyDown={handleKeyDown}
              placeholder="Send a message"
              className="flex-1 bg-transparent text-[#e8eaed] text-sm focus:outline-none resize-none placeholder-[#9aa0a6] leading-5 max-h-[100px]"
              style={{ height: '20px' }}
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all flex-shrink-0 ${
              newMessage.trim()
                ? 'bg-[#8ab4f8] hover:bg-[#a8c7fa] text-[#001d35]'
                : 'bg-[#3c3c3c] text-[#5f6368] cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-[#9aa0a6] text-center mt-2">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}