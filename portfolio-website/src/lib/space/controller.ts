import type {SpaceScene, Anchor} from "./SpaceScene"

let current: SpaceScene | null = null

const anchorListeners = new Set<(anchor: Anchor) => void>()

export const attachScene = (scene: SpaceScene | null) => {
    current = scene
}

export const emitAnchor = (anchor: Anchor) => {
    anchorListeners.forEach((listener) => listener(anchor))
}

export const subscribeAnchor = (listener: (anchor: Anchor) => void) => {
    anchorListeners.add(listener)
    return () => {
        anchorListeners.delete(listener)
    }
}

export const space = {
    hasScene: () => current !== null,
    setFieldProgress: (progress: number) => current?.setFieldProgress(progress),

    setAboutProgress: (progress: number) => current?.setAboutProgress(progress),

    setAboutScroll: (progress: number) => current?.setAboutScroll(progress),

    setFieldScroll: (progress: number) => current?.setFieldScroll(progress),

    setAboutActive: (active: number) => current?.setAboutActive(active),

    setPassageProgress: (progress: number) => current?.setPassageProgress(progress),

    setTextFloor: (floor: number) => current?.setTextFloor(floor),

    setApproach: (approach: number) => current?.setApproach(approach),
    setArrivalProgress: (progress: number) => current?.setArrivalProgress(progress),
    setPaused: (paused: boolean) => current?.setPaused(paused),
    setSelected: (index: number | null) => current?.setSelected(index),
}
