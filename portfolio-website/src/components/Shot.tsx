import {useEffect, useRef, useState} from "react"
import type {ReactNode} from "react"
import {ARRIVES, LEAVES, PresenceContext, always, createPresence} from "@/lib/presence"
import {journey, presence} from "@/lib/journey"

const VISIBLE = 0.02

/**
 * The copy for one camera stop. Over the scene it is a fixed layer that
 * fades with the camera's distance from its shot; without one it is a
 * screen-tall block in the document, with its picture shown inline.
 */
const Shot = ({
    at,
    flow,
    media,
    className = "",
    children,
}: {
    at: number
    flow: boolean
    media?: ReactNode
    className?: string
    children: ReactNode
}) => {
    const rootRef = useRef<HTMLDivElement>(null)
    const [{presence: shown, set}] = useState(createPresence)

    useEffect(() => {
        if (flow) return
        return journey.subscribe((shot) => {
            const root = rootRef.current
            if (!root) return
            const weight = presence(shot, at)
            const visible = weight >= VISIBLE
            const side = shot < at ? 1 : -1
            root.style.opacity = String(weight)
            root.style.transform = `translate3d(0, ${((1 - weight) * 18 * side).toFixed(1)}px, 0)`
            root.style.visibility = visible ? "visible" : "hidden"
            root.setAttribute("aria-hidden", visible ? "false" : "true")
            if (weight >= ARRIVES) set(true)
            else if (weight < LEAVES) set(false)
        })
    }, [at, flow, set])

    if (flow) {
        return (
            <PresenceContext.Provider value={always}>
                <section className={`relative flex min-h-svh flex-col justify-end px-[var(--gutter)] pb-20 pt-28 ${className}`}>
                    {media && <div className="mb-10 w-full max-w-[44rem] self-end">{media}</div>}
                    {children}
                </section>
            </PresenceContext.Provider>
        )
    }

    // Only the actions take the pointer: the rest of the layer lets clicks
    // through to the panel behind it.
    return (
        <PresenceContext.Provider value={shown}>
            <div
                ref={rootRef}
                data-overlay
                className={`ink pointer-events-none fixed inset-x-0 top-0 z-20 [&_a]:pointer-events-auto [&_button]:pointer-events-auto flex h-svh flex-col px-[var(--gutter)] pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] pt-20 will-change-transform md:pb-24 ${className}`}
                style={{opacity: 0, visibility: "hidden"}}
            >
                {children}
            </div>
        </PresenceContext.Provider>
    )
}

export default Shot
