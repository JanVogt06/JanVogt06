import {useEffect, useState} from "react"

const FADE_MS = 700

const Boot = ({progress, ready}: {progress: number; ready: boolean}) => {
    const [gone, setGone] = useState(false)

    useEffect(() => {
        if (!ready) return
        const timer = window.setTimeout(() => setGone(true), FADE_MS)
        return () => window.clearTimeout(timer)
    }, [ready])

    if (gone) return null

    const percent = Math.round(Math.min(Math.max(progress, 0), 1) * 100)

    return (
        <div
            role="status"
            aria-live="polite"
            aria-label={ready ? "Szene geladen" : `Szene lädt, ${percent} Prozent`}
            className="fixed inset-0 z-100 bg-page transition-opacity ease-out"
            style={{
                opacity: ready ? 0 : 1,
                transitionDuration: `${FADE_MS}ms`,
                pointerEvents: ready ? "none" : "auto",
            }}
        >
            <div className="absolute inset-x-6 bottom-6 sm:inset-x-10 sm:bottom-10">
                <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
                    <span>Jan Vogt</span>
                    <span className="tabular-nums">{String(percent).padStart(3, "0")}</span>
                </div>

                <div className="mt-3 h-px w-full bg-white/10">
                    <div
                        className="h-px origin-left bg-white/45 transition-transform duration-300 ease-out"
                        style={{transform: `scaleX(${percent / 100})`}}
                    />
                </div>
            </div>
        </div>
    )
}

export default Boot
