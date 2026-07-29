'use client';

import DashboardNavbar from '@/components/dashboard/DashboardNavbar';
import DashboardHero from '@/components/dashboard/DashboardHero';
import ScheduleTypeModal from '@/components/dashboard/ScheduleTypeModal';
import CreatedRoomModal from '@/components/dashboard/CreatedRoomModal';
import { useDashboard } from '@/hooks/useDashboard';

export default function MeetingHomePage() {
  const {
    joinCode,
    createdRoom,
    setCreatedRoom,
    copied,
    user,
    isLoading,
    isCreating,
    error,
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
  } = useDashboard();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative bg-white overflow-hidden">
      <DashboardNavbar currentTime={currentTime} user={user} onLogout={handleLogout} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-32 sm:pt-40 pb-24">
        <DashboardHero
          error={error}
          isCreating={isCreating}
          showDropdown={showDropdown}
          setShowDropdown={setShowDropdown}
          onStartInstantMeeting={handleStartInstantMeeting}
          onOpenScheduleModal={() => setShowScheduleTypeModal(true)}
          joinCode={joinCode}
          onJoinCodeChange={handleJoinCodeChange}
          isInputFocused={isInputFocused}
          setIsInputFocused={setIsInputFocused}
          onJoin={handleJoin}
        />

        <ScheduleTypeModal
          show={showScheduleTypeModal}
          onClose={() => setShowScheduleTypeModal(false)}
          selectedScheduleType={selectedScheduleType}
          setSelectedScheduleType={setSelectedScheduleType}
          onCreate={handleNewMeeting}
        />

        <CreatedRoomModal
          createdRoom={createdRoom}
          onClose={() => setCreatedRoom(null)}
          copied={copied}
          onCopy={handleCopy}
        />
      </div>
    </div>
  );
}