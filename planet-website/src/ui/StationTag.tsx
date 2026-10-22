import { useEffect, useRef } from 'react'
import { t } from '../content/lang'
import { tag, useUi } from './store'

// The station's name, floating above it while the rover is close, with a bar
// that fills while the rover holds still in the bay.
export function StationTag() {
  const { nearby, open } = useUi()
  const element = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let frame = 0
    const follow = () => {
      if (element.current && bar.current) {
        // On narrow screens the minimap and the touch legend fill the top, so
        // the tag keeps below them.
        const y = window.innerWidth < 520 ? Math.max(tag.y, 262) : tag.y
        element.current.style.transform = `translate(${tag.x}px, ${y}px) translate(-50%, -100%)`
        element.current.style.visibility = tag.onScreen ? 'visible' : 'hidden'
        bar.current.style.transform = `scaleX(${tag.progress})`
      }
      frame = requestAnimationFrame(follow)
    }
    follow()
    return () => cancelAnimationFrame(frame)
  }, [])

  const shown = nearby && !open
  return (
    <div ref={element} className="tag" data-shown={Boolean(shown)} aria-live="polite">
      {nearby && (
        <>
          <span className="tag-title">{nearby.title}</span>
          <span className="tag-hint">{t.tag.park}</span>
          <div className="tag-track">
            <div ref={bar} className="tag-bar" style={{ background: nearby.colour }} />
          </div>
        </>
      )}
    </div>
  )
}
