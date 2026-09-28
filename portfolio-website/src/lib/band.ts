const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)
const smooth = (t: number) => {
    const c = clamp01(t)
    return c * c * (3 - 2 * c)
}

// A hard flick on a touch screen can stack dissolves, because the smooth
// scroller disables itself there — so the window is wider on coarse pointers.
const coarse =
    typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches

const REACH = coarse ? 0.42 : 0.36
const FALL = coarse ? 0.3 : 0.26

/**
 * How present a band is, given its distance from the station the camera is
 * currently on. Full while `|d| < REACH - FALL`, nothing by `|d| = REACH` —
 * a short stretch mid-flight with no text, while the camera is moving fastest.
 */
export const bandWeight = (d: number) => smooth((REACH - Math.abs(d)) / FALL)

/** Rises over `a0..a1` and falls over `b0..b1`. */
export const bump = (q: number, a0: number, a1: number, b0: number, b1: number) =>
    smooth((q - a0) / (a1 - a0)) * (1 - smooth((q - b0) / (b1 - b0)))

export {clamp01, smooth}
