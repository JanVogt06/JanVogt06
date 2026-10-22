import { useEffect, useRef } from 'react'
import { otherLanguage, t } from '../content/lang'
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

const CHOICES = (['drive', 'tour', 'planet', 'text'] as const).map((mode) => ({ mode, ...t.menu.choices[mode], needs3d: mode !== 'text' }))

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
        <a className="language" href={otherLanguage()} hrefLang={t.other.lang} lang={t.other.lang} aria-label={t.other.name}>
          {t.other.label}
        </a>
        <p className="menu-eyebrow">{t.menu.eyebrow}</p>
        <h1 className="menu-title">Jan Vogt</h1>
        <p className="menu-lead">{t.menu.lead}</p>
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
                      ? t.menu.failed
                      : waiting
                        ? `${t.menu.loading}${progress > 0.02 ? ` ${Math.round(progress * 100)} %` : ''}`
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
