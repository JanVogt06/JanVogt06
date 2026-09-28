import {useEffect} from "react"
import type {RefObject} from "react"

export type ProgressMode = "pin" | "exit"

type Entry = {
    el: HTMLElement
    mode: ProgressMode
    onProgress: (progress: number) => void
    last: number
}

const entries = new Set<Entry>()
let frame = 0

// Tracks are sized in svh, so travel has to be measured in svh too: against
// innerHeight, a mobile toolbar sliding away shortens every track's travel
// and jumps every section's progress by a few percent.
let probe: HTMLDivElement | null = null

export const smallViewport = () => {
    if (!probe) {
        probe = document.createElement("div")
        probe.setAttribute("aria-hidden", "true")
        Object.assign(probe.style, {
            position: "fixed",
            top: "0",
            left: "0",
            width: "0",
            height: "100svh",
            visibility: "hidden",
            pointerEvents: "none",
        })
        document.body.appendChild(probe)
    }
    return probe.offsetHeight || window.innerHeight
}

const flush = () => {
    frame = 0

    const viewport = smallViewport()
    const measured: Array<{entry: Entry; progress: number}> = []
    entries.forEach((entry) => {
        const travel = entry.mode === "exit" ? entry.el.offsetHeight : entry.el.offsetHeight - viewport
        const progress = travel <= 0 ? 0 : -entry.el.getBoundingClientRect().top / travel
        measured.push({entry, progress})
    })

    measured.forEach(({entry, progress}) => {
        if (Math.abs(progress - entry.last) < 0.0001) return
        entry.last = progress
        entry.onProgress(progress)
    })
}

const request = () => {
    if (frame) return
    frame = requestAnimationFrame(flush)
}

export const useScrollProgress = (
    ref: RefObject<HTMLElement | null>,
    onProgress: (progress: number) => void,
    mode: ProgressMode = "pin",
) => {
    useEffect(() => {
        const el = ref.current
        if (!el) return

        const entry: Entry = {el, mode, onProgress, last: -1}
        entries.add(entry)

        if (entries.size === 1) {
            window.addEventListener("scroll", request, {passive: true})
            window.addEventListener("resize", request)
        }

        flush()

        return () => {
            entries.delete(entry)
            if (entries.size === 0) {
                window.removeEventListener("scroll", request)
                window.removeEventListener("resize", request)
                if (frame) cancelAnimationFrame(frame)
                frame = 0
            }
        }
    }, [ref, onProgress, mode])
}

export default useScrollProgress
