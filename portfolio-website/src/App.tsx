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
import {hasWebGL2} from '@/lib/space/support'
import {projects} from '@/lib/projects'

function App() {
    useSmoothScroll()

    // The scene carries the whole choreography; without it every section falls back.
    const reduced = useMediaQuery("(prefers-reduced-motion: reduce)")
    const scene = hasWebGL2() && !reduced

    const [selected, setSelected] = useState<number | null>(null)
    const [station, setStation] = useState<number | null>(null)

    return (
        <MotionConfig reducedMotion="user">
            <Atmosphere
                scene={scene}
                crystalCount={scene ? projects.length : 0}
                onPick={(pick) =>
                    pick.kind === "crystal" ? setSelected(pick.index) : setStation(pick.index)
                }
            />
            <TopBar/>
            <Hero/>
            <About scene={scene} station={station} onStation={setStation}/>
            {/* Scroll-only stretch: the fly-through of the galaxy */}
            <Passage scene={scene}/>
            <Projects crystals={scene} selected={selected} onSelect={setSelected}/>
            <Contact/>
        </MotionConfig>
    )
}

export default App
