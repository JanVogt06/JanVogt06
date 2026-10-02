import {useEffect} from "react"

const LERP = 0.09

const EPSILON = 0.5

const FOREIGN_SCROLL_THRESHOLD = 2

type Controller = {
    scrollTo: (top: number) => void
    jump: (top: number) => void
    active: boolean
}

let controller: Controller | null = null

const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

const isTouch = () => window.matchMedia("(pointer: coarse)").matches

const maxScroll = () =>
    Math.max(0, document.documentElement.scrollHeight - window.innerHeight)

const clamp = (value: number) => Math.min(Math.max(value, 0), maxScroll())

export const scrollToY = (top: number) => {
    if (controller?.active) {
        controller.scrollTo(top)
        return
    }
    window.scrollTo({top: clamp(top), behavior: prefersReducedMotion() ? "auto" : "smooth"})
}

// Past this many screens a smooth scroll would strobe every shot on the way,
// so the page blinks to fog, jumps, and lets the camera settle into view.
const WARP_SCREENS = 2.5
const VEIL_IN_MS = 200
const VEIL_OUT_MS = 480

let veil: HTMLDivElement | null = null

const jumpTo = (top: number) => {
    if (controller?.active) {
        controller.jump(top)
        return
    }
    window.scrollTo({top: clamp(top), behavior: "instant"})
}

export const warpToY = (top: number) => {
    const distance = Math.abs(top - window.scrollY) / window.innerHeight
    if (distance < WARP_SCREENS || prefersReducedMotion()) {
        scrollToY(top)
        return
    }

    if (!veil) {
        veil = document.createElement("div")
        veil.setAttribute("aria-hidden", "true")
        Object.assign(veil.style, {
            position: "fixed",
            inset: "0",
            zIndex: "90",
            pointerEvents: "none",
            background: "#9aa1aa",
            opacity: "0",
        })
        document.body.appendChild(veil)
    }

    const shade = veil
    shade.style.transition = `opacity ${VEIL_IN_MS}ms ease-in`
    shade.style.opacity = "1"

    window.setTimeout(() => {
        jumpTo(top)
        shade.style.transition = `opacity ${VEIL_OUT_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`
        shade.style.opacity = "0"
    }, VEIL_IN_MS)
}

/** Lands on a chapter: on its first resting stop over the scene, at the top
 *  of its block in the document. */
export const scrollToChapter = (id: string) => {
    const el = id === "top" ? null : document.getElementById(id)
    if (el || id === "top") warpToY(el ? el.getBoundingClientRect().top + window.scrollY : 0)
}

const ownsWheel = (node: EventTarget | null, deltaY: number) => {
    let el = node instanceof Element ? node : null
    while (el && el !== document.body) {
        if (el.hasAttribute("data-native-scroll")) return true
        const style = getComputedStyle(el)
        const scrollable = /auto|scroll|overlay/.test(style.overflowY)
        if (scrollable && el.scrollHeight > el.clientHeight) {
            const atTop = el.scrollTop <= 0
            const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1

            if (!(deltaY < 0 && atTop) && !(deltaY > 0 && atBottom)) return true
        }
        el = el.parentElement
    }
    return false
}

const deltaToPixels = (event: WheelEvent) => {
    if (event.deltaMode === 1) return event.deltaY * 16
    if (event.deltaMode === 2) return event.deltaY * window.innerHeight
    return event.deltaY
}

export const useSmoothScroll = () => {
    useEffect(() => {
        if (prefersReducedMotion() || isTouch()) {
            controller = {scrollTo: () => {}, jump: () => {}, active: false}
            return () => {
                controller = null
            }
        }

        let target = window.scrollY
        let current = target
        let frame = 0
        let last = 0

        // LERP is the share closed per frame at 60 Hz, scaled to the real
        // frame time so the glide feels the same on any display.
        const tick = (now: number) => {
            const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60
            last = now
            const distance = target - current
            if (Math.abs(distance) < EPSILON) {
                current = target
                window.scrollTo(0, current)
                frame = 0
                last = 0
                return
            }
            current += distance * (1 - Math.pow(1 - LERP, dt * 60))
            window.scrollTo(0, current)
            frame = requestAnimationFrame(tick)
        }

        const start = () => {
            if (!frame) frame = requestAnimationFrame(tick)
        }

        const onWheel = (event: WheelEvent) => {
            if (event.ctrlKey) return
            // A locked page (boot screen, open dialog) must not move under
            // the wheel: overflow:hidden does not stop a scripted scroll.
            if (document.documentElement.style.overflow === "hidden") return
            if (ownsWheel(event.target, event.deltaY)) return
            event.preventDefault()
            target = clamp(target + deltaToPixels(event))
            start()
        }

        const onScroll = () => {
            if (frame) return
            if (Math.abs(window.scrollY - current) <= FOREIGN_SCROLL_THRESHOLD) return
            current = target = window.scrollY
        }

        const onResize = () => {
            target = clamp(target)
        }

        controller = {
            active: true,
            scrollTo: (top) => {
                target = clamp(top)
                start()
            },
            jump: (top) => {
                if (frame) cancelAnimationFrame(frame)
                frame = 0
                last = 0
                current = target = clamp(top)
                window.scrollTo(0, current)
            },
        }

        window.addEventListener("wheel", onWheel, {passive: false})
        window.addEventListener("scroll", onScroll, {passive: true})
        window.addEventListener("resize", onResize)

        return () => {
            if (frame) cancelAnimationFrame(frame)
            window.removeEventListener("wheel", onWheel)
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onResize)
            controller = null
        }
    }, [])
}
