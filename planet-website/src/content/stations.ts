import { catalogue, linkLabel, type Entry } from './catalogue'
import type { StationCopy } from './copy'
import { t } from './lang'

export type { StationKind } from './catalogue'

export interface Station extends Omit<Entry, 'links' | 'image'>, StationCopy {
  image?: { src: string; alt: string; focus?: string }
  links?: { label: string; href: string }[]
}

// Every picture under src/images, by its path there.
const images = import.meta.glob<string>('../images/**/*.webp', { query: '?url', import: 'default', eager: true })

// Every station, with its words in the page's language.
export const stations: Station[] = catalogue.map((entry) => {
  const words = t.stations[entry.id]
  const src = entry.image && images[`../images/${entry.image}`]
  return {
    ...entry,
    ...words,
    image: src ? { src, alt: words.alt ?? '', focus: entry.focus } : undefined,
    links: entry.links?.map((link) => ({ label: linkLabel(link, t.links), href: link.href })),
  }
})
