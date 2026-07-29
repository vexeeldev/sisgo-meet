'use client';

import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import MicOutlinedIcon from "@mui/icons-material/MicOutlined";
import VolumeUpOutlinedIcon from "@mui/icons-material/VolumeUpOutlined";

interface LobbyPreviewProps {
  roomType: string;
  hasPermission: boolean;
  localStream: MediaStream | null;
  isCameraOn: boolean;
  isMicOn: boolean;
  isStarting: boolean;
  user: any;
  isInterviewLocked: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  audioBarRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onStartCamera: () => void;
  deviceList: { cameras: MediaDeviceInfo[]; mics: MediaDeviceInfo[] };
  speakers: MediaDeviceInfo[];
  selectedCamera: string;
  selectedMic: string;
  selectedSpeaker: string;
  onSwitchCamera: (deviceId: string) => void;
  onSwitchMic: (deviceId: string) => void;
  onSwitchSpeaker: (deviceId: string) => void;
}

export default function LobbyPreview({
  roomType,
  hasPermission,
  localStream,
  isCameraOn,
  isMicOn,
  isStarting,
  user,
  isInterviewLocked,
  videoRef,
  audioBarRefs,
  onToggleCamera,
  onToggleMic,
  onStartCamera,
  deviceList,
  speakers,
  selectedCamera,
  selectedMic,
  selectedSpeaker,
  onSwitchCamera,
  onSwitchMic,
  onSwitchSpeaker,
}: LobbyPreviewProps) {
  return (
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
              onClick={onStartCamera}
              disabled={isStarting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 text-white rounded-full text-sm font-medium transition cursor-pointer"
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
        )}

        {hasPermission && localStream && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
            <button
              onClick={onToggleMic}
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
                  <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.93c.01-.1.02-.21.02-.32V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.75zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              )}
            </button>

            <button
              onClick={onToggleCamera}
              disabled={isInterviewLocked}
              title={isInterviewLocked ? 'Kamera wajib menyala pada sesi Interview' : ''}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition ${
                isInterviewLocked
                  ? 'bg-white/40 opacity-70 cursor-not-allowed text-gray-700'
                  : isCameraOn ? 'bg-white/90 hover:bg-white cursor-pointer' : 'bg-red-600 hover:bg-red-700 cursor-pointer'
              }`}
            >
              {isCameraOn ? (
                <VideocamOutlinedIcon sx={{ fontSize: 20 }} />
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
          {/* Microphone Selector */}
          <div className="flex h-11 items-center gap-2 rounded-full border border-gray-300 bg-white px-4 transition-colors hover:border-gray-400">
            <MicOutlinedIcon sx={{ fontSize: 20 }} />
            <select
              value={selectedMic}
              onChange={(e) => onSwitchMic(e.target.value)}
              className="flex-1 appearance-none bg-transparent text-sm font-medium text-gray-800 outline-none cursor-pointer truncate"
            >
              {deviceList.mics.length === 0 && <option>Tidak ada mikrofon</option>}
              {deviceList.mics.map((mic) => (
                <option key={mic.deviceId} value={mic.deviceId}>
                  {mic.label?.length > 18 ? `${mic.label.slice(0, 18)}...` : mic.label || `Mic ${mic.deviceId.slice(0, 5)}`}
                </option>
              ))}
            </select>
            <svg className="h-4 w-4 shrink-0 text-gray-500 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
            </svg>
          </div>

          {/* Speaker Selector */}
          <div className="flex h-11 items-center gap-2 rounded-full border border-gray-300 bg-white px-4 transition-colors hover:border-gray-400">
            <VolumeUpOutlinedIcon sx={{ fontSize: 20 }} />
            <select
              value={selectedSpeaker}
              onChange={(e) => onSwitchSpeaker(e.target.value)}
              className="flex-1 appearance-none bg-transparent text-sm font-medium text-gray-800 outline-none cursor-pointer truncate"
            >
              {speakers.length === 0 && <option>Speaker Default</option>}
              {speakers.map((spk) => (
                <option key={spk.deviceId} value={spk.deviceId}>
                  {spk.label?.length > 18 ? `${spk.label.slice(0, 18)}...` : spk.label || `Speaker ${spk.deviceId.slice(0, 5)}`}
                </option>
              ))}
            </select>
            <svg className="h-4 w-4 text-gray-500 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </div>

          {/* Camera Selector */}
          <div className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 hover:border-gray-400 transition-colors">
            <VideocamOutlinedIcon sx={{ fontSize: 20 }} />
            <select
              value={selectedCamera}
              onChange={(e) => onSwitchCamera(e.target.value)}
              className="bg-transparent text-sm text-gray-800 outline-none cursor-pointer w-[140px] appearance-none truncate"
            >
              {deviceList.cameras.length === 0 && <option>Tidak ada kamera</option>}
              {deviceList.cameras.map((cam) => (
                <option key={cam.deviceId} value={cam.deviceId}>
                  {cam.label || `Camera ${cam.deviceId.slice(0, 5)}`}
                </option>
              ))}
            </select>
            <svg className="h-4 w-4 text-gray-500 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}

      <p className="text-center text-gray-500 text-sm mt-4">
        {hasPermission ? 'Kamera dan mikrofon siap' : 'Nyalakan kamera untuk bergabung'}
      </p>
    </div>
  );
}
