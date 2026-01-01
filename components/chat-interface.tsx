"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

function extractCommandSnippets(text: string): { label: string; code: string }[] {
  const snippets: { label: string; code: string }[] = []

  // 1) Fenced code blocks ```
  const fenceRegex = /```[a-zA-Z0-9-]*\n([\s\S]*?)```/g
  let m
  while ((m = fenceRegex.exec(text)) !== null) {
    const code = m[1].trim()
    if (code) snippets.push({ label: "Code", code })
  }

  // 2) Inline code `...`
  const inlineRegex = /`([^`]+)`/g
  let mi
  while ((mi = inlineRegex.exec(text)) !== null) {
    const code = mi[1].trim()
    if (code) snippets.push({ label: "Inline", code })
  }

  // 3) Lines that look like shell commands (start with $, >, or typical command pattern)
  const lines = text.split(/\n+/)
  for (const line of lines) {
    const l = line.trim()
    if (/^(\$|>|sudo\s+|npm\s+|pnpm\s+|yarn\s+|git\s+|npx\s+|node\s+)/i.test(l)) {
      const cleaned = l.replace(/^[$>\s]+/, "").trim()
      if (cleaned) snippets.push({ label: "Command", code: cleaned })
    }
  }

  // Deduplicate identical snippets
  const seen = new Set<string>()
  return snippets.filter(s => {
    if (seen.has(s.code)) return false
    seen.add(s.code)
    return true
  })
}

interface ChatInterfaceProps {
  isActive?: boolean
  className?: string
  userName?: string
}

export function ChatInterface({ isActive = false, className = "", userName }: ChatInterfaceProps) {
  const storageKey = `gentza.messages`
  const [messages, setMessages] = useState<{ id: string; role: "user" | "assistant"; content: string }[]>(() => {
    if (typeof window === "undefined") return []
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? (JSON.parse(raw) as { id: string; role: "user" | "assistant"; content: string }[]) : []
    } catch {
      return []
    }
  })
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Persist messages and auto-scroll
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages))
    } catch {}
    
    // Auto-scroll to bottom when messages change
    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight
      }
    }, 100)
  }, [messages])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {}
  }

  const send = async () => {
    if (!isActive || !input.trim() || loading) return
    const content = input.trim()
    const user = { id: Date.now().toString(), role: "user" as const, content }
      setMessages((m) => [...m, user])
    setInput("")
    setLoading(true)
    // Scroll to bottom and focus immediately after sending
    setTimeout(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
      if (inputRef.current) inputRef.current.focus()
    }, 0)
    try {
      const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }))
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, name: userName || undefined, history }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Request failed")
      const reply = (data?.reply || "").toString()

      // Simulate streaming: reveal text gradually
      const id = (Date.now() + 1).toString()
      setStreamingId(id)
      setMessages((m) => [...m, { id, role: "assistant", content: "" }])
      for (let i = 1; i <= reply.length; i += Math.max(1, Math.floor(reply.length / 60))) {
        const slice = reply.slice(0, i)
        setMessages((m) => m.map((x) => (x.id === id ? { ...x, content: slice } : x)))
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
        await new Promise((r) => setTimeout(r, 16))
      }
      setMessages((m) => m.map((x) => (x.id === id ? { ...x, content: reply } : x)))
      setStreamingId(null)
      // Scroll to bottom after assistant replies
      setTimeout(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
        if (inputRef.current) inputRef.current.focus()
      }, 0)
    } catch (e) {
      setMessages((m) => [
        ...m,
        { id: (Date.now() + 1).toString(), role: "assistant", content: "System error — please try again." },
      ])
    } finally {
      setLoading(false)
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    void send()
  }

  // Keep input focused when active
  useEffect(() => {
    if (isActive && inputRef.current) inputRef.current.focus()
  }, [isActive])

  const renderMessage = (m: { id: string; role: "user" | "assistant"; content: string }) => {
    const snippets = m.role === "assistant" ? extractCommandSnippets(m.content) : []
    return (
      <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
        <div
          className={`relative max-w-[80%] p-3 rounded-lg ${
            m.role === "user"
              ? "bg-primary/20 text-primary-foreground border border-primary/30"
              : "bg-accent/20 text-accent-foreground border border-accent/30"
          }`}
        >
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {m.content}
          </div>
          {snippets.length > 0 && (
            <div className="mt-3 space-y-2">
              {snippets.map((s, i) => (
                <div key={i} className="flex items-center bg-background/40 border border-border rounded">
                  <div className="px-2 py-1 text-xs text-muted-foreground border-r border-border w-20 shrink-0">{s.label}</div>
                  <div className="px-3 py-2 text-xs font-mono overflow-x-auto flex-1">{s.code}</div>
                  <button
                    onClick={() => copyToClipboard(s.code)}
                    className="px-2 py-1 text-xs hover:bg-foreground/10"
                    title="Copy command"
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className={`bg-card/50 backdrop-blur-sm border-primary/20 ${className}`}>
      <div className="p-3 md:p-6">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center">
            <div className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse" />
            Chat Assistance {userName ? `(${userName})` : "(ChatGPT)"}
          </h3>
          <div className="space-x-2">
            <button
              onClick={() => setMessages([])}
              className="text-xs px-2 py-1 border rounded hover:bg-foreground/10"
              title="Clear"
            >
              Clear
            </button>
          </div>
        </div>

        <ScrollArea className="h-[50vh] md:h-[60vh] mb-4 pr-4" viewportRef={listRef as any}>
          <div className="space-y-4 px-1">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>{isActive ? "Say hello to begin." : "Activate Gentza to begin."}</p>
              </div>
            ) : (
              messages.map(renderMessage)
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-accent/20 text-accent-foreground border border-accent/30 p-3 rounded-lg">
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

        <form onSubmit={submit} className="sticky bottom-0 left-0 right-0 bg-card/60 backdrop-blur p-2 rounded-md flex space-x-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                void send()
              }
            }}
            placeholder={isActive ? `Send a message${userName ? ", " + userName : ""} (Shift+Enter for new line)` : "Activate Gentza to start chatting"}
            disabled={!isActive || loading || streamingId !== null}
            className="flex-1 px-4 py-2 bg-input border border-border rounded-lg 
                     text-foreground placeholder-muted-foreground
                     focus:outline-none focus:ring-2 focus:ring-ring
                     disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!isActive || loading || !input.trim() || streamingId !== null}
            className="px-6 bg-primary/20 hover:bg-primary/30 border border-primary/40 
                     text-primary font-medium transition-all duration-200 rounded-lg
                     hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </Card>
  )
}
