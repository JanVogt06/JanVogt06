import {Award, Users, BookOpen, GraduationCap} from "lucide-react"
import type {LucideIcon} from "lucide-react"
import {motion} from "framer-motion"
import refereeImage from "@/assets/images/referee.png"
import aboutPortraitImage from "@/assets/images/about_portrait.png"
import GitGraph from "./GitGraph"
import Reveal from "./Reveal"
import {fadeUp, scaleIn, slideInLeft, stagger} from "@/lib/motion"

type EngagementItem = {
    icon: LucideIcon;
    gradient: string;
    color: string;
    title: string;
    desc: string;
};

const engagementItems: EngagementItem[] = [
    {
        icon: Users,
        gradient: "from-purple-500 to-pink-600",
        color: "text-purple-400",
        title: "Elite-Kader Thüringen",
        desc: "Fußball-Schiedsrichter Thüringenliga & Junioren-Bundesliga",
    },
    {
        icon: BookOpen,
        gradient: "from-pink-500 to-rose-600",
        color: "text-pink-400",
        title: "Redaktionsmitglied",
        desc: "\"Die Wurzel\" - Zeitschrift für Mathematik",
    },
    {
        icon: GraduationCap,
        gradient: "from-cyan-500 to-blue-600",
        color: "text-cyan-400",
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

/* Engagement-Karte – exakt das Hero-Terminal-Muster:
   nicht-transformierender Stagger-Container, direkte fadeUp-Kinder. */
const EngagementCard = () => (
    <Reveal
        variants={stagger(0.08)}
        className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm lg:rounded-3xl lg:p-8"
    >
        <motion.h3 variants={fadeUp} className="text-2xl font-bold text-white lg:text-3xl">
            Engagement
        </motion.h3>
        {engagementItems.map((item) => (
            <motion.div
                key={item.title}
                variants={fadeUp}
                whileHover={{x: 4}}
                className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/5 p-4 transition-colors duration-300 hover:border-white/10 hover:bg-white/10 sm:rounded-2xl sm:p-5"
            >
                <div className={`rounded-lg bg-linear-to-br ${item.gradient} p-2`}>
                    <item.icon className="h-4 w-4 text-white sm:h-5 sm:w-5"/>
                </div>
                <div>
                    <h4 className={`font-semibold ${item.color}`}>{item.title}</h4>
                    <p className="text-sm text-white/60">{item.desc}</p>
                </div>
            </motion.div>
        ))}
    </Reveal>
);

// Auszeichnungen – gleiches Muster, Container ist ein Stagger-Grid.
const AwardsCard = () => (
    <Reveal
        variants={stagger(0.05)}
        className="grid grid-cols-1 gap-2 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:grid-cols-2 lg:rounded-3xl lg:p-8"
    >
        <motion.h3
            variants={fadeUp}
            className="col-span-full mb-2 flex items-center gap-2 text-xl font-bold text-white lg:text-2xl"
        >
            <Award className="h-5 w-5 text-yellow-500"/>
            Auszeichnungen
        </motion.h3>
        {awards.map((award) => (
            <motion.div
                key={award.text}
                variants={fadeUp}
                className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/5 px-3 py-2 transition-colors duration-300 hover:border-yellow-500/30 hover:bg-yellow-500/5"
            >
                <span className="text-sm font-semibold text-yellow-500">{award.year}</span>
                <span className="text-xs text-white/70">{award.text}</span>
            </motion.div>
        ))}
    </Reveal>
);

const About = () => {
    return (
        <section id="about" className="relative overflow-hidden bg-[#080b14] py-16 md:py-24">

            {/* Hintergrund */}
            <div className="absolute inset-0">
                <div
                    className="absolute -right-1/4 top-0 h-[600px] w-[600px] rounded-full bg-cyan-600/10 blur-[150px]"/>
                <div
                    className="absolute -left-1/4 bottom-0 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[150px]"/>
            </div>

            {/* Punktraster */}
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: 'radial-gradient(rgba(255,255,255,.5) 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                }}
            />

            <div className="relative mx-auto max-w-[88rem] px-4 sm:px-6 lg:px-8">

                {/* Section Header */}
                <Reveal variants={stagger(0.08)} className="mb-10 text-center md:mb-16">
                    <motion.p variants={fadeUp} className="mb-3 font-mono text-sm text-white/40">
                        <span className="text-emerald-400">$</span> cat <span className="text-white/30">README.md</span>
                    </motion.p>
                    <motion.h2 variants={fadeUp} className="mb-3 text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
                        Über <span
                        className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">mich</span>
                    </motion.h2>
                    <motion.p variants={fadeUp} className="mx-auto max-w-2xl text-lg text-white/60 sm:text-xl">
                        Informatik-Student, Werkstudent bei ZEISS & Schiedsrichter mit Leidenschaft für Technologie
                    </motion.p>
                </Reveal>

                {/* Mobile Layout (gestapelt) */}
                <div className="space-y-6 lg:hidden">

                    <Reveal
                        variants={scaleIn}
                        className="flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-cyan-900/20 to-blue-900/20"
                    >
                        <img
                            src={aboutPortraitImage}
                            alt="Jan Vogt"
                            className="h-64 w-full object-contain object-bottom sm:h-80"
                        />
                    </Reveal>

                    <Reveal
                        variants={slideInLeft}
                        className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
                    >
                        <h3 className="mb-5 text-2xl font-bold text-white">Werdegang</h3>
                        <GitGraph/>
                    </Reveal>

                    <Reveal
                        variants={fadeUp}
                        className="flex items-end justify-center overflow-hidden rounded-2xl bg-linear-to-br from-purple-900/30 to-pink-900/30 p-4 pb-0"
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
                <div className="relative hidden grid-cols-12 gap-6 lg:grid">

                    <Reveal
                        variants={slideInLeft}
                        className="col-span-7 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm"
                    >
                        <h3 className="mb-6 text-3xl font-bold text-white">Werdegang</h3>
                        <GitGraph/>
                    </Reveal>

                    <Reveal
                        variants={scaleIn}
                        className="col-span-5 flex items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-cyan-900/20 to-blue-900/20"
                    >
                        <img
                            src={aboutPortraitImage}
                            alt="Jan Vogt"
                            className="h-full w-full max-h-85 object-contain object-bottom"
                        />
                    </Reveal>

                    <Reveal
                        variants={slideInLeft}
                        className="col-span-4 flex items-end justify-center overflow-visible rounded-3xl bg-linear-to-br from-purple-900/30 to-pink-900/30 p-6 pb-0"
                        style={{minHeight: '600px'}}
                    >
                        <img
                            src={refereeImage}
                            alt="Jan Vogt als Schiedsrichter"
                            className="h-full w-full object-contain object-bottom"
                        />
                    </Reveal>

                    {/* Engagement + Awards - col-span-8 */}
                    <div className="col-span-8 space-y-6">
                        <EngagementCard/>
                        <AwardsCard/>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default About;
