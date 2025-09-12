"use client"

// Simplified speech synthesis hook - disabled functionality

export function useSpeechSynthesis() {
  // Return mock values - speech synthesis is disabled
  return {
    speak: async () => {},
    stop: () => {},
    isSpeaking: false,
    isLoading: false,
  }
}
