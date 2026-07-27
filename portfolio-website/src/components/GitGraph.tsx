import {motion, useReducedMotion, useScroll, useTransform} from "framer-motion"
import type {MotionValue} from "framer-motion"
import {useRef} from "react"
import {GitBranch, GitCommitHorizontal} from "lucide-react"

/**
 * Werdegang als Git-Graph.
 *
 * Der `main`-Branch ist der akademische Weg (Abitur -> Studium). Davon zweigt
 * der Branch `feat/zeiss` ab: der Werkstudentenjob bei ZEISS, der parallel zum
 * Studium läuft. Beide Branches enden offen (gestrichelt) = noch laufend.
 *
 * Die Animation ist an den Scroll GEKOPPELT, nicht davon ausgelöst: Solange die
 * Karte durch den Viewport wandert, wächst der Graph von unten (Abitur, der
 * älteste Commit) nach oben (ZEISS, HEAD). Rückwärts scrollen baut ihn zurück.
 * Vorher lief hier ein einmaliges useInView-Einblenden, das man genau einmal
 * gesehen hat und danach nie wieder.
 *
 * Der Graph zeichnet von unten nach oben, weil die Zeit nach oben läuft – die
 * Pfade sind deshalb bewusst vom älteren zum jüngeren Commit hin definiert.
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

/**
 * Der Graph baut sich über vier Phasen des Scroll-Fortschritts auf. Feste
 * Abschnitte statt Verzögerungen in Sekunden – so bestimmt die Scroll-Position
 * den Zustand, nicht eine abgelaufene Zeit.
 *
 *   0.00 – 0.35   main von Abitur nach B.Sc.
 *   0.30 – 0.60   feat/zeiss zweigt ab
 *   0.55 – 0.80   offenes Ende von main
 *   0.60 – 0.90   offenes Ende von feat/zeiss
 */
const PHASES = {
    mainSolid: [0.0, 0.35],
    branch: [0.3, 0.6],
    mainOpen: [0.55, 0.8],
    branchOpen: [0.6, 0.9],
} as const

/* Ein Commit wacht auf, kurz bevor die Linie ihn erreicht. */
const NODE_AT = [0.55, 0.28, 0.04] as const

const GitGraph = () => {
    const ref = useRef<HTMLDivElement>(null)
    const reduced = useReducedMotion()

    /* Fortschritt der Karte durch den Viewport: 0 = Oberkante der Karte
       erreicht die Unterkante des Viewports, 1 = Karte ist mittig. Dadurch ist
       der Graph fertig, wenn man ihn liest – und nicht erst, wenn er oben
       schon halb aus dem Bild ist. */
    const {scrollYProgress} = useScroll({
        target: ref,
        offset: ["start end", "center center"],
    })

    /* Bewusst vier einzelne useTransform-Aufrufe statt einer Hilfsfunktion:
       Hooks dürfen nicht in Callbacks aufgerufen werden. */
    const clamp = {clamp: true}
    const mainSolid = useTransform(scrollYProgress, [...PHASES.mainSolid], [0, 1], clamp)
    const branch = useTransform(scrollYProgress, [...PHASES.branch], [0, 1], clamp)
    const mainOpen = useTransform(scrollYProgress, [...PHASES.mainOpen], [0, 1], clamp)
    const branchOpen = useTransform(scrollYProgress, [...PHASES.branchOpen], [0, 1], clamp)

    const len = (v: MotionValue<number>) => (reduced ? {pathLength: 1} : {pathLength: v})

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
                    {/* main: durchgezogen, wächst vom Abitur nach oben zum B.Sc. */}
                    <motion.path
                        d={`M${LANE_X[0]},${ABI_Y} L${LANE_X[0]},${BSC_Y}`}
                        stroke={BRAND_DEEP} strokeWidth={2.5} strokeLinecap="round"
                        fill="none" style={len(mainSolid)}
                    />
                    {/* feat/zeiss: zweigt am B.Sc.-Commit ab und läuft nach oben */}
                    <motion.path
                        d={`M${LANE_X[0]},${BSC_Y} C ${LANE_X[0]},${BSC_Y - 44} ${LANE_X[1]},${ZEISS_Y + 56} ${LANE_X[1]},${ZEISS_Y}`}
                        stroke={BRAND} strokeWidth={2.5} strokeLinecap="round"
                        fill="none" style={len(branch)}
                    />
                    {/* main: offenes Ende oben (gestrichelt = läuft weiter) */}
                    <motion.path
                        d={`M${LANE_X[0]},${BSC_Y} L${LANE_X[0]},${Y_TOP}`}
                        stroke={BRAND_DEEP} strokeWidth={2} strokeDasharray="4 5" strokeLinecap="round"
                        fill="none" opacity={0.5} style={len(mainOpen)}
                    />
                    {/* feat/zeiss: offenes Ende oben */}
                    <motion.path
                        d={`M${LANE_X[1]},${ZEISS_Y} L${LANE_X[1]},${Y_TOP}`}
                        stroke={BRAND} strokeWidth={2} strokeDasharray="4 5" strokeLinecap="round"
                        fill="none" opacity={0.5} style={len(branchOpen)}
                    />

                    {/* Commit-Knoten */}
                    {commits.map((c, i) => (
                        <CommitNode
                            key={c.id}
                            commit={c}
                            cx={LANE_X[c.lane]}
                            cy={yOf(i)}
                            at={NODE_AT[i]}
                            progress={scrollYProgress}
                            reduced={!!reduced}
                        />
                    ))}
                </svg>

                {/* Commit-Labels, ausgerichtet auf die Knotenhöhe.
                    Bewusst OHNE eigene Animation: der Text ist Inhalt und darf
                    nicht davon abhängen, dass eine Scroll-Kopplung greift.
                    Das Einblenden übernimmt der Reveal um die ganze Karte. */}
                <div className="relative flex-1" style={{height: HEIGHT}}>
                    {commits.map((c, i) => (
                        <CommitLabel key={c.id} commit={c} top={yOf(i) - 18}/>
                    ))}
                </div>
            </div>
        </div>
    )
}

const CommitNode = ({
    commit,
    cx,
    cy,
    at,
    progress,
    reduced,
}: {
    commit: Commit
    cx: number
    cy: number
    at: number
    progress: MotionValue<number>
    reduced: boolean
}) => {
    const lit = useTransform(progress, [at, at + 0.08], [0, 1], {clamp: true})
    /* Nie ganz auf 0: ein noch nicht erreichter Knoten ist schwach sichtbar
       ("kommt noch") statt unsichtbar – so wirkt die Rinne nie kaputt-leer. */
    const opacity = useTransform(lit, [0, 1], [0.2, 1])
    const scale = useTransform(lit, [0, 1], [0.55, 1])

    return (
        <motion.g
            style={
                reduced
                    ? {transformBox: "fill-box", transformOrigin: "center"}
                    : {opacity, scale, transformBox: "fill-box", transformOrigin: "center"}
            }
        >
            <circle cx={cx} cy={cy} r={11} fill="#05070d" stroke={commit.nodeColor} strokeWidth={2.5}/>
            <circle cx={cx} cy={cy} r={4} fill={commit.nodeColor}/>
        </motion.g>
    )
}

const CommitLabel = ({commit, top}: { commit: Commit; top: number }) => {
    return (
        <div className="absolute left-0 right-0" style={{top}}>
            <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold ${commit.chipClass}`}>
                    {commit.branch}
                </span>
                {commit.head && (
                    <span
                        className="rounded-full bg-status/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-status ring-1 ring-status/30">
                        HEAD
                    </span>
                )}
                <span className="font-mono text-[11px] text-white/30">{commit.hash}</span>
                <span className="text-[11px] text-white/40">· {commit.date}</span>
            </div>
            <h4 className="flex items-center gap-1.5 text-base font-semibold text-white sm:text-lg">
                <GitCommitHorizontal className={`h-4 w-4 ${commit.accent}`}/>
                {commit.title}
            </h4>
            <p className="pl-5.5 text-sm text-white/55">{commit.sub}</p>
        </div>
    )
}

export default GitGraph
