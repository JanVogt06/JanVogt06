import {useCallback, useId, useRef} from "react"
import type {CSSProperties} from "react"
import {ImageIcon, X} from "lucide-react"
import Band from "./band/Band"
import type {BandHandle} from "./band/Band"
import Action from "./band/Action"
import Slate from "./band/Slate"
import Scramble from "./type/Scramble"
import Rise from "./type/Rise"
import {Row, Rows} from "./band/Rows"
import station01Image from "../data/images/station_01_mein_weg.webp"
import station02Image from "../data/images/station_02_neben_dem_studium.webp"
import station03Image from "../data/images/station_03_meine_auszeichnungen.webp"
import useScrollProgress from "@/lib/useScrollProgress"
import {space} from "@/lib/space/controller"
import {stationPosition, stationProgress, trackScreens, trackTravel} from "@/lib/stations"
import Stops, {ChapterCue} from "./Stops"
import {bandWeight} from "@/lib/band"
import useDialog from "@/lib/useDialog"

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

type Entry = {when?: string; what: string; where?: string}

type Chapter = {
    id: string
    label: string
    title: string
    accent: string
    image: string
    alt: string
    entries: Entry[]

    /** The planet the camera holds on, and its mean distance from the Sun. */
    planet: string
    distance: string

    /** One-line lists, which sit closer together and pair up in two columns. */
    paired?: boolean
}

const chapters: Chapter[] = [
    {
        id: "werdegang",
        label: "Station 01",
        title: "Mein",
        accent: "Weg",
        image: station01Image,
        alt: "Jan Vogt beim Skifahren",
        entries: timeline,
        planet: "Mars",
        distance: "1,52 AE",
    },
    {
        id: "engagement",
        label: "Station 02",
        title: "Neben dem",
        accent: "Studium",
        image: station02Image,
        alt: "Jan Vogt als Schiedsrichter",
        entries: engagement,
        planet: "Jupiter",
        distance: "5,20 AE",
    },
    {
        id: "auszeichnungen",
        label: "Station 03",
        title: "Meine",
        accent: "Auszeichnungen",
        image: station03Image,
        alt: "Jan Vogt mit Urkunden auf der Bühne einer Preisverleihung",
        entries: awards,
        planet: "Saturn",
        distance: "9,58 AE",
        paired: true,
    },
]

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

const APPROACH = 0.08

const STOPS = chapters.map((_, i) => stationProgress(i, chapters.length))

const StationView = ({chapter, onClose}: {chapter: Chapter; onClose: () => void}) => {
    const rootRef = useRef<HTMLDivElement>(null)
    const closeRef = useRef<HTMLButtonElement>(null)
    const titleId = useId()

    useDialog(rootRef, onClose, closeRef)

    return (
        <div
            ref={rootRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="animate-hud fixed inset-0 z-[60] overflow-hidden bg-page"
        >
            <button
                aria-hidden="true"
                tabIndex={-1}
                onClick={onClose}
                className="absolute inset-0 cursor-default"
            />

            <div className="pointer-events-none relative mx-auto flex h-full w-full max-w-[64rem] flex-col px-[var(--gutter)] pb-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))] pt-[env(safe-area-inset-top)]">
                <div className="pointer-events-auto flex h-14 shrink-0 items-center justify-between gap-6">
                    <p className="min-w-0 truncate font-mono text-label uppercase tracking-[0.08em] text-fg-3">
                        {chapter.label} · {chapter.planet}
                    </p>

                    <button
                        ref={closeRef}
                        onClick={onClose}
                        aria-label="Foto schließen"
                        className="-mr-3 flex h-11 shrink-0 items-center gap-2.5 px-3 font-mono text-label uppercase tracking-[0.08em] text-fg transition-colors duration-200 hover:text-signal"
                    >
                        <span className="hidden sm:inline">Esc</span>
                        <X className="h-4 w-4"/>
                    </button>
                </div>

                <figure className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4">
                    <img
                        src={chapter.image}
                        alt={chapter.alt}
                        className="pointer-events-auto min-h-0 max-w-full flex-initial rounded-xl object-contain"
                    />
                    <figcaption id={titleId} className="shrink-0 text-center">
                        <span className="font-light text-fg-3">{chapter.title}</span>{" "}
                        <span className="text-fg">{chapter.accent}</span>
                    </figcaption>
                </figure>
            </div>
        </div>
    )
}

const ChapterBody = ({
    chapter,
    onOpenImage,
}: {
    chapter: Chapter
    onOpenImage?: () => void
}) => (
    <>
        <Slate>
            <span className="flex shrink-0 items-baseline gap-3">
                <Scramble text={`${chapter.label} / 0${chapters.length}`}/>
                <Scramble
                    text={`${chapter.planet} · ${chapter.distance}`}
                    delay={120}
                    className="text-fg-2"
                />
            </span>
        </Slate>

        <h2 className="mt-4 text-heading short:mt-3 squat:mt-2">
            <Rise delay={80}>
                <span className="font-light text-fg-3">{chapter.title}</span>{" "}
                <span className="text-fg">{chapter.accent}</span>
            </Rise>
        </h2>

        <div data-dense={chapter.paired ? "" : undefined}>
            <Rows dense={chapter.paired}>
                {chapter.entries.map((entry, i) => (
                    <Row key={entry.what} order={i} {...entry} />
                ))}
            </Rows>
        </div>

        {onOpenImage && (
            <Rise mode="fade" delay={420} as="div" className="mt-6 short:mt-4 squat:mt-2">
                <div className="flex items-center gap-4">
                    <Action onClick={onOpenImage} icon={<ImageIcon className="h-3 w-3"/>}>
                        Foto ansehen
                    </Action>
                    <span className="hidden text-sub text-fg-3 sm:inline">
                        oder Planet{" "}
                        <span className="pointer-coarse:hidden">anklicken</span>
                        <span className="hidden pointer-coarse:inline">antippen</span>
                    </span>
                </div>
            </Rise>
        )}
    </>
)

const AboutJourney = ({
    station,
    onStation,
}: {
    station: number | null
    onStation: (index: number | null) => void
}) => {
    const sectionRef = useRef<HTMLDivElement>(null)
    const bandRefs = useRef<(BandHandle | null)[]>([])

    const onProgress = useCallback((raw: number) => {
        const progress = clamp01(raw)

        const position = stationPosition(progress, chapters.length)
        const span = Math.max(chapters.length - 1, 1)

        space.setAboutProgress(position / span)
        space.setAboutScroll(progress)

        const active = Math.min(
            clamp01((raw + APPROACH) / APPROACH),
            clamp01((1 + APPROACH - raw) / APPROACH),
        )
        space.setAboutActive(active)

        bandRefs.current.forEach((band, i) => {
            if (!band) return
            const d = position - i
            band.setWeight(bandWeight(d) * active, -d * 10)
        })
    }, [])

    useScrollProgress(sectionRef, onProgress)

    return (
        <>
            <div
                ref={sectionRef}
                className="track relative"
                style={{"--screens": trackScreens(chapters.length)} as CSSProperties}
            >
                <Stops at={STOPS} travel={trackTravel(chapters.length)} entry={0}/>
            </div>

            {chapters.map((chapter, i) => (
                <Band
                    key={chapter.id}
                    ref={(node) => {
                        bandRefs.current[i] = node
                    }}
                >
                    <ChapterBody chapter={chapter} onOpenImage={() => onStation(i)}/>
                </Band>
            ))}

            {station !== null && chapters[station] && (
                <StationView chapter={chapters[station]} onClose={() => onStation(null)}/>
            )}
        </>
    )
}

const AboutStack = () => (
    <div className="mx-auto max-w-[72rem] space-y-24 px-[var(--gutter)] py-24 md:space-y-32 md:py-32">
        {chapters.map((chapter) => (
            <Band key={chapter.id} flow className="md:grid md:grid-cols-12 md:items-center md:gap-12">
                <div className="md:col-span-6">
                    <ChapterBody chapter={chapter}/>
                </div>
                <img
                    src={chapter.image}
                    alt={chapter.alt}
                    loading="lazy"
                    className="mt-10 max-h-[60vh] w-full rounded-xl object-cover object-center md:col-span-6 md:mt-0"
                />
            </Band>
        ))}
    </div>
)

const About = ({
    scene,
    station,
    onStation,
}: {
    scene: boolean

    station: number | null
    onStation: (index: number | null) => void
}) => (
    <section id="about" className="relative">
        {!scene && <ChapterCue chapter="about"/>}
        {scene ? <AboutJourney station={station} onStation={onStation}/> : <AboutStack/>}
    </section>
)

export default About
