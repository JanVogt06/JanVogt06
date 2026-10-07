import type {SeaScene} from "./SeaScene"

let current: SeaScene | null = null

export type Hover = "print" | "screen" | null

let hover: Hover = null
const hoverListeners = new Set<(hover: Hover) => void>()

let stirred = false
const stirListeners = new Set<() => void>()

export const attachScene = (scene: SeaScene | null) => {
    current = scene
}

export const sea = {
    setPaused: (paused: boolean) => current?.setPaused(paused),
    setFigure: (group: number | null) => current?.setFigure(group),

    /** What kind of panel the pointer rests on, for the cursor to say. */
    hover: () => hover,
    setHover: (next: Hover) => {
        if (next === hover) return
        hover = next
        hoverListeners.forEach((listener) => listener(hover))
    },
    subscribeHover: (listener: (hover: Hover) => void) => {
        hoverListeners.add(listener)
        return () => {
            hoverListeners.delete(listener)
        }
    },

    /** Whether the visitor has found out that the water answers them. */
    isStirred: () => stirred,
    markStirred: () => {
        if (stirred) return
        stirred = true
        stirListeners.forEach((listener) => listener())
    },
    subscribeStirred: (listener: () => void) => {
        stirListeners.add(listener)
        return () => {
            stirListeners.delete(listener)
        }
    },
}
