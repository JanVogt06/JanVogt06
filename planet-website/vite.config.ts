import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { copies, type Lang, type StationId } from './src/content/copy'
import { textPage } from './src/content/textPage'

const SITE = 'https://jan-vogt.dev'
const HOME: Record<Lang, string> = { de: '/', en: '/en/' }

// Where each station's picture comes from, to find its built address.
const IMAGES: Partial<Record<StationId, string>> = {
  about: 'src/images/station_01_mein_weg.webp',
  riptide: 'src/images/screenshots/riptide.webp',
  sattrak: 'src/images/screenshots/sattrak.webp',
  solarflow: 'src/images/screenshots/solarflow.webp',
  spesen: 'src/images/screenshots/spesen-generator.webp',
  pichunter: 'src/images/screenshots/pichunter.webp',
  cryptborne: 'src/images/screenshots/cryptborne.webp',
  engagement: 'src/images/station_02_neben_dem_studium.webp',
  awards: 'src/images/station_03_meine_auszeichnungen.webp',
}
const ROVER = 'src/images/rover.webp'

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

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
    <noscript><style>.loader { display: none }</style></noscript>`
  const images = Object.fromEntries(Object.entries(IMAGES).map(([id, source]) => [id, asset(source)]))
  const page = textPage(t, { rover: asset(ROVER), images, home: HOME[lang], other: HOME[t.other.lang] + '#text' })
  return html
    .replace('<html lang="de">', `<html lang="${lang}">`)
    .replace('<!--site:head-->', head)
    .replace('<!--site:loading-->', escape(t.meta.loading))
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
    },
  }
}

export default defineConfig({
  plugins: [react(), site()],
  server: { port: Number(process.env.PORT) || 5180 },
})
