import {motion, useInView} from "framer-motion"
import {useRef} from "react"
import {GitBranch, GitCommitHorizontal} from "lucide-react"
import {EASE} from "@/lib/motion"

/**
 * Werdegang als Git-Graph.
 *
 * Der `main`-Branch ist der akademische Weg (Abitur -> Studium). Davon zweigt
 * der Branch `feat/zeiss` ab: der Werkstudentenjob bei ZEISS, der parallel zum
 * Studium läuft. Beide Branches enden offen (gestrichelt) = noch laufend.
 *
 * Die komplette Animation wird über EINEN useInView-Hook am Container gesteuert
 * (statt whileInView pro SVG-Element – das ist auf <g>-Knoten unzuverlässig).
 *
 * War zwischendurch an den Scroll gekoppelt (useScroll/useTransform, der Graph
 * wuchs mit der Scroll-Position und baute sich beim Zurückscrollen wieder ab).
 * Zurück auf das einmalige Einblenden – das war die bessere Lesbarkeit.
 */

const LANE_X = [22, 70] as const   // x-Position der beiden Branch-Spuren
const Y_TOP = 12                    // oberer Rand (offene Branch-Enden)
const Y_FIRST = 48                  // y des obersten Commits
const ROW = 128                     // vertikaler Abstand zwischen Commits
const GUTTER_W = 96

type Commit = {
    id: string
    lane: 0 | 1
    branch: string
    accent: string
    chipClass: string
    nodeColor: string
    date: string
    title: string
    sub: string
    hash: string
    head?: boolean
}

/* Eine Farbe, drei Helligkeiten – der aktuellste Commit leuchtet am stärksten,
   die Vergangenheit tritt zurück. Vorher hatte jeder Branch eine eigene Farbe
   (blau/cyan/slate), was ohne Bedeutung nur Buntheit war. */
const BRAND = "#22d3ee"
const BRAND_DEEP = "#0891b2"
const PAST = "#334155"

const commits: Commit[] = [
    {
        id: "zeiss",
        lane: 1,
        branch: "feat/zeiss",
        accent: "text-brand",
        chipClass: "bg-brand/15 text-brand ring-1 ring-brand/30",
        nodeColor: BRAND,
        date: "seit 02/2026",
        title: "Werkstudent · Softwareentwicklung",
        sub: "Carl Zeiss Meditec AG.",
        hash: "a1f9c2e",
        head: true,
    },
    {
        id: "bsc",
        lane: 0,
        branch: "main",
        accent: "text-brand/70",
        chipClass: "bg-brand/10 text-brand/80 ring-1 ring-brand/20",
        nodeColor: BRAND_DEEP,
        date: "seit 10/2024",
        title: "B.Sc. Informatik",
        sub: "Friedrich-Schiller-Universität Jena",
        hash: "7d3b0a4",
        head: true,
    },
    {
        id: "abitur",
        lane: 0,
        branch: "main",
        accent: "text-white/40",
        chipClass: "bg-white/[0.07] text-white/50 ring-1 ring-white/10",
        nodeColor: PAST,
        date: "2024",
        title: "Abitur",
        sub: "Marie-Curie-Gymnasium Bad Berka",
        hash: "0e5f1d8",
    },
]

const yOf = (i: number) => Y_FIRST + i * ROW
const HEIGHT = yOf(commits.length - 1) + 48

const ZEISS_Y = yOf(0)
const BSC_Y = yOf(1)
const ABI_Y = yOf(2)

const GitGraph = () => {
    const ref = useRef<HTMLDivElement>(null)
    const inView = useInView(ref, {once: true, margin: "-80px"})

    // Pfad-Zeichnen: gemeinsame Helfer-Props, abhängig von inView.
    const drawn = (delay: number) => ({
        initial: {pathLength: 0, opacity: 0},
        animate: inView ? {pathLength: 1, opacity: 1} : {pathLength: 0, opacity: 0},
        transition: {pathLength: {duration: 0.7, delay, ease: EASE}, opacity: {duration: 0.2, delay}},
    })

    return (
        <div ref={ref}>
            {/* Kopfzeile im Terminal-Stil */}
            <div className="mb-6 flex items-center gap-2 font-mono text-xs text-white/40">
                <GitBranch className="h-4 w-4 text-brand"/>
                <span className="text-white/60">git log</span>
                <span className="text-white/30">--graph --all</span>
            </div>

            <div className="flex">
                {/* Graph-Rinne */}
                <svg
                    width={GUTTER_W}
                    height={HEIGHT}
                    viewBox={`0 0 ${GUTTER_W} ${HEIGHT}`}
                    className="shrink-0 overflow-visible"
                    aria-hidden="true"
                >
                    {/* main: offenes Ende oben (gestrichelt = läuft weiter) */}
                    <motion.path
                        d={`M${LANE_X[0]},${BSC_Y} L${LANE_X[0]},${Y_TOP}`}
                        stroke={BRAND_DEEP} strokeWidth={2} strokeDasharray="4 5" strokeLinecap="round"
                        fill="none" opacity={0.5} {...drawn(0.35)}
                    />
                    {/* main: durchgezogene Linie zwischen den Commits */}
                    <motion.path
                        d={`M${LANE_X[0]},${BSC_Y} L${LANE_X[0]},${ABI_Y}`}
                        stroke={BRAND_DEEP} strokeWidth={2.5} strokeLinecap="round"
                        fill="none" {...drawn(0)}
                    />
                    {/* feat/zeiss: zweigt am B.Sc.-Commit ab und läuft nach oben */}
                    <motion.path
                        d={`M${LANE_X[0]},${BSC_Y} C ${LANE_X[0]},${BSC_Y - 44} ${LANE_X[1]},${ZEISS_Y + 56} ${LANE_X[1]},${ZEISS_Y}`}
                        stroke={BRAND} strokeWidth={2.5} strokeLinecap="round"
                        fill="none" {...drawn(0.3)}
                    />
                    {/* feat/zeiss: offenes Ende oben */}
                    <motion.path
                        d={`M${LANE_X[1]},${ZEISS_Y} L${LANE_X[1]},${Y_TOP}`}
                        stroke={BRAND} strokeWidth={2} strokeDasharray="4 5" strokeLinecap="round"
                        fill="none" opacity={0.5} {...drawn(0.6)}
                    />

                    {/* Commit-Knoten */}
                    {commits.map((c, i) => (
                        <motion.g
                            key={c.id}
                            initial={{scale: 0, opacity: 0}}
                            animate={inView ? {scale: 1, opacity: 1} : {scale: 0, opacity: 0}}
                            transition={{delay: 0.15 + i * 0.15, type: "spring", stiffness: 210, damping: 22}}
                            style={{transformBox: "fill-box", transformOrigin: "center"}}
                        >
                            <circle cx={LANE_X[c.lane]} cy={yOf(i)} r={11} fill="#05070d" stroke={c.nodeColor} strokeWidth={2.5}/>
                            <circle cx={LANE_X[c.lane]} cy={yOf(i)} r={4} fill={c.nodeColor}/>
                        </motion.g>
                    ))}
                </svg>

                {/* Commit-Labels, ausgerichtet auf die Knotenhöhe */}
                <div className="relative flex-1" style={{height: HEIGHT}}>
                    {commits.map((c, i) => (
                        <motion.div
                            key={c.id}
                            className="absolute left-0 right-0"
                            style={{top: yOf(i) - 18}}
                            initial={{opacity: 0, x: 16}}
                            animate={inView ? {opacity: 1, x: 0} : {opacity: 0, x: 16}}
                            transition={{duration: 0.5, delay: 0.25 + i * 0.15, ease: EASE}}
                        >
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                                <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold ${c.chipClass}`}>
                                    {c.branch}
                                </span>
                                {c.head && (
                                    <span className="rounded-full bg-status/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-status ring-1 ring-status/30">
                                        HEAD
                                    </span>
                                )}
                                <span className="font-mono text-[11px] text-white/30">{c.hash}</span>
                                <span className="text-[11px] text-white/40">· {c.date}</span>
                            </div>
                            <h4 className="flex items-center gap-1.5 text-base font-semibold text-white sm:text-lg">
                                <GitCommitHorizontal className={`h-4 w-4 ${c.accent}`}/>
                                {c.title}
                            </h4>
                            <p className="pl-5.5 text-sm text-white/55">{c.sub}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default GitGraph
