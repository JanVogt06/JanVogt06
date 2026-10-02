import {stations} from "./about"
import {projects} from "./projects"

// Stops are placed in svh, so scrolling has to be measured in svh too:
// against innerHeight, a mobile toolbar sliding away would shift every shot.
let probe: HTMLDivElement | null = null

const smallViewport = () => {
    if (!probe) {
        probe = document.createElement("div")
        probe.setAttribute("aria-hidden", "true")
        Object.assign(probe.style, {
            position: "fixed",
            top: "0",
            left: "0",
            width: "0",
            height: "100svh",
            visibility: "hidden",
            pointerEvents: "none",
        })
        document.body.appendChild(probe)
    }
    return probe.offsetHeight || window.innerHeight
}

const PHOTOS = stations.length
const WORK = projects.length

const run = (from: number, count: number) => Array.from({length: count}, (_, i) => from + i)

/**
 * The page is one camera move along a row of panels standing in the sea.
 * Every stop is a shot the camera rests on: the opening view, a photo per
 * station, a look down the row of screens that opens the work, a screen per
 * project and the night sky at the end.
 */
export const SHOT = {
    hero: 0,
    photos: run(1, PHOTOS),
    work: PHOTOS + 1,
    projects: run(PHOTOS + 2, WORK),
    contact: PHOTOS + WORK + 2,
}

export const SHOT_COUNT = SHOT.contact + 1

/** The shot that has panel `i` in focus: the photos first, then the work. */
export const panelShot = (i: number) =>
    i < SHOT.photos.length ? SHOT.photos[i] : SHOT.projects[i - SHOT.photos.length]

/** Screens of scrolling between one shot and the next. The long ones are
 *  where the chapters turn, and the day with them. */
const GAPS = [
    1.5,
    ...run(0, PHOTOS - 1).map(() => 1.05),
    1.35,
    1.3,
    ...run(0, WORK - 1).map(() => 1.05),
    1.5,
]

export const STOP_SCREENS = GAPS.reduce<number[]>((acc, gap) => [...acc, acc[acc.length - 1] + gap], [0])

export const TOTAL_SCREENS = STOP_SCREENS[STOP_SCREENS.length - 1] + 1

export type Chapter = "hero" | "about" | "projects" | "contact"

export const chapters: Array<{id: Exclude<Chapter, "hero">; index: string; label: string; shot: number}> = [
    {id: "about", index: "01", label: "Über mich", shot: SHOT.photos[0]},
    {id: "projects", index: "02", label: "Projekte", shot: SHOT.work},
    {id: "contact", index: "03", label: "Kontakt", shot: SHOT.contact},
]

export const chapterAt = (shot: number): Chapter => {
    if (shot < SHOT.photos[0] - 0.5) return "hero"
    if (shot < SHOT.work - 0.5) return "about"
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
