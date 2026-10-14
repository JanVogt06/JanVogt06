import cryptborne from '../images/screenshots/cryptborne.webp'
import riptide from '../images/screenshots/riptide.webp'
import sattrak from '../images/screenshots/sattrak.webp'
import solarflow from '../images/screenshots/solarflow.webp'
import spesen from '../images/screenshots/spesen-generator.webp'
import awards from '../images/station_03_meine_auszeichnungen.webp'
import engagement from '../images/station_02_neben_dem_studium.webp'
import about from '../images/station_01_mein_weg.webp'

export type StationKind = 'about' | 'project' | 'engagement' | 'awards' | 'contact'

export interface Station {
  id: string
  kind: StationKind
  title: string
  tagline: string
  // Stand-in colour until the station has its own model.
  colour: string
  // Where it stands, in degrees. The parking bay faces north unless turned.
  place: { lat: number; lon: number; turn?: number }
  // `focus` is the CSS object-position that keeps the subject in the crop.
  image?: { src: string; alt: string; focus?: string }
  body: string[]
  facts?: string[]
  tech?: string[]
  links?: { label: string; href: string }[]
}

const github = (repo: string) => ({ label: 'GitHub', href: `https://github.com/${repo}` })

export const stations: Station[] = [
  {
    id: 'about',
    kind: 'about',
    title: 'Über mich',
    tagline: 'Informatikstudent aus Thüringen',
    colour: '#f2efe6',
    place: { lat: 74, lon: 0 },
    image: { src: about, alt: 'Jan beim Skifahren im Schnee', focus: '50% 20%' },
    body: [
      'Hallo, ich bin Jan – Informatikstudent an der Friedrich-Schiller-Universität Jena mit einer Schwäche für Mathematik und Physik.',
      'Mich reizen Softwareentwicklung, mathematische Anwendungen und wissenschaftliches Rechnen – am liebsten dort, wo alle drei zusammenkommen.',
    ],
    facts: ['B.Sc. Informatik in Jena, seit Oktober 2024', 'Zuhause in Bad Berka, Thüringen'],
    tech: ['C', 'C++', 'C#', 'Java', 'Python', 'JavaScript', 'TypeScript', 'Unity', 'React', 'FastAPI', 'Django', 'OpenGL', 'Docker', 'Git'],
  },
  {
    id: 'riptide',
    kind: 'project',
    title: 'Riptide',
    tagline: 'Tsunami-Simulation',
    colour: '#5b9bd5',
    place: { lat: 38, lon: 40 },
    image: { src: riptide, alt: 'Screenshot von Riptide' },
    body: [
      'Finite-Volumen-Solver zur Simulation von Tsunami-Wellenausbreitung auf Basis der Flachwassergleichungen.',
      'Umfasst Riemann-Löser für Shock-Shock-, Rare-Rare- und Dammbruch-Szenarien sowie Visualisierungen und eine Sphinx-Dokumentation. Entwickelt im Team mit Yannik Köllmann und Mika Brückner.',
    ],
    tech: ['C++', 'Python', 'OpenGL', 'GLSL'],
    links: [{ label: 'Live ansehen', href: 'https://riptide.jan-vogt.dev' }, github('SquadCommit/Riptide')],
  },
  {
    id: 'sattrak',
    kind: 'project',
    title: 'SatTrak',
    tagline: '3D-Satellitenvisualisierung',
    colour: '#7b6fd6',
    place: { lat: 38, lon: 112 },
    image: { src: sattrak, alt: 'Screenshot von SatTrak' },
    body: [
      'Echtzeit-Visualisierung von über 12.000 Satelliten auf einem 3D-Globus – mit Heatmap-Darstellung, Tag/Nacht-Zyklus und Zeitsteuerung für historische und zukünftige Positionen.',
      'Läuft als Unity-WebGL-Build direkt im Browser.',
    ],
    tech: ['Unity', 'C#', 'Cesium'],
    links: [{ label: 'Live ansehen', href: 'https://sattrek.jan-vogt.dev' }, github('JanVogt06/SatTrak_Satellite-Visualization')],
  },
  {
    id: 'solarflow',
    kind: 'project',
    title: 'SolarFlow',
    tagline: 'Intelligentes Energie-Management',
    colour: '#e9c46a',
    place: { lat: 38, lon: 184 },
    image: { src: solarflow, alt: 'Screenshot von SolarFlow' },
    body: [
      'Smartes Energie-Management für Photovoltaik-Anlagen mit Fronius-Wechselrichtern.',
      'Maximiert den Eigenverbrauch durch eine prioritätsbasierte Steuerung, die Verbraucher bei Solarüberschuss automatisch zuschaltet.',
    ],
    tech: ['Python', 'SQLite', 'FastAPI', 'Fronius API'],
    links: [{ label: 'Live ansehen', href: 'https://solarflow.jan-vogt.dev' }, github('JanVogt06/SolarFlow_Smart-Energy-Management')],
  },
  {
    id: 'spesen',
    kind: 'project',
    title: 'Spesenfuchs',
    tagline: 'Spesenabrechnung für Schiedsrichter',
    colour: '#8ab17d',
    place: { lat: 38, lon: 256 },
    image: { src: spesen, alt: 'Screenshot von Spesenfuchs' },
    body: [
      'Web-Anwendung zur automatisierten Spesenabrechnung für Fußballschiedsrichter in Thüringen.',
      'Das System liest die Spielansetzungen aus dem DFBnet aus und erzeugt daraus die Word-Dokumente für die Abrechnung – vollautomatisch und mehrbenutzerfähig.',
    ],
    tech: ['Python', 'FastAPI', 'React', 'TypeScript', 'Playwright', 'Docker'],
    links: [
      { label: 'Live ansehen', href: 'https://spesen-generator.jan-vogt.dev' },
      github('JanVogt06/Spesenfuchs_Schiri-Spesen-Automat'),
    ],
  },
  {
    id: 'pichunter',
    kind: 'project',
    title: 'PicHunter',
    tagline: 'Bilder-Download mit Duplikaterkennung',
    colour: '#e76f51',
    place: { lat: -6, lon: 220 },
    body: [
      'Werkzeug, das alle Bilder einer Website herunterlädt – parallel, aus den unterschiedlichsten Quellen der Seite und mit automatischer Erkennung von Duplikaten.',
    ],
    tech: ['JavaScript', 'Docker'],
    links: [github('JanVogt06/PicHunter')],
  },
  {
    id: 'cryptborne',
    kind: 'project',
    title: 'Cryptborne',
    tagline: '3D-Dungeon-Crawler',
    colour: '#6b5b73',
    place: { lat: -6, lon: 292 },
    image: { src: cryptborne, alt: 'Screenshot von Cryptborne' },
    body: [
      'Prozedural generierter Dungeon-Crawler im mittelalterlichen Fantasy-Setting – mit variantenreichem Waffensystem und intelligenter Gegner-KI.',
    ],
    tech: ['Unity', 'C#', 'HLSL'],
    links: [{ label: 'Spielen', href: 'https://squadcommit.github.io/cryptborne/' }, github('JY-Studios/cryptborne')],
  },
  {
    id: 'engagement',
    kind: 'engagement',
    title: 'Engagement',
    tagline: 'Neben dem Studium',
    colour: '#f4a261',
    place: { lat: -6, lon: 76 },
    image: { src: engagement, alt: 'Jan als Schiedsrichter zeigt eine gelbe Karte', focus: '50% 30%' },
    body: ['Wenn ich nicht programmiere, stehe ich meistens auf dem Fußballplatz.'],
    facts: [
      'Schiedsrichter in der Oberliga NOFV und der U19-Bundesliga, Assistent in der Regionalliga',
      'Redaktionsmitglied bei „Die Wurzel“, einer Zeitschrift für Mathematik',
      'Aktiv in der Stadtentwicklung von Bad Berka',
    ],
  },
  {
    id: 'awards',
    kind: 'awards',
    title: 'Auszeichnungen',
    tagline: 'Mathematik und Physik',
    colour: '#d4a72c',
    place: { lat: -6, lon: 148 },
    image: { src: awards, alt: 'Jan bei einer Preisverleihung auf der Bühne', focus: '50% 45%' },
    body: ['Ein paar Stationen auf dem Weg hierher.'],
    facts: [
      'Marie-Curie-Preis (2022)',
      'DMV-Abiturpreis Mathematik (2024)',
      'DPG-Abiturpreis Physik (2024)',
      '2. Platz Thüringer Physikolympiade (Klasse 10)',
      '3. Platz Thüringer Physikolympiade (Klasse 12)',
    ],
  },
  {
    id: 'contact',
    kind: 'contact',
    title: 'Kontakt',
    tagline: 'Schreib mir',
    colour: '#e05d5d',
    place: { lat: -6, lon: 4 },
    body: ['Lust auf ein gemeinsames Projekt, eine Frage oder einfach Hallo sagen? Ich freue mich über jede Nachricht.'],
    links: [
      { label: 'contact@jan-vogt.dev', href: 'mailto:contact@jan-vogt.dev' },
      github('JanVogt06'),
      { label: 'Instagram', href: 'https://instagram.com/jan.vogt06' },
    ],
  },
]
