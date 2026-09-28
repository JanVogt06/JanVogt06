import {useCallback, useRef} from "react"
import type {CSSProperties} from "react"
import useScrollProgress from "@/lib/useScrollProgress"
import {space} from "@/lib/space/controller"
import {bump, clamp01} from "@/lib/band"
import Interlude from "./Interlude"
import type {InterludeHandle} from "./Interlude"
import Stops, {ChapterCue} from "./Stops"

const SCREENS = 2.2
const TRAVEL = SCREENS - 1

const TITLE: [number, number, number, number] = [0.14, 0.28, 0.68, 0.82]

/**
 * The flight from the last planet to the crystal ring. Its title holds the
 * frame while the camera crosses the galaxy plane behind it.
 */
const PassageFlight = () => {
    const sectionRef = useRef<HTMLDivElement>(null)
    const titleRef = useRef<InterludeHandle>(null)

    const onProgress = useCallback((raw: number) => {
        const q = clamp01(raw)
        space.setPassageProgress(q)
        titleRef.current?.setWeight(bump(q, ...TITLE), (0.48 - q) * 0.05 * window.innerHeight)
    }, [])

    useScrollProgress(sectionRef, onProgress)

    return (
        <div
            ref={sectionRef}
            aria-hidden="true"
            className="track track-join relative"
            style={{"--screens": SCREENS} as CSSProperties}
        >
            <Stops at={[0.48]} travel={TRAVEL}/>
            <ChapterCue chapter="projects" at={TITLE[0] * TRAVEL + 0.5}/>
            <Interlude
                ref={titleRef}
                index="02"
                title="Projekte"
                note="Fünf Kristalle · fünf Projekte"
            />
        </div>
    )
}

const Passage = ({scene}: {scene: boolean}) => (scene ? <PassageFlight/> : null)

export default Passage
