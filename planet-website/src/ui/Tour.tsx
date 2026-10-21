import { useEffect, useRef } from 'react'
import { stations } from '../content/stations'
import { TOUR } from '../content/tour'
import { go } from './route'
import { StationDetails } from './StationDetails'
import { tour, ui } from './store'

const stops = TOUR.map((id) => stations.find((station) => station.id === id)!)

// The page for the flight round the planet: a screen's height per stop,
// with each station's card on the side the camera leaves free. Scrolling
// is what flies the camera.
export function Tour() {
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = scroller.current!
    element.scrollTop = tour.position * element.clientHeight
    element.focus({ preventScroll: true })
  }, [])

  const onScroll = () => {
    const element = scroller.current!
    tour.position = element.scrollTop / element.clientHeight
  }

  return (
    <div ref={scroller} className="tour" tabIndex={-1} onScroll={onScroll}>
      <section className="tour-stop tour-intro">
        <div className="tour-card tour-card-left">
          <p className="panel-kind">Rundflug</p>
          <h2 className="panel-title">Hallo, ich bin Jan.</h2>
          <p className="panel-text">
            Das hier ist mein kleiner Forscher-Planet. Scroll los – die Kamera fliegt dich von Station zu Station.
          </p>
          <p className="tour-hint" aria-hidden="true">
            Scrollen <span>↓</span>
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
                  Mehr
                </button>
              )}
            </StationDetails>
          </article>
        </section>
      ))}

      <section className="tour-stop tour-outro">
        <div className="tour-card tour-card-center">
          <p className="panel-kind">Ende des Rundflugs</p>
          <h2 className="panel-title">Danke fürs Mitfliegen!</h2>
          <p className="panel-text">Lust, den Planeten selbst zu erkunden? Auf ihm gibt es noch mehr zu entdecken.</p>
          <div className="panel-actions">
            <button className="panel-link" onClick={() => go('drive')}>
              Selbst fahren
            </button>
            <button className="panel-close" onClick={() => go('text')}>
              Alles als Text
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
