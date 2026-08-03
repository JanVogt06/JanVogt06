import {useEffect, useRef} from "react"
import {subscribeAnchor} from "@/lib/space/controller"
import {projects} from "@/lib/projects"

/**
 * Beschriftungspfeile am vorderen Kristall.
 *
 * Wie eine technische Zeichnung: eine kurze Fahne geht vom Stein weg, knickt
 * einmal ab und endet an einer Beschriftung. Drei davon – der Projekttitel und
 * zwei Schlagworte.
 *
 * Der Anker kommt jeden Frame aus der Szene (Bildschirmposition des vorderen
 * Steins, in CSS-Pixeln) und wird direkt in style geschrieben. Ueber React-State
 * waeren das sechzig Renderbaeume pro Sekunde.
 *
 * Die Ebene ist `fixed`, nicht `absolute`: damit ist ihr Koordinatensystem genau
 * das der Canvas (die ebenfalls fixed ueber dem Viewport liegt) und die
 * projizierten Pixel passen ohne Umrechnung. In einem `absolute` Container
 * innerhalb der klebenden Sektion waere jeder Wert um deren Versatz verschoben.
 *
 * Der Text liegt im DOM und nicht im Canvas – markierbar, vorlesbar, auffindbar.
 */

/* Richtung, Laenge und Ausrichtung der drei Fahnen. dx/dy ist die Richtung im
   Bildschirmraum (y zeigt nach unten). */
const CALLOUTS = [
    {dx: 1, dy: -0.62, length: 210, role: "title" as const},
    {dx: -1, dy: -0.28, length: 180, role: "tag" as const},
    {dx: 0.85, dy: 0.9, length: 170, role: "tag" as const},
]

type Line = {
    line: SVGPolylineElement | null
    dot: SVGCircleElement | null
    label: HTMLDivElement | null
}

const CrystalCallouts = () => {
    const refs = useRef<Line[]>(CALLOUTS.map(() => ({line: null, dot: null, label: null})))
    const titleRef = useRef<HTMLSpanElement>(null)
    const tagRefs = useRef<(HTMLSpanElement | null)[]>([])
    const shownIndex = useRef<number>(-1)

    useEffect(() => {
        return subscribeAnchor(({index, x, y, radius, strength}) => {
            // Texte nur bei Wechsel anfassen – nicht jeden Frame.
            if (index !== shownIndex.current) {
                shownIndex.current = index
                const project = projects[index]
                if (project) {
                    if (titleRef.current) titleRef.current.textContent = project.title
                    tagRefs.current.forEach((node, i) => {
                        if (node) node.textContent = project.tech[i] ?? ""
                    })
                }
            }

            CALLOUTS.forEach((callout, i) => {
                const {line, dot, label} = refs.current[i]
                if (!line || !label || !dot) return

                const length = Math.hypot(callout.dx, callout.dy)
                const ux = callout.dx / length
                const uy = callout.dy / length

                // Ansatz kurz ausserhalb des Steins, dann Knick, dann waagerecht.
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

                /* Die Fahnen laufen versetzt ein: die erste (Titel) fuehrt, die
                   Schlagworte folgen. Ohne Versatz erscheinen drei Beschriftungen
                   gleichzeitig und es wirkt wie ein Aufblitzen. */
                const stagger = clamp01((strength - i * 0.12) / (1 - i * 0.12))
                line.style.opacity = String(stagger)
                dot.style.opacity = String(stagger)
                label.style.opacity = String(stagger)
                /* Bei 0 aus dem Layout nehmen, damit unsichtbare Beschriftungen
                   nicht doch noch Text markierbar machen. */
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
                            stroke={callout.role === "title" ? "#22d3ee" : "rgba(255,255,255,0.35)"}
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
                    className="absolute whitespace-nowrap"
                    style={{opacity: 0, visibility: "hidden"}}
                >
                    {callout.role === "title" ? (
                        <span
                            ref={titleRef}
                            className="block text-2xl font-semibold tracking-[-0.02em] text-white"
                        />
                    ) : (
                        <span
                            ref={(node) => {
                                tagRefs.current[i - 1] = node
                            }}
                            className="block font-mono text-[11px] uppercase tracking-[0.22em] text-white/50"
                        />
                    )}
                </div>
            ))}
        </div>
    )
}

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

export default CrystalCallouts
