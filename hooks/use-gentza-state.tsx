"use client"

import { useState, useCallback, useEffect } from "react"

export interface GentzaState {
  isActive: boolean
  isListening: boolean
  isSpeaking: boolean
  isSearching: boolean
  isProcessing: boolean
  error: string | null
  lastActivity: Date | null
}

export function useGentzaState() {
  const [state, setState] = useState<GentzaState>({
    isActive: false,
    isListening: false,
    isSpeaking: false,
    isSearching: false,
    isProcessing: false,
    error: null,
    lastActivity: null,
  })

  const updateState = useCallback((updates: Partial<GentzaState>) => {
    setState((prev) => ({
      ...prev,
      ...updates,
      lastActivity: new Date(),
    }))
  }, [])

  const setActive = useCallback(
    (active: boolean) => {
      updateState({
        isActive: active,
        isListening: false,
        isSpeaking: false,
        isSearching: false,
        isProcessing: false,
        error: null,
      })
    },
    [updateState],
  )

  const setListening = useCallback(
    (listening: boolean) => {
      updateState({ isListening: listening, error: null })
    },
    [updateState],
  )

  const setSpeaking = useCallback(
    (speaking: boolean) => {
      updateState({ isSpeaking: speaking })
    },
    [updateState],
  )

  const setSearching = useCallback(
    (searching: boolean) => {
      updateState({ isSearching: searching })
    },
    [updateState],
  )

  const setProcessing = useCallback(
    (processing: boolean) => {
      updateState({ isProcessing: processing })
    },
    [updateState],
  )

  const setError = useCallback(
    (error: string | null) => {
      updateState({ error, isProcessing: false, isSearching: false })
    },
    [updateState],
  )

  const clearError = useCallback(() => {
    updateState({ error: null })
  }, [updateState])

  useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        clearError()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [state.error, clearError])

  return {
    state,
    setActive,
    setListening,
    setSpeaking,
    setSearching,
    setProcessing,
    setError,
    clearError,
  }
}
