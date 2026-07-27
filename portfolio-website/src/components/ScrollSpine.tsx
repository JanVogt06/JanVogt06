import {useCallback, useEffect, useRef, useState} from "react"
import {motion, useReducedMotion, useScroll, useTransform} from "framer-motion"

/**
 * Die Commit-Achse der Seite – das Leitmotiv wird hier von Deko zu Struktur.
 *
 * Die ganze Seite ist als Repository inszeniert, also ist der Scrollbalken ein
 * `git log --graph`: eine Linie, die sich exakt mit der Scroll-Position zeichnet
 * (nicht "wird beim Erreichen ausgelöst" – rückwärts scrollen baut sie zurück).
 *
 * Die Erzählung entspricht dem Werdegang-Graph:
 *
 *   main          init  →  werdegang.md  ─────────────────→  kontakt.pr (merge)
 *   feat/projekte              └──→  projekte/  ──→ ────┘
 *
 * Die Projekte liegen auf einem Feature-Branch, der Kontakt-Abschnitt ist der
 * Pull Request, in dem er zurück in main läuft. Die Knoten sind anklickbar und
 * ersetzen damit nebenbei eine Scroll-Fortschrittsanzeige.
 *
 * Bewusst schlank (28 px, ab lg 44 px): Die Achse liegt in der linken Rinne,
 * die Abschnitte lassen dafür links Platz. Genau wie im echten `git log
 * --graph`, wo der Graph auch in der Gosse links vom Text steht.
 */

const TOP = 56 // Höhe der RepoBar – darunter beginnt die Achse

type Anchor = {
    id: string
    label: string
    lane: 0 | 1
}

const anchors: Anchor[] = [
    {id: "hero", label: "init", lane: 0},
    {id: "about", label: "werdegang.md", lane: 0},
    {id: "projects", label: "projekte/", lane: 1},
    {id: "contact", label: "kontakt.pr — merge", lane: 0},
]

/** Scroll-Fortschritt (0…1), bei dem ein Abschnitt mittig im Viewport steht. */
const progressOf = (el: HTMLElement) => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight
    if (scrollable <= 0) return 0
    const centered = el.offsetTop + el.offsetHeight / 2 - window.innerHeight / 2
    return Math.min(1, Math.max(0, centered / scrollable))
}

const ScrollSpine = () => {
    const wrapRef = useRef<HTMLDivElement>(null)
    const reduced = useReducedMotion()
    const {scrollYProgress} = useScroll()

    // Maße der Rinne. Über den gemessenen Wert statt Magic Numbers, damit die
    // Spurpositionen bei 28 px (mobil) und 44 px (ab lg) beide stimmen.
    const [box, setBox] = useState({w: 44, h: 600})
    // Fortschrittswerte der Abschnitte – abhängig von der Dokumenthöhe, also
    // nach Bildern, Fonts und jedem Resize neu bestimmen.
    const [stops, setStops] = useState<number[]>(() => anchors.map((_, i) => i / (anchors.length - 1)))

    const measure = useCallback(() => {
        const el = wrapRef.current
        if (el) setBox({w: el.clientWidth, h: el.clientHeight})
        setStops(
            anchors.map((a, i) => {
                const target = document.getElementById(a.id)
                return target ? progressOf(target) : i / (anchors.length - 1)
            }),
        )
    }, [])

    useEffect(() => {
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(document.body)
        if (wrapRef.current) ro.observe(wrapRef.current)
        window.addEventListener("resize", measure)
        return () => {
            ro.disconnect()
            window.removeEventListener("resize", measure)
        }
    }, [measure])

    const laneMain = box.w * 0.36
    const laneBranch = box.w * 0.74

    /* Rand, damit der erste und der letzte Knoten nicht halb am Viewport-Rand
       abgeschnitten werden (t=0 und t=1 liegen genau auf den Kanten). */
    const PAD = 8
    const span = Math.max(0, box.h - PAD * 2)
    const yOf = (t: number) => PAD + t * span

    const branchFrom = stops[1] ?? 0.33
    const branchTo = stops[3] ?? 1

    // Der Feature-Branch zeichnet sich nur über seinen eigenen Abschnitt:
    // Abzweig am Werdegang, Merge im Kontakt.
    const branchDraw = useTransform(scrollYProgress, [branchFrom, branchTo], [0, 1], {clamp: true})

    const splitY = yOf(branchFrom)
    const mergeY = yOf(branchTo)
    // Kurvenlänge des Abzweigs, begrenzt auf ein Drittel des Abstands, damit
    // die Kurven bei kurzen Viewports nicht überlappen.
    const bend = Math.max(8, Math.min(56, (mergeY - splitY) / 3))

    const branchPath = [
        `M${laneMain},${splitY}`,
        `C${laneMain},${splitY + bend} ${laneBranch},${splitY + bend} ${laneBranch},${splitY + bend * 2}`,
        `L${laneBranch},${mergeY - bend * 2}`,
        `C${laneBranch},${mergeY - bend} ${laneMain},${mergeY - bend} ${laneMain},${mergeY}`,
    ].join(" ")

    const go = (id: string) => document.getElementById(id)?.scrollIntoView({behavior: "smooth"})

    return (
        <div
            ref={wrapRef}
            aria-hidden="true"
            className="pointer-events-none fixed bottom-0 left-0 z-30 hidden w-7 sm:block lg:w-11"
            style={{top: TOP}}
        >
            <svg width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} fill="none">
                {/* Ungelaufene Spur */}
                <line
                    x1={laneMain} y1={PAD} x2={laneMain} y2={PAD + span}
                    stroke="rgb(255 255 255 / 0.07)" strokeWidth={1.5}
                />

                {/* main – zeichnet sich mit dem Scroll-Fortschritt */}
                <motion.path
                    d={`M${laneMain},${PAD} L${laneMain},${PAD + span}`}
                    stroke="#0891b2" strokeWidth={1.5} strokeLinecap="round"
                    style={reduced ? {pathLength: 1} : {pathLength: scrollYProgress}}
                />

                {/* feat/projekte – Abzweig am Werdegang, Merge im Kontakt */}
                <motion.path
                    d={branchPath}
                    stroke="#22d3ee" strokeWidth={1.5} strokeLinecap="round"
                    style={reduced ? {pathLength: 1} : {pathLength: branchDraw}}
                />

                {anchors.map((anchor, i) => (
                    <SpineNode
                        key={anchor.id}
                        anchor={anchor}
                        cx={anchor.lane === 0 ? laneMain : laneBranch}
                        cy={yOf(stops[i] ?? 0)}
                        stop={stops[i] ?? 0}
                        progress={scrollYProgress}
                        reduced={!!reduced}
                        onSelect={() => go(anchor.id)}
                    />
                ))}
            </svg>
        </div>
    )
}

/** Ein Commit-Knoten: wacht auf, sobald die Linie ihn erreicht. */
const SpineNode = ({
    anchor,
    cx,
    cy,
    stop,
    progress,
    reduced,
    onSelect,
}: {
    anchor: Anchor
    cx: number
    cy: number
    stop: number
    progress: ReturnType<typeof useScroll>["scrollYProgress"]
    reduced: boolean
    onSelect: () => void
}) => {
    // Kurz vor dem Knoten anfangen, damit das Aufwachen zur Linie passt.
    const lit = useTransform(progress, [Math.max(0, stop - 0.02), stop], [0, 1], {clamp: true})
    const opacity = useTransform(lit, [0, 1], [0.3, 1])
    const scale = useTransform(lit, [0, 1], [0.65, 1])

    return (
        <motion.g
            className="pointer-events-auto cursor-pointer"
            style={
                reduced
                    ? {transformBox: "fill-box", transformOrigin: "center"}
                    : {opacity, scale, transformBox: "fill-box", transformOrigin: "center"}
            }
            onClick={onSelect}
        >
            <title>{anchor.label}</title>
            {/* Unsichtbares, größeres Klickziel */}
            <circle cx={cx} cy={cy} r={11} fill="transparent"/>
            <circle cx={cx} cy={cy} r={5} fill="#05070d" stroke="#22d3ee" strokeWidth={1.5}/>
            <circle cx={cx} cy={cy} r={1.75} fill="#22d3ee"/>
        </motion.g>
    )
}

export default ScrollSpine
