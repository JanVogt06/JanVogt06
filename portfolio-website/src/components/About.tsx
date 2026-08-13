import {useCallback, useEffect, useRef, useState} from "react"
import type {ReactNode} from "react"
import portraitImage from "../data/images/portrait.webp"
import refereeImage from "../data/images/referee.webp"
import skiJumpImage from "../data/images/ski_jump.webp"
import useScrollProgress from "@/lib/useScrollProgress"
import useMediaQuery from "@/lib/useMediaQuery"
import {scrollToPosition} from "@/lib/smoothScroll"
import {space, subscribeAnchor} from "@/lib/space/controller"

/**
 * Der Werdegang als Flug durch die Galaxie.
 *
 * Zwei Fassungen sind daran gescheitert, und beide aus demselben Grund:
 *
 * 1. Ein Kartenraster, das vorbeiscrollte. Es hing an nichts.
 * 2. Gepinnte Kapitel als HUD-Tafeln. Die hingen am Scroll, aber die Kamera stand
 *    still – im Raum passierte nichts, waehrend im DOM Tafeln durchzogen. Es war
 *    dieselbe Mechanik wie beim Kristallring, aber sie fand DANEBEN statt.
 *
 * Jetzt IST der Abschnitt eine Etappe der Reise. Der Scroll fliegt die Kamera vom
 * Hero durch eine Spiralgalaxie bis vor den Kristallring, und in der Galaxie
 * stehen drei Wegpunkte – einer pro Kapitel. Man kommt an ihnen an, so wie man
 * spaeter an den Steinen ankommt.
 *
 * WARUM DER TEXT NICHT AM WEGPUNKT KLEBT
 *
 * Bei den Projekten haengt die Beschriftung direkt am Stein, weil sie kurz ist –
 * ein Titel, zwei Schlagworte. Hier sind es Absaetze und Listen. Text, der jeden
 * Frame mit einem fliegenden Objekt mitwandert, ist nicht lesbar.
 *
 * Deshalb steht der Text ruhig links, und nur eine feine Linie greift von der
 * Ueberschrift zum vorbeiziehenden Wegpunkt hinueber. Das verbindet DOM und Raum,
 * ohne die Lesbarkeit zu opfern.
 *
 * Kein Rahmen, keine Eckklammern, keine Tafel: der Text liegt frei im Raum, mit
 * einem weichen dunklen Schleier dahinter, damit er ueber der Galaxie lesbar
 * bleibt.
 */

/** Stationen des Werdegangs – frueher ein Git-Graph mit Branches und Hashes. */
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

/**
 * Eine Zeile aus Zeitangabe und Inhalt.
 *
 * Dieselbe Form fuer alle drei Kapitel: links eine schmale Mono-Spalte, rechts
 * der Text, dazwischen eine Hairline. Das haelt die Kapitel als eine Familie
 * zusammen, ohne dass sie einen Rahmen braeuchten.
 */
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
    /** Wie das Bild in seinem Rahmen sitzt – Aufnahme oder freigestellt. */
    fit: "cover" | "contain"
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
        fit: "cover",
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
        fit: "contain",
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
        fit: "contain",
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

/**
 * Aufnahme, die in den Raum ausblendet.
 *
 * Ohne Rahmen und ohne Eckklammern – eine Kante wuerde das Bild als Objekt VOR
 * dem Raum zeigen statt als etwas, das darin schwebt. Die Maske loest alle vier
 * Seiten auf.
 */
const FloatingImage = ({chapter}: {chapter: Chapter}) => (
    <img
        src={chapter.image}
        alt={chapter.alt}
        className={`h-full w-full ${chapter.fit === "cover" ? "object-cover" : "object-contain object-bottom"}`}
        style={{
            maskImage: "radial-gradient(ellipse 78% 78% at 50% 50%, black 45%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 78% 78% at 50% 50%, black 45%, transparent 100%)",
        }}
    />
)

const ChapterContent = ({
    chapter,
    headingRef,
}: {
    chapter: Chapter
    headingRef?: (node: HTMLDivElement | null) => void
}) => (
    <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="relative max-w-xl lg:col-span-6">
            {/* Weicher Schleier statt Tafel: haelt den Text ueber der Galaxie
                lesbar, ohne ihn einzukasteln. */}
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
        </div>

        <div className="hidden h-[46vh] lg:col-span-6 lg:block">
            <FloatingImage chapter={chapter}/>
        </div>
    </div>
)

/**
 * Die feine Linie von der Ueberschrift zum Wegpunkt im Raum.
 *
 * Sie ist der einzige Teil, der jeden Frame nachgezogen wird – der Text selbst
 * bleibt ruhig. Position und Deckkraft kommen aus dem Anker der Szene und werden
 * direkt in Attribute geschrieben, nicht ueber React-State.
 */
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

            // Ansatz an der rechten Kante der Ueberschrift, Ziel am Wegpunktrand.
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

const AboutJourney = () => {
    const sectionRef = useRef<HTMLDivElement>(null)
    const layerRefs = useRef<(HTMLDivElement | null)[]>([])
    const headingRefs = useRef<(HTMLDivElement | null)[]>([])
    const [index, setIndex] = useState(0)
    const activeIndex = useRef(0)

    /**
     * KEIN Vorlauf auf den Fortschritt.
     *
     * Ein erster Versuch schob ihn um 12 % vor, damit die Kamera schon losfliegt,
     * bevor die Sektion oben steht. Das verschiebt aber die ganze Zuordnung:
     * Kapitel 0 stand dann bei 21 % statt bei 0, und der zugehoerige Wegpunkt lag
     * 2,6 Einheiten vor der Kamera statt 9 – gemessen 319 px Radius und x = 1514
     * auf einem 1500 px breiten Fenster, also riesig und aus dem Bild.
     *
     * Die Wegpunkte werden aus derselben Abbildung gerechnet wie die Kamera. Also
     * darf hier nichts dazwischen liegen.
     */
    const onProgress = useCallback((raw: number) => {
        const progress = clamp01(raw)

        // Die Kamera fliegt – das ist der Kern: der Raum bewegt sich mit.
        space.setAboutProgress(progress)

        const position = progress * (chapters.length - 1)
        layerRefs.current.forEach((layer, i) => {
            if (!layer) return
            const d = position - i
            const distance = Math.abs(d)

            layer.style.opacity = String(clamp01(1 - distance * 1.5))
            /* Nur ein kleiner Versatz: die Tiefenwirkung kommt jetzt von der
               Kamera, nicht davon, dass Tafeln durchs Bild skalieren. */
            layer.style.transform = `translate3d(0, ${(-d * 4).toFixed(2)}vh, 0)`

            /* Nur das vorderste Kapitel ist bedienbar und fuer Screenreader da.
               Sonst laege unter dem sichtbaren Kapitel Text, den man markieren und
               antabben koennte, ohne ihn zu sehen. */
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

    /* Der Link braucht die Position der aktuellen Ueberschrift erst dann, wenn er
       zeichnet – deshalb als Funktion und nicht als Wert. */
    const headingBox = useCallback(
        () => headingRefs.current[activeIndex.current]?.getBoundingClientRect() ?? null,
        [],
    )

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
                            />
                        </div>
                    ))}
                </div>

                {/* Steuerzeile – dieselbe Form wie bei den Projekten */}
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
        </div>
    )
}

/**
 * Rueckfallebene: gestapelt.
 *
 * Fuer schmale oder flache Fenster und fuer prefers-reduced-motion. Ein Flug
 * durch eine Galaxie ist genau die Bewegung, die dort abgewaehlt wurde, und ein
 * gepinnter Abschnitt braucht eine Bildschirmhoehe, die den Inhalt traegt.
 */
const AboutStack = () => (
    <div className="mx-auto max-w-[88rem] space-y-20 px-4 py-20 sm:px-6 md:py-28 lg:px-8">
        {chapters.map((chapter) => (
            <ChapterContent key={chapter.id} chapter={chapter}/>
        ))}
    </div>
)

const About = () => {
    const roomy = useMediaQuery("(min-width: 1024px) and (min-height: 700px)")
    const reduced = useMediaQuery("(prefers-reduced-motion: reduce)")

    return (
        <section id="about" className="relative">
            {roomy && !reduced ? <AboutJourney/> : <AboutStack/>}
        </section>
    )
}

export default About
