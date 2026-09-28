import {useCallback, useLayoutEffect, useRef} from "react"
import {usePresence} from "@/lib/presence"
import useMediaQuery from "@/lib/useMediaQuery"

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const LOWER = "abcdefghijklmnopqrstuvwxyz"

// Every line takes the same time however long it is: characters come into
// view on a quick sweep, and each one then runs through a handful of wrong
// letters before it locks, the tail lingering longest.
const SWEEP = 400
const DECODE = 750
const WRONG = 5.753

const BLANK = " "

const sineOut = (t: number) => Math.sin(Math.min(Math.max(t, 0), 1) * (Math.PI / 2))

const scrambles = (char: string) => /\p{L}/u.test(char)

const noise = (char: string, i: number, step: number) => {
    const set = char === char.toLowerCase() && char !== char.toUpperCase() ? LOWER : UPPER
    return set[(i * 7 + step * 13 + 3) % set.length]
}

const frameAt = (text: string, elapsed: number, speed: number) => {
    const shown = 1.1 * sineOut(elapsed / (SWEEP * speed))
    const decoded = 2 * sineOut(elapsed / (DECODE * speed))
    const last = Math.max(text.length - 1, 1)

    let out = ""
    let done = true

    for (let i = 0; i < text.length; i++) {
        const char = text[i]
        const w = i / last

        if ((shown - w) / 0.1 < 1) {
            done = false
            out += /\s/.test(char) ? char : BLANK
            continue
        }

        if (!scrambles(char)) {
            out += char
            continue
        }

        const settle = Math.min(Math.max(decoded - w, 0), 1)
        const step = Math.floor((1 - settle) * WRONG)
        if (step > 0) done = false
        out += step > 0 ? noise(char, i, step) : char
    }

    return {out, done}
}

/**
 * Mono text that decodes itself whenever its block arrives, and again, twice
 * as fast, when the pointer finds it. Only ever used on monospaced type, so a
 * glyph swap never moves the layout.
 */
const Scramble = ({
    text,
    delay = 0,
    hover = false,
    className = "",
}: {
    text: string
    delay?: number

    /** Replay on hover of the nearest `.group` ancestor, or of the text. */
    hover?: boolean
    className?: string
}) => {
    const shown = usePresence()
    const reduced = useMediaQuery("(prefers-reduced-motion: reduce)")
    const ref = useRef<HTMLSpanElement>(null)
    const frame = useRef(0)
    const lastReplay = useRef(0)

    const play = useCallback(
        (wait: number, speed: number) => {
            const el = ref.current
            if (!el) return
            cancelAnimationFrame(frame.current)

            const start = performance.now() + wait
            const tick = (now: number) => {
                const {out, done} = frameAt(text, now - start, speed)
                el.textContent = out
                if (!done) frame.current = requestAnimationFrame(tick)
            }
            frame.current = requestAnimationFrame(tick)
        },
        [text],
    )

    useLayoutEffect(() => {
        const el = ref.current
        if (!el) return

        if (reduced) {
            el.textContent = text
            return
        }

        el.textContent = text.replace(/\S/g, BLANK)
        if (shown) play(delay, 1)

        return () => cancelAnimationFrame(frame.current)
    }, [shown, reduced, text, delay, play])

    useLayoutEffect(() => {
        const el = ref.current
        if (!el || !hover || reduced) return

        const target = (el.closest(".group") as HTMLElement | null) ?? el
        const onEnter = () => {
            const now = performance.now()
            if (now - lastReplay.current < 400) return
            lastReplay.current = now
            play(0, 0.5)
        }
        target.addEventListener("pointerenter", onEnter)
        return () => target.removeEventListener("pointerenter", onEnter)
    }, [hover, reduced, play])

    return (
        <span className={className}>
            <span className="sr-only">{text}</span>
            <span ref={ref} aria-hidden="true">
                {text}
            </span>
        </span>
    )
}

export default Scramble
