'use client';

import LobbyNotFound from '@/components/meeting/lobby/LobbyNotFound';
import LobbyNavbar from '@/components/meeting/lobby/LobbyNavbar';
import LobbyPreview from '@/components/meeting/lobby/LobbyPreview';
import LobbyJoinCard from '@/components/meeting/lobby/LobbyJoinCard';
import { useMeetingLobby } from '@/hooks/useMeetingLobby';

interface MeetingLobbyProps {
  roomId: string;
  roomExists: boolean | null;
  roomType?: string;
  onJoin: (participantUUID: string, role?: string, cameraOn?: boolean, micOn?: boolean, name?: string) => void;
}

export default function MeetingLobby({ roomId, roomExists, roomType = 'private', onJoin }: MeetingLobbyProps) {
  const {
    error,
    redirectCountdown,
    localStream,
    isCameraOn,
    isMicOn,
    hasPermission,
    isStarting,
    deviceList,
    speakers,
    selectedCamera,
    selectedMic,
    selectedSpeaker,
    videoRef,
    audioBarRefs,
    waitingApproval,
    joining,
    user,
    customGuestName,
    setCustomGuestName,
    currentTime,
    isInterviewLocked,
    toggleCamera,
    toggleMic,
    startCamera,
    handleSwitchCamera,
    handleSwitchMic,
    handleSwitchSpeaker,
    handleJoin,
    handleBackToDashboard,
  } = useMeetingLobby({ roomId, roomExists, roomType, onJoin });

  if (roomExists === false) {
    return (
      <LobbyNotFound
        roomId={roomId}
        redirectCountdown={redirectCountdown}
        onBackToDashboard={handleBackToDashboard}
      />
    );
  }

  return (
    <div className="min-h-screen w-full relative bg-white overflow-hidden flex flex-col">
      <LobbyNavbar currentTime={currentTime} user={user} />

      <div className="flex-1 w-full flex items-center justify-center px-4">
        <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-center">
          <LobbyPreview
            roomType={roomType}
            hasPermission={hasPermission}
            localStream={localStream}
            isCameraOn={isCameraOn}
            isMicOn={isMicOn}
            isStarting={isStarting}
            user={user}
            isInterviewLocked={isInterviewLocked}
            videoRef={videoRef}
            audioBarRefs={audioBarRefs}
            onToggleCamera={toggleCamera}
            onToggleMic={toggleMic}
            onStartCamera={startCamera}
            deviceList={deviceList}
            speakers={speakers}
            selectedCamera={selectedCamera}
            selectedMic={selectedMic}
            selectedSpeaker={selectedSpeaker}
            onSwitchCamera={handleSwitchCamera}
            onSwitchMic={handleSwitchMic}
            onSwitchSpeaker={handleSwitchSpeaker}
          />

          <LobbyJoinCard
            roomId={roomId}
            user={user}
            customGuestName={customGuestName}
            setCustomGuestName={setCustomGuestName}
            error={error}
            joining={joining}
            waitingApproval={waitingApproval}
            hasPermission={hasPermission}
            isStarting={isStarting}
            onJoin={handleJoin}
          />
        </div>
      </div>
    </div>
  );
}
