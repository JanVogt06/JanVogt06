import {Award, Users, BookOpen, GraduationCap} from "lucide-react"
import type {LucideIcon} from "lucide-react"
import {motion} from "framer-motion"
import refereeImage from "../data/images/referee.webp"
import skiJumpImage from "../data/images/ski_jump.webp"
import GitGraph from "./GitGraph"
import Reveal from "./Reveal"
import {HudPanel, HudLabel, HudCorners, HudSectionHeader} from "./Hud"
import {fadeUp, scaleIn, slideInLeft, stagger} from "@/lib/motion"

/**
 * Werdegang im HUD-Stil.
 *
 * Vorher waren das abgerundete Karten mit Hairline-Rahmen – freundlich, aber aus
 * einem anderen Baukasten als der Kristallring darueber. Jetzt dieselbe Sprache
 * wie die Projekt-Tafel: rechte Winkel, Eckklammern, Mono-Beschriftungen mit
 * Doppelslash.
 *
 * Die Bilder bekommen einen Rahmen aus Eckklammern und eine Mono-Bildunterschrift
 * statt eines Kartenrandes – dadurch lesen sie sich als Aufnahmen in einer
 * Instrumententafel und nicht als Fotos in einem Album.
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

/** Bild mit Eckklammern und Mono-Unterschrift statt Kartenrand. */
const HudImage = ({
    src,
    alt,
    caption,
    className = "",
    imageClassName = "",
    style,
}: {
    src: string
    alt: string
    caption: string
    className?: string
    imageClassName?: string
    style?: React.CSSProperties
}) => (
    <div className={`relative overflow-hidden border border-white/[0.06] ${className}`} style={style}>
        <img src={src} alt={alt} className={imageClassName}/>

        {/* Cyan-Hauch: bindet die Aufnahmen an den Farbraum der Seite, statt sie
            als Fremdkoerper stehen zu lassen. */}
        <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand/[0.10] via-transparent to-transparent"
        />
        <HudCorners tone="border-white/25"/>

        <HudLabel
            tone="text-white/45"
            className="absolute bottom-3 left-4 !tracking-[0.24em]"
        >
            {caption}
        </HudLabel>
    </div>
)

const EngagementPanel = ({className = ""}: {className?: string}) => (
    <Reveal variants={stagger(0.08)} className={className}>
        <HudPanel className="h-full p-6 lg:p-8" tone="border-white/15">
            <motion.div variants={fadeUp}>
                <HudLabel>Engagement</HudLabel>
            </motion.div>
            {engagementItems.map((item, i) => (
                <motion.div
                    key={item.title}
                    variants={fadeUp}
                    className={`group flex items-start gap-3.5 py-4 ${i > 0 ? "border-t border-white/[0.06]" : "pt-5"}`}
                >
                    <item.icon
                        className="mt-1 h-4 w-4 shrink-0 text-brand transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="min-w-0">
                        <h4 className="font-semibold text-white">{item.title}</h4>
                        <p className="text-sm leading-relaxed text-white/50">{item.desc}</p>
                    </div>
                </motion.div>
            ))}
        </HudPanel>
    </Reveal>
)

/** Auszeichnungen – Jahre in Mono als linke Spalte, wie ein git-log-Datum. */
const AwardsPanel = ({className = ""}: {className?: string}) => (
    <Reveal variants={stagger(0.05)} className={className}>
        <HudPanel className="h-full p-6 lg:p-8" tone="border-white/15">
            <motion.div variants={fadeUp} className="flex items-center gap-2">
                <Award className="h-3.5 w-3.5 text-brand"/>
                <HudLabel>Auszeichnungen</HudLabel>
            </motion.div>
            <div className="mt-4 grid sm:grid-cols-2 sm:gap-x-8">
                {awards.map((award, i) => (
                    <motion.div
                        key={award.text}
                        variants={fadeUp}
                        /* Trennlinie oben ausser bei der ersten Zeile jeder Spalte:
                           einspaltig ab i>0, zweispaltig verliert i=1 seine Linie. */
                        className={`flex items-baseline gap-3 py-2.5 ${i > 0 ? "border-t border-white/[0.06]" : ""} ${i === 1 ? "sm:border-t-0" : ""}`}
                    >
                        <span className="shrink-0 font-mono text-xs text-brand/60">{award.year}</span>
                        <span className="text-sm text-white/70">{award.text}</span>
                    </motion.div>
                ))}
            </div>
        </HudPanel>
    </Reveal>
)

const About = () => (
    <section id="about" className="relative py-20 md:py-28">
        <div className="relative mx-auto max-w-[88rem] px-4 sm:px-6 lg:px-8">

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

            {/* Mobile (gestapelt) */}
            <div className="space-y-4 lg:hidden">
                <Reveal variants={scaleIn}>
                    <HudImage
                        src={skiJumpImage}
                        alt="Jan Vogt beim Skifahren"
                        caption="Skisprung"
                        imageClassName="block h-56 w-full object-cover object-center sm:h-72"
                    />
                </Reveal>

                <Reveal variants={slideInLeft}>
                    <HudPanel className="p-6" tone="border-white/15">
                        <HudLabel className="mb-5">Werdegang</HudLabel>
                        <GitGraph/>
                    </HudPanel>
                </Reveal>

                <Reveal variants={fadeUp}>
                    <HudImage
                        src={refereeImage}
                        alt="Jan Vogt als Schiedsrichter"
                        caption="Schiedsrichter"
                        className="flex items-end justify-center bg-gradient-to-b from-brand/[0.07] to-transparent p-4 pb-0"
                        style={{minHeight: "300px"}}
                        imageClassName="h-full max-h-72 w-auto object-contain object-bottom"
                    />
                </Reveal>

                <EngagementPanel/>
                <AwardsPanel/>
            </div>

            {/* Desktop (12-Spalten-Raster) */}
            <div className="relative hidden grid-cols-12 gap-5 lg:grid">
                <Reveal variants={slideInLeft} className="col-span-7">
                    <HudPanel className="h-full p-8" tone="border-white/15">
                        <HudLabel className="mb-6">Werdegang</HudLabel>
                        <GitGraph/>
                    </HudPanel>
                </Reveal>

                <Reveal variants={scaleIn} className="col-span-5">
                    <HudImage
                        src={skiJumpImage}
                        alt="Jan Vogt beim Skifahren"
                        caption="Skisprung"
                        className="h-full"
                        imageClassName="block h-full w-full object-cover object-center"
                    />
                </Reveal>

                <Reveal variants={slideInLeft} className="col-span-4">
                    <HudImage
                        src={refereeImage}
                        alt="Jan Vogt als Schiedsrichter"
                        caption="Schiedsrichter"
                        className="flex h-full items-end justify-center bg-gradient-to-b from-brand/[0.07] to-transparent p-6 pb-0"
                        style={{minHeight: "600px"}}
                        imageClassName="h-full w-full object-contain object-bottom"
                    />
                </Reveal>

                {/* Engagement + Auszeichnungen teilen sich die Hoehe der
                    Referee-Aufnahme: die Spalte ist als Grid-Item so hoch wie die
                    Nachbarzelle, flex-1 verteilt den Platz auf beide. */}
                <div className="col-span-8 flex flex-col gap-5">
                    <EngagementPanel className="flex-1"/>
                    <AwardsPanel className="flex-1"/>
                </div>
            </div>
        </div>
    </section>
)

export default About
