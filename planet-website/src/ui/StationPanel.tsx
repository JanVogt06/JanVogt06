import { useEffect, useRef, useState } from 'react'
import { lang, t } from '../content/lang'
import type { Station } from '../content/stations'
import { hashFor } from './route'
import { StationDetails } from './StationDetails'
import { ui, useUi } from './store'

// A link to the station in the tour, which works on any device. Phones
// offer it to their share sheet; elsewhere it goes on the clipboard.
function Share({ station }: { station: Station }) {
  const [copied, setCopied] = useState(false)
  const share = async () => {
    const url = `${location.origin}${lang === 'en' ? '/en/' : '/'}${hashFor('tour', station.id)}`
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      await navigator.share({ title: `${station.title} – Jan Vogt`, url }).catch(() => {})
      return
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button className="panel-close panel-share" onClick={share} aria-live="polite">
      {copied ? t.panel.copied : t.panel.share}
    </button>
  )
}

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
            <Share station={station} />
            <button ref={close} className="panel-close" onClick={() => ui.set({ open: null })}>
              {mode === 'drive' ? t.panel.drive : t.panel.close} <kbd>Esc</kbd>
            </button>
          </StationDetails>
        </div>
      </article>
    </div>
  )
}
