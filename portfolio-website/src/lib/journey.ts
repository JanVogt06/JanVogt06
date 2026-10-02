import {smallViewport} from "./useScrollProgress"

/**
 * The page is one camera move along a row of panels standing in the sea.
 * Every stop is a shot the camera rests on: the opening view, three photos,
 * five projects and the night sky at the end.
 */
export const SHOT = {
    hero: 0,
    photos: [1, 2, 3],
    projects: [4, 5, 6, 7, 8],
    contact: 9,
} as const

export const SHOT_COUNT = 10

/** Screens of scrolling between one shot and the next. The two long ones are
 *  where the day turns: into the afternoon, and into the night. */
const GAPS = [1.5, 1.05, 1.05, 1.7, 1.05, 1.05, 1.05, 1.05, 1.5]

export const STOP_SCREENS = GAPS.reduce<number[]>((acc, gap) => [...acc, acc[acc.length - 1] + gap], [0])

export const TOTAL_SCREENS = STOP_SCREENS[STOP_SCREENS.length - 1] + 1

export type Chapter = "hero" | "about" | "projects" | "contact"

export const chapters: Array<{id: Exclude<Chapter, "hero">; index: string; label: string; shot: number}> = [
    {id: "about", index: "01", label: "Über mich", shot: SHOT.photos[0]},
    {id: "projects", index: "02", label: "Projekte", shot: SHOT.projects[0]},
    {id: "contact", index: "03", label: "Kontakt", shot: SHOT.contact},
]

export const chapterAt = (shot: number): Chapter => {
    if (shot < SHOT.photos[0] - 0.5) return "hero"
    if (shot < SHOT.projects[0] - 0.5) return "about"
    if (shot < SHOT.contact - 0.5) return "projects"
    return "contact"
}

// Share of each gap the camera holds still on a shot, half at either end,
// and the share of the move spread over the whole gap so it never parks.
const HOLD = 0.34
const CREEP = 0.12

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)
const smooth = (t: number) => t * t * (3 - 2 * t)

export const shotAt = (scrollY: number, viewport: number) => {
    const screens = scrollY / Math.max(viewport, 1)
    if (screens <= 0) return 0
    const last = STOP_SCREENS.length - 1
    if (screens >= STOP_SCREENS[last]) return last

    let i = 0
    while (screens > STOP_SCREENS[i + 1]) i++
    const t = (screens - STOP_SCREENS[i]) / (STOP_SCREENS[i + 1] - STOP_SCREENS[i])
    const held = smooth(clamp01((t - HOLD / 2) / (1 - HOLD)))
    return i + (1 - CREEP) * held + CREEP * t
}

/** How present the copy for a shot is: whole while the camera rests on it,
 *  gone mid-flight, while the camera is moving fastest. */
export const presence = (shot: number, at: number) => smooth(clamp01((0.42 - Math.abs(shot - at)) / 0.26))

export const scrollYForShot = (shot: number) => STOP_SCREENS[shot] * smallViewport()

type Listener = (shot: number) => void

const listeners = new Set<Listener>()
let current = 0
let frame = 0

const measure = () => {
    frame = 0
    const next = shotAt(window.scrollY, smallViewport())
    if (Math.abs(next - current) < 1e-5) return
    current = next
    listeners.forEach((listener) => listener(current))
}

const request = () => {
    if (!frame) frame = requestAnimationFrame(measure)
}

export const journey = {
    get: () => current,

    subscribe: (listener: Listener) => {
        listeners.add(listener)
        if (listeners.size === 1) {
            window.addEventListener("scroll", request, {passive: true})
            window.addEventListener("resize", request)
            current = shotAt(window.scrollY, smallViewport())
        }
        listener(current)
        return () => {
            listeners.delete(listener)
            if (listeners.size === 0) {
                window.removeEventListener("scroll", request)
                window.removeEventListener("resize", request)
                if (frame) cancelAnimationFrame(frame)
                frame = 0
            }
        }
    },
}
