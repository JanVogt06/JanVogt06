/** Viewports of scroll between two neighbouring stations. */
export const SCREENS_PER_STATION = 2

/** Share of a segment spent standing at a station rather than travelling. */
const HOLD = 0.6

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)
const smooth = (t: number) => t * t * (3 - 2 * t)

/** How many viewports a track with that many stations needs. */
export const trackScreens = (stops: number) => 1 + Math.max(stops - 1, 0) * SCREENS_PER_STATION

/**
 * Linear scroll to station position. Most of a segment is spent standing still at a
 * station, only the middle travels to the next one. Without it every station is a
 * passing moment and the crossfade is on screen longer than the content is.
 */
export const stationPosition = (progress: number, stops: number) => {
    const span = Math.max(stops - 1, 1)
    const raw = clamp01(progress) * span
    const index = Math.min(Math.floor(raw), span - 1)
    const within = raw - index
    return index + smooth(clamp01((within - HOLD / 2) / (1 - HOLD)))
}
