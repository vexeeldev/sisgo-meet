'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import MeetingHeader from '@/components/meeting/room/MeetingHeader';
import MeetingVideo from '@/components/meeting/room/MeetingVideo';
import MeetingControls from '@/components/meeting/room/MeetingControls';
import MeetingSidebar from '@/components/meeting/room/MeetingSidebarBackground';
import MeetingSidebarRecordings from '@/components/meeting/room/MeetingSidebarRecordings';
import EndCallModal from '@/components/meeting/room/EndCallModal';
import HostActionMenuModal from '@/components/meeting/HostActionMenuModal';
import WhiteboardModal from '@/components/meeting/WhiteboardModal';
import MeetingLobby from './lobby/page';
import { stringToColor } from '@/lib/meeting';
import { useMeetingRoom } from '@/hooks/useMeetingRoom';

export default function MeetingPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const [showRecordingsPanel, setShowRecordingsPanel] = useState(false);

  const {
    showLobby,
    participantName,
    isLoading,
    isMuted,
    isVideoOff,
    roomExists,
    roomType,
    chatMessages,
    unreadChatCount,
    layout,
    showEndCallModal,
    currentTime,
    isHandRaised,
    raisedHands,
    virtualBgImage,
    showActionMenu,
    processingJoin,
    showChat,
    showParticipants,
    showRequests,
    showBgPanel,
    isHost,
    localStream,
    remoteStreams,
    participants,
    participantDetails,
    peerIdToStreamId,
    screenStream,
    remoteScreenShare,
    remoteVideoOff,
    remoteAudioOff,
    speaking,
    virtualBgMode,
    joinRequests,
    isScreenSharing,
    isRecording,
    isPaused,
    elapsedMs,
    result,
    setLayout,
    setShowChat,
    setShowParticipants,
    setShowRequests,
    setShowBgPanel,
    setShowEndCallModal,
    setShowActionMenu,
    handleJoinFromLobby,
    handleToggleLayout,
    handleEndCall,
    leaveCall,
    handleEndForAll,
    handleKickParticipant,
    handleApproveJoin,
    handleRejectJoin,
    handleSendMessage,
    handleToggleFullscreen,
    handleToggleMute,
    handleToggleVideo,
    handleToggleScreenShare,
    handleToggleChat,
    handleToggleParticipants,
    handleToggleRequests,
    handleCopyLink,
    handleToggleHand,
    handleChangeVirtualBg,
    startRecording,
    stopRecording,
    downloadRecording,
    discardRecording,
    sendMessage,
    isWhiteboardOpen,
    isWhiteboardMinimized,
    whiteboardSnapshot,
    handleToggleWhiteboard,
    handleWhiteboardSnapshotChange,
    screenAnnotations,
    handleScreenAnnotationChange,
    handleScreenAnnotationStart,
    handleScreenAnnotationDraw,
    handleScreenAnnotationEnd,
    handleClearScreenAnnotations,
    isScreenAnnotationOpen,
    handleToggleScreenAnnotation,
  } = useMeetingRoom({ roomId });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0f0f0f]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-transparent rounded-full animate-spin"></div>
          <div className="text-white text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  if (showLobby) {
    return (
      <MeetingLobby
        roomId={roomId}
        roomExists={roomExists}
        roomType={roomType}
        onJoin={handleJoinFromLobby}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0f0f0f] overflow-hidden">
      
      <HostActionMenuModal
        isOpen={showActionMenu}
        onClose={() => setShowActionMenu(false)}
        sendMessage={sendMessage}
      />
      
      <MeetingHeader
        currentTime={currentTime}
        roomId={roomId}
        participantsCount={participants.length + 1}
        onToggleLayout={handleToggleLayout}
        onToggleFullscreen={handleToggleFullscreen}
        onCopyLink={handleCopyLink}
        isRecording={isRecording}
        isPaused={isPaused}
        elapsedMs={elapsedMs}
        recordingResult={result}
        onStartRecording={startRecording}  
        onStopRecording={stopRecording}
        onDownloadRecording={downloadRecording}
        onDiscardRecording={discardRecording}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex gap-2 sm:gap-4 relative min-h-0 ${(isScreenSharing || remoteScreenShare) ? 'p-1 sm:p-2' : 'p-2 sm:p-4'}`}>
        <div className={`flex-1 transition-all duration-300 relative ${
          (showChat || showParticipants || showRequests || showBgPanel) ? 'hidden sm:block' : ''
        }`}>
          <MeetingVideo
            layout={layout}
            localStream={localStream}
            remoteStreams={remoteStreams}
            participantName={participantName}
            participantDetails={participantDetails}
            peerIdToStreamId={peerIdToStreamId}
            isVideoOff={isVideoOff}
            isAudioOff={isMuted}
            isScreenSharing={isScreenSharing} 
            screenStream={screenStream}
            onStopSharing={handleToggleScreenShare}
            remoteVideoOff={remoteVideoOff}
            remoteAudioOff={remoteAudioOff}
            speaking={speaking}
            remoteScreenShare={remoteScreenShare}
            raisedHands={raisedHands}
            isWhiteboardOpen={isWhiteboardOpen}
            isWhiteboardMinimized={isWhiteboardMinimized}
            isHost={isHost}
            whiteboardSnapshot={whiteboardSnapshot}
            onWhiteboardSnapshotChange={handleWhiteboardSnapshotChange}
            onCloseWhiteboard={handleToggleWhiteboard}
            screenAnnotations={screenAnnotations}
            onChangeScreenAnnotations={handleScreenAnnotationChange}
            onScreenAnnotationStart={handleScreenAnnotationStart}
            onScreenAnnotationDraw={handleScreenAnnotationDraw}
            onScreenAnnotationEnd={handleScreenAnnotationEnd}
            onClearScreenAnnotations={handleClearScreenAnnotations}
            isScreenAnnotationOpen={isScreenAnnotationOpen}
            onCloseScreenAnnotation={handleToggleScreenAnnotation}
          />
        </div>

        {/* Sidebar */}
        {(showChat || showParticipants || showRequests || showBgPanel) && (
          <MeetingSidebar
            showChat={showChat}
            showParticipants={showParticipants}
            showRequests={showRequests}
            showBgPanel={showBgPanel}
            isHost={isHost}
            joinRequests={joinRequests}
            participants={participants}
            participantName={participantName}
            participantDetails={participantDetails}
            chatMessages={chatMessages}
            processingJoin={processingJoin}
            virtualBgMode={virtualBgMode}
            virtualBgImage={virtualBgImage}
            localStream={localStream}
            isVideoOff={isVideoOff}
            setShowChat={setShowChat}
            setShowParticipants={setShowParticipants}
            setShowRequests={setShowRequests}
            setShowBgPanel={setShowBgPanel}
            handleSendMessage={handleSendMessage}
            handleKickParticipant={handleKickParticipant}
            handleApproveJoin={handleApproveJoin}
            handleRejectJoin={handleRejectJoin}
            handleChangeVirtualBg={handleChangeVirtualBg}
            stringToColor={stringToColor}
          />
        )}

        {/* Recording History Sidebar (Host Only) */}
        {isHost && showRecordingsPanel && (
          <MeetingSidebarRecordings
            roomId={roomId}
            onClose={() => setShowRecordingsPanel(false)}
            latestRecordingResult={result}
          />
        )}
      </div>

      <EndCallModal
        isOpen={showEndCallModal}
        onClose={() => setShowEndCallModal(false)}
        onEndForAll={handleEndForAll}
        onLeaveCall={leaveCall}
      />

      <MeetingControls
        currentTime={currentTime}
        roomId={roomId}
        roomType={roomType}
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isScreenSharing={isScreenSharing}
        showChat={showChat}
        showParticipants={showParticipants}
        onToggleMute={handleToggleMute}
        onToggleVideo={handleToggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onToggleChat={handleToggleChat}
        onToggleParticipants={handleToggleParticipants}
        onEndCall={handleEndCall}
        isHost={isHost}
        isHandRaised={isHandRaised}
        onToggleHand={handleToggleHand}
        onToggleWhiteboard={handleToggleWhiteboard}
        isWhiteboardOpen={isWhiteboardOpen}
        onToggleScreenAnnotation={handleToggleScreenAnnotation}
        isScreenAnnotationOpen={isScreenAnnotationOpen}
        layout={layout as any}
        onChangeLayout={setLayout as any}
        virtualBgMode={virtualBgMode}
        virtualBgImage={virtualBgImage}
        onChangeVirtualBg={handleChangeVirtualBg}
        isRecording={isRecording}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        recordingResult={result}
        onDownloadRecording={downloadRecording}
        onDiscardRecording={discardRecording}
        joinRequestsCount={isHost ? joinRequests.length : 0}
        showRequests={showRequests}
        onToggleRequests={handleToggleRequests}
        unreadChatCount={unreadChatCount}
        localStream={localStream}
        showBgPanel={showBgPanel}
        onToggleBgPanel={() => {
          setShowRecordingsPanel(false);
          setShowBgPanel((p) => !p);
        }}
        showRecordingsPanel={showRecordingsPanel}
        onToggleRecordingsPanel={() => {
          setShowRecordingsPanel((p: boolean) => {
            if (!p) {
              setShowChat(false);
              setShowParticipants(false);
              setShowRequests(false);
              setShowBgPanel(false);
            }
            return !p;
          });
        }}
      />
    </div>
  );
}