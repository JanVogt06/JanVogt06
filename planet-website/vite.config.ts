import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { catalogue } from './src/content/catalogue'
import { copies, type Lang } from './src/content/copy'
import { githubUrl, person } from './src/content/person'
import { textPage } from './src/content/textPage'

const SITE = person.site
const HOME: Record<Lang, string> = { de: '/', en: '/en/' }
const ROVER = 'src/images/rover.webp'

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

// Who the page is about, in the form search engines read for the box
// beside their results: name, work, study, home town and profiles.
function profile(lang: Lang, image: string) {
  const t = copies[lang]
  const job = t.career.steps.find((step) => step.where === person.employer.name)
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: SITE + HOME[lang],
    inLanguage: lang,
    name: t.meta.title,
    mainEntity: {
      '@type': 'Person',
      name: person.name,
      url: SITE + HOME[lang],
      email: `mailto:${person.email}`,
      image,
      description: t.stations.about.tagline,
      jobTitle: job?.what,
      worksFor: { '@type': 'Organization', ...person.employer },
      alumniOf: { '@type': 'CollegeOrUniversity', ...person.university },
      address: { '@type': 'PostalAddress', addressLocality: person.home, addressCountry: 'DE' },
      knowsLanguage: t.languages.spoken.map((spoken) => spoken.name),
      sameAs: [githubUrl(), `https://instagram.com/${person.instagram}`],
    },
  }
  // Kept from closing the script tag early.
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`
}

// Both pages for search engines to find, each pointing at the other.
function sitemap() {
  const today = new Date().toISOString().slice(0, 10)
  const alternates = (Object.keys(HOME) as Lang[])
    .map((lang) => `<xhtml:link rel="alternate" hreflang="${lang}" href="${SITE + HOME[lang]}"/>`)
    .join('')
  const urls = Object.values(HOME)
    .map((path) => `<url><loc>${SITE + path}</loc><lastmod>${today}</lastmod>${alternates}</url>`)
    .join('\n  ')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  ${urls}
</urlset>
`
}

// Fills index.html in for one language: its title, description, preview
// image and links to the other language, the loading line, and the text
// page itself, for search engines and for readers without JavaScript.
function localise(html: string, lang: Lang, asset: (source: string) => string | undefined) {
  const t = copies[lang]
  const url = SITE + HOME[lang]
  const image = `${SITE}/${lang === 'en' ? 'og-en.png' : 'og.png'}`
  const head = `<title>${escape(t.meta.title)}</title>
    <meta name="description" content="${escape(t.meta.description)}" />
    <link rel="canonical" href="${url}" />
    <link rel="alternate" hreflang="de" href="${SITE}/" />
    <link rel="alternate" hreflang="en" href="${SITE}/en/" />
    <link rel="alternate" hreflang="x-default" href="${SITE}/" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${escape(t.meta.title)}" />
    <meta property="og:description" content="${escape(t.meta.description)}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="${lang === 'en' ? 'en_GB' : 'de_DE'}" />
    <meta name="twitter:card" content="summary_large_image" />
    ${profile(lang, image)}
    <noscript><style>.loader { display: none }</style></noscript>`
  const images = Object.fromEntries(catalogue.filter((entry) => entry.image).map((entry) => [entry.id, asset(`src/images/${entry.image}`)]))
  const page = textPage(t, { rover: asset(ROVER), images, home: HOME[lang], other: HOME[t.other.lang] + '#text' })
  return html
    .replace('<html lang="de">', `<html lang="${lang}">`)
    .replace('<!--site:head-->', head)
    .replace('<!--site:loading-->', escape(t.meta.loading))
    .replace('<!--site:name-->', escape(person.name))
    .replace('<!--site:text-->', `<div class="text-page">${page}</div>`)
}

// Writes the German page at the root and the English one under /en/.
function site(): Plugin {
  let template = ''
  let assets: Record<string, string> = {}
  return {
    name: 'site',
    // After Vite's own HTML step, so the page is built before it is copied.
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, context) {
        if (context.bundle) {
          // The built address of each source picture.
          assets = {}
          for (const file of Object.values(context.bundle)) {
            if (file.type !== 'asset') continue
            for (const source of file.originalFileNames ?? []) assets[source] = '/' + file.fileName
          }
        }
        template = html
        const lang: Lang = context.originalUrl?.startsWith('/en') ? 'en' : 'de'
        return localise(html, lang, (source) => (context.bundle ? assets[source] : '/' + source))
      },
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'en/index.html', source: localise(template, 'en', (source) => assets[source]) })
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap() })
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n` })
    },
  }
}

export default defineConfig({
  plugins: [react(), site()],
  server: { port: Number(process.env.PORT) || 5180 },
})
