"use client"

import { useState, useEffect } from "react"

interface WelcomeScreenProps {
  onComplete: () => void
}

export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [showWelcome, setShowWelcome] = useState(true)
  const [currentText, setCurrentText] = useState("")
  const fullText = "Welcome to Gentza"
  const creator = "By Irtza Jutt"

  useEffect(() => {
    let index = 0
    const timer = setInterval(() => {
      if (index < fullText.length) {
        setCurrentText(fullText.slice(0, index + 1))
        index++
      } else {
        clearInterval(timer)
        setTimeout(() => {
          setShowWelcome(false)
          onComplete()
        }, 2000)
      }
    }, 100)

    return () => clearInterval(timer)
  }, [onComplete])

  if (!showWelcome) return null

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
          <div className="animate-pulse">Initializing AI Systems...</div>
        </div>
      </div>
    </div>
  )
}
