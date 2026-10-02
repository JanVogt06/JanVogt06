import * as THREE from "three"

/** One moment of the day the page walks through, from morning fog to night. */
export type Light = {
    zenith: THREE.Color
    horizon: THREE.Color
    deep: THREE.Color
    sun: THREE.Color
    /** Elevation and bearing of the sun (or the moon), in radians. */
    elevation: number
    bearing: number
    sunSize: number
    halo: number
    glitter: number
    fog: number
    stars: number
    panel: number
    frame: THREE.Color
}

type Spec = Omit<Light, "zenith" | "horizon" | "deep" | "sun" | "frame"> & {
    zenith: string
    horizon: string
    deep: string
    sun: string
    frame: string
}

const spec = (s: Spec): Light => ({
    ...s,
    zenith: new THREE.Color(s.zenith),
    horizon: new THREE.Color(s.horizon),
    deep: new THREE.Color(s.deep),
    sun: new THREE.Color(s.sun),
    frame: new THREE.Color(s.frame),
})

// Kept almost colourless on purpose: the screenshots are the only saturated
// thing in the frame, and only while they are in focus.
const MORNING = spec({
    zenith: "#5f6874",
    horizon: "#b9bfc6",
    deep: "#161c23",
    sun: "#cfccc5",
    elevation: 0.085,
    bearing: -0.3,
    sunSize: 0.03,
    halo: 0.7,
    glitter: 0.22,
    fog: 0.025,
    stars: 0,
    panel: 0.92,
    frame: "#1a1f25",
})

const DAY = spec({
    zenith: "#56616e",
    horizon: "#aeb6bf",
    deep: "#141a21",
    sun: "#f2efe9",
    elevation: 0.62,
    bearing: -0.45,
    sunSize: 0.02,
    halo: 0.55,
    glitter: 0.22,
    fog: 0.0085,
    stars: 0,
    panel: 0.95,
    frame: "#161b21",
})

const DUSK = spec({
    zenith: "#252d39",
    horizon: "#7b7f88",
    deep: "#10151b",
    sun: "#e9d9c6",
    elevation: 0.012,
    bearing: -0.55,
    sunSize: 0.024,
    halo: 1,
    glitter: 0.5,
    fog: 0.0095,
    stars: 0.08,
    panel: 1,
    frame: "#0e1217",
})

const BLUE = spec({
    zenith: "#121924",
    horizon: "#3f4858",
    deep: "#090d12",
    sun: "#9fb0c8",
    elevation: -0.04,
    bearing: -0.6,
    sunSize: 0.0,
    halo: 0.6,
    glitter: 0.1,
    fog: 0.0105,
    stars: 0.35,
    panel: 1,
    frame: "#0a0d11",
})

const NIGHT = spec({
    zenith: "#04070b",
    horizon: "#18202b",
    deep: "#04070a",
    sun: "#d8e2f0",
    elevation: 0.2,
    bearing: 0.28,
    sunSize: 0.014,
    halo: 0.5,
    glitter: 0.9,
    fog: 0.0075,
    stars: 1,
    panel: 0.9,
    frame: "#07090c",
})

/** Shot positions the day is pinned to, see `shots.ts`. */
const KEYS: ReadonlyArray<[number, Light]> = [
    [0, MORNING],
    [1.4, DAY],
    [3.2, DAY],
    [4.4, DUSK],
    [8, BLUE],
    [9, NIGHT],
]

const smooth = (t: number) => t * t * (3 - 2 * t)

export const createLight = (): Light => spec({
    zenith: "#000", horizon: "#000", deep: "#000", sun: "#000", frame: "#000",
    elevation: 0, bearing: 0, sunSize: 0, halo: 0, glitter: 0, fog: 0, stars: 0, panel: 0,
})

export const lightAt = (shot: number, out: Light) => {
    let i = 0
    while (i < KEYS.length - 2 && shot > KEYS[i + 1][0]) i++
    const [s0, a] = KEYS[i]
    const [s1, b] = KEYS[i + 1]
    const t = smooth(Math.min(Math.max((shot - s0) / (s1 - s0), 0), 1))

    out.zenith.lerpColors(a.zenith, b.zenith, t)
    out.horizon.lerpColors(a.horizon, b.horizon, t)
    out.deep.lerpColors(a.deep, b.deep, t)
    out.sun.lerpColors(a.sun, b.sun, t)
    out.frame.lerpColors(a.frame, b.frame, t)

    // The moon is not the sun: crossing from blue hour to night the light
    // sets and a second one rises, so the disc must not slide across the sky.
    const handover = a === BLUE && b === NIGHT
    const fall = handover ? Math.min(t * 2, 1) : t
    const rise = handover ? Math.max(t * 2 - 1, 0) : t
    out.elevation = handover ? (t < 0.5 ? a.elevation - 0.1 * fall : b.elevation * rise) : a.elevation + (b.elevation - a.elevation) * t
    out.bearing = handover ? (t < 0.5 ? a.bearing : b.bearing) : a.bearing + (b.bearing - a.bearing) * t
    out.sunSize = handover ? b.sunSize * rise : a.sunSize + (b.sunSize - a.sunSize) * t
    out.halo = handover ? b.halo * rise + a.halo * (1 - fall) : a.halo + (b.halo - a.halo) * t
    out.glitter = handover ? b.glitter * rise : a.glitter + (b.glitter - a.glitter) * t

    out.fog = a.fog + (b.fog - a.fog) * t
    out.stars = a.stars + (b.stars - a.stars) * t
    out.panel = a.panel + (b.panel - a.panel) * t
    return out
}

/** The time on the scene's clock at a given shot, in minutes after midnight. */
export const clockAt = (shot: number) => {
    const marks: ReadonlyArray<[number, number]> = [
        [0, 6 * 60 + 12],
        [1.4, 9 * 60 + 40],
        [3.2, 14 * 60 + 5],
        [4.4, 19 * 60 + 48],
        [8, 21 * 60 + 2],
        [9, 23 * 60 + 17],
    ]
    let i = 0
    while (i < marks.length - 2 && shot > marks[i + 1][0]) i++
    const [s0, m0] = marks[i]
    const [s1, m1] = marks[i + 1]
    const t = Math.min(Math.max((shot - s0) / (s1 - s0), 0), 1)
    return Math.round(m0 + (m1 - m0) * t)
}
