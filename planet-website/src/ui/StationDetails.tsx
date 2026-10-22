import { t } from '../content/lang'
import type { Station } from '../content/stations'

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
