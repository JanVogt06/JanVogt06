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

const flush = () => {
    frame = 0

    // Phase 1: read only.
    const viewport = window.innerHeight
    const measured: Array<{entry: Entry; progress: number}> = []
    entries.forEach((entry) => {
        const travel = entry.mode === "exit" ? entry.el.offsetHeight : entry.el.offsetHeight - viewport
        const progress = travel <= 0 ? 0 : -entry.el.getBoundingClientRect().top / travel
        measured.push({entry, progress})
    })

    // Phase 2: write only.
    measured.forEach(({entry, progress}) => {
        // Only report when something visibly changed.
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

        // Initial state right away, without waiting for the first event.
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
