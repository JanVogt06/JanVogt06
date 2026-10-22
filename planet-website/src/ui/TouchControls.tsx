import { useEffect, useRef, useState } from 'react'
import { t } from '../content/lang'
import { drag, touch, useUi } from './store'

// How far a full drag reaches, in pixels; the boost starts beyond it.
const RADIUS = 70
const BOOST = 1.3
const DOUBLE_TAP = 300
const TAP_SLOP = 12

const coarse = () => window.matchMedia('(pointer: coarse)').matches

// Touch screens drive by pointing: put a thumb down anywhere and drag the way
// to go. A ring marks where the thumb landed and a dot where it is now. Two
// quick taps jump. A small legend explains it all.
export function TouchControls() {
  const [shown, setShown] = useState(coarse)
  const { open } = useUi()
  const ring = useRef<HTMLDivElement>(null)
  const dot = useRef<HTMLDivElement>(null)
  const start = useRef<{ id: number; x: number; y: number; at: number } | null>(null)
  const lastTap = useRef(0)

  useEffect(() => {
    const query = window.matchMedia('(pointer: coarse)')
    const change = () => setShown(query.matches)
    query.addEventListener('change', change)
    return () => query.removeEventListener('change', change)
  }, [])

  const letGo = () => {
    start.current = null
    drag.active = false
    drag.x = drag.y = 0
    if (ring.current) ring.current.dataset.visible = 'false'
  }

  // A panel takes the controls away mid-drag, so let go of everything.
  useEffect(() => {
    if (open) letGo()
  }, [open])

  const follow = (x: number, y: number) => {
    if (!ring.current || !dot.current || !start.current) return
    const dx = x - start.current.x
    const dy = y - start.current.y
    const reach = Math.hypot(dx, dy) / RADIUS
    // The dot stops at the ring's edge, a little past it when boosting.
    const shrink = Math.min(reach, BOOST) / Math.max(reach, 1e-6)
    ring.current.style.transform = `translate(${start.current.x}px, ${start.current.y}px)`
    ring.current.dataset.boost = String(reach > BOOST)
    dot.current.style.transform = `translate(${dx * shrink}px, ${dy * shrink}px)`
    drag.x = dx / RADIUS
    drag.y = -dy / RADIUS
  }

  if (!shown || open) return null
  return (
    <>
      <div
        className="touch-pad"
        onPointerDown={(event) => {
          if (start.current) return
          // Keeps following a thumb that slides off the pad; a pointer the
          // browser no longer tracks cannot be captured, which is fine.
          try {
            event.currentTarget.setPointerCapture(event.pointerId)
          } catch {}
          start.current = { id: event.pointerId, x: event.clientX, y: event.clientY, at: performance.now() }
          drag.active = drag.used = true
          if (ring.current) ring.current.dataset.visible = 'true'
          follow(event.clientX, event.clientY)
        }}
        onPointerMove={(event) => {
          if (start.current?.id === event.pointerId) follow(event.clientX, event.clientY)
        }}
        onPointerUp={(event) => {
          const from = start.current
          if (from?.id !== event.pointerId) return
          // A short touch that barely moved is a tap; two in a row jump.
          const quick = performance.now() - from.at < 250
          const still = Math.hypot(event.clientX - from.x, event.clientY - from.y) < TAP_SLOP
          if (quick && still) {
            if (performance.now() - lastTap.current < DOUBLE_TAP) {
              touch.jumps++
              lastTap.current = 0
            } else lastTap.current = performance.now()
          }
          letGo()
        }}
        onPointerCancel={letGo}
      />
      <div ref={ring} className="touch-ring" data-visible="false" aria-hidden="true">
        <div ref={dot} className="touch-dot" />
      </div>

      <ul className="touch-legend">
        {t.touch.map(([gesture, action]) => (
          <li key={gesture}>
            <b>{gesture}</b> {action}
          </li>
        ))}
      </ul>
      <button className="touch-reset" aria-label={t.chrome.keys.reset} onPointerDown={() => touch.resets++}>
        ↻
      </button>
    </>
  )
}
