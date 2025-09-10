"use client"

interface StatusIndicatorProps {
  isActive: boolean
  isListening: boolean
  isSpeaking: boolean
  className?: string
}

export function StatusIndicator({ isActive, isListening, isSpeaking, className = "" }: StatusIndicatorProps) {
  const getStatusText = () => {
    if (isSpeaking) return "Speaking..."
    if (isListening) return "Listening..."
    if (isActive) return "Ready"
    return 'Say "Hello Gentza" to activate'
  }

  const getStatusColor = () => {
    if (isSpeaking) return "bg-accent"
    if (isListening) return "bg-primary"
    if (isActive) return "bg-secondary"
    return "bg-muted"
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Status dot */}
      <div className="relative">
        <div
          className={`w-3 h-3 rounded-full transition-all duration-300 ${getStatusColor()} ${
            isSpeaking || isListening ? "animate-pulse" : ""
          }`}
        />
        {(isSpeaking || isListening) && (
          <div className={`absolute inset-0 w-3 h-3 rounded-full ${getStatusColor()} animate-ping opacity-30`} />
        )}
      </div>

      {/* Status text */}
      <span className="text-sm text-muted-foreground font-medium">{getStatusText()}</span>

      {/* Activity indicator bars */}
      {(isListening || isSpeaking) && (
        <div className="flex items-center space-x-1 ml-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-200 ${isSpeaking ? "bg-accent" : "bg-primary"}`}
              style={{
                height: `${Math.random() * 12 + 8}px`,
                animation: `pulse 0.${5 + i}s ease-in-out infinite`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
