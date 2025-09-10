"use client"

interface SearchIndicatorProps {
  isSearching: boolean
  className?: string
}

export function SearchIndicator({ isSearching, className = "" }: SearchIndicatorProps) {
  if (!isSearching) return null

  return (
    <div className={`flex items-center space-x-2 text-sm text-muted-foreground ${className}`}>
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
      </div>
      <span>Searching for real-time information...</span>
    </div>
  )
}
