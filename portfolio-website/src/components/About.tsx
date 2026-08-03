import {useCallback, useRef, useState} from "react"
import {Award, Users, BookOpen, GraduationCap, GitBranch} from "lucide-react"
import type {LucideIcon} from "lucide-react"
import type {ReactNode} from "react"
import portraitImage from "../data/images/portrait.webp"
import refereeImage from "../data/images/referee.webp"
import skiJumpImage from "../data/images/ski_jump.webp"
import GitGraph from "./GitGraph"
import Reveal from "./Reveal"
import {HudPanel, HudLabel, HudCorners, HudSectionHeader} from "./Hud"
import {fadeUp} from "@/lib/motion"
import useScrollProgress from "@/lib/useScrollProgress"
import useMediaQuery from "@/lib/useMediaQuery"
import {scrollToPosition} from "@/lib/smoothScroll"

/**
 * Werdegang als gepinnte Kapitel.
 *
 * Der Abschnitt war vorher ein gewoehnliches Kartenraster: es scrollte einfach
 * vorbei. Damit stand er neben dem Scroll-Design der Seite und nicht darin – der
 * Kristallring nebenan ist an den Scroll gekoppelt, hier lief die gleiche
 * Bewegung ins Leere.
 *
 * Jetzt dieselbe Mechanik wie beim Ring: die Sektion ist so hoch wie die Anzahl
 * der Kapitel in Bildschirmhoehen, darin klebt ein bildschirmhoher Rahmen, und
 * der Scroll-Fortschritt fuehrt durch die Kapitel. Sie liegen uebereinander und
 * ziehen als HUD-Ebenen durch die Kamera: das kommende waechst von hinten heran,
 * das gehende zieht groesser werdend vorbei. Derselbe Griff, dieselbe
 * Steuerzeile, dieselbe Sprache.
 *
 * Und das Portrait hat damit wieder einen Ort. Es stand im Hero dem Ring im Weg;
 * im Kapitel "Auszeichnungen" gehoert es hin – es ist ja ein "Ueber mich".
 */

type EngagementItem = {
    icon: LucideIcon
    title: string
    desc: string
}

const engagementItems: EngagementItem[] = [
    {
        icon: Users,
        title: "Schiedsrichter NOFV",
        desc: "Oberliga & U19-Bundesliga, Assistent Regionalliga",
    },
    {
        icon: BookOpen,
        title: "Redaktionsmitglied",
        desc: "\"Die Wurzel\" - Zeitschrift für Mathematik",
    },
    {
        icon: GraduationCap,
        title: "Jugendvertretung Bad Berka",
        desc: "Stadtentwicklung & ISEK-Workshops",
    },
]

const awards = [
    {year: "2024", text: "DMV-Abiturpreis Mathematik"},
    {year: "2024", text: "DPG-Abiturpreis Physik"},
    {year: "2024", text: "Pierre-de-Coubertin-Preis"},
    {year: "2022", text: "Marie-Curie-Preis"},
    {year: "2022", text: "Schiedsrichter des Jahres"},
    {year: "2016-24", text: "Olympiaden-Preise in Mathematik und Physik"},
]

const EngagementList = () => (
    <>
        {engagementItems.map((item, i) => (
            <div
                key={item.title}
                className={`group flex items-start gap-3.5 py-4 ${i > 0 ? "border-t border-white/[0.06]" : "pt-5"}`}
            >
                <item.icon className="mt-1 h-4 w-4 shrink-0 text-brand transition-transform duration-300 group-hover:scale-110"/>
                <div className="min-w-0">
                    <h4 className="font-semibold text-white">{item.title}</h4>
                    <p className="text-sm leading-relaxed text-white/50">{item.desc}</p>
                </div>
            </div>
        ))}
    </>
)

/** Auszeichnungen – Jahre in Mono als linke Spalte, wie ein git-log-Datum. */
const AwardsList = () => (
    <div className="mt-4">
        {awards.map((award, i) => (
            <div
                key={award.text}
                className={`flex items-baseline gap-3 py-2.5 ${i > 0 ? "border-t border-white/[0.06]" : ""}`}
            >
                <span className="shrink-0 font-mono text-xs text-brand/60">{award.year}</span>
                <span className="text-sm text-white/70">{award.text}</span>
            </div>
        ))}
    </div>
)

type Chapter = {
    id: string
    label: string
    /** Kennzeichnet das Kapitel in der Tafel – wie eine Instrumentenanzeige. */
    icon: LucideIcon
    image: string
    alt: string
    caption: string
    /** Wie das Bild in seinen Rahmen sitzt – Aufnahme oder freigestellt. */
    fit: "cover" | "contain"
    body: ReactNode
}

const chapters: Chapter[] = [
    {
        id: "werdegang",
        label: "Werdegang",
        icon: GitBranch,
        image: skiJumpImage,
        alt: "Jan Vogt beim Skifahren",
        caption: "Skisprung",
        fit: "cover",
        body: <GitGraph/>,
    },
    {
        id: "engagement",
        label: "Engagement",
        icon: Users,
        image: refereeImage,
        alt: "Jan Vogt als Schiedsrichter",
        caption: "Schiedsrichter",
        fit: "contain",
        body: <EngagementList/>,
    },
    {
        id: "auszeichnungen",
        label: "Auszeichnungen",
        icon: Award,
        image: portraitImage,
        alt: "Jan Vogt",
        caption: "Jan Vogt",
        fit: "contain",
        body: <AwardsList/>,
    },
]

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

/** Bild mit Eckklammern und Mono-Unterschrift statt Kartenrand. */
const HudImage = ({chapter, className = ""}: {chapter: Chapter; className?: string}) => (
    <div className={`relative overflow-hidden border border-white/[0.06] ${className}`}>
        <img
            src={chapter.image}
            alt={chapter.alt}
            className={
                chapter.fit === "cover"
                    ? "h-full w-full object-cover object-center"
                    : "h-full w-full object-contain object-bottom"
            }
        />

        {/* Cyan-Hauch: bindet die Aufnahmen an den Farbraum der Seite. */}
        <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand/[0.10] via-transparent to-transparent"
        />
        <HudCorners tone="border-white/25"/>

        <HudLabel tone="text-white/45" className="absolute bottom-3 left-4 !tracking-[0.24em]">
            {chapter.caption}
        </HudLabel>
    </div>
)

/** Ein Kapitel: links die Tafel, rechts die Aufnahme. */
const ChapterLayer = ({chapter}: {chapter: Chapter}) => (
    <div className="grid h-full items-center gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="flex min-h-0 lg:col-span-7">
            <HudPanel
                className="flex max-h-full w-full flex-col overflow-y-auto p-6 lg:p-8"
                tone="border-white/15"
            >
                <div className="mb-1 flex shrink-0 items-center gap-2">
                    <chapter.icon className="h-3.5 w-3.5 text-brand"/>
                    <HudLabel>{chapter.label}</HudLabel>
                </div>
                <div className="min-h-0">{chapter.body}</div>
            </HudPanel>
        </div>

        <HudImage chapter={chapter} className="hidden h-full max-h-[62vh] lg:col-span-5 lg:block"/>
    </div>
)

const AboutChapters = () => {
    const sectionRef = useRef<HTMLDivElement>(null)
    const layerRefs = useRef<(HTMLDivElement | null)[]>([])
    const [index, setIndex] = useState(0)

    /**
     * Kapitel i steht, wenn der Fortschritt i/(n-1) erreicht.
     *
     * d ist der Abstand zum aktuellen Stand: negativ heisst "kommt noch",
     * positiv "ist vorbei". Daraus wird die Ebene gestellt – das kommende
     * Kapitel waechst von hinten heran (kleiner, tiefer), das gehende zieht
     * groesser werdend nach oben vorbei. Ohne React-State pro Frame, wie beim
     * Kristallring: direkt in style.
     */
    const onProgress = useCallback((raw: number) => {
        const position = clamp01(raw) * (chapters.length - 1)

        layerRefs.current.forEach((layer, i) => {
            if (!layer) return
            const d = position - i
            const distance = Math.abs(d)

            layer.style.opacity = String(clamp01(1 - distance * 1.4))
            layer.style.transform =
                `translate3d(0, ${(-d * 7).toFixed(2)}vh, 0) scale(${(1 + d * 0.1).toFixed(3)})`

            /* Nur das vorderste Kapitel ist bedienbar und fuer Screenreader da.
               Sonst laege unter dem sichtbaren Kapitel noch Text, den man
               markieren und antabben koennte, ohne ihn zu sehen. */
            const active = distance < 0.5
            layer.style.pointerEvents = active ? "auto" : "none"
            layer.setAttribute("aria-hidden", active ? "false" : "true")
        })

        setIndex(Math.round(position))
    }, [])

    useScrollProgress(sectionRef, onProgress)

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
                <div className="mx-auto w-full max-w-[88rem] shrink-0 px-6 pt-8 sm:px-10 lg:px-16">
                    <HudSectionHeader
                        id="01"
                        command="cat"
                        argument="README.md"
                        title="Über"
                        accent="mich"
                    />
                </div>

                {/* Die Kapitel liegen uebereinander und ziehen durch die Kamera. */}
                <div className="relative mx-auto w-full min-h-0 max-w-[88rem] flex-1 px-6 py-6 sm:px-10 lg:px-16">
                    {chapters.map((chapter, i) => (
                        <div
                            key={chapter.id}
                            ref={(node) => {
                                layerRefs.current[i] = node
                            }}
                            className="absolute inset-x-6 inset-y-6 will-change-transform sm:inset-x-10 lg:inset-x-16"
                            style={{opacity: i === 0 ? 1 : 0}}
                        >
                            <ChapterLayer chapter={chapter}/>
                        </div>
                    ))}
                </div>

                {/* Steuerzeile – dieselbe wie bei den Projekten */}
                <div className="mx-auto w-full max-w-[88rem] shrink-0 px-6 pb-10 sm:px-10 lg:px-16">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-1 gap-1.5">
                            {chapters.map((chapter, i) => (
                                <button
                                    key={chapter.id}
                                    onClick={() => goToChapter(i)}
                                    aria-label={`Zu ${chapter.label}`}
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
                                            i === index ? "text-white/70" : "text-white/25"
                                        }`}
                                    >
                                        {chapter.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <span className="shrink-0 font-mono text-xs text-white/35">
                            <span className="text-white/70">{String(index + 1).padStart(2, "0")}</span>
                            /{String(chapters.length).padStart(2, "0")}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * Rueckfallebene: gestapelt.
 *
 * Fuer schmale oder flache Fenster und fuer prefers-reduced-motion. Ein
 * gepinnter Abschnitt braucht eine Bildschirmhoehe, die den Inhalt traegt, und
 * das Durchfahren von Kapiteln ist genau die Bewegung, die bei reduzierter
 * Bewegung nicht gewollt ist.
 */
const AboutStack = () => (
    <div className="mx-auto max-w-[88rem] px-4 py-20 sm:px-6 md:py-28 lg:px-8">
        <Reveal variants={fadeUp} className="mb-10 md:mb-14">
            <HudSectionHeader
                id="01"
                command="cat"
                argument="README.md"
                title="Über"
                accent="mich"
                lead="Informatik-Student, Werkstudent bei ZEISS & Schiedsrichter mit Leidenschaft für Technologie"
            />
        </Reveal>

        <div className="space-y-4">
            {chapters.map((chapter) => (
                <Reveal key={chapter.id} variants={fadeUp} className="space-y-4">
                    <HudImage chapter={chapter} className="h-56 sm:h-72"/>
                    <HudPanel className="p-6" tone="border-white/15">
                        <div className="mb-1 flex items-center gap-2">
                            <chapter.icon className="h-3.5 w-3.5 text-brand"/>
                            <HudLabel>{chapter.label}</HudLabel>
                        </div>
                        {chapter.body}
                    </HudPanel>
                </Reveal>
            ))}
        </div>
    </div>
)

const About = () => {
    /* Gepinnt nur, wenn genug Platz da ist: Breite fuer die zwei Spalten und
       Hoehe, damit ein Kapitel in einen Bildschirm passt. */
    const roomy = useMediaQuery("(min-width: 1024px) and (min-height: 700px)")
    const reduced = useMediaQuery("(prefers-reduced-motion: reduce)")

    return (
        <section id="about" className="relative">
            {roomy && !reduced ? <AboutChapters/> : <AboutStack/>}
        </section>
    )
}

export default About
