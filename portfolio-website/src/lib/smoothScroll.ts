import {useEffect} from "react"

const LERP = 0.09

const EPSILON = 0.5

const FOREIGN_SCROLL_THRESHOLD = 2

type Controller = {
    /** Set the target directly, e.g. for navigation. */
    scrollTo: (top: number) => void
    active: boolean
}

let controller: Controller | null = null

const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

const isTouch = () => window.matchMedia("(pointer: coarse)").matches

const maxScroll = () =>
    Math.max(0, document.documentElement.scrollHeight - window.innerHeight)

const clamp = (value: number) => Math.min(Math.max(value, 0), maxScroll())

export const scrollToPosition = (top: number) => {
    if (controller?.active) {
        controller.scrollTo(top)
        return
    }
    window.scrollTo({top, behavior: prefersReducedMotion() ? "auto" : "smooth"})
}

export const scrollToElement = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return

    if (controller?.active) {
        // Respect scroll-padding-top of <html> so the target clears the fixed bar.
        const padding = parseFloat(
            getComputedStyle(document.documentElement).scrollPaddingTop || "0",
        )
        controller.scrollTo(el.getBoundingClientRect().top + window.scrollY - (padding || 0))
        return
    }

    el.scrollIntoView({behavior: prefersReducedMotion() ? "auto" : "smooth"})
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
            // Only while it can still scroll itself; the page takes over at the end.
            if (!(deltaY < 0 && atTop) && !(deltaY > 0 && atBottom)) return true
        }
        el = el.parentElement
    }
    return false
}

/** Wheel delta in pixels; devices report lines or pages. */
const deltaToPixels = (event: WheelEvent) => {
    if (event.deltaMode === 1) return event.deltaY * 16
    if (event.deltaMode === 2) return event.deltaY * window.innerHeight
    return event.deltaY
}

export const useSmoothScroll = () => {
    useEffect(() => {
        if (prefersReducedMotion() || isTouch()) {
            controller = {scrollTo: () => {}, active: false}
            return () => {
                controller = null
            }
        }

        let target = window.scrollY
        let current = target
        let frame = 0

        const tick = () => {
            const distance = target - current
            if (Math.abs(distance) < EPSILON) {
                current = target
                window.scrollTo(0, current)
                frame = 0
                return
            }
            current += distance * LERP
            window.scrollTo(0, current)
            frame = requestAnimationFrame(tick)
        }

        const start = () => {
            if (!frame) frame = requestAnimationFrame(tick)
        }

        const onWheel = (event: WheelEvent) => {
            if (event.ctrlKey) return // pinch zoom
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
