import {useLayoutEffect, useRef} from "react"
import type {ReactNode} from "react"
import {usePresence} from "@/lib/presence"
import useMediaQuery from "@/lib/useMediaQuery"

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)"

/**
 * Lifts its content out of a mask when the block arrives and drops it back
 * the instant the block leaves, so the entrance replays on every visit.
 * `mode="fade"` is the same beat for running copy, which should not be
 * clipped line by line.
 */
const Rise = ({
    children,
    delay = 0,
    duration = 900,
    mode = "mask",
    as: Tag = "span",
    className = "",
}: {
    children: ReactNode
    delay?: number
    duration?: number
    mode?: "mask" | "fade"
    as?: "span" | "div"
    className?: string
}) => {
    const shown = usePresence()
    const reduced = useMediaQuery("(prefers-reduced-motion: reduce)")
    const ref = useRef<HTMLSpanElement & HTMLDivElement>(null)

    useLayoutEffect(() => {
        const el = ref.current
        if (!el) return

        const hidden =
            mode === "mask" ? "translate3d(0, calc(100% + 0.3em), 0)" : "translate3d(0, 0.6rem, 0)"

        if (reduced) {
            el.style.transition = "none"
            el.style.transform = "none"
            el.style.opacity = "1"
            return
        }

        el.style.transition = "none"
        el.style.transform = hidden
        if (mode === "fade") el.style.opacity = "0"

        if (!shown) return

        // Committing the hidden state first is what makes a remount (a new
        // project in the same band) animate rather than appear.
        void el.offsetHeight

        el.style.transition =
            `transform ${duration}ms ${EASE} ${delay}ms, opacity ${duration * 0.7}ms ${EASE} ${delay}ms`
        el.style.transform = "none"
        el.style.opacity = "1"
    }, [shown, reduced, delay, duration, mode])

    if (mode === "fade") {
        return (
            <Tag ref={ref} className={`block will-change-transform ${className}`}>
                {children}
            </Tag>
        )
    }

    return (
        // The mask overhangs the line box both ways, or tight display leading
        // would clip umlauts at the top and descenders at the bottom.
        <Tag className={`-my-[0.16em] block overflow-hidden py-[0.16em] ${className}`}>
            <span ref={ref} className="block will-change-transform">
                {children}
            </span>
        </Tag>
    )
}

export default Rise
