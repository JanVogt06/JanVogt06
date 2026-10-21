import { useEffect, useRef } from 'react'
import { go } from './route'
import { type Mode, useUi } from './store'

// Small line drawings for the four ways in.
const ICONS: Record<Exclude<Mode, 'menu'>, React.ReactNode> = {
  drive: (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect x="6" y="12" width="20" height="9" rx="4" />
      <circle cx="10" cy="24" r="3" />
      <circle cx="22" cy="24" r="3" />
      <path d="M19 12V7h4" />
      <circle cx="24" cy="6" r="1.5" />
    </svg>
  ),
  tour: (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect x="10" y="4" width="12" height="20" rx="6" />
      <path d="M16 9v4" />
      <path d="M11 27l5 3 5-3" />
    </svg>
  ),
  planet: (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="9" />
      <ellipse cx="16" cy="16" rx="15" ry="5" transform="rotate(-20 16 16)" />
    </svg>
  ),
  text: (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M8 4h11l6 6v18H8z" />
      <path d="M19 4v6h6M12 16h9M12 20h9M12 24h6" />
    </svg>
  ),
}

const CHOICES: { mode: Exclude<Mode, 'menu'>; title: string; text: string; needs3d: boolean }[] = [
  { mode: 'drive', title: 'Losfahren', text: 'Steuere den Rover über den Planeten und entdecke die Stationen.', needs3d: true },
  { mode: 'tour', title: 'Rundflug', text: 'Scrolle entspannt von Station zu Station.', needs3d: true },
  { mode: 'planet', title: 'Planet betrachten', text: 'Dreh den ganzen Planeten und tippe Stationen an.', needs3d: true },
  { mode: 'text', title: 'Nur Text', text: 'Lebenslauf und Projekte als schlichte Seite.', needs3d: false },
]

// The way in: who this is and four ways to look round, over the rover
// waiting on its planet. Until the planet has loaded, its three ways show
// how far it has got; the text is there straight away.
export function StartMenu() {
  const { world, progress } = useUi()
  const first = useRef<HTMLButtonElement>(null)
  const ready = world === 'ready'

  useEffect(() => {
    first.current?.focus({ preventScroll: true })
  }, [])

  return (
    <main className="menu">
      <div className="menu-card">
        <p className="menu-eyebrow">Willkommen auf dem Forscher-Planeten</p>
        <h1 className="menu-title">Jan Vogt</h1>
        <p className="menu-lead">
          Informatikstudent in Jena mit einer Schwäche für Mathe und Physik. Wie möchtest du dich umsehen?
        </p>
        <ul className="menu-choices">
          {CHOICES.map((choice, i) => {
            const waiting = choice.needs3d && !ready
            return (
              <li key={choice.mode}>
                <button
                  ref={i === 0 ? first : undefined}
                  className="menu-choice"
                  data-mode={choice.mode}
                  disabled={waiting && world === 'failed'}
                  aria-busy={waiting && world !== 'failed'}
                  onClick={() => go(choice.mode)}
                >
                  <span className="menu-icon">{ICONS[choice.mode]}</span>
                  <span className="menu-choice-title">{choice.title}</span>
                  <span className="menu-choice-text">
                    {waiting && world === 'failed'
                      ? '3D lässt sich in diesem Browser nicht laden.'
                      : waiting
                        ? `Planet lädt …${progress > 0.02 ? ` ${Math.round(progress * 100)} %` : ''}`
                        : choice.text}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </main>
  )
}
