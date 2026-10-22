import { useEffect, useRef, useState } from 'react'
import { t } from '../content/lang'
import { stations } from '../content/stations'
import { TOUR } from '../content/tour'
import { go, point } from './route'
import { calm } from './motion'
import { StationDetails } from './StationDetails'
import { tour, ui } from './store'

const stops = TOUR.map((id) => stations.find((station) => station.id === id)!)
// The intro, the stations and the end, as the dots name them.
const names = [t.tour.kind, ...stops.map((station) => station.title), t.tour.endKind]

// The page for the flight round the planet: a screen's height per stop,
// with each station's card on the side the camera leaves free. Scrolling
// is what flies the camera.
export function Tour() {
  const scroller = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState(0)
  // The stop a key or dot is heading for, while the page glides there.
  const heading = useRef<number | null>(null)

  // Starts at the station the address names, if any, else where the tour
  // was left.
  useEffect(() => {
    const element = scroller.current!
    const { focus } = ui.get()
    const stop = focus ? TOUR.indexOf(focus) + 1 : 0
    if (stop > 0) tour.position = stop
    element.scrollTop = tour.position * element.clientHeight
    element.focus({ preventScroll: true })
    setCurrent(Math.round(tour.position))
  }, [])

  const visit = (stop: number) => {
    const element = scroller.current!
    const to = Math.max(0, Math.min(names.length - 1, stop))
    heading.current = to
    element.scrollTo({ top: to * element.clientHeight, behavior: calm() ? 'auto' : 'smooth' })
  }

  // The arrow and page keys go a whole stop at a time.
  const onKeyDown = (event: React.KeyboardEvent) => {
    const step = { ArrowDown: 1, PageDown: 1, ' ': event.shiftKey ? -1 : 1, ArrowUp: -1, PageUp: -1 }[event.key]
    if (event.key === 'Home') visit(0)
    else if (event.key === 'End') visit(names.length - 1)
    else if (step) visit((heading.current ?? Math.round(tour.position)) + step)
    else return
    event.preventDefault()
  }

  // The address follows the station in view, so it can be shared as is.
  const onScroll = () => {
    const element = scroller.current!
    tour.position = element.scrollTop / element.clientHeight
    const stop = Math.round(tour.position)
    if (heading.current !== null && Math.abs(tour.position - heading.current) < 0.02) heading.current = null
    setCurrent(stop)
    point('tour', TOUR[stop - 1] ?? null)
  }

  return (
    <>
      <nav className="tour-dots" aria-label={t.tour.stops}>
        {names.map((name, i) => (
          <button
            key={name}
            aria-label={name}
            title={name}
            aria-current={i === current ? 'step' : undefined}
            onClick={() => visit(i)}
          />
        ))}
      </nav>
      <div ref={scroller} className="tour" tabIndex={-1} onScroll={onScroll} onKeyDown={onKeyDown}>
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
    </>
  )
}
