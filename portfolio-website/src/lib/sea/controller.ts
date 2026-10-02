import type {SeaScene} from "./SeaScene"

let current: SeaScene | null = null

export const attachScene = (scene: SeaScene | null) => {
    current = scene
}

export const sea = {
    setPaused: (paused: boolean) => current?.setPaused(paused),
}
