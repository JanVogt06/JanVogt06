import {useCallback, useRef} from "react"
import useScrollProgress from "@/lib/useScrollProgress"
import useMediaQuery from "@/lib/useMediaQuery"
import {space} from "@/lib/space/controller"

/** Length of the stretch, in viewport heights. */
const LENGTH_VH = 200

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

const PassageFlight = () => {
    const sectionRef = useRef<HTMLDivElement>(null)

    const onProgress = useCallback((raw: number) => {
        space.setPassageProgress(clamp01(raw))
    }, [])

    useScrollProgress(sectionRef, onProgress)

    return <div ref={sectionRef} aria-hidden="true" style={{height: `${LENGTH_VH}vh`}}/>
}

const Passage = () => {
    const roomy = useMediaQuery("(min-width: 1024px) and (min-height: 700px)")
    const reduced = useMediaQuery("(prefers-reduced-motion: reduce)")

    if (!roomy || reduced) return null
    return <PassageFlight/>
}

export default Passage
