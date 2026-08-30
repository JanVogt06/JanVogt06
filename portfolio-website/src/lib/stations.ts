export const SCREENS_PER_STATION = 2

const HOLD = 0.6

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)
const smooth = (t: number) => t * t * (3 - 2 * t)

export const trackScreens = (stops: number) => 1 + Math.max(stops - 1, 0) * SCREENS_PER_STATION

export const stationPosition = (progress: number, stops: number) => {
    const span = Math.max(stops - 1, 1)
    const raw = clamp01(progress) * span
    const index = Math.min(Math.floor(raw), span - 1)
    const within = raw - index
    return index + smooth(clamp01((within - HOLD / 2) / (1 - HOLD)))
}
