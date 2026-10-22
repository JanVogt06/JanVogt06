import { t } from '../content/lang'
import { go } from './route'
import { clock, useUi } from './store'

// The way back to the start menu from any of the 3D views, and beside it
// the switch between day and night.
export function Corner() {
  return (
    <div className="corner">
      <button className="menu-back" onClick={() => go('menu')}>
        <span aria-hidden="true">‹</span> {t.chrome.menu}
      </button>
      <SkyButton />
    </div>
  )
}

// Shows the moon by day, to bring on the night, and the sun by night.
function SkyButton() {
  const { night, world } = useUi()
  if (world !== 'ready') return null
  const label = night ? t.chrome.sky.day : t.chrome.sky.night
  return (
    <button className="sky-button" aria-label={label} title={label} onClick={() => (clock.wish = night ? 'day' : 'night')}>
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        {night ? (
          <g fill="#f2b33d" stroke="#c98a1c" strokeWidth="1.2" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4.6" />
            {Array.from({ length: 8 }, (_, i) => (
              <rect key={i} x="11" y="1.6" width="2" height="3.6" rx="1" transform={`rotate(${i * 45} 12 12)`} />
            ))}
          </g>
        ) : (
          <path
            d="M15.6 3.2a8.6 8.6 0 1 0 5.2 12.4A7 7 0 0 1 15.6 3.2Z"
            fill="#8fa6ff"
            stroke="#4f62b8"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        )}
      </svg>
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
