import { useEffect, useRef } from 'react'
import { t } from '../content/lang'
import { stations } from '../content/stations'
import { point } from './route'
import { labels, ui, useUi } from './store'

// Name labels over the stations facing the camera in the planet view, each
// a button that opens the station, and a hint on how to turn the planet.
export function PlanetView() {
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const { open } = useUi()

  // Opens the station the address names, and keeps the address on the
  // station that is open.
  useEffect(() => {
    const station = stations.find((station) => station.id === ui.get().focus)
    if (station) ui.set({ open: station })
  }, [])
  useEffect(() => point('planet', open?.id ?? null), [open])

  useEffect(() => {
    let frame = 0
    const follow = () => {
      labels.points.forEach((point, i) => {
        const button = buttons.current[i]
        if (!button) return
        button.style.transform = `translate(${point.x}px, ${point.y}px) translate(-50%, -100%)`
        button.dataset.shown = String(point.shown)
        button.tabIndex = point.shown ? 0 : -1
      })
      frame = requestAnimationFrame(follow)
    }
    follow()
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <>
      {stations.map((station, i) => (
        <button
          key={station.id}
          ref={(element) => {
            buttons.current[i] = element
          }}
          className="planet-label"
          data-shown="false"
          style={{ '--accent': station.colour } as React.CSSProperties}
          onClick={() => ui.set({ open: station })}
        >
          {station.title}
        </button>
      ))}
      <p className="planet-hint">{t.planet.hint}</p>
    </>
  )
}
