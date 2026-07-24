import { useEffect } from "react";

interface Props {
  toggleMic: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => void;
}

export function useKeyboardShortcuts({
  toggleMic,
  toggleCamera,
  toggleScreenShare,
}: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.ctrlKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        toggleMic();
      }

      if (e.ctrlKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        toggleCamera();
      }

      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        toggleScreenShare();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [toggleMic, toggleCamera, toggleScreenShare]);
}