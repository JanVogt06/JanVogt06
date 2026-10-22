import { useEffect, useRef } from 'react'
import { t } from '../content/lang'
import { stations } from '../content/stations'
import { TOUR } from '../content/tour'
import { go, point } from './route'
import { StationDetails } from './StationDetails'
import { tour, ui } from './store'

const stops = TOUR.map((id) => stations.find((station) => station.id === id)!)

// The page for the flight round the planet: a screen's height per stop,
// with each station's card on the side the camera leaves free. Scrolling
// is what flies the camera.
export function Tour() {
  const scroller = useRef<HTMLDivElement>(null)

  // Starts at the station the address names, if any, else where the tour
  // was left.
  useEffect(() => {
    const element = scroller.current!
    const { focus } = ui.get()
    const stop = focus ? TOUR.indexOf(focus) + 1 : 0
    if (stop > 0) tour.position = stop
    element.scrollTop = tour.position * element.clientHeight
    element.focus({ preventScroll: true })
  }, [])

  // The address follows the station in view, so it can be shared as is.
  const onScroll = () => {
    const element = scroller.current!
    tour.position = element.scrollTop / element.clientHeight
    point('tour', TOUR[Math.round(tour.position) - 1] ?? null)
  }

  return (
    <div ref={scroller} className="tour" tabIndex={-1} onScroll={onScroll}>
      <section className="tour-stop tour-intro">
        <div className="tour-card tour-card-left">
          <p className="panel-kind">{t.tour.kind}</p>
          <h2 className="panel-title">{t.tour.title}</h2>
          <p className="panel-text">{t.tour.text}</p>
          <p className="tour-hint" aria-hidden="true">
            {t.tour.hint} <span>↓</span>
          </p>
        </div>
      </section>

      {stops.map((station, i) => (
        <section key={station.id} className="tour-stop" aria-label={station.title}>
          <article
            className={`tour-card ${i % 2 === 0 ? 'tour-card-right' : 'tour-card-left'}`}
            style={{ '--accent': station.colour } as React.CSSProperties}
          >
            {station.image && (
              <img
                className="tour-image"
                src={station.image.src}
                alt={station.image.alt}
                loading="lazy"
                style={{ objectPosition: station.image.focus }}
              />
            )}
            <StationDetails station={station} brief>
              {(station.body.length > 1 || station.image) && (
                <button className="panel-close" onClick={() => ui.set({ open: station })}>
                  {t.panel.more}
                </button>
              )}
            </StationDetails>
          </article>
        </section>
      ))}

      <section className="tour-stop tour-outro">
        <div className="tour-card tour-card-center">
          <p className="panel-kind">{t.tour.endKind}</p>
          <h2 className="panel-title">{t.tour.endTitle}</h2>
          <p className="panel-text">{t.tour.endText}</p>
          <div className="panel-actions">
            <button className="panel-link" onClick={() => go('drive')}>
              {t.tour.drive}
            </button>
            <button className="panel-close" onClick={() => go('text')}>
              {t.tour.read}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
