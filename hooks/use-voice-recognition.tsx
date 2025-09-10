"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface UseVoiceRecognitionProps {
  onWakeWordDetected: () => void
  onTranscript: (transcript: string) => void
  isActive: boolean
  isListening: boolean
}

export function useVoiceRecognition({
  onWakeWordDetected,
  onTranscript,
  isActive,
  isListening,
}: UseVoiceRecognitionProps) {
  const [isSupported, setIsSupported] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const recognitionRef = useRef<any | null>(null)
  const permissionRequestedRef = useRef(false)

  // Check if speech recognition is supported and request permissions
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const supported = !!SpeechRecognition
    setIsSupported(supported)

    if (supported && !permissionRequestedRef.current) {
      permissionRequestedRef.current = true
      // Request microphone permission
      navigator.mediaDevices
        ?.getUserMedia({ audio: true })
        .then(() => {
          setHasPermission(true)
        })
        .catch((error) => {
          setHasPermission(false)
        })
    }
  }, [])

  // Start voice input recognition (manual activation only)
  const startVoiceInput = useCallback(() => {
    if (!isSupported || !hasPermission || !isActive || !isListening || recognitionRef.current) return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"
    recognition.maxAlternatives = 1

    recognition.onstart = () => {}

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      onTranscript(transcript)
    }

    recognition.onerror = (event) => {
      console.log("Voice input error:", event.error)
      if (event.error === "not-allowed") {
        setHasPermission(false)
      }
    }

    recognition.onend = () => {
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch (error) {
      console.error("Failed to start voice input:", error)
      recognitionRef.current = null
    }
  }, [isSupported, hasPermission, isActive, isListening, onTranscript])

  // Stop voice input recognition
  const stopVoiceInput = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch (error) {}
      recognitionRef.current = null
    }
  }, [])

  // Effect to manage voice input
  useEffect(() => {
    if (isActive && isListening && hasPermission) {
      startVoiceInput()
    } else {
      stopVoiceInput()
    }

    return () => {
      stopVoiceInput()
    }
  }, [isActive, isListening, hasPermission, startVoiceInput, stopVoiceInput])

  useEffect(() => {
    return () => {
      stopVoiceInput()
    }
  }, [stopVoiceInput])

  return {
    isSupported,
    hasPermission,
    isWakeWordListening: false, // Always false since we removed wake word detection
    wakeWordEnabled: false, // Always false since we removed wake word detection
    toggleWakeWordDetection: () => {}, // No-op function
    startWakeWordDetection: () => {}, // No-op function
    stopWakeWordDetection: () => {}, // No-op function
    startVoiceInput,
    stopVoiceInput,
  }
}
