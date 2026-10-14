import { useEffect, useRef } from 'react'
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
        element.current.style.transform = `translate(${tag.x}px, ${tag.y}px) translate(-50%, -100%)`
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
          <span className="tag-hint">In der Zone parken</span>
          <div className="tag-track">
            <div ref={bar} className="tag-bar" style={{ background: nearby.colour }} />
          </div>
        </>
      )}
    </div>
  )
}
