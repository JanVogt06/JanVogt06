import {Award, Users, BookOpen, GraduationCap} from "lucide-react"
import type {LucideIcon} from "lucide-react"
import {motion} from "framer-motion"
import refereeImage from "../data/images/referee.webp"
import skiJumpImage from "../data/images/ski_jump.webp"
import GitGraph from "./GitGraph"
import Reveal from "./Reveal"
import SectionHeader from "./SectionHeader"
import {fadeUp, scaleIn, slideInLeft, stagger} from "@/lib/motion"

type EngagementItem = {
    icon: LucideIcon;
    title: string;
    desc: string;
};

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
];

const awards = [
    {year: "2024", text: "DMV-Abiturpreis Mathematik"},
    {year: "2024", text: "DPG-Abiturpreis Physik"},
    {year: "2024", text: "Pierre-de-Coubertin-Preis"},
    {year: "2022", text: "Marie-Curie-Preis"},
    {year: "2022", text: "Schiedsrichter des Jahres"},
    {year: "2016-24", text: "Olympiaden-Preise in Mathematik und Physik"},
];

/* Kartenueberschrift als Mono-Kapitaelchen: pro Sektion bleibt nur EINE laute
   Schriftgroesse. */
const CardLabel = ({children}: { children: string }) => (
    <motion.h3 variants={fadeUp} className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-white/40">
        {children}
    </motion.h3>
);

/* Engagement – Hairline-getrennte Zeilen statt Karten in Karten in Karten. */
const EngagementCard = ({className = ""}: { className?: string }) => (
    <Reveal
        variants={stagger(0.08)}
        className={`surface rounded-2xl p-6 lg:rounded-3xl lg:p-8 ${className}`}
    >
        <CardLabel>Engagement</CardLabel>
        {engagementItems.map((item, i) => (
            <motion.div
                key={item.title}
                variants={fadeUp}
                className={`group flex items-start gap-3.5 py-4 ${i > 0 ? "border-t border-white/[0.06]" : ""}`}
            >
                <item.icon
                    className="mt-1 h-4 w-4 shrink-0 text-brand transition-transform duration-300 group-hover:scale-110"/>
                <div className="min-w-0">
                    <h4 className="font-semibold text-white">{item.title}</h4>
                    <p className="text-sm leading-relaxed text-white/50">{item.desc}</p>
                </div>
            </motion.div>
        ))}
    </Reveal>
);

/* Auszeichnungen – Jahre in Mono als linke Spalte, wie ein git-log-Datum. */
const AwardsCard = ({className = ""}: { className?: string }) => (
    <Reveal
        variants={stagger(0.05)}
        className={`surface rounded-2xl p-6 lg:rounded-3xl lg:p-8 ${className}`}
    >
        <motion.h3
            variants={fadeUp}
            className="mb-1 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-white/40"
        >
            <Award className="h-3.5 w-3.5 text-brand"/>
            Auszeichnungen
        </motion.h3>
        <div className="grid sm:grid-cols-2 sm:gap-x-8">
            {awards.map((award, i) => (
                <motion.div
                    key={award.text}
                    variants={fadeUp}
                    /* Trennlinie oben ausser bei der ersten Zeile jeder Spalte:
                       einspaltig ab i>0, zweispaltig verliert i=1 seine Linie. */
                    className={`flex items-baseline gap-3 py-2.5 ${i > 0 ? "border-t border-white/[0.06]" : ""} ${i === 1 ? "sm:border-t-0" : ""}`}
                >
                    <span className="shrink-0 font-mono text-xs text-white/35">{award.year}</span>
                    <span className="text-sm text-white/70">{award.text}</span>
                </motion.div>
            ))}
        </div>
    </Reveal>
);

const About = () => {
    return (
        <section id="about" className="relative py-20 md:py-28">
            <div className="relative mx-auto max-w-[88rem] px-4 sm:px-6 lg:px-8">

                <SectionHeader
                    command="cat"
                    argument="README.md"
                    title="Über"
                    accent="mich"
                    lead="Informatik-Student, Werkstudent bei ZEISS & Schiedsrichter mit Leidenschaft für Technologie"
                />

                {/* Mobile Layout (gestapelt) */}
                <div className="space-y-4 lg:hidden">

                    <Reveal
                        variants={scaleIn}
                        className="overflow-hidden rounded-2xl border border-white/[0.06]"
                    >
                        <img
                            src={skiJumpImage}
                            alt="Jan Vogt beim Skifahren"
                            className="block h-56 w-full object-cover object-center sm:h-72"
                        />
                    </Reveal>

                    <Reveal
                        variants={slideInLeft}
                        className="surface rounded-2xl p-6"
                    >
                        <h3 className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-white/40">Werdegang</h3>
                        <GitGraph/>
                    </Reveal>

                    <Reveal
                        variants={fadeUp}
                        className="flex items-end justify-center overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-brand/[0.07] to-transparent p-4 pb-0"
                        style={{minHeight: '300px'}}
                    >
                        <img
                            src={refereeImage}
                            alt="Jan Vogt als Schiedsrichter"
                            className="h-full max-h-72 w-auto object-contain object-bottom"
                        />
                    </Reveal>

                    <EngagementCard/>
                    <AwardsCard/>

                </div>

                {/* Desktop Layout (12-Spalten-Raster) */}
                <div className="relative hidden grid-cols-12 gap-5 lg:grid">

                    <Reveal
                        variants={slideInLeft}
                        className="surface col-span-7 rounded-3xl p-8"
                    >
                        <h3 className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-white/40">Werdegang</h3>
                        <GitGraph/>
                    </Reveal>

                    <Reveal
                        variants={scaleIn}
                        className="col-span-5 overflow-hidden rounded-3xl border border-white/[0.06]"
                    >
                        <img
                            src={skiJumpImage}
                            alt="Jan Vogt beim Skifahren"
                            className="block h-full w-full object-cover object-center"
                        />
                    </Reveal>

                    <Reveal
                        variants={slideInLeft}
                        className="col-span-4 flex items-end justify-center overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-b from-brand/[0.07] to-transparent p-6 pb-0"
                        style={{minHeight: '600px'}}
                    >
                        <img
                            src={refereeImage}
                            alt="Jan Vogt als Schiedsrichter"
                            className="h-full w-full object-contain object-bottom"
                        />
                    </Reveal>

                    {/* Engagement + Auszeichnungen teilen sich die Hoehe der
                        Referee-Karte: die Spalte ist als Grid-Item so hoch wie
                        die Nachbarzelle, flex-1 verteilt den Platz auf beide. */}
                    <div className="col-span-8 flex flex-col gap-5">
                        <EngagementCard className="flex-1"/>
                        <AwardsCard className="flex-1"/>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default About;
