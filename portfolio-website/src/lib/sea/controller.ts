import type {SeaScene} from "./SeaScene"

let current: SeaScene | null = null

let stirred = false
const stirListeners = new Set<() => void>()

export const attachScene = (scene: SeaScene | null) => {
    current = scene
}

export const sea = {
    setPaused: (paused: boolean) => current?.setPaused(paused),

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
