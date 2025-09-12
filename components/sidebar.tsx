"use client"

import { useEffect, useState } from "react"

export interface ChatMeta {
  id: string
  title: string
  createdAt: number
}

function loadChats(): ChatMeta[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem("gentza.chats")
    return raw ? (JSON.parse(raw) as ChatMeta[]) : []
  } catch {
    return []
  }
}

function saveChats(chats: ChatMeta[]) {
  try {
    localStorage.setItem("gentza.chats", JSON.stringify(chats))
  } catch {}
}

export function Sidebar({ activeId, onSelect, onNew, onDelete }: {
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
}) {
  const [chats, setChats] = useState<ChatMeta[]>(loadChats())

  useEffect(() => {
    setChats(loadChats())
  }, [activeId])

  const handleNew = () => {
    onNew()
    setTimeout(() => setChats(loadChats()), 0)
  }

  const handleDelete = (id: string) => {
    const filtered = chats.filter((c) => c.id !== id)
    saveChats(filtered)
    setChats(filtered)
    onDelete(id)
  }

  return (
    <aside className="w-64 hidden md:flex flex-col border-r border-border bg-card/40">
      <div className="p-3 flex items-center justify-between">
        <div className="font-mono text-sm text-muted-foreground">Sessions</div>
        <button onClick={handleNew} className="text-xs px-2 py-1 border rounded hover:bg-foreground/10">New</button>
      </div>
      <div className="flex-1 overflow-auto">
        {chats.length === 0 ? (
          <div className="p-3 text-xs text-muted-foreground">No chats yet</div>
        ) : (
          <ul>
            {chats.map((c) => (
              <li key={c.id} className={`group flex items-center justify-between px-3 py-2 cursor-pointer ${activeId === c.id ? "bg-primary/10" : "hover:bg-foreground/5"}`}>
                <button onClick={() => onSelect(c.id)} className="flex-1 text-left truncate text-sm">
                  {c.title || "Untitled"}
                </button>
                <button onClick={() => handleDelete(c.id)} className="opacity-0 group-hover:opacity-100 text-xs px-2 py-1 border rounded hover:bg-foreground/10">Del</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}

export function createChat(title = "New chat"): ChatMeta {
  const id = `c_${Date.now()}`
  const meta: ChatMeta = { id, title, createdAt: Date.now() }
  const list = loadChats()
  list.unshift(meta)
  saveChats(list)
  return meta
}

export function renameChat(id: string, title: string) {
  const list = loadChats()
  const idx = list.findIndex((c) => c.id === id)
  if (idx >= 0) {
    list[idx] = { ...list[idx], title }
    saveChats(list)
  }
}
