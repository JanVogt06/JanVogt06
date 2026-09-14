import {useEffect, useRef} from "react"
import {subscribeAnchor} from "@/lib/space/controller"
import type {Anchor} from "@/lib/space/SpaceScene"
import {landingPoint} from "./band/metrics"

const RUN = 40

const HIDDEN = 0.02

/**
 * One leader line from whatever the camera has centred — a crystal or a
 * planet — to the band's slate. The object moves, the landing point does not,
 * and the line draws itself as the object arrives.
 */
const Tether = () => {
    const lineRef = useRef<SVGPolylineElement>(null)
    const dotRef = useRef<SVGCircleElement>(null)

    useEffect(() => {
        // The scene reports a crystal and a planet every frame; only the one
        // the camera is actually on gets a line, or the weaker anchor would
        // wipe the stronger one depending on which arrived last.
        const latest: Partial<Record<Anchor["kind"], Anchor>> = {}

        return subscribeAnchor((anchor) => {
            latest[anchor.kind] = anchor

            const crystal = latest.crystal
            const waypoint = latest.waypoint
            const shown =
                !waypoint || (crystal && crystal.strength >= waypoint.strength)
                    ? crystal
                    : waypoint

            const line = lineRef.current
            const dot = dotRef.current
            if (!line || !dot) return

            const landing = landingPoint()

            if (!shown || !landing || shown.strength < HIDDEN) {
                line.style.visibility = "hidden"
                dot.style.visibility = "hidden"
                return
            }

            const {x, y, radius, strength} = shown

            const dx = landing.x - x
            const dy = landing.y - y
            const length = Math.hypot(dx, dy) || 1
            const reach = radius * 0.95

            const x0 = x + (dx / length) * reach
            const y0 = y + (dy / length) * reach
            const elbow = x0 + Math.sign(dx || 1) * RUN

            line.setAttribute("points", `${x0},${y0} ${elbow},${y0} ${landing.x},${landing.y}`)
            line.style.strokeDashoffset = String(1 - strength)
            line.style.opacity = String(Math.min(1, strength * 1.6) * 0.6)
            line.style.visibility = "visible"

            dot.setAttribute("cx", String(x0))
            dot.setAttribute("cy", String(y0))
            dot.style.opacity = String(Math.min(1, strength * 1.6) * 0.8)
            dot.style.visibility = "visible"
        })
    }, [])

    return (
        <svg
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-16 hidden h-full w-full overflow-visible md:block"
        >
            <polyline
                ref={lineRef}
                points=""
                fill="none"
                stroke="rgb(159 216 234 / 0.34)"
                strokeWidth={1}
                pathLength={1}
                strokeDasharray={1}
                style={{visibility: "hidden"}}
            />
            <circle
                ref={dotRef}
                r={2}
                fill="none"
                stroke="var(--color-signal)"
                strokeWidth={1}
                style={{visibility: "hidden"}}
            />
        </svg>
    )
}

export default Tether
