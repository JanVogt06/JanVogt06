// Every word on the site, in German and English. Plain data with no
// imports, so the build can read it too when it writes the static page.

export type Lang = 'de' | 'en'
export type StationId =
  | 'about'
  | 'riptide'
  | 'sattrak'
  | 'solarflow'
  | 'spesen'
  | 'pichunter'
  | 'cryptborne'
  | 'engagement'
  | 'awards'
  | 'contact'

export interface StationCopy {
  title: string
  tagline: string
  // What the station's photo or screenshot shows.
  alt?: string
  body: string[]
  facts?: string[]
}

type Views = 'drive' | 'tour' | 'planet' | 'text'

export interface Copy {
  meta: { title: string; textTitle: string; description: string; loading: string }
  // The other language, for the switch.
  other: { lang: Lang; label: string; name: string }
  menu: { eyebrow: string; lead: string; choices: Record<Views, { title: string; text: string }>; loading: string; failed: string }
  kinds: { about: string; project: string; engagement: string; awards: string; contact: string }
  panel: { close: string; drive: string; more: string; share: string; copied: string }
  tour: { kind: string; title: string; text: string; hint: string; endKind: string; endTitle: string; endText: string; drive: string; read: string; stops: string }
  planet: { hint: string }
  chrome: { menu: string; loading: string; failed: string; toText: string; keys: { drive: string; boost: string; jump: string; space: string; reset: string } }
  touch: [string, string][]
  tag: { park: string }
  map: { label: string; found: string }
  text: { sections: { about: string; projects: string; contact: string }; nav: string; toPlanet: string; footer: string; rover: string; pdf: string; tech: string }
  links: { live: string; github: string; play: string; instagram: string }
  stations: Record<StationId, StationCopy>
}

const de: Copy = {
  meta: {
    title: 'Jan Vogt – Informatik in Jena',
    textTitle: 'Jan Vogt – Lebenslauf und Projekte',
    description:
      'Jan Vogt studiert Informatik in Jena und pfeift am Wochenende Fußball. Fahr mit einem kleinen Rover über seinen Planeten und schau dir seine Projekte an – oder lies alles als Text.',
    loading: 'Einen Moment …',
  },
  other: { lang: 'en', label: 'EN', name: 'English' },
  menu: {
    eyebrow: 'Willkommen auf meinem kleinen Planeten',
    lead: 'Ich studiere Informatik in Jena, pfeife am Wochenende Fußballspiele und baue nebenbei Software – oft für genau die Dinge, die mich im Alltag nerven.',
    choices: {
      drive: { title: 'Losfahren', text: 'Mit dem Rover über den Planeten fahren und die Stationen abklappern.' },
      tour: { title: 'Rundflug', text: 'Zurücklehnen und von Station zu Station scrollen.' },
      planet: { title: 'Planet betrachten', text: 'Den ganzen Planeten drehen und Stationen antippen.' },
      text: { title: 'Nur Text', text: 'Alles auf einer Seite, schnell gelesen – auch als PDF.' },
    },
    loading: 'Planet lädt …',
    failed: '3D lässt sich in diesem Browser nicht laden.',
  },
  kinds: { about: 'Über mich', project: 'Projekt', engagement: 'Engagement', awards: 'Auszeichnungen', contact: 'Kontakt' },
  panel: { close: 'Schließen', drive: 'Weiterfahren', more: 'Mehr', share: 'Link teilen', copied: 'Link kopiert' },
  tour: {
    kind: 'Rundflug',
    title: 'Hallo, ich bin Jan.',
    text: 'Das hier ist mein kleiner Planet. Scroll los – die Kamera fliegt dich von Station zu Station.',
    hint: 'Scrollen',
    endKind: 'Ende des Rundflugs',
    endTitle: 'Das war’s!',
    endText: 'Der Rover steht bereit, falls du selbst fahren willst. Auf dem Planeten gibt es noch ein paar Dinge zu entdecken, die hier nicht vorkamen.',
    drive: 'Selbst fahren',
    read: 'Alles als Text',
    stops: 'Stationen',
  },
  planet: { hint: 'Ziehen zum Drehen · Zoomen mit Rad oder zwei Fingern · Station antippen' },
  chrome: {
    menu: 'Menü',
    loading: 'Planet wird geladen …',
    failed: 'Der Planet lässt sich in diesem Browser leider nicht laden.',
    toText: 'Zur Textfassung',
    keys: { drive: 'Fahren', boost: 'Boost', jump: 'Springen', space: 'Leertaste', reset: 'Aufrichten' },
  },
  touch: [
    ['Ziehen', 'dahin fahren'],
    ['Nach unten', 'rückwärts'],
    ['Weit ziehen', 'Boost'],
    ['Loslassen', 'anhalten'],
    ['Doppeltippen', 'springen'],
  ],
  tag: { park: 'In der Zone parken' },
  map: { label: 'Karte des Planeten', found: 'entdeckt' },
  text: {
    sections: { about: 'Über mich', projects: 'Projekte', contact: 'Kontakt' },
    nav: 'Abschnitte',
    toPlanet: 'Zum 3D-Planeten',
    footer: 'Lieber in 3D? Zum Planeten',
    rover: 'Der kleine Rover von meinem Planeten',
    pdf: 'Lebenslauf als PDF',
    tech: 'Technologien',
  },
  links: { live: 'Live ansehen', github: 'GitHub', play: 'Spielen', instagram: 'Instagram' },
  stations: {
    about: {
      title: 'Über mich',
      tagline: 'Informatik in Jena, Fußball am Wochenende',
      alt: 'Jan beim Skifahren im Schnee',
      body: [
        'Ich bin Jan, studiere seit 2024 Informatik an der Friedrich-Schiller-Universität Jena und wohne in Bad Berka.',
        'Am liebsten baue ich Dinge, die man gleich ausprobieren kann: eine Tsunami-Simulation, einen Satelliten-Globus im Browser oder ein Tool, das mir als Schiedsrichter die Spesenabrechnung abnimmt. Diese Seite ist auch so ein Ding.',
      ],
      facts: ['B.Sc. Informatik in Jena, seit Oktober 2024', 'Zuhause in Bad Berka, Thüringen'],
    },
    riptide: {
      title: 'Riptide',
      tagline: 'Tsunami-Simulation',
      alt: 'Screenshot von Riptide',
      body: [
        'Wie breitet sich eine Tsunamiwelle über den Ozean aus? Riptide rechnet es aus – mit einem Finite-Volumen-Löser für die Flachwassergleichungen.',
        'Gebaut im Team mit Yannik Köllmann und Mika Brückner, mit Riemann-Lösern für Dammbruch- und andere Wellenszenarien, eigener Visualisierung und Sphinx-Doku.',
      ],
    },
    sattrak: {
      title: 'SatTrak',
      tagline: 'Satelliten auf einem 3D-Globus',
      alt: 'Screenshot von SatTrak',
      body: [
        'Über 12.000 Satelliten in Echtzeit auf einem Globus – mit Heatmap, Tag-Nacht-Grenze und einem Zeitregler, mit dem man vor- und zurückspulen kann.',
        'Gebaut mit Unity und Cesium, läuft als WebGL direkt im Browser.',
      ],
    },
    solarflow: {
      title: 'SolarFlow',
      tagline: 'Solarstrom selbst verbrauchen',
      alt: 'Screenshot von SolarFlow',
      body: [
        'SolarFlow liest einen Fronius-Wechselrichter aus und schaltet bei Solarüberschuss Verbraucher nach Priorität zu – damit möglichst viel vom eigenen Strom auch im Haus bleibt.',
      ],
    },
    spesen: {
      title: 'Spesenfuchs',
      tagline: 'Spesenabrechnung für Schiris',
      alt: 'Screenshot von Spesenfuchs',
      body: [
        'Nach jedem Spiel wartet als Schiedsrichter noch die Spesenabrechnung. Spesenfuchs holt die Ansetzungen aus dem DFBnet und erstellt die Word-Dokumente dafür automatisch.',
        'Mehrere Schiris können es gleichzeitig nutzen, jeder mit eigenem Konto.',
      ],
    },
    pichunter: {
      title: 'PicHunter',
      tagline: 'Spielfotos von fupa.net',
      alt: 'Screenshot von PicHunter',
      body: [
        'Link zu einem Spiel, einer Galerie oder einem Schiri-Profil auf fupa.net einfügen – PicHunter sammelt alle Fotos in voller Auflösung, schreibt Anstoßzeit und Spielort dazu und packt alles in ein ZIP.',
      ],
    },
    cryptborne: {
      title: 'Cryptborne',
      tagline: 'Dungeon-Crawler',
      alt: 'Screenshot von Cryptborne',
      body: [
        'Ein Dungeon-Crawler im Mittelalter-Setting: Jeder Dungeon wird neu erzeugt, die Gegner haben ihre eigene KI und es gibt reichlich Waffen zum Durchprobieren.',
      ],
    },
    engagement: {
      title: 'Engagement',
      tagline: 'Neben dem Studium',
      alt: 'Jan als Schiedsrichter zeigt eine gelbe Karte',
      body: ['Wenn ich nicht am Rechner sitze, stehe ich meistens mit Pfeife auf dem Fußballplatz.'],
      facts: [
        'Schiedsrichter in der Oberliga NOFV und der U19-Bundesliga, Assistent in der Regionalliga',
        'In der Redaktion von „Die Wurzel“, einer Zeitschrift für Mathematik',
        'Aktiv in der Stadtentwicklung von Bad Berka',
      ],
    },
    awards: {
      title: 'Auszeichnungen',
      tagline: 'Aus der Schulzeit',
      alt: 'Jan bei einer Preisverleihung auf der Bühne',
      body: ['Ein paar Preise, die ich in der Schule mitgenommen habe.'],
      facts: [
        'Marie-Curie-Preis (2022)',
        'DMV-Abiturpreis Mathematik (2024)',
        'DPG-Abiturpreis Physik (2024)',
        '2. Platz Thüringer Physikolympiade (Klasse 10)',
        '3. Platz Thüringer Physikolympiade (Klasse 12)',
      ],
    },
    contact: {
      title: 'Kontakt',
      tagline: 'Schreib mir',
      body: ['Du hast eine Frage, eine Idee für ein Projekt oder willst einfach Hallo sagen? Ich freue mich über jede Nachricht.'],
    },
  },
}

const en: Copy = {
  meta: {
    title: 'Jan Vogt – Computer science in Jena',
    textTitle: 'Jan Vogt – CV and projects',
    description:
      'Jan Vogt studies computer science in Jena and referees football at the weekend. Drive a little rover across his planet and look at his projects – or just read it all as text.',
    loading: 'Just a moment …',
  },
  other: { lang: 'de', label: 'DE', name: 'Deutsch' },
  menu: {
    eyebrow: 'Welcome to my little planet',
    lead: 'I study computer science in Jena, referee football matches at the weekend and build software on the side – often for exactly the things that bug me day to day.',
    choices: {
      drive: { title: 'Drive', text: 'Take the rover across the planet and visit the stations.' },
      tour: { title: 'Fly-through', text: 'Sit back and scroll from station to station.' },
      planet: { title: 'Look around', text: 'Turn the whole planet and tap a station.' },
      text: { title: 'Just text', text: 'Everything on one page, quick to read – also as a PDF.' },
    },
    loading: 'Loading the planet …',
    failed: '3D won’t load in this browser.',
  },
  kinds: { about: 'About me', project: 'Project', engagement: 'Off the screen', awards: 'Awards', contact: 'Contact' },
  panel: { close: 'Close', drive: 'Drive on', more: 'More', share: 'Share link', copied: 'Link copied' },
  tour: {
    kind: 'Fly-through',
    title: 'Hi, I’m Jan.',
    text: 'This is my little planet. Start scrolling – the camera will fly you from station to station.',
    hint: 'Scroll',
    endKind: 'End of the fly-through',
    endTitle: 'That’s it!',
    endText: 'The rover is ready if you’d like to drive yourself. There are a few things on the planet that didn’t make it into the tour.',
    drive: 'Drive yourself',
    read: 'Read it as text',
    stops: 'Stations',
  },
  planet: { hint: 'Drag to turn · Zoom with the wheel or two fingers · Tap a station' },
  chrome: {
    menu: 'Menu',
    loading: 'Loading the planet …',
    failed: 'Sorry, the planet won’t load in this browser.',
    toText: 'Read the text version',
    keys: { drive: 'Drive', boost: 'Boost', jump: 'Jump', space: 'Space', reset: 'Flip back' },
  },
  touch: [
    ['Drag', 'to drive there'],
    ['Down', 'to reverse'],
    ['Drag far', 'to boost'],
    ['Let go', 'to stop'],
    ['Double-tap', 'to jump'],
  ],
  tag: { park: 'Park in the zone' },
  map: { label: 'Map of the planet', found: 'found' },
  text: {
    sections: { about: 'About me', projects: 'Projects', contact: 'Contact' },
    nav: 'Sections',
    toPlanet: 'To the 3D planet',
    footer: 'Rather see it in 3D? Visit the planet',
    rover: 'The little rover from my planet',
    pdf: 'CV as PDF',
    tech: 'Technologies',
  },
  links: { live: 'See it live', github: 'GitHub', play: 'Play', instagram: 'Instagram' },
  stations: {
    about: {
      title: 'About me',
      tagline: 'Computer science in Jena, football at the weekend',
      alt: 'Jan skiing in the snow',
      body: [
        'I’m Jan. I’ve been studying computer science at Friedrich Schiller University Jena since 2024 and live in Bad Berka, Thuringia.',
        'I like building things you can try out straight away: a tsunami simulation, a satellite globe in the browser, or a tool that does my expense claims as a referee for me. This site is one of those things too.',
      ],
      facts: ['B.Sc. Computer Science in Jena, since October 2024', 'Home in Bad Berka, Thuringia'],
    },
    riptide: {
      title: 'Riptide',
      tagline: 'Tsunami simulation',
      alt: 'Screenshot of Riptide',
      body: [
        'How does a tsunami spread across the ocean? Riptide works it out with a finite-volume solver for the shallow-water equations.',
        'Built as a team with Yannik Köllmann and Mika Brückner, with Riemann solvers for dam-break and other wave scenarios, its own visualisation and Sphinx docs.',
      ],
    },
    sattrak: {
      title: 'SatTrak',
      tagline: 'Satellites on a 3D globe',
      alt: 'Screenshot of SatTrak',
      body: [
        'More than 12,000 satellites in real time on a globe – with a heat map, the day-night line and a time slider to wind forwards and back.',
        'Built with Unity and Cesium, it runs as WebGL right in the browser.',
      ],
    },
    solarflow: {
      title: 'SolarFlow',
      tagline: 'Use your own solar power',
      alt: 'Screenshot of SolarFlow',
      body: [
        'SolarFlow reads a Fronius inverter and, whenever there’s surplus solar power, switches appliances on by priority – so as much of your own power as possible stays in the house.',
      ],
    },
    spesen: {
      title: 'Spesenfuchs',
      tagline: 'Expense claims for referees',
      alt: 'Screenshot of Spesenfuchs',
      body: [
        'After every match a referee still has an expense claim to write. Spesenfuchs fetches the fixtures from DFBnet and creates the Word documents for it automatically.',
        'Several referees can use it at once, each with their own account.',
      ],
    },
    pichunter: {
      title: 'PicHunter',
      tagline: 'Match photos from fupa.net',
      alt: 'Screenshot of PicHunter',
      body: [
        'Paste a link to a match, a gallery or a referee’s profile on fupa.net – PicHunter collects every photo in full resolution, adds kick-off time and venue, and packs it all into a ZIP.',
      ],
    },
    cryptborne: {
      title: 'Cryptborne',
      tagline: 'Dungeon crawler',
      alt: 'Screenshot of Cryptborne',
      body: [
        'A dungeon crawler in a medieval setting: every dungeon is generated anew, the enemies have their own AI and there are plenty of weapons to try.',
      ],
    },
    engagement: {
      title: 'Off the screen',
      tagline: 'Besides my studies',
      alt: 'Jan refereeing, showing a yellow card',
      body: ['When I’m not at my computer, I’m usually on a football pitch with a whistle.'],
      facts: [
        'Referee in the NOFV Oberliga and the U19 Bundesliga, assistant referee in the Regionalliga',
        'On the editorial team of “Die Wurzel”, a maths magazine',
        'Involved in the town development of Bad Berka',
      ],
    },
    awards: {
      title: 'Awards',
      tagline: 'From my school days',
      alt: 'Jan on stage at an award ceremony',
      body: ['A few prizes I picked up at school.'],
      facts: [
        'Marie Curie Prize (2022)',
        'DMV Abitur Prize in Mathematics (2024)',
        'DPG Abitur Prize in Physics (2024)',
        '2nd place, Thuringian Physics Olympiad (year 10)',
        '3rd place, Thuringian Physics Olympiad (year 12)',
      ],
    },
    contact: {
      title: 'Contact',
      tagline: 'Drop me a line',
      body: ['Got a question, an idea for a project or just want to say hello? I’m happy to hear from you.'],
    },
  },
}

export const copies: Record<Lang, Copy> = { de, en }
