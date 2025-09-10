"use client"

import { useState, useCallback, useRef } from "react"

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return

    setIsLoading(true)
    setIsSpeaking(true)

    try {
      // Try ElevenLabs API first
      const response = await fetch("/api/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      })

      if (response.ok) {
        const contentType = response.headers.get("content-type")

        if (contentType?.includes("audio")) {
          // ElevenLabs audio response
          const audioBlob = await response.blob()
          const audioUrl = URL.createObjectURL(audioBlob)

          const audio = new Audio(audioUrl)
          audioRef.current = audio

          audio.onloadeddata = () => {
            setIsLoading(false)
          }

          audio.onended = () => {
            setIsSpeaking(false)
            URL.revokeObjectURL(audioUrl)
            audioRef.current = null
          }

          audio.onerror = () => {
            console.error("Audio playback error, falling back to browser TTS")
            setIsLoading(false)
            fallbackToWebSpeech(text)
          }

          await audio.play()
        } else {
          // Fallback response
          const data = await response.json()
          console.log("[v0] Using fallback speech synthesis:", data.message)
          setIsLoading(false)
          fallbackToWebSpeech(text)
        }
      } else {
        console.error("Speech API error, using fallback")
        setIsLoading(false)
        fallbackToWebSpeech(text)
      }
    } catch (error) {
      console.error("Speech synthesis error:", error)
      setIsLoading(false)
      fallbackToWebSpeech(text)
    }
  }, [])

  const fallbackToWebSpeech = useCallback((text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utteranceRef.current = utterance

      utterance.rate = 0.9
      utterance.pitch = 1.0
      utterance.volume = 0.8

      utterance.onstart = () => {}

      utterance.onend = () => {
        setIsSpeaking(false)
        utteranceRef.current = null
      }

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event.error)
        setIsSpeaking(false)
        utteranceRef.current = null
      }

      speechSynthesis.speak(utterance)
    } else {
      console.error("Speech synthesis not supported")
      setIsSpeaking(false)
    }
  }, [])

  const stop = useCallback(() => {
    // Stop ElevenLabs audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }

    // Stop browser speech synthesis
    if (utteranceRef.current) {
      speechSynthesis.cancel()
      utteranceRef.current = null
    }

    setIsSpeaking(false)
    setIsLoading(false)
  }, [])

  return {
    speak,
    stop,
    isSpeaking,
    isLoading,
  }
}
