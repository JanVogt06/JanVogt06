import {createContext, useContext, useSyncExternalStore} from "react"

/**
 * Whether the block a piece of text sits in is currently on screen. Bands
 * flip it as they take and give up the frame, so entrances inside a band can
 * replay every time the camera comes back to it.
 */
export type Presence = {
    shown: () => boolean
    subscribe: (listener: () => void) => () => void
}

// Entrances fire as soon as a block starts to show, so its text decodes while
// it fades up rather than leaving an empty frame on screen, and they reset
// only once it is all but gone, so a slow scroll cannot make them stutter.
export const ARRIVES = 0.15
export const LEAVES = 0.04

export const always: Presence = {
    shown: () => true,
    subscribe: () => () => {},
}

export const PresenceContext = createContext<Presence>(always)

export const createPresence = () => {
    let shown = false
    const listeners = new Set<() => void>()

    const presence: Presence = {
        shown: () => shown,
        subscribe: (listener) => {
            listeners.add(listener)
            return () => {
                listeners.delete(listener)
            }
        },
    }

    const set = (next: boolean) => {
        if (next === shown) return
        shown = next
        listeners.forEach((listener) => listener())
    }

    return {presence, set}
}

export const usePresence = () => {
    const presence = useContext(PresenceContext)
    return useSyncExternalStore(presence.subscribe, presence.shown)
}
