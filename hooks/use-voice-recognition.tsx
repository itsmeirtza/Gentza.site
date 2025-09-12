"use client"

// Simplified voice recognition hook - disabled functionality

interface UseVoiceRecognitionProps {
  onWakeWordDetected: () => void
  onTranscript: (transcript: string) => void
  isActive: boolean
  isListening: boolean
}

export function useVoiceRecognition(props: UseVoiceRecognitionProps) {
  // Return mock values - voice recognition is disabled
  return {
    isSupported: false,
    hasPermission: false,
    isWakeWordListening: false,
    wakeWordEnabled: false,
    toggleWakeWordDetection: () => {},
    startWakeWordDetection: () => {},
    stopWakeWordDetection: () => {},
    startVoiceInput: () => {},
    stopVoiceInput: () => {},
  }
}
