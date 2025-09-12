"use client"

import { useState, useEffect, useRef } from "react"

interface WelcomeScreenProps {
  onComplete: () => void
}

export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [showWelcome, setShowWelcome] = useState(true)
  const [currentText, setCurrentText] = useState("")
  const fullText = "Welcome to Gentza"
  const creator = "By Irtza Jutt"

  const audioCtxRef = useRef<AudioContext | null>(null)

  const playKeyClick = () => {
    try {
      const Ctx: any = (window as any).AudioContext || (window as any).webkitAudioContext
      if (!Ctx) return
      const ctx: AudioContext = audioCtxRef.current || new Ctx()
      audioCtxRef.current = ctx
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = "square"
      o.frequency.value = 800
      g.gain.value = 0.0001
      o.connect(g)
      g.connect(ctx.destination)
      const now = ctx.currentTime
      g.gain.setValueAtTime(0.0001, now)
      g.gain.exponentialRampToValueAtTime(0.05, now + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.05)
      o.start(now)
      o.stop(now + 0.06)
    } catch {}
  }

  useEffect(() => {
    let index = 0

    const startTyping = () => {
      const timer = setInterval(() => {
        if (index < fullText.length) {
          setCurrentText(fullText.slice(0, index + 1))
          playKeyClick()
          index++
        } else {
          clearInterval(timer)
          setTimeout(() => {
            setShowWelcome(false)
            onComplete()
          }, 2000)
        }
      }, 100)

      return timer
    }

    // Ensure audio context can start after a user gesture in some browsers
    let timerHandle: any
    const resume = () => {
      try {
        if (audioCtxRef.current && (audioCtxRef.current.state === "suspended")) {
          audioCtxRef.current.resume().catch(() => {})
        }
      } catch {}
      if (!timerHandle) {
        timerHandle = startTyping()
      }
      window.removeEventListener("click", resume)
      window.removeEventListener("keydown", resume)
    }

    // Start immediately; if audio is blocked, a gesture will resume
    timerHandle = startTyping()
    window.addEventListener("click", resume)
    window.addEventListener("keydown", resume)

    return () => {
      if (timerHandle) clearInterval(timerHandle)
      window.removeEventListener("click", resume)
      window.removeEventListener("keydown", resume)
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close()
        } catch {}
        audioCtxRef.current = null
      }
    }
  }, [onComplete])

  if (!showWelcome) return null

  // Play a short futuristic boot tone once when the welcome screen mounts
  useEffect(() => {
    try {
      const Ctx: any = (window as any).AudioContext || (window as any).webkitAudioContext
      if (!Ctx) return
      const ctx: AudioContext = new Ctx()
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = "sawtooth"
      o.frequency.value = 480
      g.gain.value = 0.0001
      o.connect(g)
      g.connect(ctx.destination)
      const now = ctx.currentTime
      g.gain.setValueAtTime(0.0001, now)
      g.gain.exponentialRampToValueAtTime(0.08, now + 0.05)
      o.frequency.exponentialRampToValueAtTime(1200, now + 0.25)
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.4)
      o.start(now)
      o.stop(now + 0.42)
      setTimeout(() => ctx.close().catch(() => {}), 800)
    } catch {}
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="absolute inset-0 matrix-bg opacity-30"></div>

      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary rounded-full opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          >
            <div className="w-full h-full animate-pulse"></div>
          </div>
        ))}
      </div>

      <div className="text-center welcome-animation">
        <div className="mb-8">
          <h1 className="text-6xl md:text-8xl font-bold text-primary logo-glow mb-4">
            {currentText}
            <span className="animate-pulse">|</span>
          </h1>
          <div className="text-2xl md:text-3xl text-secondary font-mono tracking-wider">
            {currentText === fullText && <span className="typewriter inline-block">{creator}</span>}
          </div>
        </div>

        <div className="flex justify-center items-center space-x-2 mt-8">
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-secondary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
          <div className="w-3 h-3 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
        </div>

        <div className="mt-6 text-muted-foreground font-mono text-sm">
          <div className="animate-pulse">Initializing Systems...</div>
        </div>
      </div>
    </div>
  )
}
