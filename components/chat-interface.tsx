"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SearchIndicator } from "@/components/search-indicator"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface ChatInterfaceProps {
  isActive: boolean
  onSpeakResponse?: (text: string) => void
  voiceTranscript?: string
  onVoiceTranscriptProcessed?: () => void
  onSearchStart?: () => void
  onSearchEnd?: () => void
  className?: string
}

export function ChatInterface({
  isActive,
  onSpeakResponse,
  voiceTranscript,
  onVoiceTranscriptProcessed,
  onSearchStart,
  onSearchEnd,
  className = "",
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  const detectSearchIntent = (message: string): boolean => {
    const searchKeywords = [
      "current",
      "latest",
      "recent",
      "today",
      "now",
      "search",
      "look up",
      "find",
      "what's happening",
      "news",
      "weather",
      "stock",
      "price",
    ]
    return searchKeywords.some((keyword) => message.toLowerCase().includes(keyword))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isActive || !input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    // Check if this might need search
    if (detectSearchIntent(input)) {
      setIsSearching(true)
      onSearchStart?.()
    }

    const currentInput = input
    setInput("")

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ""

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.content) {
                  assistantContent += data.content
                  setMessages((prev) =>
                    prev.map((m) => (m.id === assistantMessage.id ? { ...m, content: assistantContent } : m)),
                  )
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      setIsSearching(false)
      onSearchEnd?.()

      // Trigger speech synthesis when response is complete
      if (onSpeakResponse && assistantContent) {
        onSpeakResponse(assistantContent)
      }
    } catch (error) {
      console.error("Chat error:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
      setIsSearching(false)
      onSearchEnd?.()
    }
  }

  useEffect(() => {
    if (voiceTranscript && voiceTranscript.trim()) {
      setInput(voiceTranscript)

      // Check if this might need search
      if (detectSearchIntent(voiceTranscript)) {
        setIsSearching(true)
        onSearchStart?.()
      }

      // Auto-submit voice transcript
      setTimeout(() => {
        const syntheticEvent = new Event("submit") as any
        syntheticEvent.preventDefault = () => {}
        handleSubmit(syntheticEvent)
        onVoiceTranscriptProcessed?.()
      }, 100)
    }
  }, [voiceTranscript, onVoiceTranscriptProcessed, onSearchStart])

  return (
    <Card className={`bg-card/50 backdrop-blur-sm border-primary/20 ${className}`}>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <div className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse" />
          Conversation
        </h3>

        {/* Chat messages */}
        <ScrollArea className="h-64 mb-4 pr-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>Start a conversation with Gentza</p>
                <p className="text-sm mt-2">Try saying: "Hello Gentza, what's the latest news?"</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === "user"
                        ? "bg-primary/20 text-primary-foreground border border-primary/30"
                        : "bg-accent/20 text-accent-foreground border border-accent/30"
                    }`}
                  >
                    <div className="text-xs opacity-70 mb-1">{message.role === "user" ? "You" : "Gentza"}</div>
                    <div className="text-sm leading-relaxed">{message.content}</div>
                  </div>
                </div>
              ))
            )}

            {isSearching && !isLoading && <SearchIndicator isSearching={true} />}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-accent/20 text-accent-foreground border border-accent/30 p-3 rounded-lg">
                  <div className="text-xs opacity-70 mb-1">Gentza</div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-accent rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isActive ? "Ask about current events, weather, news..." : "Activate Gentza first"}
            disabled={!isActive || isLoading}
            className="flex-1 px-4 py-2 bg-input border border-border rounded-lg 
                     text-foreground placeholder-muted-foreground
                     focus:outline-none focus:ring-2 focus:ring-ring
                     disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <Button
            type="submit"
            disabled={!isActive || !input.trim() || isLoading}
            className="px-6 bg-primary/20 hover:bg-primary/30 border border-primary/40 
                     text-primary font-medium transition-all duration-200
                     hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50"
          >
            Send
          </Button>
        </form>
      </div>
    </Card>
  )
}
