import { t } from '../content/lang'
import type { Station } from '../content/stations'

// The way so far, newest first, and the languages spoken: shown with the
// About station, in the same markup as on the text page.
function Career({ languages }: { languages: boolean }) {
  return (
    <>
      <h3 className="panel-subtitle">{t.career.title}</h3>
      <ol className="timeline">
        {t.career.steps.map((step) => (
          <li key={step.when}>
            <span className="timeline-when">{step.when}</span>
            <span className="timeline-what">
              <b>{step.what}</b>
              {step.where && <span>{step.where}</span>}
            </span>
          </li>
        ))}
      </ol>
      {languages && (
        <>
          <h3 className="panel-subtitle">{t.languages.title}</h3>
          <dl className="languages">
            {t.languages.spoken.map((spoken) => (
              <div key={spoken.name}>
                <dt>{spoken.name}</dt>
                <dd>{spoken.level}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </>
  )
}

// What there is to say about a station: its kind, name and tagline, the
// text, any facts and technologies, and its links. `brief` keeps to the
// first paragraph, for the tour's cards.
export function StationDetails({ station, brief = false, children }: { station: Station; brief?: boolean; children?: React.ReactNode }) {
  const body = brief ? station.body.slice(0, 1) : station.body
  return (
    <>
      <p className="panel-kind">{t.kinds[station.kind]}</p>
      <h2 className="panel-title">{station.title}</h2>
      <p className="panel-tagline">{station.tagline}</p>

      {body.map((paragraph) => (
        <p key={paragraph} className="panel-text">
          {paragraph}
        </p>
      ))}

      {station.kind === 'about' && <Career languages={!brief} />}

      {station.facts && (
        <ul className="panel-facts">
          {station.facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      )}

      {station.tech && (
        <ul className="panel-tech" aria-label={t.text.tech}>
          {station.tech.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      )}

      <div className="panel-actions">
        {station.links?.map((link) => (
          <a key={link.href} className="panel-link" href={link.href} target="_blank" rel="noreferrer">
            {link.label}
          </a>
        ))}
        {children}
      </div>
    </>
  )
}
