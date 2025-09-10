"use client"

import { useState, useCallback, useEffect } from "react"
import { GentzaAvatar } from "@/components/gentza-avatar"
import { StatusIndicator } from "@/components/status-indicator"
import { ChatInterface } from "@/components/chat-interface"
import { SystemStatus } from "@/components/system-status"
import { WelcomeScreen } from "@/components/welcome-screen"
import { useVoiceRecognition } from "@/hooks/use-voice-recognition"
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis"
import { useGentzaState } from "@/hooks/use-gentza-state"

export default function GentzaInterface() {
  const [showWelcome, setShowWelcome] = useState(true)
  const [voiceTranscript, setVoiceTranscript] = useState<string>("")
  const [isActivating, setIsActivating] = useState(false)

  const { state, setActive, setListening, setSpeaking, setSearching, setProcessing, setError } = useGentzaState()

  const { speak, stop, isSpeaking, isLoading: speechLoading } = useSpeechSynthesis()

  const handleWelcomeComplete = useCallback(() => {
    setShowWelcome(false)
  }, [])

  const handleSpeakResponse = useCallback(
    (text: string) => {
      setSpeaking(true)
      speak(text).catch((error) => {
        console.error("Speech synthesis error:", error)
        setError("Speech synthesis failed")
        setSpeaking(false)
      })
    },
    [speak, setSpeaking, setError],
  )

  const handleWakeWordDetected = useCallback(() => {
    setActive(true)
    setListening(true)
  }, [setActive, setListening])

  const handleVoiceTranscript = useCallback(
    (transcript: string) => {
      setVoiceTranscript(transcript)
      setListening(false)
      setProcessing(true)
    },
    [setListening, setProcessing],
  )

  const handleVoiceTranscriptProcessed = useCallback(() => {
    setVoiceTranscript("")
    setProcessing(false)
  }, [setProcessing])

  const handleSearchStart = useCallback(() => {
    setSearching(true)
  }, [setSearching])

  const handleSearchEnd = useCallback(() => {
    setSearching(false)
  }, [setSearching])

  const { isSupported, hasPermission, isWakeWordListening, wakeWordEnabled, toggleWakeWordDetection } =
    useVoiceRecognition({
      onWakeWordDetected: handleWakeWordDetected,
      onTranscript: handleVoiceTranscript,
      isActive: state.isActive,
      isListening: state.isListening,
    })

  useEffect(() => {
    setSpeaking(isSpeaking || speechLoading)
  }, [isSpeaking, speechLoading, setSpeaking])

  const handleStopSpeaking = useCallback(() => {
    stop()
    setSpeaking(false)
  }, [stop, setSpeaking])

  const handleToggleActive = useCallback(() => {
    if (state.isActive) {
      // Deactivating - stop all operations
      stop()
      setActive(false)
      setIsActivating(false)
    } else {
      // Activating with animation sequence
      setIsActivating(true)
      setTimeout(() => {
        setActive(true)
        setIsActivating(false)
      }, 800)
    }
  }, [state.isActive, stop, setActive])

  const handleRequestPermission = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      window.location.reload() // Reload to reinitialize with permissions
    } catch (error) {
      console.error("Permission request failed:", error)
      setError("Microphone permission is required for voice features")
    }
  }, [setError])

  if (showWelcome) {
    return <WelcomeScreen onComplete={handleWelcomeComplete} />
  }

  return (
    <div className="min-h-screen bg-background matrix-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={`matrix-${i}`}
            className="absolute text-primary/30 text-xs font-mono matrix-rain hologram-flicker"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
            }}
          >
            {Math.random() > 0.5 ? "01" : String.fromCharCode(0x2580 + Math.random() * 16)}
          </div>
        ))}

        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute w-1 h-1 bg-gradient-to-r from-primary to-secondary rounded-full data-flow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
            }}
          />
        ))}

        <div className="absolute inset-0">
          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent scan-line" />
          <div
            className="absolute w-full h-px bg-gradient-to-r from-transparent via-secondary/40 to-transparent scan-line"
            style={{ animationDelay: "1s" }}
          />
        </div>

        <div className="absolute inset-0 neural-network opacity-20" />
      </div>

      {/* Main interface */}
      <div className={`relative z-10 w-full max-w-6xl mx-auto ${isActivating ? "system-boot" : ""}`}>
        <div className="text-center mb-8">
          <h1
            className={`text-6xl font-bold font-mono text-primary mb-4 ${
              state.isActive ? "activation-pulse neon-glow" : "glitch-effect"
            }`}
          >
            &gt; GENTZA_AI
          </h1>
          <p className="text-secondary font-mono text-lg uppercase tracking-wider">[NEURAL_VOICE_ASSISTANT_v3.0_PRO]</p>
          <div className="text-accent font-mono text-sm mt-2">
            STATUS:{" "}
            <span className={`terminal-cursor ${state.isActive ? "text-primary" : "text-muted-foreground"}`}>
              {state.isActive ? "ACTIVE" : isActivating ? "INITIALIZING" : "STANDBY"}
            </span>
          </div>
          <div className="text-xs font-mono text-muted-foreground mt-1">
            CREATED_BY: <span className="text-primary">IRTZA_JUTT</span>
          </div>

          <SystemStatus
            state={state}
            isSupported={isSupported}
            isWakeWordListening={isWakeWordListening}
            wakeWordEnabled={wakeWordEnabled}
            className="mt-4"
          />

          {isSupported && hasPermission === false && (
            <div className="mt-4 p-4 terminal-card relative system-boot">
              <p className="text-destructive font-mono font-bold mb-2">[ERROR] AUDIO_PERMISSIONS_REQUIRED</p>
              <p className="text-sm text-muted-foreground font-mono mb-3">
                &gt; GENTZA requires microphone access for advanced voice recognition protocols.
              </p>
              <button onClick={handleRequestPermission} className="hacker-button px-6 py-3 rounded">
                GRANT_SYSTEM_ACCESS
              </button>
            </div>
          )}

          {!isSupported && (
            <div className="mt-4 p-4 terminal-card relative system-boot">
              <p className="text-destructive font-mono font-bold mb-2">[ERROR] INCOMPATIBLE_BROWSER_DETECTED</p>
              <p className="text-sm text-muted-foreground font-mono">
                &gt; Please use Chrome, Edge, or Safari for optimal voice recognition performance.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="terminal-card relative p-8 system-boot">
            <div className="flex flex-col items-center space-y-8">
              <div className={isActivating ? "activation-pulse" : ""}>
                <GentzaAvatar
                  isActive={state.isActive}
                  isListening={state.isListening || isWakeWordListening}
                  isSpeaking={state.isSpeaking}
                  className="w-64 h-64"
                />
              </div>

              <StatusIndicator
                isActive={state.isActive}
                isListening={state.isListening || isWakeWordListening}
                isSpeaking={state.isSpeaking}
              />

              <div className="flex flex-col space-y-4 w-full max-w-sm">
                <button
                  onClick={handleToggleActive}
                  disabled={!isSupported || hasPermission === false || isActivating}
                  className="hacker-button px-8 py-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  {isActivating ? "[INITIALIZING...]" : state.isActive ? "[DEACTIVATE_SYSTEM]" : "[ACTIVATE_GENTZA]"}
                </button>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setListening(!state.isListening)}
                    disabled={!state.isActive || !isSupported || hasPermission === false || state.isSpeaking}
                    className="flex-1 px-4 py-3 border-2 border-secondary text-secondary font-mono font-bold
                              hover:bg-secondary/10 hover:border-secondary/80 transition-all duration-300 rounded-lg
                              disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {state.isListening ? "[STOP_LISTEN]" : "[VOICE_INPUT]"}
                  </button>

                  <button
                    onClick={
                      state.isSpeaking
                        ? handleStopSpeaking
                        : () =>
                            handleSpeakResponse(
                              "Gentza AI system online. Neural networks initialized. Ready for advanced voice commands.",
                            )
                    }
                    disabled={!state.isActive}
                    className="flex-1 px-4 py-3 border-2 border-accent text-accent font-mono font-bold
                              hover:bg-accent/10 hover:border-accent/80 transition-all duration-300 rounded-lg
                              disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {state.isSpeaking ? "[MUTE_AUDIO]" : "[TEST_VOICE]"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="system-boot" style={{ animationDelay: "0.2s" }}>
            <ChatInterface
              isActive={state.isActive}
              onSpeakResponse={handleSpeakResponse}
              voiceTranscript={voiceTranscript}
              onVoiceTranscriptProcessed={handleVoiceTranscriptProcessed}
              onSearchStart={handleSearchStart}
              onSearchEnd={handleSearchEnd}
            />
          </div>
        </div>

        <div
          className="text-center mt-8 text-muted-foreground text-sm font-mono system-boot"
          style={{ animationDelay: "0.4s" }}
        >
          <p>&gt; POWERED_BY: [OPENAI_GPT] [ELEVENLABS_TTS] [SEARCHAPI_REALTIME]</p>
          <div className="text-primary/60 mt-2">
            &gt; SECURITY_STATUS: <span className="text-secondary">ENCRYPTED</span> | CONNECTION:{" "}
            <span className="text-primary">SECURE_TUNNEL</span>
          </div>
          <div className="text-xs mt-1 text-accent/60">
            DEVELOPER: <span className="text-primary">IRTZA_JUTT</span> | VERSION:{" "}
            <span className="text-secondary">3.0_PRO</span>
          </div>
        </div>
      </div>
    </div>
  )
}
