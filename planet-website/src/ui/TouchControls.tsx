import { useEffect, useRef, useState } from 'react'
import { touch, useUi } from './store'

const REACH = 48

const coarse = () => window.matchMedia('(pointer: coarse)').matches

// A thumb stick on the left for throttle and steering, and buttons on the
// right for boost, jumping and getting back on the wheels. Shown on touch
// screens only.
export function TouchControls() {
  const [shown, setShown] = useState(coarse)
  const { open } = useUi()
  const knob = useRef<HTMLDivElement>(null)
  const origin = useRef<{ id: number; x: number; y: number } | null>(null)

  useEffect(() => {
    const query = window.matchMedia('(pointer: coarse)')
    const change = () => setShown(query.matches)
    query.addEventListener('change', change)
    return () => query.removeEventListener('change', change)
  }, [])

  // A panel takes the controls away mid-touch, so let go of everything.
  useEffect(() => {
    if (!open) return
    origin.current = null
    touch.x = touch.y = 0
    touch.boost = false
  }, [open])

  const move = (x: number, y: number) => {
    const length = Math.hypot(x, y)
    const scale = length > REACH ? REACH / length : 1
    x *= scale
    y *= scale
    if (knob.current) knob.current.style.transform = `translate(${x}px, ${y}px)`
    touch.x = x / REACH
    touch.y = -y / REACH
  }

  const release = () => {
    origin.current = null
    move(0, 0)
  }

  if (!shown || open) return null
  return (
    <div className="touch">
      <div
        className="touch-stick"
        onPointerDown={(event) => {
          // Keeps the stick following a thumb that slides off it; a pointer
          // the browser no longer tracks cannot be captured, which is fine.
          try {
            event.currentTarget.setPointerCapture(event.pointerId)
          } catch {}
          const rect = event.currentTarget.getBoundingClientRect()
          origin.current = { id: event.pointerId, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
          move(event.clientX - origin.current.x, event.clientY - origin.current.y)
        }}
        onPointerMove={(event) => {
          if (origin.current?.id === event.pointerId) move(event.clientX - origin.current.x, event.clientY - origin.current.y)
        }}
        onPointerUp={release}
        onPointerCancel={release}
      >
        <div ref={knob} className="touch-knob" />
      </div>

      <div className="touch-buttons">
        <button
          className="touch-button touch-boost"
          onPointerDown={() => (touch.boost = true)}
          onPointerUp={() => (touch.boost = false)}
          onPointerCancel={() => (touch.boost = false)}
          onPointerLeave={() => (touch.boost = false)}
        >
          Boost
        </button>
        <button className="touch-button touch-jump" onPointerDown={() => touch.jumps++}>
          Springen
        </button>
        <button className="touch-button touch-reset" aria-label="Aufrichten" onPointerDown={() => touch.resets++}>
          ↻
        </button>
      </div>
    </div>
  )
}
