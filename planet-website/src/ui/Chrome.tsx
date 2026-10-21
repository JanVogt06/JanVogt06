import { go } from './route'
import { useUi } from './store'

// The way back to the start menu from any of the 3D views.
export function MenuButton() {
  return (
    <button className="menu-back" onClick={() => go('menu')}>
      <span aria-hidden="true">‹</span> Menü
    </button>
  )
}

// Shown over a 3D view opened straight from its address, while the planet
// is still loading, or if it cannot load at all.
export function Loading() {
  const { world, progress } = useUi()
  if (world === 'ready') return null
  return (
    <div className="loading" role="status" aria-live="polite">
      {world === 'failed' ? (
        <>
          <p>Der Planet lässt sich in diesem Browser leider nicht laden.</p>
          <button className="panel-link" onClick={() => go('text')}>
            Zur Textfassung
          </button>
        </>
      ) : (
        <>
          <p>Planet wird geladen …{progress > 0.02 ? ` ${Math.round(progress * 100)} %` : ''}</p>
          <div className="loading-track">
            <div className="loading-bar" style={{ transform: `scaleX(${progress})` }} />
          </div>
        </>
      )}
    </div>
  )
}

// What the keys do while driving, for keyboards only.
export function DriveKeys() {
  return (
    <ul className="controls">
      <li>
        <kbd>W</kbd>
        <kbd>A</kbd>
        <kbd>S</kbd>
        <kbd>D</kbd> Fahren
      </li>
      <li>
        <kbd>Shift</kbd> Boost
      </li>
      <li>
        <kbd>Leertaste</kbd> Springen
      </li>
      <li>
        <kbd>R</kbd> Aufrichten
      </li>
    </ul>
  )
}
