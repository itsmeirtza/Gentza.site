"use client"

import React, { useEffect, useRef } from "react"

/**
 * HackerConsole: A React port of the provided "Hacker 3D Console" HTML/JS.
 * Renders two canvases and a console output area with neon-green hacker styling.
 * The effect runs on mount and cleans up all timers, rafs, and listeners on unmount.
 */
export default function HackerConsole() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const barsRef = useRef<HTMLCanvasElement | null>(null)
  const outputRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d")!
    const canvasBars = barsRef.current!
    const ctxBars = canvasBars.getContext("2d")!
    const outputConsole = outputRef.current!

    // Control state (can be adjusted via events)
    let isRunning = true
    let consoleEnabled = true
    let speedMultiplier = 1
    let barsIntensity = 1

    // Load persisted controls if present
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("gentza_controls") : null
      if (saved) {
        const parsed = JSON.parse(saved)
        if (typeof parsed.running === "boolean") isRunning = parsed.running
        if (typeof parsed.consoleEnabled === "boolean") consoleEnabled = parsed.consoleEnabled
        if (typeof parsed.speed === "number") speedMultiplier = parsed.speed
        if (typeof parsed.barsIntensity === "number") barsIntensity = parsed.barsIntensity
      }
    } catch {}

    // Sizes and layout
    const sizeAll = () => {
      canvas.width = (window.innerWidth / 3) * 2
      canvas.height = window.innerHeight / 3
      canvasBars.width = window.innerWidth / 3
      canvasBars.height = canvas.height
      outputConsole.style.height = ((window.innerHeight / 3) * 2).toString() + "px"
      outputConsole.style.top = (window.innerHeight / 3).toString() + "px"
    }

    /* Graphics classes */
    class Point {
      x: number
      y: number
      z: number
      cX = 0
      cY = 0
      cZ = 0
      xPos = 0
      yPos = 0

      constructor(pos: { x: number; y: number; z: number }) {
        this.x = pos.x - canvas.width / 2 || 0
        this.y = pos.y - canvas.height / 2 || 0
        this.z = pos.z || 0
        this.map2D()
      }

      rotateZ(angleZ: number) {
        const cosZ = Math.cos(angleZ)
        const sinZ = Math.sin(angleZ)
        const x1 = this.x * cosZ - this.y * sinZ
        const y1 = this.y * cosZ + this.x * sinZ
        this.x = x1
        this.y = y1
      }

      map2D() {
        const scaleX = focal / (focal + this.z + this.cZ)
        const scaleY = focal / (focal + this.z + this.cZ)
        this.xPos = vpx + (this.cX + this.x) * scaleX
        this.yPos = vpy + (this.cY + this.y) * scaleY
      }
    }

    class Square {
      width: number
      height: number
      points: Point[]
      dist = 0

      constructor(z = 0) {
        this.width = canvas.width / 2
        if (canvas.height < 200) this.width = 200
        this.height = canvas.height
        this.points = [
          new Point({ x: canvas.width / 2 - this.width, y: canvas.height / 2 - this.height, z }),
          new Point({ x: canvas.width / 2 + this.width, y: canvas.height / 2 - this.height, z }),
          new Point({ x: canvas.width / 2 + this.width, y: canvas.height / 2 + this.height, z }),
          new Point({ x: canvas.width / 2 - this.width, y: canvas.height / 2 + this.height, z }),
        ]
      }

      update() {
        for (let p = 0; p < this.points.length; p++) {
          const rot = 0.001 * (isRunning ? speedMultiplier : 0)
          this.points[p].rotateZ(rot)
          this.points[p].z -= 3 * (isRunning ? speedMultiplier : 0)
          if (this.points[p].z < -300) this.points[p].z = 2700
          this.points[p].map2D()
        }
      }

      render() {
        ctx.beginPath()
        ctx.moveTo(this.points[0].xPos, this.points[0].yPos)
        for (let p = 1; p < this.points.length; p++) {
          if (this.points[p].z > -(focal - 50)) ctx.lineTo(this.points[p].xPos, this.points[p].yPos)
        }
        ctx.closePath()
        ctx.stroke()
        this.dist = this.points[this.points.length - 1].z
      }
    }

    // State
    let squares: Square[] = []
    let focal = canvas.width / 2
    let vpx = canvas.width / 2
    let vpy = canvas.height / 2
    const barVals: Array<{ val: number; freq: number; sineVal: number } | undefined> = []

    // Fake console state
    const commandStart = [
      "Performing DNS Lookups for",
      "Searching ",
      "Analyzing ",
      "Estimating Approximate Location of ",
      "Compressing ",
      "Requesting Authorization From : ",
      "wget -a -t ",
      "tar -xzf ",
      "Entering Location ",
      "Compilation Started of ",
      "Downloading ",
    ]
    const commandParts = [
      "Data Structure",
      "http://wwjd.com?au&2",
      "Texture",
      "TPS Reports",
      " .... Searching ... ",
      "http://zanb.se/?23&88&far=2",
      "http://ab.ret45-33/?timing=1ww",
    ]
    const commandResponses = [
      "Authorizing ",
      "Authorized...",
      "Access Granted..",
      "Going Deeper....",
      "Compression Complete.",
      "Compilation of Data Structures Complete..",
      "Entering Security Console...",
      "Encryption Unsuccesful Attempting Retry...",
      "Waiting for response...",
      "....Searching...",
      "Calculating Space Requirements ",
    ]
    let isProcessing = false
    let processTime = 0
    let lastProcess = 0

    // Rendering
    let rafId = 0
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      squares.sort((a, b) => b.dist - a.dist)
      for (let i = 0, len = squares.length; i < len; i++) {
        if (isRunning) squares[i].update()
        squares[i].render()
      }

      ctxBars.clearRect(0, 0, canvasBars.width, canvasBars.height)
      ctxBars.beginPath()
      const y = canvasBars.height / 6
      ctxBars.moveTo(0, y)
      for (let i = 0; i < canvasBars.width; i++) {
        let ran = (Math.random() * 20 - 10) * (isRunning ? barsIntensity : 0)
        if (isRunning && Math.random() > 0.98) ran = (Math.random() * 50 - 25) * barsIntensity
        ctxBars.lineTo(i, y + ran)
      }
      ctxBars.stroke()
      for (let i = 0; i < canvasBars.width; i += 20) {
        if (!barVals[i]) barVals[i] = { val: Math.random() * (canvasBars.height / 2), freq: 0.1, sineVal: Math.random() * 100 }
        barVals[i]!.sineVal += barVals[i]!.freq
        barVals[i]!.val += Math.sin((barVals[i]!.sineVal * Math.PI) / 2) * 5 * (isRunning ? barsIntensity : 0)
        ctxBars.fillRect(i + 5, canvasBars.height, 15, -barVals[i]!.val)
      }

      rafId = window.requestAnimationFrame(render)
    }

    let consoleTimer: number | null = null
    const consoleOutput = () => {
      if (!consoleEnabled) {
        consoleTimer = window.setTimeout(consoleOutput, 300)
        return
      }
      let textEl: HTMLParagraphElement | HTMLSpanElement = document.createElement(isProcessing ? "span" : "p")
      if (isProcessing) {
        textEl.textContent = (Math.random() + " ")
        if (Date.now() > lastProcess + processTime) isProcessing = false
      } else {
        const commandType = Math.floor(Math.random() * 4)
        switch (commandType) {
          case 0:
            textEl.textContent = commandStart[Math.floor(Math.random() * commandStart.length)] +
              commandParts[Math.floor(Math.random() * commandParts.length)]
            break
          case 3:
            isProcessing = true
            processTime = Math.floor(Math.random() * 5000)
            lastProcess = Date.now()
          // fall through
          default:
            textEl.textContent = commandResponses[Math.floor(Math.random() * commandResponses.length)]
            break
        }
      }
      outputConsole.scrollTop = outputConsole.scrollHeight
      outputConsole.appendChild(textEl)
      if (outputConsole.scrollHeight > window.innerHeight) {
        const removeNodes = outputConsole.querySelectorAll("*")
        for (let n = 0; n < Math.floor(removeNodes.length / 3); n++) outputConsole.removeChild(removeNodes[n])
      }
      const safe = Math.max(0.1, speedMultiplier)
      consoleTimer = window.setTimeout(consoleOutput, Math.floor((Math.random() * 200) / safe))
    }

    const init = () => {
      sizeAll()
      focal = canvas.width / 2
      vpx = canvas.width / 2
      vpy = canvas.height / 2
      squares = []
      for (let i = 0; i < 15; i++) squares.push(new Square(-300 + i * 200))
      ctx.strokeStyle = "#00FF00"
      ctxBars.strokeStyle = "#00FF00"
      ctxBars.fillStyle = "#00FF00"
      // Start loops
      rafId = window.requestAnimationFrame(render)
      consoleOutput()
    }

    init()

    // Controls event listener
    const onControls = (ev: Event) => {
      const e = ev as CustomEvent<any>
      const d = e.detail || {}
      if (d.action === "set" && d.payload) {
        const p = d.payload
        if (typeof p.running === "boolean") isRunning = p.running
        if (typeof p.consoleEnabled === "boolean") consoleEnabled = p.consoleEnabled
        if (typeof p.speed === "number") speedMultiplier = p.speed
        if (typeof p.barsIntensity === "number") barsIntensity = p.barsIntensity
        try {
          const toSave = JSON.stringify({ running: isRunning, consoleEnabled, speed: speedMultiplier, barsIntensity })
          localStorage.setItem("gentza_controls", toSave)
        } catch {}
      } else if (d.action === "clearConsole") {
        if (outputConsole) outputConsole.innerHTML = ""
      }
    }
    window.addEventListener("gentza-controls", onControls as EventListener)

    const onResize = () => {
      sizeAll()
      focal = canvas.width / 2
      vpx = canvas.width / 2
      vpy = canvas.height / 2
      ctx.strokeStyle = "#00FF00"
      ctxBars.strokeStyle = "#00FF00"
      ctxBars.fillStyle = "#00FF00"
    }
    window.addEventListener("resize", onResize)

    return () => {
      window.removeEventListener("gentza-controls", onControls as EventListener)
      window.removeEventListener("resize", onResize)
      if (rafId) cancelAnimationFrame(rafId)
      if (consoleTimer) clearTimeout(consoleTimer)
      // Clear DOM output
      if (outputConsole) outputConsole.innerHTML = ""
    }
  }, [])

return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        color: "#00FF00",
        zIndex: -1,
        pointerEvents: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        className="hacker-3d-shiz"
        style={{ position: "absolute", top: 0, left: 0 }}
      />
      <canvas
        ref={barsRef}
        className="bars-and-stuff"
        style={{ position: "absolute", top: 0, left: "66.6%" }}
      />
      <div
        ref={outputRef}
        className="output-console"
        style={{
          position: "fixed",
          overflow: "hidden",
          left: 0,
          right: 0,
          padding: "8px 12px",
          fontSize: 13,
          lineHeight: 1.35,
          fontFamily: 'Source Code Pro, SF Mono, Monaco, Menlo, Consolas, "Courier New", monospace',
        }}
      />
    </div>
  )
}
