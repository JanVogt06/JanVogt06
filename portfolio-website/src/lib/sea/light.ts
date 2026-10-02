import {scatter, transmittance} from "./atmosphere"

type Vec3 = [number, number, number]

/**
 * One moment of the day the page walks through. Only the geometry and the
 * weather are chosen here; every colour follows from the atmosphere.
 */
export type Light = {
    sun: Vec3
    moon: Vec3
    /** Light reaching the sea from the sun and the moon, per channel. */
    sunLight: Vec3
    moonLight: Vec3
    /** Sky light falling on a level surface, per channel. */
    ambient: Vec3
    /** The sky straight up, which stands in for the light that scatters
     *  more than once and fills the haze at the horizon with blue. */
    zenith: Vec3
    haze: number
    fog: number
    clouds: number
    exposure: number
    stars: number
}

type Key = {
    shot: number
    sun: [number, number]
    moon: [number, number]
    haze: number
    fog: number
    clouds: number
}

/** The moon, as a share of the sun. Far brighter than the real one, so the
 *  night stays a deep blue instead of drowning in noise. */
export const MOON = 0.006

/** Moonlight is sunlight, but the eye reads it at night as cool. */
export const MOON_TINT: Vec3 = [0.62, 0.8, 1.2]

// Elevation and bearing in radians; bearing 0 is straight down the row of
// panels, positive to the right.
const KEYS: Key[] = [
    {shot: 0, sun: [0.045, -0.32], moon: [-0.5, 0.3], haze: 0.95, fog: 0.0034, clouds: 0.46},
    {shot: 1.4, sun: [0.36, -0.6], moon: [-0.5, 0.3], haze: 1.25, fog: 0.0024, clouds: 0.43},
    {shot: 3, sun: [1.05, -1.2], moon: [-0.5, 0.3], haze: 0.8, fog: 0.0016, clouds: 0.4},
    {shot: 4, sun: [0.3, 0.3], moon: [-0.5, 0.3], haze: 1, fog: 0.0019, clouds: 0.44},
    {shot: 7.6, sun: [0.014, 0.42], moon: [-0.4, 0.3], haze: 1.45, fog: 0.0026, clouds: 0.5},
    {shot: 9, sun: [-0.075, 0.46], moon: [-0.05, 0.3], haze: 1.3, fog: 0.0024, clouds: 0.46},
    {shot: 10, sun: [-0.32, 0.5], moon: [0.3, 0.28], haze: 1, fog: 0.002, clouds: 0.36},
]

const CLOCK: Array<[number, number]> = [
    [0, 6 * 60 + 12],
    [1.4, 8 * 60 + 40],
    [3, 13 * 60 + 5],
    [4, 16 * 60 + 10],
    [7.6, 20 * 60 + 21],
    [9, 20 * 60 + 58],
    [10, 23 * 60 + 17],
]

const smooth = (t: number) => t * t * (3 - 2 * t)
const mix = (a: number, b: number, t: number) => a + (b - a) * t

export const direction = ([elevation, bearing]: [number, number]): Vec3 => [
    Math.sin(bearing) * Math.cos(elevation),
    Math.sin(elevation),
    -Math.cos(bearing) * Math.cos(elevation),
]

const luminance = (c: Vec3) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]

const between = <T,>(list: T[], at: (item: T) => number, shot: number): [T, T, number] => {
    let i = 0
    while (i < list.length - 2 && shot > at(list[i + 1])) i++
    const a = list[i]
    const b = list[i + 1]
    return [a, b, Math.min(Math.max((shot - at(a)) / (at(b) - at(a)), 0), 1)]
}

const PROBES: Array<[number, number]> = [
    [1.57, 0],
    [0.02, 0],
    [0.02, Math.PI * 0.5],
    [0.02, Math.PI],
    [0.02, -Math.PI * 0.5],
    [0.35, 0.3],
    [0.35, Math.PI],
]

export const lightAt = (shot: number): Light => {
    const [a, b, raw] = between(KEYS, (k) => k.shot, shot)
    const t = smooth(raw)
    const sun = direction([mix(a.sun[0], b.sun[0], t), mix(a.sun[1], b.sun[1], t)])
    const moon = direction([mix(a.moon[0], b.moon[0], t), mix(a.moon[1], b.moon[1], t)])
    const haze = mix(a.haze, b.haze, t)

    const sky = (dir: Vec3): Vec3 => {
        const s = scatter(dir, sun, haze)
        const m = scatter(dir, moon, haze)
        return [0, 1, 2].map((c) => s[c] + m[c] * MOON * MOON_TINT[c]) as Vec3
    }

    // The eye adapts, but not all the way: dusk is meant to look darker than
    // noon, and night darker still.
    const probes = PROBES.map((probe) => sky(direction(probe)))
    const average = probes.reduce((sum, c) => sum + luminance(c), 0) / probes.length
    const exposure = Math.min(0.85 / Math.pow(Math.max(average, 1e-7), 0.75), 360)

    const zenith = probes[0]
    const horizon = probes.slice(1, 5).reduce<Vec3>((s, c) => [s[0] + c[0] / 4, s[1] + c[1] / 4, s[2] + c[2] / 4], [0, 0, 0])
    const ambient = [0, 1, 2].map((c) => Math.PI * (0.6 * zenith[c] + 0.4 * horizon[c])) as Vec3

    const sunT = transmittance(sun)
    const moonT = transmittance(moon)

    return {
        sun,
        moon,
        sunLight: sunT,
        moonLight: [0, 1, 2].map((c) => moonT[c] * MOON * MOON_TINT[c]) as Vec3,
        ambient,
        zenith,
        haze,
        fog: mix(a.fog, b.fog, t),
        clouds: mix(a.clouds, b.clouds, t),
        exposure,
        stars: smooth(Math.min(Math.max((exposure - 70) / 220, 0), 1)),
    }
}

/** The time on the scene's clock at a given shot, in minutes after midnight. */
export const clockAt = (shot: number) => {
    const [[s0, m0], [s1, m1]] = between(CLOCK, ([at]) => at, shot)
    const t = Math.min(Math.max((shot - s0) / (s1 - s0), 0), 1)
    return Math.round(m0 + (m1 - m0) * t)
}
