"use client"

import { useState } from "react"

export function NamePrompt({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange?: (open: boolean) => void
  onSubmit: (name: string) => void
}) {
  const [name, setName] = useState("")

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in"
        onClick={() => onOpenChange?.(false)}
      />

      {/* Modal */}
      <div className="relative z-10 w-[90%] max-w-md rounded-lg border border-border bg-card p-6 shadow-2xl system-boot">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-mono font-bold text-primary neon-glow">IDENTIFICATION REQUIRED</h2>
          <p className="mt-1 text-sm text-muted-foreground font-mono">Apna naam batayein / Please enter your name</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            const trimmed = name.trim()
            if (trimmed.length === 0) return
            onSubmit(trimmed)
            onOpenChange?.(false)
          }}
          className="space-y-4"
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Irtza"
            className="w-full rounded-md border border-border bg-input px-4 py-2 font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenChange?.(false)}
              className="px-4 py-2 rounded-md border border-border text-sm font-mono text-muted-foreground hover:bg-muted/40 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-mono font-bold hover:opacity-90 transition shadow"
            >
              Continue
            </button>
          </div>
        </form>

        {/* Decorative scan line */}
        <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/40 to-transparent scan-line" />
      </div>
    </div>
  )
}
