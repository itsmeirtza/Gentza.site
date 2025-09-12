"use client"

import { useEffect, useState } from "react"

const THEMES = [
  { id: "hacker", label: "Hacker" },
  { id: "matrix", label: "Matrix" },
  { id: "tron", label: "Tron" },
  { id: "amber", label: "Amber" },
]

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<string>("amber")

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("gentza_theme")) || "amber"
    setTheme(saved)
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", saved)
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("gentza_theme", theme)
    }
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme)
    }
  }, [theme])

  return (
    <div
      className="fixed top-3 right-3 z-[1000]"
      style={{ backdropFilter: "blur(6px)" }}
    >
      <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-card/70 text-foreground text-xs font-mono">
        <span className="opacity-70">Theme:</span>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="bg-transparent outline-none border border-border rounded px-2 py-1"
        >
          {THEMES.map((t) => (
            <option key={t.id} value={t.id} className="bg-background text-foreground">
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Controls row */}
      <div className="mt-2 grid grid-cols-2 gap-2 px-3 py-2 rounded-md border bg-card/70 text-foreground text-[10px] font-mono">
        <button
          className="px-2 py-1 rounded border hover:bg-muted"
          onClick={() => {
            const ev = new CustomEvent("gentza-controls", { detail: { action: "set", payload: { running: true } } })
            window.dispatchEvent(ev)
          }}
        >
          Run
        </button>
        <button
          className="px-2 py-1 rounded border hover:bg-muted"
          onClick={() => {
            const ev = new CustomEvent("gentza-controls", { detail: { action: "set", payload: { running: false } } })
            window.dispatchEvent(ev)
          }}
        >
          Pause
        </button>
        <button
          className="px-2 py-1 rounded border hover:bg-muted col-span-2"
          onClick={() => {
            const ev = new CustomEvent("gentza-controls", { detail: { action: "clearConsole" } })
            window.dispatchEvent(ev)
          }}
        >
          Clear Console
        </button>
        <label className="flex items-center gap-2 col-span-2">
          <span>Speed</span>
          <input
            type="range"
            min={0}
            max={3}
            step={0.1}
            defaultValue={1}
            onChange={(e) => {
              const val = Number(e.target.value)
              const ev = new CustomEvent("gentza-controls", { detail: { action: "set", payload: { speed: val } } })
              window.dispatchEvent(ev)
            }}
          />
        </label>
        <label className="flex items-center gap-2 col-span-2">
          <span>Bars</span>
          <input
            type="range"
            min={0}
            max={3}
            step={0.1}
            defaultValue={1}
            onChange={(e) => {
              const val = Number(e.target.value)
              const ev = new CustomEvent("gentza-controls", { detail: { action: "set", payload: { barsIntensity: val } } })
              window.dispatchEvent(ev)
            }}
          />
        </label>
        <label className="flex items-center gap-2 col-span-2">
          <input
            type="checkbox"
            defaultChecked={true}
            onChange={(e) => {
              const ev = new CustomEvent("gentza-controls", { detail: { action: "set", payload: { consoleEnabled: e.target.checked } } })
              window.dispatchEvent(ev)
            }}
          />
          <span>Show Console</span>
        </label>
      </div>
    </div>
  )
}
