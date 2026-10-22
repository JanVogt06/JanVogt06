import { catalogue, linkLabel, type Entry } from './catalogue'
import type { Copy, StationId } from './copy'
import { person } from './person'

// Where the pictures are, which differs between the page and the build,
// and which address leads back to the planet.
export interface PageAssets {
  rover?: string
  images: Partial<Record<StationId, string>>
  home: string
  // The same page in the other language.
  other: string
}

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Anchors to sections carry `data-jump`, so the page can scroll to them
// instead of letting the hash change the view.
const SECTIONS = { projects: 'projekte', engagement: 'engagement', contact: 'kontakt' }

// The whole text page as HTML: the same markup whether the page draws it or
// the build writes it into index.html for search engines and for readers
// without JavaScript.
export function textPage(t: Copy, assets: PageAssets) {
  const words = (id: StationId) => t.stations[id]
  const list = (items?: string[]) => (items?.length ? `<ul>${items.map((item) => `<li>${escape(item)}</li>`).join('')}</ul>` : '')
  const tech = (entry: Entry) =>
    entry.tech
      ? `<ul class="panel-tech" aria-label="${escape(t.text.tech)}">${entry.tech.map((name) => `<li>${escape(name)}</li>`).join('')}</ul>`
      : ''
  const links = (entry: Entry) =>
    entry.links
      ? `<p class="text-links">${entry.links
          .map((link) => `<a href="${escape(link.href)}" target="_blank" rel="noreferrer">${escape(linkLabel(link, t.links))}</a>`)
          .join('')}</p>`
      : ''
  const paragraphs = (id: StationId) => words(id).body.map((paragraph) => `<p>${escape(paragraph)}</p>`).join('')
  const entry = (id: StationId) => catalogue.find((item) => item.id === id)!
  const career = `<ol class="timeline">${t.career.steps
    .map(
      (step) => `<li><span class="timeline-when">${escape(step.when)}</span><span class="timeline-what"><b>${escape(step.what)}</b>${
        step.where ? `<span>${escape(step.where)}</span>` : ''
      }</span></li>`,
    )
    .join('')}</ol>`
  const languages = `<dl class="languages">${t.languages.spoken
    .map((spoken) => `<div><dt>${escape(spoken.name)}</dt><dd>${escape(spoken.level)}</dd></div>`)
    .join('')}</dl>`

  const projects = catalogue
    .filter((item) => item.kind === 'project')
    .map((item) => {
      const w = words(item.id)
      const image = assets.images[item.id]
      return `<article class="text-project" style="--accent: ${item.colour}">
        ${image ? `<img src="${image}" alt="${escape(w.alt ?? '')}" loading="lazy">` : ''}
        <div>
          <h3>${escape(w.title)}</h3>
          <p class="text-tagline">${escape(w.tagline)}</p>
          ${paragraphs(item.id)}${tech(item)}${links(item)}
        </div>
      </article>`
    })
    .join('')

  const side = (['engagement', 'awards'] as const)
    .map(
      (id) => `<section class="text-section" aria-labelledby="${id}">
        <h2 id="${id}">${escape(words(id).title)}</h2>
        ${paragraphs(id)}${list(words(id).facts)}
      </section>`,
    )
    .join('')

  const about = words('about')
  return `<div class="text-column">
    <a class="language" href="${assets.other}" hreflang="${t.other.lang}" lang="${t.other.lang}" aria-label="${escape(t.other.name)}">${t.other.label}</a>
    <header class="text-header">
      ${assets.rover ? `<img class="text-rover" src="${assets.rover}" alt="${escape(t.text.rover)}" width="160" height="151">` : ''}
      <div>
        <h1 class="text-name">${escape(person.name)}</h1>
        <p class="text-role">${escape(about.tagline)}</p>
        <nav class="text-nav" aria-label="${escape(t.text.nav)}">
          <a href="#${SECTIONS.projects}" data-jump="${SECTIONS.projects}">${escape(t.text.sections.projects)}</a>
          <a href="#${SECTIONS.engagement}" data-jump="${SECTIONS.engagement}">${escape(words('engagement').title)}</a>
          <a href="#${SECTIONS.contact}" data-jump="${SECTIONS.contact}">${escape(t.text.sections.contact)}</a>
          <button type="button" class="text-pdf" data-pdf>${escape(t.text.pdf)}</button>
          <a class="text-home" href="${assets.home}" data-go="menu">${escape(t.text.toPlanet)}</a>
        </nav>
      </div>
    </header>

    <section class="text-section" aria-labelledby="ueber-mich">
      <h2 id="ueber-mich">${escape(t.text.sections.about)}</h2>
      ${paragraphs('about')}
    </section>

    <section class="text-section" aria-labelledby="werdegang">
      <h2 id="werdegang">${escape(t.career.title)}</h2>
      ${career}
    </section>

    <section class="text-section" aria-labelledby="${SECTIONS.projects}">
      <h2 id="${SECTIONS.projects}">${escape(t.text.sections.projects)}</h2>
      <div class="text-projects">${projects}</div>
    </section>

    ${side}

    <section class="text-section" aria-labelledby="sprachen">
      <h2 id="sprachen">${escape(t.languages.title)}</h2>
      ${languages}
    </section>

    <section class="text-section" aria-labelledby="${SECTIONS.contact}">
      <h2 id="${SECTIONS.contact}">${escape(t.text.sections.contact)}</h2>
      ${paragraphs('contact')}${links(entry('contact'))}
    </section>

    <footer class="text-footer">
      <a class="panel-link" href="${assets.home}" data-go="menu">${escape(t.text.footer)}</a>
    </footer>
  </div>`
}
