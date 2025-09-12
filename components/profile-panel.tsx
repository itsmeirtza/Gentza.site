"use client"

import React, { useEffect, useMemo, useState } from "react"

function ResumeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [html, setHtml] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError(null)
    fetch("/api/irtza-resume")
      .then(async (r) => {
        if (!r.ok) throw new Error("failed")
        const t = await r.text()
        setHtml(t)
      })
      .catch(() => setError("Failed to load resume"))
      .finally(() => setLoading(false))
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-card text-foreground border rounded-xl w-[92vw] max-w-4xl h-[80vh] shadow-xl pop-in overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-mono text-sm">Irtza Ali Waris — Resume</h3>
          <button className="px-2 py-1 text-xs rounded border hover:bg-muted" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="h-full overflow-auto p-4">
          {loading && (
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          )}
          {error && <div className="text-destructive">{error}</div>}
          {!loading && !error && (
            <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
          )}
        </div>
      </div>
    </div>
  )
}

export function ProfilePanel() {
  const [open, setOpen] = useState(false)

  const avatarUrl = useMemo(
    () => "https://avatars.githubusercontent.com/u/177459984?v=4",
    []
  )

  return (
    <>
      <div className="fixed top-20 right-4 z-[1500] slide-in-right">
        <div className="bg-card/90 backdrop-blur border rounded-2xl shadow-lg p-4 w-[280px] pulse-border">
          <div className="flex flex-col items-center text-center gap-3">
            <img
              src={avatarUrl}
              alt="Irtza Ali Waris"
              className="w-24 h-24 rounded-full object-cover border"
            />
            <div>
              <h2 className="text-2xl font-bold text-primary">Irtza Ali Waris</h2>
              <p className="text-sm text-muted-foreground mt-1">"With Every Step, You're Shaping Your Future (Stay Blessed...😊)"</p>
            </div>
            <button
              className="mt-2 inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition shadow-md"
              onClick={() => setOpen(true)}
            >
              Resume
            </button>
          </div>
        </div>
      </div>

      <ResumeModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
