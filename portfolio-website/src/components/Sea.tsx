import {useEffect, useRef} from "react"
import {SeaScene} from "@/lib/sea/SeaScene"
import type {PanelSpec} from "@/lib/sea/SeaScene"
import {attachScene} from "@/lib/sea/controller"
import {journey} from "@/lib/journey"

/**
 * The canvas behind the page. It is sized to the large viewport, so a
 * mobile toolbar sliding in or out never resizes the scene.
 */
const Sea = ({
    panels,
    onSelect,
    onProgress,
    onReady,
}: {
    panels: PanelSpec[]
    onSelect: (panel: number) => void
    onProgress: (fraction: number) => void
    onReady: () => void
}) => {
    const hostRef = useRef<HTMLDivElement>(null)
    const handlers = useRef({onSelect, onProgress, onReady})

    useEffect(() => {
        handlers.current = {onSelect, onProgress, onReady}
    }, [onSelect, onProgress, onReady])

    useEffect(() => {
        const host = hostRef.current
        if (!host) return
        const scene = new SeaScene({
            container: host,
            panels,
            onSelect: (i) => handlers.current.onSelect(i),
            onProgress: (f) => handlers.current.onProgress(f),
            onReady: () => handlers.current.onReady(),
        })
        attachScene(scene)
        const unsubscribe = journey.subscribe((shot) => scene.setShot(shot))
        return () => {
            unsubscribe()
            attachScene(null)
            scene.dispose()
        }
    }, [panels])

    return <div ref={hostRef} aria-hidden="true" className="fixed inset-x-0 top-0 -z-10 h-lvh overflow-hidden bg-page"/>
}

export default Sea
