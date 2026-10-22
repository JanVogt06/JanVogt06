import cryptborne from '../images/screenshots/cryptborne.webp'
import pichunter from '../images/screenshots/pichunter.webp'
import riptide from '../images/screenshots/riptide.webp'
import sattrak from '../images/screenshots/sattrak.webp'
import solarflow from '../images/screenshots/solarflow.webp'
import spesen from '../images/screenshots/spesen-generator.webp'
import awards from '../images/station_03_meine_auszeichnungen.webp'
import engagement from '../images/station_02_neben_dem_studium.webp'
import about from '../images/station_01_mein_weg.webp'
import { catalogue, linkLabel, type Entry } from './catalogue'
import type { StationCopy } from './copy'
import { t } from './lang'

export type { StationKind } from './catalogue'

export interface Station extends Omit<Entry, 'links'>, StationCopy {
  image?: { src: string; alt: string; focus?: string }
  links?: { label: string; href: string }[]
}

const images: Partial<Record<Entry['id'], string>> = {
  about,
  riptide,
  sattrak,
  solarflow,
  spesen,
  pichunter,
  cryptborne,
  engagement,
  awards,
}

// Every station, with its words in the page's language.
export const stations: Station[] = catalogue.map((entry) => {
  const words = t.stations[entry.id]
  const src = images[entry.id]
  return {
    ...entry,
    ...words,
    image: src ? { src, alt: words.alt ?? '', focus: entry.focus } : undefined,
    links: entry.links?.map((link) => ({ label: linkLabel(link, t.links), href: link.href })),
  }
})
