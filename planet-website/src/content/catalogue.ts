import type { StationId } from './copy'

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
  // `focus` is the CSS object-position that keeps the subject in the crop.
  focus?: string
  tech?: string[]
  links?: { kind: LinkKind; href: string }[]
}

const github = (repo: string) => ({ kind: 'github' as const, href: `https://github.com/${repo}` })

export const catalogue: Entry[] = [
  {
    id: 'about',
    kind: 'about',
    colour: '#f2efe6',
    place: { lat: 74, lon: 0 },
    focus: '50% 20%',
    tech: ['C', 'C++', 'C#', 'Java', 'Python', 'JavaScript', 'TypeScript', 'Unity', 'React', 'FastAPI', 'Django', 'OpenGL', 'Docker', 'Git'],
  },
  {
    id: 'riptide',
    kind: 'project',
    colour: '#5b9bd5',
    place: { lat: 38, lon: 40 },
    tech: ['C++', 'Python', 'OpenGL', 'GLSL'],
    links: [{ kind: 'live', href: 'https://riptide.jan-vogt.dev' }, github('SquadCommit/Riptide')],
  },
  {
    id: 'sattrak',
    kind: 'project',
    colour: '#7b6fd6',
    place: { lat: 38, lon: 112 },
    tech: ['Unity', 'C#', 'Cesium'],
    links: [{ kind: 'live', href: 'https://sattrek.jan-vogt.dev' }, github('JanVogt06/SatTrak_Satellite-Visualization')],
  },
  {
    id: 'solarflow',
    kind: 'project',
    colour: '#e9c46a',
    place: { lat: 38, lon: 184 },
    tech: ['Python', 'SQLite', 'FastAPI', 'Fronius API'],
    links: [{ kind: 'live', href: 'https://solarflow.jan-vogt.dev' }, github('JanVogt06/SolarFlow_Smart-Energy-Management')],
  },
  {
    id: 'spesen',
    kind: 'project',
    colour: '#8ab17d',
    place: { lat: 38, lon: 256 },
    tech: ['Python', 'FastAPI', 'React', 'TypeScript', 'Playwright', 'Docker'],
    links: [{ kind: 'live', href: 'https://spesen-generator.jan-vogt.dev' }, github('JanVogt06/Spesenfuchs_Schiri-Spesen-Automat')],
  },
  {
    id: 'pichunter',
    kind: 'project',
    colour: '#e76f51',
    place: { lat: -6, lon: 220 },
    tech: ['JavaScript', 'Docker'],
    links: [github('JanVogt06/PicHunter')],
  },
  {
    id: 'cryptborne',
    kind: 'project',
    colour: '#6b5b73',
    place: { lat: -6, lon: 292 },
    tech: ['Unity', 'C#', 'HLSL'],
    links: [{ kind: 'play', href: 'https://squadcommit.github.io/cryptborne/' }, github('JY-Studios/cryptborne')],
  },
  {
    id: 'engagement',
    kind: 'engagement',
    colour: '#f4a261',
    place: { lat: -6, lon: 76 },
    focus: '50% 30%',
  },
  {
    id: 'awards',
    kind: 'awards',
    colour: '#d4a72c',
    place: { lat: -6, lon: 148 },
    focus: '50% 45%',
  },
  {
    id: 'contact',
    kind: 'contact',
    colour: '#e05d5d',
    place: { lat: -6, lon: 4 },
    links: [
      { kind: 'mail', href: 'mailto:contact@jan-vogt.dev' },
      github('JanVogt06'),
      { kind: 'instagram', href: 'https://instagram.com/jan.vogt06' },
    ],
  },
]

// The label to show for a link.
export function linkLabel(link: { kind: LinkKind; href: string }, labels: Record<Exclude<LinkKind, 'mail'>, string>) {
  return link.kind === 'mail' ? link.href.replace('mailto:', '') : labels[link.kind]
}
