import type { StationId } from './copy'
import { githubUrl, person } from './person'

export type StationKind = 'about' | 'project' | 'engagement' | 'awards' | 'contact'
// A link's label comes from the copy by its kind; a mail link shows its
// address.
export type LinkKind = 'live' | 'github' | 'play' | 'mail' | 'instagram'

// What a station is, apart from its words and pictures: plain data the
// build can read as well as the page.
export interface Entry {
  id: StationId
  kind: StationKind
  colour: string
  // Where it stands, in degrees. The parking bay faces north unless turned.
  place: { lat: number; lon: number; turn?: number }
  // The station's picture, under src/images, and the CSS object-position
  // that keeps its subject in the crop.
  image?: string
  focus?: string
  tech?: string[]
  links?: { kind: LinkKind; href: string }[]
}

const github = (repo: string) => ({ kind: 'github' as const, href: githubUrl(repo) })

export const catalogue: Entry[] = [
  {
    id: 'about',
    kind: 'about',
    colour: '#f2efe6',
    place: { lat: 74, lon: 0 },
    image: 'station_01_mein_weg.webp',
    focus: '50% 20%',
  },
  {
    id: 'riptide',
    kind: 'project',
    colour: '#5b9bd5',
    place: { lat: 38, lon: 40 },
    image: 'screenshots/riptide.webp',
    tech: ['C++', 'Python', 'OpenGL', 'GLSL'],
    links: [{ kind: 'live', href: 'https://riptide.jan-vogt.dev' }, github('SquadCommit/Riptide')],
  },
  {
    id: 'sattrak',
    kind: 'project',
    colour: '#7b6fd6',
    place: { lat: 38, lon: 112 },
    image: 'screenshots/sattrak.webp',
    tech: ['Unity', 'C#', 'Cesium'],
    links: [{ kind: 'live', href: 'https://sattrek.jan-vogt.dev' }, github(`${person.github}/SatTrak_Satellite-Visualization`)],
  },
  {
    id: 'solarflow',
    kind: 'project',
    colour: '#e9c46a',
    place: { lat: 38, lon: 184 },
    image: 'screenshots/solarflow.webp',
    tech: ['Python', 'SQLite', 'FastAPI', 'Fronius API'],
    links: [{ kind: 'live', href: 'https://solarflow.jan-vogt.dev' }, github(`${person.github}/SolarFlow_Smart-Energy-Management`)],
  },
  {
    id: 'spesen',
    kind: 'project',
    colour: '#8ab17d',
    place: { lat: 38, lon: 256 },
    image: 'screenshots/spesen-generator.webp',
    tech: ['Python', 'FastAPI', 'React', 'TypeScript', 'Playwright', 'Docker'],
    links: [{ kind: 'live', href: 'https://spesen-generator.jan-vogt.dev' }, github(`${person.github}/Spesenfuchs_Schiri-Spesen-Automat`)],
  },
  {
    id: 'pichunter',
    kind: 'project',
    colour: '#e76f51',
    place: { lat: -6, lon: 220 },
    image: 'screenshots/pichunter.webp',
    tech: ['JavaScript', 'Docker'],
    links: [github(`${person.github}/PicHunter`)],
  },
  {
    id: 'cryptborne',
    kind: 'project',
    colour: '#6b5b73',
    place: { lat: -6, lon: 292 },
    image: 'screenshots/cryptborne.webp',
    tech: ['Unity', 'C#', 'HLSL'],
    links: [{ kind: 'play', href: 'https://squadcommit.github.io/cryptborne/' }, github('JY-Studios/cryptborne')],
  },
  {
    id: 'engagement',
    kind: 'engagement',
    colour: '#f4a261',
    place: { lat: -6, lon: 76 },
    image: 'station_02_neben_dem_studium.webp',
    focus: '50% 30%',
  },
  {
    id: 'awards',
    kind: 'awards',
    colour: '#d4a72c',
    place: { lat: -6, lon: 148 },
    image: 'station_03_meine_auszeichnungen.webp',
    focus: '50% 45%',
  },
  {
    id: 'contact',
    kind: 'contact',
    colour: '#e05d5d',
    place: { lat: -6, lon: 4 },
    links: [
      { kind: 'mail', href: `mailto:${person.email}` },
      github(person.github),
      { kind: 'instagram', href: `https://instagram.com/${person.instagram}` },
    ],
  },
]

// The label to show for a link.
export function linkLabel(link: { kind: LinkKind; href: string }, labels: Record<Exclude<LinkKind, 'mail'>, string>) {
  return link.kind === 'mail' ? link.href.replace('mailto:', '') : labels[link.kind]
}
