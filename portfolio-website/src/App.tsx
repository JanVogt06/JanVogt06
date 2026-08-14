import {useState} from 'react'
import {MotionConfig} from 'framer-motion'
import Atmosphere from './components/Atmosphere'
import TopBar from './components/TopBar'
import Hero from './components/Hero'
import About from './components/About'
import Passage from './components/Passage'
import Projects from './components/Projects'
import Contact from './components/Contact'
import {useSmoothScroll} from '@/lib/smoothScroll'
import useMediaQuery from '@/lib/useMediaQuery'
import {sceneSupported, CRYSTALS_MIN_WIDTH} from '@/lib/space/support'
import {projects} from '@/lib/projects'

function App() {
    useSmoothScroll()

    /* Die Breite wird beobachtet, damit ein Wechsel zwischen Kristallfeld und
       gestapelter Liste beim Drehen oder Fenstergroesse-Aendern mitkommt. Die
       uebrigen Bedingungen (WebGL2, reduzierte Bewegung, Zeigerart) aendern sich
       zur Laufzeit nicht.

       Nebel und Kristalle sind zwei Entscheidungen: ein schmales Desktop-Fenster
       verliert die Steine, aber nicht den Hintergrund. */
    const scene = sceneSupported()
    const wideEnough = useMediaQuery(`(min-width: ${CRYSTALS_MIN_WIDTH}px)`)
    const crystals = scene && wideEnough

    /* Was ist geoeffnet? Beides liegt hier, weil jeweils zwei Geschwister
       beteiligt sind: die Szene loest die Auswahl per Klick im Raum aus, die
       jeweilige Sektion zeigt daraufhin ihre Tafel.

       `selected` = Kristall (Projekt), `station` = Planet (Werdegang). */
    const [selected, setSelected] = useState<number | null>(null)
    const [station, setStation] = useState<number | null>(null)

    return (
        /* reducedMotion="user": wer im System "Bewegung reduzieren" gesetzt hat,
           bekommt in JEDER motion-Komponente nur noch Ein-/Ausblenden statt
           Transforms – auch in allem, was spaeter dazukommt. */
        <MotionConfig reducedMotion="user">
            {/* Ein Hintergrund fuer alle Sektionen – siehe Atmosphere.tsx */}
            <Atmosphere
                scene={scene}
                crystalCount={crystals ? projects.length : 0}
                onPick={(pick) =>
                    pick.kind === "crystal" ? setSelected(pick.index) : setStation(pick.index)
                }
            />
            <TopBar/>
            <Hero/>
            <About station={station} onStation={setStation}/>
            {/* Reine Scroll-Strecke: der Durchflug durch die Galaxie. */}
            <Passage/>
            <Projects crystals={crystals} selected={selected} onSelect={setSelected}/>
            <Contact/>
        </MotionConfig>
    )
}

export default App
