import {useEffect, useRef, useState} from "react"
import {sea} from "@/lib/sea/controller"
import type {Hover} from "@/lib/sea/controller"

const LABELS: Record<Exclude<Hover, null>, string> = {print: "Ansehen", screen: "Öffnen"}

/**
 * A dot that sits on the pointer and a ring that trails it. Over a link the
 * ring opens out; over the panel in focus it grows and says what a click does.
 * Only for a mouse: a finger needs no cursor.
 */
const Cursor = () => {
    const dotRef = useRef<HTMLDivElement>(null)
    const ringRef = useRef<HTMLDivElement>(null)
    const [panel, setPanel] = useState<Hover>(sea.hover)
    const [link, setLink] = useState(false)
    const [shown, setShown] = useState(false)

    useEffect(() => sea.subscribeHover(setPanel), [])

    useEffect(() => {
        const at = {x: -100, y: -100}
        const ring = {x: -100, y: -100}
        let frame = 0
        let last = 0

        const tick = (now: number) => {
            frame = requestAnimationFrame(tick)
            const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60
            last = now
            const k = 1 - Math.exp(-dt / 0.09)
            ring.x += (at.x - ring.x) * k
            ring.y += (at.y - ring.y) * k
            if (dotRef.current) dotRef.current.style.transform = `translate3d(${at.x}px, ${at.y}px, 0)`
            if (ringRef.current) ringRef.current.style.transform = `translate3d(${ring.x.toFixed(1)}px, ${ring.y.toFixed(1)}px, 0)`
        }

        const move = (event: PointerEvent) => {
            if (event.pointerType !== "mouse") return
            at.x = event.clientX
            at.y = event.clientY
            setShown(true)
            const target = event.target instanceof Element ? event.target : null
            setLink(Boolean(target?.closest("a, button, [role=button]")))
        }
        const leave = () => setShown(false)

        frame = requestAnimationFrame(tick)
        window.addEventListener("pointermove", move, {passive: true})
        document.documentElement.addEventListener("pointerleave", leave)
        document.documentElement.classList.add("custom-cursor")
        return () => {
            cancelAnimationFrame(frame)
            window.removeEventListener("pointermove", move)
            document.documentElement.removeEventListener("pointerleave", leave)
            document.documentElement.classList.remove("custom-cursor")
        }
    }, [])

    const label = panel ? LABELS[panel] : null
    const size = label ? 88 : link ? 44 : 30

    return (
        <div aria-hidden="true" className={`pointer-events-none fixed inset-0 z-[95] transition-opacity duration-300 ${shown ? "opacity-100" : "opacity-0"}`}>
            <div ref={ringRef} className="absolute left-0 top-0">
                <div
                    className={`label absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-fg transition-[width,height,background-color,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        label ? "border-fg/0 bg-fg/15 backdrop-blur-sm" : "border-fg/50 bg-transparent"
                    }`}
                    style={{width: size, height: size}}
                >
                    <span className={`transition-opacity duration-300 ${label ? "opacity-100" : "opacity-0"}`}>{label}</span>
                </div>
            </div>
            <div ref={dotRef} className="absolute left-0 top-0">
                <div className={`absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg transition-opacity duration-300 ${label || link ? "opacity-0" : "opacity-100"}`}/>
            </div>
        </div>
    )
}

export default Cursor
