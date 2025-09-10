"use client"

import { useEffect, useState } from "react"

interface GentzaAvatarProps {
  isActive: boolean
  isListening: boolean
  isSpeaking: boolean
  className?: string
}

export function GentzaAvatar({ isActive, isListening, isSpeaking, className = "" }: GentzaAvatarProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([])

  useEffect(() => {
    // Generate particles around the avatar
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.cos((i * 30 * Math.PI) / 180) * 80,
      y: Math.sin((i * 30 * Math.PI) / 180) * 80,
      delay: i * 0.2,
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className={`relative ${className}`}>
      {/* Outer energy rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Ring 1 - Outermost */}
        <div
          className={`absolute w-64 h-64 rounded-full border border-primary/20 transition-all duration-1000 ${
            isActive ? "animate-spin" : ""
          }`}
          style={{ animationDuration: "20s" }}
        />

        {/* Ring 2 - Middle */}
        <div
          className={`absolute w-48 h-48 rounded-full border-2 border-primary/30 transition-all duration-500 ${
            isListening ? "pulse-glow animate-pulse" : ""
          }`}
        />

        {/* Ring 3 - Inner */}
        <div
          className={`absolute w-32 h-32 rounded-full border border-accent/40 transition-all duration-300 ${
            isSpeaking ? "animate-ping" : ""
          }`}
        />
      </div>

      {/* Floating particles */}
      {isActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-2 h-2 bg-primary/60 rounded-full particle-float"
              style={{
                transform: `translate(${particle.x}px, ${particle.y}px)`,
                animationDelay: `${particle.delay}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Main avatar face */}
      <div className="relative z-10 flex items-center justify-center">
        <div
          className={`w-24 h-24 rounded-full bg-gradient-to-br from-primary/40 via-accent/30 to-primary/40 
                      flex items-center justify-center hologram-flicker backdrop-blur-sm
                      transition-all duration-300 ${
                        isSpeaking
                          ? "scale-110 shadow-lg shadow-accent/30"
                          : isListening
                            ? "scale-105 shadow-md shadow-primary/30"
                            : isActive
                              ? "scale-100"
                              : "scale-95 opacity-60"
                      }`}
        >
          {/* Inner core */}
          <div
            className={`w-16 h-16 rounded-full bg-gradient-to-br from-primary/60 to-accent/60 
                        flex items-center justify-center transition-all duration-200 ${
                          isSpeaking ? "animate-pulse" : ""
                        }`}
          >
            {/* Eye/center dot */}
            <div
              className={`w-6 h-6 rounded-full transition-all duration-200 ${
                isSpeaking
                  ? "bg-accent animate-pulse"
                  : isListening
                    ? "bg-primary animate-pulse"
                    : isActive
                      ? "bg-foreground/80"
                      : "bg-muted"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Holographic scan lines effect */}
      {isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-24 h-24 rounded-full overflow-hidden">
            <div
              className="w-full h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent 
                         animate-bounce"
              style={{
                animation: "scan-line 2s ease-in-out infinite",
              }}
            />
          </div>
        </div>
      )}

      {/* Voice waveform visualization */}
      {isSpeaking && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-8">
          <div className="flex items-end space-x-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-accent rounded-full animate-pulse"
                style={{
                  height: `${Math.random() * 20 + 10}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: "0.5s",
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
