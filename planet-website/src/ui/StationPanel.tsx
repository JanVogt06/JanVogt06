import { useEffect, useRef } from 'react'
import { StationDetails } from './StationDetails'
import { ui, useUi } from './store'

// Everything about a station, laid over the paused world.
export function StationPanel() {
  const { open: station, mode } = useUi()
  const close = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!station) return
    close.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') ui.set({ open: null })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [station])

  if (!station) return null
  return (
    <div className="panel-backdrop" onClick={() => ui.set({ open: null })}>
      <article
        className="panel"
        role="dialog"
        aria-modal="true"
        aria-label={station.title}
        style={{ '--accent': station.colour } as React.CSSProperties}
        onClick={(event) => event.stopPropagation()}
      >
        {station.image && (
          <img
            className="panel-image"
            src={station.image.src}
            alt={station.image.alt}
            style={{ objectPosition: station.image.focus }}
          />
        )}
        <div className="panel-content">
          <StationDetails station={station}>
            <button ref={close} className="panel-close" onClick={() => ui.set({ open: null })}>
              {mode === 'drive' ? 'Weiterfahren' : 'Schließen'} <kbd>Esc</kbd>
            </button>
          </StationDetails>
        </div>
      </article>
    </div>
  )
}
