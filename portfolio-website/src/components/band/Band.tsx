import {forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState} from "react"
import type {ReactNode} from "react"
import {release, report} from "./metrics"
import {ARRIVES, LEAVES, PresenceContext, createPresence} from "@/lib/presence"

export type BandHandle = {
    setWeight: (weight: number, drift?: number) => void
}

const VISIBLE = 0.02

const OWNS_FRAME = 0.5

/**
 * The only place DOM text lives while the scene is running: one bottom
 * anchored region per section, driven by its section's scroll progress.
 * Without a scene it falls back to a plain block in document flow.
 *
 * A band never scrolls: a scroller inside a fixed layer swallows the page's
 * touch scroll. Its content is sized to fit, and clipped if it ever does not.
 */
const Band = forwardRef<
    BandHandle,
    {flow?: boolean; armed?: boolean; className?: string; children: ReactNode}
>(({flow = false, armed = true, className = "", children}, ref) => {
    const rootRef = useRef<HTMLDivElement>(null)
    const blockRef = useRef<HTMLDivElement>(null)
    const weight = useRef(0)
    const id = useRef<symbol>(Symbol("band"))
    const [{presence, set: setShown}] = useState(createPresence)

    const armedRef = useRef(armed)
    const inViewRef = useRef(false)
    useEffect(() => {
        armedRef.current = armed
        if (!armed) setShown(false)
        else if (flow ? inViewRef.current : weight.current >= ARRIVES) setShown(true)
    }, [armed, flow, setShown])

    // Without a scene there is no weight to follow; a block simply arrives
    // the first time it scrolls into view.
    useEffect(() => {
        const block = blockRef.current
        if (!flow || !block) return
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return
                inViewRef.current = true
                if (!armedRef.current) return
                setShown(true)
                observer.disconnect()
            },
            {threshold: 0.2},
        )
        observer.observe(block)
        return () => observer.disconnect()
    }, [flow, setShown])

    const measure = useCallback(() => {
        const block = blockRef.current
        if (!block || flow) return
        const rect = block.getBoundingClientRect()
        report(id.current, {
            weight: weight.current,
            top: rect.top,
            right: rect.right,
            height: rect.height,
        })
    }, [flow])

    useEffect(() => {
        const block = blockRef.current
        if (!block || flow) return

        const own = id.current
        const observer = new ResizeObserver(measure)
        observer.observe(block)

        return () => {
            observer.disconnect()
            release(own)
        }
    }, [flow, measure])

    useImperativeHandle(
        ref,
        () => ({
            setWeight: (next, drift = 0) => {
                const root = rootRef.current
                if (!root || flow) return

                const shown = next >= VISIBLE
                root.style.opacity = String(next)
                root.style.transform = `translate3d(0, ${drift.toFixed(1)}px, 0)`
                root.style.visibility = shown ? "visible" : "hidden"
                // A hidden band gives its compositor layer back.
                root.style.willChange = shown ? "transform, opacity" : "auto"
                root.setAttribute("aria-hidden", shown ? "false" : "true")

                // Metrics only change hands when a band takes or gives up the
                // frame — measuring per frame would cost a layout every frame.
                const handover = weight.current >= OWNS_FRAME !== (next >= OWNS_FRAME)
                weight.current = next
                if (handover) measure()

                if (next >= ARRIVES && armedRef.current) setShown(true)
                else if (next < LEAVES) setShown(false)
            },
        }),
        [flow, measure, setShown],
    )

    if (flow) {
        return (
            <PresenceContext.Provider value={presence}>
                <div ref={blockRef} data-register="doc" className={className}>
                    {children}
                </div>
            </PresenceContext.Provider>
        )
    }

    return (
        <PresenceContext.Provider value={presence}>
            {/* The layer is the small viewport, anchored to the top: a mobile
                toolbar sliding away then leaves the text where it was rather
                than dragging it down the screen. */}
            <div
                ref={rootRef}
                className="pointer-events-none fixed inset-x-0 top-0 z-20 flex h-svh flex-col justify-end px-[var(--gutter)] pb-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))]"
                style={{opacity: 0, visibility: "hidden"}}
            >
                <div
                    ref={blockRef}
                    data-band
                    className="soft-scrim etched pointer-events-auto relative mr-auto w-full max-w-[34rem] md:max-w-[44rem] lg:max-w-[56rem] xl:max-w-[64rem]"
                >
                    {/* The clip reaches past the content on every side, most
                        at the bottom, where a quiet action's hit box and focus
                        ring overhang it. */}
                    <div
                        className={`-mx-2 -mb-5 -mt-2 max-h-[calc(100svh-4.75rem)] overflow-clip px-2 pb-5 pt-2 ${className}`}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </PresenceContext.Provider>
    )
})

Band.displayName = "Band"

export default Band
