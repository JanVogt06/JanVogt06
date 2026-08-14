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
 *
 * DIE BILDER
 *
 * Sie standen einmal dauerhaft in der rechten Haelfte. Das war der Fremdkoerper:
 * ein Foto ist ein Rechteck mit eigener Perspektive, eigenem Licht und eigenem
 * Horizont – im freien Raum sieht es aus, als klebe es auf der Scheibe. Und es
 * nahm der Galaxie genau die Haelfte des Bildes weg, durch die man fliegen soll.
 *
 * Jetzt sind die Planeten anklickbar und die Aufnahme kommt erst darauf – dieselbe
 * Geste wie bei den Kristallen. Der Raum bleibt Raum, bis man etwas darin
 * anfasst.
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

/**
 * Ueber welchen Anteil der Strecke der Abschnitt "anlaeuft", bevor er oben
 * ankommt. Derselbe Griff wie bei den Projekten.
 */
const APPROACH = 0.14

/**
 * Die Aufnahme zum Kapitel – als Tafel, die ein Klick auf den Planeten oeffnet.
 *
 * Bewusst schlichter als das Projekt-HUD: dort ruft man einen Datensatz auf, hier
 * schaut man ein Bild an. Eckklammern, eine Zeile Beschriftung, sonst nichts.
 *
 * `object-contain`: die Bilder sind freigestellt, es gibt nichts zuzuschneiden.
 */
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
            /* Das Rad gehoert dieser Tafel, nicht der Seite darunter – siehe
               lib/smoothScroll.ts. Die Tafel scrollt selbst nicht, also bleibt
               das Bild stehen, statt dass die Kamera darunter weiterfliegt. */
            data-native-scroll
            role="dialog"
            aria-modal="true"
            aria-label={chapter.alt}
            className="animate-hud fixed inset-0 z-40 flex justify-center overflow-hidden bg-page/85 px-4 pb-4 pt-20 backdrop-blur-xl sm:px-8 sm:pb-8"
        >
            {/* Klick daneben schliesst. Der Knopf bleibt der barrierefreie Weg. */}
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

                {/* min-h-0: sonst waere der Bildbereich nie kleiner als das Bild. */}
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
    /** Fehlt in der gestapelten Fassung – dort steht das Bild einfach da. */
    onOpenImage?: () => void
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

            {/* Der Weg zur Aufnahme ohne Maus – und gleichzeitig der Hinweis,
                dass der Planet ueberhaupt anfassbar ist. Ein Bild, das nur
                per Klick auf ein 3D-Objekt erreichbar ist, waere fuer einen
                Teil der Besucher gar nicht erreichbar. */}
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

        /* Zusaetzlich, ob der Abschnitt ueberhaupt an der Reihe ist. `raw` ist
           nicht begrenzt, oberhalb also negativ – daraus laesst sich das ableiten,
           aus `progress` nicht: der steht im Hero auf 0, und 0 heisst dort
           "Station 1 genau vorne". Genau deshalb wurde die Beschriftungslinie
           schon im Hero gezeichnet. */
        /* An- UND Auslauf, aus demselben Grund wie bei den Projekten: nur der
           Anlauf bliebe fuer raw > 1 auf 1 und haette die Planeten-Beschriftung
           auch nach dem Abschnitt im Bild gelassen. */
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

    /**
     * Rechteck der aktuellen Ueberschrift – ZWISCHENGESPEICHERT.
     *
     * Das war die Ursache fuer das ruckelige Scrollen: die Beschriftungslinie
     * holte es sich pro Frame ueber getBoundingClientRect(), waehrend im selben
     * Frame die Ebenen ihre Transformationen geschrieben bekamen. Lesen nach
     * Schreiben erzwingt jedes Mal ein neues Layout – klassisches Layout
     * Thrashing, sechzig Mal pro Sekunde.
     *
     * Die Ueberschrift steht in einem klebenden Rahmen und bewegt sich praktisch
     * nicht. Es genuegt, sie beim Kapitelwechsel und bei Groessenaenderungen neu
     * zu messen.
     */
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

            {station !== null && chapters[station] && (
                <StationView chapter={chapters[station]} onClose={() => onStation(null)}/>
            )}
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
            <div key={chapter.id}>
                <ChapterContent chapter={chapter}/>
                {/* Hier gibt es keine Planeten zum Anklicken, also steht das Bild
                    einfach unter dem Text. */}
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
    /** Welcher Planet ist angeklickt? Kommt aus App, weil die Szene ihn auslöst. */
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
