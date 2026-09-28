import {forwardRef, useImperativeHandle, useRef, useState} from "react"
import {ARRIVES, LEAVES, PresenceContext, createPresence} from "@/lib/presence"
import Scramble from "./type/Scramble"
import Rise from "./type/Rise"

export type InterludeHandle = {
    setWeight: (weight: number, drift?: number) => void
}

const VISIBLE = 0.02

/**
 * A chapter title that holds the frame while the camera travels between two
 * sections, so a flight reads as a turn of the page rather than a gap.
 * It never reports band metrics: the scene keeps its full frame behind it.
 */
const Interlude = forwardRef<
    InterludeHandle,
    {index: string; title: string; note: string}
>(({index, title, note}, ref) => {
    const rootRef = useRef<HTMLDivElement>(null)
    const [{presence, set}] = useState(createPresence)

    useImperativeHandle(
        ref,
        () => ({
            setWeight: (weight, drift = 0) => {
                const root = rootRef.current
                if (!root) return
                const shown = weight >= VISIBLE
                root.style.opacity = String(weight)
                root.style.transform = `translate3d(0, ${drift.toFixed(1)}px, 0)`
                root.style.visibility = shown ? "visible" : "hidden"

                if (weight >= ARRIVES) set(true)
                else if (weight < LEAVES) set(false)
            },
        }),
        [set],
    )

    return (
        <PresenceContext.Provider value={presence}>
            <div
                ref={rootRef}
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center px-[var(--gutter)] will-change-transform"
                style={{opacity: 0, visibility: "hidden"}}
            >
                {/* Set a little below centre, clear of the galaxy core the
                    camera holds above it, and grounded by a cover of its own. */}
                <div className="etched relative mt-[10svh] flex flex-col items-center text-center before:absolute before:-inset-x-16 before:-inset-y-10 before:-z-10 before:bg-[radial-gradient(closest-side,rgb(5_7_10/0.7),rgb(5_7_10/0.38)_60%,transparent)] before:blur-[10px] before:content-['']">
                    <p className="font-mono text-label uppercase tracking-[0.08em] text-fg-2">
                        <Scramble text={`Kapitel ${index}`}/>
                    </p>
                    <p className="mt-4 text-display text-fg">
                        <Rise delay={40} duration={600}>
                            {title}
                        </Rise>
                    </p>
                    <p className="mt-5 font-mono text-label uppercase tracking-[0.08em] text-fg-2">
                        <Scramble text={note} delay={200}/>
                    </p>
                </div>
            </div>
        </PresenceContext.Provider>
    )
})

Interlude.displayName = "Interlude"

export default Interlude
