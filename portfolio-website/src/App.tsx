import {useState} from 'react'
import {MotionConfig} from 'framer-motion'
import Atmosphere from './components/Atmosphere'
import RepoBar from './components/RepoBar'
import Hero from './components/Hero'
import About from './components/About'
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

    /* Welches Projekt ist geoeffnet? Liegt hier, weil zwei Geschwister es
       brauchen: die Szene loest die Auswahl per Klick auf einen Stein aus, die
       Projekt-Sektion zeigt das Panel. */
    const [selected, setSelected] = useState<number | null>(null)

    return (
        /* reducedMotion="user": wer im System "Bewegung reduzieren" gesetzt hat,
           bekommt in JEDER motion-Komponente nur noch Ein-/Ausblenden statt
           Transforms – auch in allem, was spaeter dazukommt. */
        <MotionConfig reducedMotion="user">
            {/* Ein Hintergrund fuer alle Sektionen – siehe Atmosphere.tsx */}
            <Atmosphere
                scene={scene}
                crystalCount={crystals ? projects.length : 0}
                onSelectCrystal={setSelected}
            />
            <RepoBar/>
            <Hero/>
            <About/>
            <Projects crystals={crystals} selected={selected} onSelect={setSelected}/>
            <Contact/>
        </MotionConfig>
    )
}

export default App
