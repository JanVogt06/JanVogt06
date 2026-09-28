import {useCallback, useEffect, useState} from 'react'
import {MotionConfig} from 'framer-motion'
import Atmosphere from './components/Atmosphere'
import Boot from './components/Boot'
import Tether from './components/Tether'
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

// A stalled texture must not hold a phone on a black screen for long; past
// this the page is more useful half-built than hidden.
const BOOT_TIMEOUT_MS =
    typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches ? 5000 : 8000

function App() {
    useSmoothScroll()

    const reduced = useMediaQuery("(prefers-reduced-motion: reduce)")
    const scene = hasWebGL2() && !reduced

    const [selected, setSelected] = useState<number | null>(null)
    const [station, setStation] = useState<number | null>(null)

    const [progress, setProgress] = useState(0)
    const [ready, setReady] = useState(false)

    const announce = useCallback(() => setReady(true), [])

    useEffect(() => {
        if (ready) return
        const timer = window.setTimeout(() => setReady(true), BOOT_TIMEOUT_MS)
        return () => window.clearTimeout(timer)
    }, [ready])

    // Without a scene there is nothing heavy to wait for, so the only thing
    // worth holding the reveal for is the webfont.
    useEffect(() => {
        if (scene) return
        let cancelled = false
        document.fonts.ready.then(() => {
            if (!cancelled) {
                setProgress(1)
                setReady(true)
            }
        })
        return () => {
            cancelled = true
        }
    }, [scene])

    // A page that is still loading should not be scrollable underneath the
    // boot screen — the scroll position drives the camera.
    useEffect(() => {
        if (ready) return
        const previous = document.documentElement.style.overflow
        document.documentElement.style.overflow = "hidden"
        return () => {
            document.documentElement.style.overflow = previous
        }
    }, [ready])

    return (
        <MotionConfig reducedMotion="user">
            <Atmosphere
                scene={scene}
                crystalCount={scene ? projects.length : 0}
                onPick={(pick) =>
                    pick.kind === "crystal" ? setSelected(pick.index) : setStation(pick.index)
                }
                onProgress={setProgress}
                onReady={announce}
            />
            {scene && <div aria-hidden="true" className="scrim-band"/>}
            {scene && <Tether/>}

            <TopBar ready={ready} scene={scene}/>
            <Hero ready={ready} scene={scene}/>
            <About scene={scene} station={station} onStation={setStation}/>
            <Passage scene={scene}/>
            <Projects crystals={scene} selected={selected} onSelect={setSelected}/>
            <Contact scene={scene}/>
            <Boot progress={progress} ready={ready}/>
        </MotionConfig>
    )
}

export default App
