"use client"

import { useState, useCallback } from "react"
import { GentzaAvatar } from "@/components/gentza-avatar"
import { StatusIndicator } from "@/components/status-indicator"
import { ChatInterface } from "@/components/chat-interface"
import { WelcomeScreen } from "@/components/welcome-screen"
import { HackingAnim } from "@/components/hacking-anim"
import { NamePrompt } from "@/components/name-prompt"
import dynamic from "next/dynamic"
import SimpleVoiceAssistant from "@/components/voice-assistant/SimpleVoiceAssistant"

const HackerConsole = dynamic(() => import("@/components/hacker-console"), { ssr: false })

export default function GentzaInterface() {
  const [showWelcome, setShowWelcome] = useState(true)
  const [isActive, setIsActive] = useState(true)
  const [isActivating, setIsActivating] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const [askName, setAskName] = useState(false)

  const handleWelcomeComplete = useCallback(() => {
    setShowWelcome(false)
    // Show name prompt shortly after welcome completes
    setTimeout(() => setAskName(true), 400)
  }, [])

  const handleToggleActive = useCallback(() => {
    if (isActive) {
      setIsActive(false)
      setIsActivating(false)
    } else {
      // Activating with animation sequence
      setIsActivating(true)
      setTimeout(() => {
        setIsActive(true)
        setIsActivating(false)
      }, 800)
    }
  }, [isActive])

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <HackerConsole />
        </div>
        <WelcomeScreen onComplete={handleWelcomeComplete} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background matrix-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Hacker background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <HackerConsole />
      </div>

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
              isActive ? "activation-pulse neon-glow" : "glitch-effect"
            }`}
          >
            Gentza by Irtza Jutt
          </h1>
          <p className="text-secondary font-mono text-lg uppercase tracking-wider">[DIGITAL_INTERFACE_v3.0]</p>
          <div className="text-accent font-mono text-sm mt-2">
            STATUS{" "}
            <span className={`terminal-cursor ${isActive ? "text-primary" : "text-muted-foreground"}`}>
              {isActive ? "ACTIVE" : isActivating ? "INITIALIZING" : "STANDBY"}
            </span>
          </div>
          <div className="text-xs font-mono text-muted-foreground mt-1">
            CREATED_BY: <span className="text-primary">IRTZA_JUTT</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:gap-8 items-start relative">
          <HackingAnim />

          <div className="system-boot col-span-full" style={{ animationDelay: "0.2s" }}>
            <div className="max-w-3xl mx-auto w-full">
              <ChatInterface isActive={isActive} userName={userName ?? undefined} />
            </div>
          </div>
        </div>

        <div
          className="text-center mt-8 text-muted-foreground text-sm font-mono system-boot"
          style={{ animationDelay: "0.4s" }}
        >
          <p>&gt; POWERED_BY: [INTERFACE_ONLY]</p>
          <div className="text-primary/60 mt-2">
            &gt; SECURITY_STATUS: <span className="text-secondary">ENCRYPTED</span> | CONNECTION{" "}
            <span className="text-primary">SECURE_TUNNEL</span>
          </div>
          <div className="text-xs mt-1 text-accent/60">
            DEVELOPER: <span className="text-primary">IRTZA_JUTT</span> | VERSION{" "}
            <span className="text-secondary">3.0_INTERFACE</span>
          </div>
        </div>
      </div>

      {/* Name Prompt Modal */}
      <NamePrompt
        open={askName}
        onOpenChange={setAskName}
        onSubmit={(name) => {
          setUserName(name)
        }}
      />

      {/* Voice Assistant */}
      <div className="fixed bottom-6 right-6 w-96 z-50">
        <SimpleVoiceAssistant />
      </div>

    </div>
  )
}
