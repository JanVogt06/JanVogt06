import { useEffect } from 'react'
import { stations, type Station } from '../content/stations'
import rover from '../images/rover.webp'
import { go } from './route'

const about = stations.find((station) => station.kind === 'about')!
const projects = stations.filter((station) => station.kind === 'project')
const rest = stations.filter((station) => station.kind === 'engagement' || station.kind === 'awards')
const contact = stations.find((station) => station.kind === 'contact')!

// The address's hash picks the view, so in-page links scroll instead.
function jump(id: string) {
  return (event: React.MouseEvent) => {
    event.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function Links({ station }: { station: Station }) {
  if (!station.links) return null
  return (
    <p className="text-links">
      {station.links.map((link) => (
        <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
          {link.label}
        </a>
      ))}
    </p>
  )
}

function Tech({ station }: { station: Station }) {
  if (!station.tech) return null
  return (
    <ul className="panel-tech" aria-label="Technologien">
      {station.tech.map((name) => (
        <li key={name}>{name}</li>
      ))}
    </ul>
  )
}

// Everything from the planet as one plain page to read or print, for
// anyone short of time or without 3D.
export function TextPage() {
  useEffect(() => {
    document.title = 'Jan Vogt – Lebenslauf und Projekte'
    return () => {
      document.title = 'Jan Vogt – Informatikstudent'
    }
  }, [])

  return (
    <div className="text-page">
      <div className="text-column">
        <header className="text-header">
          <img className="text-rover" src={rover} alt="Der kleine Rover vom Forscher-Planeten" width="160" height="151" />
          <div>
            <h1 className="text-name">Jan Vogt</h1>
            <p className="text-role">{about.tagline}</p>
            <nav className="text-nav" aria-label="Abschnitte">
              <a href="#projekte" onClick={jump('projekte')}>
                Projekte
              </a>
              <a href="#engagement" onClick={jump('engagement')}>
                Engagement
              </a>
              <a href="#kontakt" onClick={jump('kontakt')}>
                Kontakt
              </a>
              <button onClick={() => go('menu')}>Zum 3D-Planeten</button>
            </nav>
          </div>
        </header>

        <section className="text-section" aria-labelledby="ueber-mich">
          <h2 id="ueber-mich">Über mich</h2>
          {about.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <ul>
            {about.facts?.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
          <Tech station={about} />
        </section>

        <section className="text-section" aria-labelledby="projekte">
          <h2 id="projekte">Projekte</h2>
          <div className="text-projects">
            {projects.map((project) => (
              <article key={project.id} className="text-project" style={{ '--accent': project.colour } as React.CSSProperties}>
                {project.image && <img src={project.image.src} alt={project.image.alt} loading="lazy" />}
                <div>
                  <h3>{project.title}</h3>
                  <p className="text-tagline">{project.tagline}</p>
                  {project.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  <Tech station={project} />
                  <Links station={project} />
                </div>
              </article>
            ))}
          </div>
        </section>

        {rest.map((station) => (
          <section key={station.id} className="text-section" aria-labelledby={station.id}>
            <h2 id={station.id}>{station.title}</h2>
            {station.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <ul>
              {station.facts?.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          </section>
        ))}

        <section className="text-section" aria-labelledby="kontakt">
          <h2 id="kontakt">Kontakt</h2>
          {contact.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <Links station={contact} />
        </section>

        <footer className="text-footer">
          <button className="panel-link" onClick={() => go('menu')}>
            Lieber in 3D? Zum Forscher-Planeten
          </button>
        </footer>
      </div>
    </div>
  )
}
