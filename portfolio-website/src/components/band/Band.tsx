import {forwardRef, useCallback, useEffect, useImperativeHandle, useRef} from "react"
import type {ReactNode} from "react"
import {release, report} from "./metrics"

export type BandHandle = {
    setWeight: (weight: number, drift?: number) => void
}

const VISIBLE = 0.02

const OWNS_FRAME = 0.5

/**
 * The only place DOM text lives while the scene is running: one bottom
 * anchored region per section, driven by its section's scroll progress.
 * Without a scene it falls back to a plain block in document flow.
 */
const Band = forwardRef<
    BandHandle,
    {flow?: boolean; className?: string; children: ReactNode}
>(({flow = false, className = "", children}, ref) => {
    const rootRef = useRef<HTMLDivElement>(null)
    const blockRef = useRef<HTMLDivElement>(null)
    const weight = useRef(0)
    const id = useRef<symbol>(Symbol("band"))

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
        window.addEventListener("resize", measure)

        return () => {
            observer.disconnect()
            window.removeEventListener("resize", measure)
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
                root.setAttribute("aria-hidden", shown ? "false" : "true")

                // Metrics only change hands when a band takes or gives up the
                // frame — measuring per frame would cost a layout every frame.
                const handover = weight.current >= OWNS_FRAME !== (next >= OWNS_FRAME)
                weight.current = next
                if (handover) measure()
            },
        }),
        [flow, measure],
    )

    if (flow) {
        return (
            <div data-register="doc" className={className}>
                {children}
            </div>
        )
    }

    return (
        <div
            ref={rootRef}
            className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-[var(--gutter)] pb-[calc(env(safe-area-inset-bottom)+1.25rem)] will-change-transform"
            style={{opacity: 0, visibility: "hidden"}}
        >
            <div
                ref={blockRef}
                className={`soft-scrim etched pointer-events-auto relative mx-auto w-full max-w-[34rem] lg:max-w-[42rem] ${className}`}
            >
                {/* The scroller is inside the scrim, because the scrim's own
                    pseudo-element overhangs the block and would otherwise make
                    every band scrollable by the height of its own shadow. */}
                <div
                    data-native-scroll
                    className="-mb-3 max-h-[calc(100svh-7.5rem)] overflow-y-auto overscroll-contain pb-3"
                >
                    {children}
                </div>
            </div>
        </div>
    )
})

Band.displayName = "Band"

export default Band
