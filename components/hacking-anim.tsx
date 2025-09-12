"use client"

export function HackingAnim() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
      {/* Vertical code rain columns */}
      {Array.from({ length: 14 }).map((_, i) => (
        <div
          key={i}
          className="absolute top-[-120vh] text-primary/20 text-[10px] md:text-xs font-mono hacking-column"
          style={{
            left: `${(i + 1) * (100 / 15)}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${6 + Math.random() * 6}s`,
          }}
        >
          {Array.from({ length: 120 }).map((_, j) => (
            <div key={j}>{j % 3 === 0 ? "01" : String.fromCharCode(0x30A0 + ((i * j) % 90))}</div>
          ))}
        </div>
      ))}

      {/* Horizontal scan sweeps */}
      <div className="absolute inset-0">
        <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent hacking-scan" />
        <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-secondary/30 to-transparent hacking-scan" style={{ animationDelay: '1.2s' }} />
      </div>
    </div>
  )
}
