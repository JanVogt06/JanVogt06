import {useEffect, useRef} from "react"
import {subscribeAnchor} from "@/lib/space/controller"
import {projects} from "@/lib/projects"
import {loadDescriptions, subscribeDescriptions, taglineOf} from "@/lib/github"

const CALLOUTS = [
    {dx: 1, dy: -0.62, length: 210, role: "title" as const},
    {dx: 0.9, dy: 0.78, length: 185, role: "tagline" as const},
]

type Line = {
    line: SVGPolylineElement | null
    dot: SVGCircleElement | null
    label: HTMLDivElement | null
}

const CrystalCallouts = () => {
    const refs = useRef<Line[]>(CALLOUTS.map(() => ({line: null, dot: null, label: null})))
    const titleRef = useRef<HTMLSpanElement>(null)
    const taglineRef = useRef<HTMLSpanElement>(null)
    const shownIndex = useRef<number>(-1)

    // The taglines come from GitHub, so they can arrive after the first paint.
    useEffect(() => {
        loadDescriptions()
        return subscribeDescriptions(() => {
            const project = projects[shownIndex.current]
            if (project && taglineRef.current) {
                taglineRef.current.textContent = taglineOf(project)
            }
        })
    }, [])

    useEffect(() => {
        return subscribeAnchor(({kind, index, x, y, radius, strength}) => {
            // The scene also reports the career waypoints; those do not belong here.
            if (kind !== "crystal") return

            // Only touch the texts on change, not every frame.
            if (index !== shownIndex.current) {
                shownIndex.current = index
                const project = projects[index]
                if (project) {
                    if (titleRef.current) titleRef.current.textContent = project.title
                    if (taglineRef.current) taglineRef.current.textContent = taglineOf(project)
                }
            }

            CALLOUTS.forEach((callout, i) => {
                const {line, dot, label} = refs.current[i]
                if (!line || !label || !dot) return

                const length = Math.hypot(callout.dx, callout.dy)
                const ux = callout.dx / length
                const uy = callout.dy / length

                // Start just outside the crystal, then a bend, then horizontal.
                const start = radius * 0.95
                const x0 = x + ux * start
                const y0 = y + uy * start
                const x1 = x0 + ux * callout.length * 0.6
                const y1 = y0 + uy * callout.length * 0.6
                const x2 = x1 + Math.sign(callout.dx) * callout.length * 0.42

                line.setAttribute("points", `${x0},${y0} ${x1},${y1} ${x2},${y1}`)
                dot.setAttribute("cx", String(x0))
                dot.setAttribute("cy", String(y0))

                const toRight = callout.dx > 0
                label.style.left = `${toRight ? x2 + 10 : x2 - 10}px`
                label.style.top = `${y1}px`
                label.style.transform = `translate(${toRight ? "0" : "-100%"}, -50%)`

                const stagger = clamp01((strength - i * 0.15) / (1 - i * 0.15))
                line.style.opacity = String(stagger)
                dot.style.opacity = String(stagger)
                label.style.opacity = String(stagger)
                label.style.visibility = stagger < 0.02 ? "hidden" : "visible"
            })
        })
    }, [])

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-10 hidden lg:block"
        >
            <svg className="absolute inset-0 h-full w-full overflow-visible">
                {CALLOUTS.map((callout, i) => (
                    <g key={i}>
                        <polyline
                            ref={(node) => {
                                refs.current[i].line = node
                            }}
                            fill="none"
                            stroke={callout.role === "title" ? "#22d3ee" : "rgba(255,255,255,0.32)"}
                            strokeWidth={1}
                            points=""
                        />
                        <circle
                            ref={(node) => {
                                refs.current[i].dot = node
                            }}
                            r={2.5}
                            fill="none"
                            stroke={callout.role === "title" ? "#22d3ee" : "rgba(255,255,255,0.45)"}
                            strokeWidth={1}
                        />
                    </g>
                ))}
            </svg>

            {CALLOUTS.map((callout, i) => (
                <div
                    key={i}
                    ref={(node) => {
                        refs.current[i].label = node
                    }}
                    className={`absolute ${callout.role === "title" ? "whitespace-nowrap" : ""}`}
                    style={{opacity: 0, visibility: "hidden"}}
                >
                    {callout.role === "title" ? (
                        <span
                            ref={titleRef}
                            className="block text-2xl font-semibold tracking-[-0.02em] text-white"
                        />
                    ) : (
                        <span
                            ref={taglineRef}
                            className="block max-w-[22rem] text-sm leading-snug text-white/55"
                        />
                    )}
                </div>
            ))}
        </div>
    )
}

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

export default CrystalCallouts
