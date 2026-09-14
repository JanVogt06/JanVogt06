const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

// A hard flick on a touch screen can stack dissolves, because the smooth
// scroller disables itself there — so the window is wider on coarse pointers.
const coarse =
    typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches

const REACH = coarse ? 0.42 : 0.34
const FALL = coarse ? 0.34 : 0.28

/**
 * How present a band is, given its distance from the station the camera is
 * currently on. Full while `|d| < 0.08`, nothing by `|d| = REACH` — which
 * leaves a real stretch of scroll with no text on screen at all.
 */
export const bandWeight = (d: number) => {
    const t = clamp01((REACH - Math.abs(d)) / FALL)
    return t * t * (3 - 2 * t)
}
