export const SCREENS_PER_STATION = 1.25

// Share of each station-to-station segment the camera holds on a station.
const HOLD = 0.5

// Share of the travel that is spread evenly over the whole track, so the
// camera keeps drifting through every hold instead of parking. Small enough
// that a band never leaves its full-weight plateau while it holds.
const CREEP = 0.15

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)
const smooth = (t: number) => t * t * (3 - 2 * t)

/** The first and last station get a full hold too, half of it at each end. */
export const trackScreens = (stops: number) =>
    1 + (Math.max(stops - 1, 0) + HOLD) * SCREENS_PER_STATION

/** Screens of pin travel a track of `stops` stations spans. */
export const trackTravel = (stops: number) => trackScreens(stops) - 1

export const stationPosition = (progress: number, stops: number) => {
    const span = Math.max(stops - 1, 1)
    const p = clamp01(progress)
    const raw = Math.min(Math.max(p * (span + HOLD) - HOLD / 2, 0), span)
    const index = Math.min(Math.floor(raw), span - 1)
    const within = raw - index
    const stepped = index + smooth(clamp01((within - HOLD / 2) / (1 - HOLD)))
    return (1 - CREEP) * stepped + CREEP * p * span
}

/** The pin progress at the middle of station `i`'s hold. */
export const stationProgress = (i: number, stops: number) =>
    (i + HOLD / 2) / (Math.max(stops - 1, 1) + HOLD)
