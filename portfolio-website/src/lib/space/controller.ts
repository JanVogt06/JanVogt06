import type {SpaceScene, Anchor} from "./SpaceScene"

let current: SpaceScene | null = null

const anchorListeners = new Set<(anchor: Anchor) => void>()

export const attachScene = (scene: SpaceScene | null) => {
    current = scene
}

/** Called by the scene every frame, once per anchor kind. */
export const emitAnchor = (anchor: Anchor) => {
    anchorListeners.forEach((listener) => listener(anchor))
}

/** Listen for anchor positions. Returns the unsubscribe function. */
export const subscribeAnchor = (listener: (anchor: Anchor) => void) => {
    anchorListeners.add(listener)
    return () => {
        anchorListeners.delete(listener)
    }
}

/** All calls are no-ops while no scene is running (fallback). */
export const space = {
    hasScene: () => current !== null,
    setFieldProgress: (progress: number) => current?.setFieldProgress(progress),
    /** Flight through the galaxy: 0 = hero position, 1 = in front of the ring. */
    setAboutProgress: (progress: number) => current?.setAboutProgress(progress),
    /** Raw scroll through the career section; turns the planets while you read. */
    setAboutScroll: (progress: number) => current?.setAboutScroll(progress),
    /** Raw scroll through the project field; turns the crystals while you read. */
    setFieldScroll: (progress: number) => current?.setFieldScroll(progress),
    /** 0 = career section not active yet, 1 = section in place. */
    setAboutActive: (active: number) => current?.setAboutActive(active),
    /** Fly-through of the galaxy between career and projects. */
    setPassageProgress: (progress: number) => current?.setPassageProgress(progress),
    /** How far down the screen the section text reaches, 0..1. Frames the planets. */
    setTextFloor: (floor: number) => current?.setTextFloor(floor),
    /** 0 = ring far away, 1 = section in place. Drives the zoom-in. */
    setApproach: (approach: number) => current?.setApproach(approach),
    setPaused: (paused: boolean) => current?.setPaused(paused),
    setSelected: (index: number | null) => current?.setSelected(index),
}
