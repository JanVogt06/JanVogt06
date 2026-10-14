import { useEffect, useRef } from 'react'
import type { Station } from '../content/stations'
import { ui, useUi } from './store'

const KINDS: Record<Station['kind'], string> = {
  about: 'Über mich',
  project: 'Projekt',
  engagement: 'Engagement',
  awards: 'Auszeichnungen',
  contact: 'Kontakt',
}

// Everything about a station, laid over the paused game.
export function StationPanel() {
  const { open: station } = useUi()
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
        aria-labelledby="panel-title"
        style={{ '--accent': station.colour } as React.CSSProperties}
        onClick={(event) => event.stopPropagation()}
      >
        {station.image && <img className="panel-image" src={station.image.src} alt={station.image.alt} />}
        <div className="panel-content">
          <p className="panel-kind">{KINDS[station.kind]}</p>
          <h2 id="panel-title" className="panel-title">
            {station.title}
          </h2>
          <p className="panel-tagline">{station.tagline}</p>

          {station.body.map((paragraph) => (
            <p key={paragraph} className="panel-text">
              {paragraph}
            </p>
          ))}

          {station.facts && (
            <ul className="panel-facts">
              {station.facts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          )}

          {station.tech && (
            <ul className="panel-tech" aria-label="Technologien">
              {station.tech.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          )}

          <div className="panel-actions">
            {station.links?.map((link) => (
              <a key={link.href} className="panel-link" href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            ))}
            <button ref={close} className="panel-close" onClick={() => ui.set({ open: null })}>
              Weiterfahren <kbd>Esc</kbd>
            </button>
          </div>
        </div>
      </article>
    </div>
  )
}
