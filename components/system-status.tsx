"use client"

import type { GentzaState } from "@/hooks/use-gentza-state"

interface SystemStatusProps {
  state: GentzaState
  isSupported: boolean
  isWakeWordListening: boolean
  wakeWordEnabled?: boolean
  className?: string
}

export function SystemStatus({
  state,
  isSupported,
  isWakeWordListening,
  wakeWordEnabled = false,
  className = "",
}: SystemStatusProps) {
  const getStatusMessage = () => {
    if (state.error) return state.error
    if (state.isProcessing) return "Processing your request..."
    if (state.isSearching) return "Searching for real-time information..."
    if (state.isSpeaking) return "Speaking response..."
    if (state.isListening) return "Listening for your voice..."
    if (state.isActive) return "Ready for voice commands"
    if (!isSupported) return "Voice recognition not supported"
    return 'Click "Activate" to start using Gentza'
  }

  const getStatusColor = () => {
    if (state.error) return "text-destructive"
    if (state.isProcessing || state.isSearching) return "text-primary"
    if (state.isSpeaking) return "text-accent"
    if (state.isListening || isWakeWordListening) return "text-secondary"
    return "text-muted-foreground"
  }

  return (
    <div className={`text-center ${className}`}>
      <p className={`text-sm ${getStatusColor()} transition-colors duration-200`}>{getStatusMessage()}</p>
      {state.lastActivity && (
        <p className="text-xs text-muted-foreground/60 mt-1">
          Last activity: {state.lastActivity.toLocaleTimeString()}
        </p>
      )}
    </div>
  )
}
