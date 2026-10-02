import {useCallback, useEffect, useMemo, useState} from "react"
import {AnimatePresence, MotionConfig} from "framer-motion"
import Sea from "./components/Sea"
import Boot from "./components/Boot"
import Frame from "./components/Frame"
import Track from "./components/Track"
import Hero from "./components/Hero"
import About, {PhotoView} from "./components/About"
import Projects from "./components/Projects"
import Contact from "./components/Contact"
import ProjectHud from "./components/ProjectHud"
import Credits from "./components/Credits"
import {useSmoothScroll} from "@/lib/smoothScroll"
import useMediaQuery from "@/lib/useMediaQuery"
import {hasWebGL2} from "@/lib/sea/support"
import {stations} from "@/lib/about"
import {projects} from "@/lib/projects"
import {SCREENSHOT_ASPECT, screenshotFor} from "@/lib/screenshots"

// A stalled texture must not hold a phone in the fog for long; past this the
// page is more useful half-built than hidden.
const BOOT_TIMEOUT_MS =
    typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches ? 5000 : 8000

const PANELS = [
    ...stations.map((station) => ({image: station.image, aspect: station.aspect, kind: "print" as const})),
    ...projects.map((project) => ({
        image: screenshotFor(project.slug) ?? "",
        aspect: SCREENSHOT_ASPECT,
        kind: "screen" as const,
    })),
]

function App() {
    useSmoothScroll()

    const reduced = useMediaQuery("(prefers-reduced-motion: reduce)")
    const scene = useMemo(() => hasWebGL2() && !reduced, [reduced])

    const [photo, setPhoto] = useState<number | null>(null)
    const [project, setProject] = useState<number | null>(null)
    const [credits, setCredits] = useState(false)

    const [progress, setProgress] = useState(0)
    const [ready, setReady] = useState(false)
    const announce = useCallback(() => setReady(true), [])

    const onPanel = useCallback((panel: number) => {
        if (panel < stations.length) setPhoto(panel)
        else setProject(panel - stations.length)
    }, [])

    useEffect(() => {
        if (ready) return
        const timer = window.setTimeout(() => setReady(true), BOOT_TIMEOUT_MS)
        return () => window.clearTimeout(timer)
    }, [ready])

    // Without a scene there is nothing heavy to wait for but the webfont.
    useEffect(() => {
        if (scene) return
        let cancelled = false
        document.fonts.ready.then(() => {
            if (cancelled) return
            setProgress(1)
            setReady(true)
        })
        return () => {
            cancelled = true
        }
    }, [scene])

    // The scroll position drives the camera, so it must not move under the
    // boot screen.
    useEffect(() => {
        if (ready) return
        const html = document.documentElement
        const previous = html.style.overflow
        html.style.overflow = "hidden"
        return () => {
            html.style.overflow = previous
        }
    }, [ready])

    return (
        <MotionConfig reducedMotion="user">
            {scene && (
                <>
                    <Sea panels={PANELS} onSelect={onPanel} onProgress={setProgress} onReady={announce}/>
                    {/* Shade where the copy sits, at the foot of the frame and
                        under the chrome; the bright band of the horizon stays. */}
                    <div
                        aria-hidden="true"
                        data-scene
                        className="pointer-events-none fixed inset-x-0 bottom-0 z-10 h-[72svh] bg-gradient-to-t from-[rgb(7_10_14/0.68)] via-[rgb(7_10_14/0.34)] to-transparent"
                    />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none fixed inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-[rgb(7_10_14/0.3)] to-transparent"
                    />
                </>
            )}

            <Frame ready={ready} scene={scene}/>

            {scene ? (
                <main>
                    <Track/>
                    <Hero flow={false}/>
                    <About flow={false} onOpen={setPhoto}/>
                    <Projects flow={false} onOpen={setProject}/>
                    <Contact flow={false} onCredits={() => setCredits(true)}/>
                </main>
            ) : (
                <main className="seascape">
                    <div id="top">
                        <Hero flow/>
                    </div>
                    <div id="about">
                        <About flow onOpen={setPhoto}/>
                    </div>
                    <div id="projects">
                        <Projects flow onOpen={setProject}/>
                    </div>
                    <div id="contact">
                        <Contact flow onCredits={() => setCredits(true)}/>
                    </div>
                </main>
            )}

            {photo !== null && <PhotoView station={stations[photo]} onClose={() => setPhoto(null)}/>}
            {project !== null && <ProjectHud index={project} onClose={() => setProject(null)}/>}
            <AnimatePresence>{credits && <Credits key="credits" onClose={() => setCredits(false)}/>}</AnimatePresence>

            <Boot progress={progress} ready={ready}/>
        </MotionConfig>
    )
}

export default App
