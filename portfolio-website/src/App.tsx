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

    const scene = sceneSupported()
    const wideEnough = useMediaQuery(`(min-width: ${CRYSTALS_MIN_WIDTH}px)`)
    const crystals = scene && wideEnough

    const [selected, setSelected] = useState<number | null>(null)
    const [station, setStation] = useState<number | null>(null)

    return (
        <MotionConfig reducedMotion="user">
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
            {/* Scroll-only stretch: the fly-through of the galaxy */}
            <Passage/>
            <Projects crystals={crystals} selected={selected} onSelect={setSelected}/>
            <Contact/>
        </MotionConfig>
    )
}

export default App
