import {useCallback, useRef} from "react"
import type {CSSProperties} from "react"
import useScrollProgress from "@/lib/useScrollProgress"
import {space} from "@/lib/space/controller"

/** Length of the stretch, in viewports. */
const SCREENS = 2

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

const PassageFlight = () => {
    const sectionRef = useRef<HTMLDivElement>(null)

    const onProgress = useCallback((raw: number) => {
        space.setPassageProgress(clamp01(raw))
    }, [])

    useScrollProgress(sectionRef, onProgress)

    return (
        <div
            ref={sectionRef}
            aria-hidden="true"
            className="track"
            style={{"--screens": SCREENS} as CSSProperties}
        />
    )
}

const Passage = ({scene}: {scene: boolean}) => (scene ? <PassageFlight/> : null)

export default Passage
