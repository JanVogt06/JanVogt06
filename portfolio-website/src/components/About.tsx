import {useCallback, useEffect, useRef, useState} from "react"
import type {ReactNode} from "react"
import {ImageIcon, X} from "lucide-react"
import {HudCorners, HudLabel} from "./Hud"
import portraitImage from "../data/images/portrait.webp"
import refereeImage from "../data/images/referee.webp"
import skiJumpImage from "../data/images/ski_jump.webp"
import useScrollProgress from "@/lib/useScrollProgress"
import useMediaQuery from "@/lib/useMediaQuery"
import {scrollToPosition} from "@/lib/smoothScroll"
import {space, subscribeAnchor} from "@/lib/space/controller"

/** Stations of the career timeline. */
const timeline = [
    {when: "seit 02/2026", what: "Werkstudent Softwareentwicklung", where: "Carl Zeiss Meditec AG"},
    {when: "seit 10/2024", what: "B.Sc. Informatik", where: "Friedrich-Schiller-Universität Jena"},
    {when: "2024", what: "Abitur", where: "Marie-Curie-Gymnasium Bad Berka"},
]

const engagement = [
    {what: "Schiedsrichter NOFV", where: "Oberliga & U19-Bundesliga, Assistent Regionalliga"},
    {what: "Redaktionsmitglied", where: "\"Die Wurzel\" – Zeitschrift für Mathematik"},
    {what: "Jugendvertretung Bad Berka", where: "Stadtentwicklung & ISEK-Workshops"},
]

const awards = [
    {when: "2024", what: "DMV-Abiturpreis Mathematik"},
    {when: "2024", what: "DPG-Abiturpreis Physik"},
    {when: "2024", what: "Pierre-de-Coubertin-Preis"},
    {when: "2022", what: "Marie-Curie-Preis"},
    {when: "2022", what: "Schiedsrichter des Jahres"},
    {when: "2016-24", what: "Olympiaden-Preise in Mathematik und Physik"},
]

const Row = ({when, what, where}: {when?: string; what: string; where?: string}) => (
    <div className="flex gap-5 border-t border-white/[0.07] py-3.5 first:border-t-0">
        {when && (
            <span className="w-24 shrink-0 pt-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-brand/60">
                {when}
            </span>
        )}
        <span className="min-w-0">
            <span className="block text-white/90">{what}</span>
            {where && <span className="mt-0.5 block text-sm text-white/45">{where}</span>}
        </span>
    </div>
)

type Chapter = {
    id: string
    label: string
    title: string
    accent: string
    image: string
    alt: string
    body: ReactNode
}

const chapters: Chapter[] = [
    {
        id: "werdegang",
        label: "Station 01",
        title: "Mein",
        accent: "Weg",
        image: skiJumpImage,
        alt: "Jan Vogt beim Skifahren",
        body: (
            <div>
                {timeline.map((row) => (
                    <Row key={row.what} {...row} />
                ))}
            </div>
        ),
    },
    {
        id: "engagement",
        label: "Station 02",
        title: "Neben dem",
        accent: "Studium",
        image: refereeImage,
        alt: "Jan Vogt als Schiedsrichter",
        body: (
            <div>
                {engagement.map((row) => (
                    <Row key={row.what} {...row} />
                ))}
            </div>
        ),
    },
    {
        id: "auszeichnungen",
        label: "Station 03",
        title: "Meine",
        accent: "Auszeichnungen",
        image: portraitImage,
        alt: "Jan Vogt",
        body: (
            <div>
                {awards.map((row) => (
                    <Row key={row.what} {...row} />
                ))}
            </div>
        ),
    },
]

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

const APPROACH = 0.14

const StationView = ({chapter, onClose}: {chapter: Chapter; onClose: () => void}) => {
    const closeRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        closeRef.current?.focus()
    }, [])

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [onClose])

    return (
        <div
            data-native-scroll
            role="dialog"
            aria-modal="true"
            aria-label={chapter.alt}
            className="animate-hud fixed inset-0 z-40 flex justify-center overflow-hidden bg-page/85 px-4 pb-4 pt-20 backdrop-blur-xl sm:px-8 sm:pb-8"
        >
            {/* Clicking outside closes; the button stays the accessible way */}
            <button
                aria-hidden="true"
                tabIndex={-1}
                onClick={onClose}
                className="absolute inset-0 cursor-default"
            />

            <div className="surface relative flex w-full max-w-[64rem] flex-col p-5 sm:p-8">
                <HudCorners/>

                <div className="flex shrink-0 items-start justify-between gap-6 border-b border-white/[0.07] pb-4">
                    <div className="min-w-0">
                        <HudLabel tone="text-brand/80" className="!text-[11px]">
                            {chapter.label}
                        </HudLabel>
                        <h2 className="mt-2 truncate text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
                            {chapter.title} {chapter.accent}
                        </h2>
                    </div>

                    <div className="flex shrink-0 items-center gap-4">
                        <span className="hidden font-mono text-[10px] uppercase tracking-[0.28em] text-white/25 lg:inline">
                            Esc
                        </span>
                        <button
                            ref={closeRef}
                            onClick={onClose}
                            aria-label="Aufnahme schließen"
                            className="border border-white/10 p-2.5 text-white/60 transition-colors hover:border-brand/40 hover:bg-brand/10 hover:text-brand"
                        >
                            <X className="h-4 w-4"/>
                        </button>
                    </div>
                </div>

                {/* min-h-0: otherwise the image area never shrinks below the image */}
                <div className="mt-5 min-h-0 flex-1">
                    <img
                        src={chapter.image}
                        alt={chapter.alt}
                        className="h-full w-full object-contain object-center"
                    />
                </div>
            </div>
        </div>
    )
}

const ChapterContent = ({
    chapter,
    headingRef,
    onOpenImage,
}: {
    chapter: Chapter
    headingRef?: (node: HTMLDivElement | null) => void
    /** Absent in the stacked variant. */
    onOpenImage?: () => void
}) => (
    <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="relative max-w-xl lg:col-span-6">
            {}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-8 -inset-y-10 -z-10"
                style={{
                    background:
                        "radial-gradient(ellipse 70% 60% at 30% 50%, rgba(5,7,13,0.9) 0%, rgba(5,7,13,0.55) 55%, transparent 100%)",
                }}
            />

            <div ref={headingRef}>
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-brand/70">
                    {chapter.label}
                </p>
                <h3 className="mt-4 text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
                    {chapter.title}{" "}
                    <span className="bg-gradient-to-r from-brand to-brand-deep bg-clip-text text-transparent">
                        {chapter.accent}
                    </span>
                </h3>
            </div>

            <div className="mt-7">{chapter.body}</div>

            {}
            {onOpenImage && (
                <button
                    onClick={onOpenImage}
                    className="group mt-8 inline-flex items-center gap-2 border border-white/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/50 transition-colors hover:border-brand/40 hover:bg-brand/10 hover:text-brand"
                >
                    <ImageIcon className="h-3.5 w-3.5"/>
                    Aufnahme
                    <span className="text-white/25 group-hover:text-brand/50">
                        oder Planet anklicken
                    </span>
                </button>
            )}
        </div>
    </div>
)

const WaypointLink = ({headingBox}: {headingBox: () => DOMRect | null}) => {
    const lineRef = useRef<SVGPolylineElement>(null)
    const dotRef = useRef<SVGCircleElement>(null)

    useEffect(() => {
        return subscribeAnchor(({kind, x, y, radius, strength}) => {
            if (kind !== "waypoint") return
            const line = lineRef.current
            const dot = dotRef.current
            if (!line || !dot) return

            const box = headingBox()
            if (!box || strength < 0.02) {
                line.style.opacity = "0"
                dot.style.opacity = "0"
                return
            }

            // Starts at the right edge of the heading, ends at the waypoint rim.
            const sx = box.right + 14
            const sy = box.top + box.height / 2
            const dx = x - radius * 1.2
            const midX = sx + (dx - sx) * 0.45

            line.setAttribute("points", `${sx},${sy} ${midX},${sy} ${dx},${y}`)
            dot.setAttribute("cx", String(sx))
            dot.setAttribute("cy", String(sy))
            line.style.opacity = String(strength * 0.55)
            dot.style.opacity = String(strength * 0.8)
        })
    }, [headingBox])

    return (
        <svg
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-10 hidden h-full w-full overflow-visible lg:block"
        >
            <polyline
                ref={lineRef}
                points=""
                fill="none"
                stroke="#22d3ee"
                strokeWidth={1}
                style={{opacity: 0}}
            />
            <circle
                ref={dotRef}
                r={2.5}
                fill="none"
                stroke="#22d3ee"
                strokeWidth={1}
                style={{opacity: 0}}
            />
        </svg>
    )
}

const AboutJourney = ({
    station,
    onStation,
}: {
    station: number | null
    onStation: (index: number | null) => void
}) => {
    const sectionRef = useRef<HTMLDivElement>(null)
    const layerRefs = useRef<(HTMLDivElement | null)[]>([])
    const headingRefs = useRef<(HTMLDivElement | null)[]>([])
    const [index, setIndex] = useState(0)
    const activeIndex = useRef(0)

    const onProgress = useCallback((raw: number) => {
        const progress = clamp01(raw)

        space.setAboutProgress(progress)

        space.setAboutActive(
            Math.min(
                clamp01((raw + APPROACH) / APPROACH),
                clamp01((1 + APPROACH - raw) / APPROACH),
            ),
        )

        const position = progress * (chapters.length - 1)
        layerRefs.current.forEach((layer, i) => {
            if (!layer) return
            const d = position - i
            const distance = Math.abs(d)

            layer.style.opacity = String(clamp01(1 - distance * 1.5))
            layer.style.transform = `translate3d(0, ${(-d * 4).toFixed(2)}vh, 0)`

            const active = distance < 0.5
            layer.style.pointerEvents = active ? "auto" : "none"
            layer.setAttribute("aria-hidden", active ? "false" : "true")
        })

        const nearest = Math.round(position)
        if (nearest !== activeIndex.current) {
            activeIndex.current = nearest
            setIndex(nearest)
        }
    }, [])

    useScrollProgress(sectionRef, onProgress)

    const boxCache = useRef<DOMRect | null>(null)

    const remeasure = useCallback(() => {
        boxCache.current =
            headingRefs.current[activeIndex.current]?.getBoundingClientRect() ?? null
    }, [])

    useEffect(() => {
        remeasure()
        window.addEventListener("resize", remeasure)
        return () => window.removeEventListener("resize", remeasure)
    }, [remeasure, index])

    const headingBox = useCallback(() => boxCache.current, [])

    const goToChapter = (target: number) => {
        const el = sectionRef.current
        if (!el) return
        const travel = el.offsetHeight - window.innerHeight
        const top = el.getBoundingClientRect().top + window.scrollY
        scrollToPosition(top + (target / (chapters.length - 1)) * travel)
    }

    return (
        <div ref={sectionRef} style={{height: `${chapters.length * 100}vh`}}>
            <div className="sticky top-0 flex h-screen flex-col overflow-hidden pt-14">
                <WaypointLink headingBox={headingBox}/>

                <div className="relative mx-auto min-h-0 w-full max-w-[88rem] flex-1 px-6 sm:px-10 lg:px-16">
                    {chapters.map((chapter, i) => (
                        <div
                            key={chapter.id}
                            ref={(node) => {
                                layerRefs.current[i] = node
                            }}
                            className="absolute inset-x-6 top-1/2 -translate-y-1/2 will-change-transform sm:inset-x-10 lg:inset-x-16"
                            style={{opacity: i === 0 ? 1 : 0}}
                        >
                            <ChapterContent
                                chapter={chapter}
                                headingRef={(node) => {
                                    headingRefs.current[i] = node
                                }}
                                onOpenImage={() => onStation(i)}
                            />
                        </div>
                    ))}
                </div>

                {/* Control row */}
                <div className="mx-auto w-full max-w-[88rem] shrink-0 px-6 pb-10 sm:px-10 lg:px-16">
                    <div className="flex flex-1 gap-1.5">
                        {chapters.map((chapter, i) => (
                            <button
                                key={chapter.id}
                                onClick={() => goToChapter(i)}
                                aria-label={`Zu ${chapter.title} ${chapter.accent}`}
                                aria-current={i === index}
                                className="group flex-1 py-3 text-left"
                            >
                                <span
                                    className={`block h-px w-full transition-colors duration-500 ${
                                        i <= index ? "bg-brand/70" : "bg-white/10 group-hover:bg-white/30"
                                    }`}
                                />
                                <span
                                    className={`mt-2 block font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
                                        i === index ? "text-white/60" : "text-white/25"
                                    }`}
                                >
                                    {chapter.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {station !== null && chapters[station] && (
                <StationView chapter={chapters[station]} onClose={() => onStation(null)}/>
            )}
        </div>
    )
}

const AboutStack = () => (
    <div className="mx-auto max-w-[88rem] space-y-20 px-4 py-20 sm:px-6 md:py-28 lg:px-8">
        {chapters.map((chapter) => (
            <div key={chapter.id}>
                <ChapterContent chapter={chapter}/>
                {}
                <img
                    src={chapter.image}
                    alt={chapter.alt}
                    className="mt-10 max-h-[50vh] w-full object-contain object-center"
                />
            </div>
        ))}
    </div>
)

const About = ({
    station,
    onStation,
}: {
    /** Which planet is clicked; comes from App because the scene triggers it. */
    station: number | null
    onStation: (index: number | null) => void
}) => {
    const roomy = useMediaQuery("(min-width: 1024px) and (min-height: 700px)")
    const reduced = useMediaQuery("(prefers-reduced-motion: reduce)")

    return (
        <section id="about" className="relative">
            {roomy && !reduced ? (
                <AboutJourney station={station} onStation={onStation}/>
            ) : (
                <AboutStack/>
            )}
        </section>
    )
}

export default About
