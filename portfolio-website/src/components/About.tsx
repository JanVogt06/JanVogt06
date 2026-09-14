import {useCallback, useEffect, useRef} from "react"
import type {CSSProperties} from "react"
import {ImageIcon, X} from "lucide-react"
import Band from "./band/Band"
import type {BandHandle} from "./band/Band"
import Action from "./band/Action"
import Slate from "./band/Slate"
import {Row, Rows} from "./band/Rows"
import station01Image from "../data/images/station_01_mein_weg.webp"
import station02Image from "../data/images/station_02_neben_dem_studium.webp"
import station03Image from "../data/images/station_03_meine_auszeichnungen.webp"
import useScrollProgress from "@/lib/useScrollProgress"
import {space} from "@/lib/space/controller"
import {stationPosition, trackScreens} from "@/lib/stations"
import {bandWeight} from "@/lib/band"

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

    /** Lists with no second line pair up once there is room for two columns. */
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
    },
    {
        id: "engagement",
        label: "Station 02",
        title: "Neben dem",
        accent: "Studium",
        image: station02Image,
        alt: "Jan Vogt als Schiedsrichter",
        entries: engagement,
    },
    {
        id: "auszeichnungen",
        label: "Station 03",
        title: "Meine",
        accent: "Auszeichnungen",
        image: station03Image,
        alt: "Jan Vogt",
        entries: awards,
        paired: true,
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
            className="animate-hud fixed inset-0 z-40 overflow-hidden bg-page/92 backdrop-blur-[14px]"
        >
            <button
                aria-hidden="true"
                tabIndex={-1}
                onClick={onClose}
                className="absolute inset-0 cursor-default"
            />

            <div className="relative mx-auto flex h-full w-full max-w-[64rem] flex-col px-[var(--gutter)] pb-5 pt-16">
                <div className="flex shrink-0 items-center justify-between gap-6 border-b border-hair pb-4">
                    <div className="min-w-0">
                        <p className="text-label uppercase tracking-[0.14em] text-fg-3">
                            {chapter.label}
                        </p>
                        <h2 className="mt-2 truncate text-title text-fg">
                            {chapter.title} {chapter.accent}
                        </h2>
                    </div>

                    <div className="flex shrink-0 items-center gap-4">
                        <kbd className="hidden text-label uppercase tracking-[0.14em] text-fg-3 sm:inline">
                            Esc
                        </kbd>
                        <button
                            ref={closeRef}
                            onClick={onClose}
                            aria-label="Aufnahme schließen"
                            className="flex h-11 w-11 items-center justify-center rounded-full text-fg-2 transition-colors duration-200 hover:bg-white/[0.08] hover:text-fg"
                        >
                            <X className="h-4 w-4"/>
                        </button>
                    </div>
                </div>

                <div className="mt-5 min-h-0 flex-1">
                    <img
                        src={chapter.image}
                        alt={chapter.alt}
                        className="h-full w-full rounded-xl object-contain object-center"
                    />
                </div>
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
            <p className="shrink-0 text-label uppercase tracking-[0.14em] text-fg-3">
                {chapter.label} <span className="text-fg-3/70">/ 0{chapters.length}</span>
            </p>
        </Slate>

        <h2 className="mt-3 text-title">
            <span className="font-light text-fg-2">{chapter.title}</span>{" "}
            <span className="text-fg">{chapter.accent}</span>
        </h2>

        <div className={chapter.paired ? "sm:grid sm:grid-cols-2 sm:gap-x-8" : undefined}>
            <Rows>
                {chapter.entries.map((entry) => (
                    <Row key={entry.what} {...entry} />
                ))}
            </Rows>
        </div>

        {onOpenImage && (
            <div className="mt-7 short:mt-5">
                <Action onClick={onOpenImage} icon={<ImageIcon className="h-3 w-3"/>}>
                    Aufnahme
                </Action>
                <span className="ml-3 hidden text-sub text-fg-3 sm:inline">
                    oder Planet anklicken
                </span>
            </div>
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
                className="track"
                style={{"--screens": trackScreens(chapters.length)} as CSSProperties}
            />

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
    <div className="mx-auto max-w-[72rem] space-y-20 px-[var(--gutter)] py-20 md:py-28">
        {chapters.map((chapter) => (
            <Band key={chapter.id} flow>
                <ChapterBody chapter={chapter}/>
                <img
                    src={chapter.image}
                    alt={chapter.alt}
                    className="mt-10 max-h-[50vh] w-full rounded-xl object-contain object-center"
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
        {scene ? <AboutJourney station={station} onStation={onStation}/> : <AboutStack/>}
    </section>
)

export default About
