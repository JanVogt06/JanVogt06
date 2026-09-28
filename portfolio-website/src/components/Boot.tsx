import {useEffect, useState} from "react"

const FADE_MS = 700

const CELLS = 12
const GLYPHS = "-=+"
const TICK_MS = 110

/** The loaded share as a row of mono cells, the filled ones flickering. */
const Meter = ({fraction, tick}: {fraction: number; tick: number}) => {
    const filled = Math.round(fraction * CELLS)
    let cells = ""
    for (let i = 0; i < CELLS; i++) {
        cells += i < filled ? GLYPHS[(i * 5 + tick) % GLYPHS.length] : "·"
    }
    return <>{cells}</>
}

const Boot = ({progress, ready}: {progress: number; ready: boolean}) => {
    const [gone, setGone] = useState(false)
    const [tick, setTick] = useState(0)

    useEffect(() => {
        if (!ready) return
        const timer = window.setTimeout(() => setGone(true), FADE_MS)
        return () => window.clearTimeout(timer)
    }, [ready])

    useEffect(() => {
        if (ready || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
        const timer = window.setInterval(() => setTick((t) => t + 1), TICK_MS)
        return () => window.clearInterval(timer)
    }, [ready])

    if (gone) return null

    const fraction = Math.min(Math.max(progress, 0), 1)
    const percent = Math.round(fraction * 100)

    return (
        <div
            role="status"
            aria-live="polite"
            aria-label={ready ? "Szene geladen" : `Szene lädt, ${percent} Prozent`}
            className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-page transition-opacity ease-out"
            style={{
                opacity: ready ? 0 : 1,
                transitionDuration: `${FADE_MS}ms`,
                pointerEvents: ready ? "none" : "auto",
            }}
        >
            <p aria-hidden="true" className="font-mono text-label uppercase tracking-[0.12em] text-fg-3">
                Jan Vogt
            </p>
            <p
                aria-hidden="true"
                className="mt-4 font-mono text-[0.8125rem] tracking-[0.3em] text-signal [text-shadow:0_0_6px_rgb(159_216_234/0.55)]"
            >
                <Meter fraction={fraction} tick={tick}/>
            </p>
        </div>
    )
}

export default Boot
