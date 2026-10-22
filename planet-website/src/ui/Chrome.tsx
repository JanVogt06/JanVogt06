import { t } from '../content/lang'
import { go } from './route'
import { useUi } from './store'

// The way back to the start menu from any of the 3D views.
export function MenuButton() {
  return (
    <button className="menu-back" onClick={() => go('menu')}>
      <span aria-hidden="true">‹</span> {t.chrome.menu}
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
          <p>{t.chrome.failed}</p>
          <button className="panel-link" onClick={() => go('text')}>
            {t.chrome.toText}
          </button>
        </>
      ) : (
        <>
          <p>
            {t.chrome.loading}
            {progress > 0.02 ? ` ${Math.round(progress * 100)} %` : ''}
          </p>
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
        <kbd>D</kbd> {t.chrome.keys.drive}
      </li>
      <li>
        <kbd>Shift</kbd> {t.chrome.keys.boost}
      </li>
      <li>
        <kbd>{t.chrome.keys.space}</kbd> {t.chrome.keys.jump}
      </li>
      <li>
        <kbd>R</kbd> {t.chrome.keys.reset}
      </li>
    </ul>
  )
}
