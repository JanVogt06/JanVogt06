import {Award, Users, BookOpen, GraduationCap} from "lucide-react"
import {motion} from "framer-motion"
import {useEffect, useRef, useState} from "react"
import {Card} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import refereeImage from "@/assets/images/referee.png"
import aboutPortraitImage from "@/assets/images/about_portrait.png"

// CSS Animations
const cssAnimations = `
@keyframes slideInFromBottom {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

// Hook for intersection observer
const useInView = <T extends HTMLElement = HTMLElement>(options = {}) => {
    const ref = useRef<T>(null);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsInView(true);
                observer.disconnect();
            }
        }, {threshold: 0.1, ...options});

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    return {ref, isInView};
};

// Animated Card Component
const AnimatedCard = ({
                          children,
                          className = "",
                          animation = "slideInFromBottom",
                          duration = "0.5s",
                          delay = "0s"
                      }: {
    children: React.ReactNode;
    className?: string;
    animation?: string;
    duration?: string;
    delay?: string;
}) => {
    const {ref, isInView} = useInView<HTMLDivElement>();

    return (
        <Card
            ref={ref}
            className={className}
            style={{
                opacity: 0,
                animation: isInView ? `${animation} ${duration} linear ${delay} forwards` : 'none'
            }}
        >
            {children}
        </Card>
    );
};

const About = () => {
    const engagementCardRef = useInView<HTMLDivElement>();
    const awardsCardRef = useInView<HTMLDivElement>();

    return (
        <>
            <style>{cssAnimations}</style>
            <section id="about" className="relative overflow-hidden bg-[#080b14] py-16 md:py-24">

                {/* Background Elements - Blue/Cyan tinted */}
                <div className="absolute inset-0">
                    <div
                        className="absolute -right-1/4 top-0 h-[600px] w-[600px] rounded-full bg-cyan-600/10 blur-[150px]"/>
                    <div
                        className="absolute -left-1/4 bottom-0 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[150px]"/>
                </div>

                {/* Subtle dot pattern */}
                <div
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: 'radial-gradient(rgba(255,255,255,.5) 1px, transparent 1px)',
                        backgroundSize: '30px 30px'
                    }}
                />

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                    {/* Section Header */}
                    <motion.div
                        className="mb-10 text-center md:mb-16"
                        initial={{opacity: 0, y: 30}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true, margin: "-100px"}}
                        transition={{duration: 0.6}}
                    >
                        <h2 className="mb-3 text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
                            Über <span
                            className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">mich</span>
                        </h2>
                        <p className="mx-auto max-w-2xl text-lg text-white/60 sm:text-xl">
                            Student, Entwickler & Schiedsrichter mit Leidenschaft für Technologie
                        </p>
                    </motion.div>

                    {/* Mobile Layout (stacked) */}
                    <div className="space-y-6 lg:hidden">

                        {/* Portrait - Mobile */}
                        <motion.div
                            className="flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-cyan-900/20 to-blue-900/20"
                            initial={{opacity: 0, scale: 0.9}}
                            whileInView={{opacity: 1, scale: 1}}
                            viewport={{once: true, margin: "-50px"}}
                            transition={{duration: 0.6}}
                        >
                            <img
                                src={aboutPortraitImage}
                                alt="Jan Vogt"
                                className="h-64 w-full object-contain object-bottom sm:h-80"
                            />
                        </motion.div>

                        {/* Bildung - Mobile */}
                        <motion.div
                            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
                            initial={{opacity: 0, x: -30}}
                            whileInView={{opacity: 1, x: 0}}
                            viewport={{once: true, margin: "-50px"}}
                            transition={{duration: 0.6}}
                        >
                            <h3 className="mb-5 text-2xl font-bold text-white">Bildung</h3>

                            <div className="relative space-y-6 border-l-2 border-cyan-500/30 pl-6">
                                {/* B.Sc. */}
                                <div className="relative">
                                    <div
                                        className="absolute -left-8 top-1 h-3 w-3 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"/>
                                    <Badge
                                        className="mb-1.5 inline-block rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/20">
                                        seit 10/2024
                                    </Badge>
                                    <h4 className="mb-0.5 text-lg font-semibold text-white">B.Sc. Informatik</h4>
                                    <p className="text-sm text-white/60">Friedrich-Schiller-Universität Jena</p>
                                </div>

                                {/* Abitur */}
                                <div className="relative">
                                    <div className="absolute -left-8 top-1 h-3 w-3 rounded-full bg-white/30"/>
                                    <Badge
                                        className="mb-1.5 inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/70 hover:bg-white/10">
                                        2024
                                    </Badge>
                                    <h4 className="mb-0.5 text-lg font-semibold text-white">Abitur</h4>
                                    <p className="text-sm text-white/60">Marie-Curie-Gymnasium Bad Berka</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Referee Image - Mobile */}
                        <motion.div
                            className="flex items-end justify-center overflow-hidden rounded-2xl bg-linear-to-br from-purple-900/30 to-pink-900/30 p-4 pb-0"
                            style={{minHeight: '300px'}}
                            initial={{opacity: 0, y: 30}}
                            whileInView={{opacity: 1, y: 0}}
                            viewport={{once: true, margin: "-50px"}}
                            transition={{duration: 0.6}}
                        >
                            <img
                                src={refereeImage}
                                alt="Jan Vogt als Schiedsrichter"
                                className="h-full max-h-72 w-auto object-contain object-bottom"
                            />
                        </motion.div>

                        {/* Engagement - Mobile */}
                        <Card
                            ref={engagementCardRef.ref}
                            className="rounded-2xl border-white/10 bg-white/5 p-6 backdrop-blur-sm"
                            style={{
                                opacity: 0,
                                animation: engagementCardRef.isInView ? 'fadeInUp 0.6s linear forwards' : 'none'
                            }}
                        >
                            <h3 className="mb-5 text-2xl font-bold text-white">Engagement</h3>

                            <div className="space-y-3">
                                {[
                                    {
                                        icon: Users,
                                        gradient: "from-purple-500 to-pink-600",
                                        color: "text-purple-400",
                                        title: "Elite-Kader Thüringen",
                                        desc: "Fußball-Schiedsrichter Thüringenliga & Junioren-Bundesliga"
                                    },
                                    {
                                        icon: BookOpen,
                                        gradient: "from-pink-500 to-rose-600",
                                        color: "text-pink-400",
                                        title: "Redaktionsmitglied",
                                        desc: "\"Die Wurzel\" - Zeitschrift für Mathematik"
                                    },
                                    {
                                        icon: GraduationCap,
                                        gradient: "from-cyan-500 to-blue-600",
                                        color: "text-cyan-400",
                                        title: "Jugendvertretung Bad Berka",
                                        desc: "Stadtentwicklung & ISEK-Workshops"
                                    },
                                ].map((item, i) => (
                                    <Card key={i}
                                          className="flex items-start gap-3 rounded-xl border-white/5 bg-white/5 p-4 transition-all duration-300 hover:border-white/10 hover:bg-white/10">
                                        <div className={`rounded-lg bg-linear-to-br ${item.gradient} p-2`}>
                                            <item.icon className="h-4 w-4 text-white"/>
                                        </div>
                                        <div>
                                            <h4 className={`font-semibold ${item.color}`}>{item.title}</h4>
                                            <p className="text-sm text-white/60">{item.desc}</p>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </Card>

                        {/* Awards - Mobile */}
                        <Card
                            ref={awardsCardRef.ref}
                            className="rounded-2xl border-white/10 bg-white/5 p-6 backdrop-blur-sm"
                            style={{
                                opacity: 0,
                                animation: awardsCardRef.isInView ? 'fadeInUp 0.5s linear forwards' : 'none'
                            }}
                        >
                            <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
                                <Award className="h-5 w-5 text-yellow-500"/>
                                Auszeichnungen
                            </h3>

                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {[
                                    {year: "2024", text: "DMV-Abiturpreis Mathematik"},
                                    {year: "2024", text: "DPG-Abiturpreis Physik"},
                                    {year: "2024", text: "Pierre-de-Coubertin-Preis"},
                                    {year: "2022", text: "Marie-Curie-Preis"},
                                    {year: "2022", text: "Schiedsrichter des Jahres"},
                                    {year: "2016-24", text: "Olympia-Preise"},
                                ].map((award, i) => (
                                    <Card
                                        key={i}
                                        className="flex items-center gap-2 rounded-lg border-white/5 bg-white/5 px-3 py-2 transition-all duration-300 hover:border-yellow-500/30 hover:bg-yellow-500/5"
                                    >
                                        <span className="text-sm font-semibold text-yellow-500">{award.year}</span>
                                        <span className="text-xs text-white/70">{award.text}</span>
                                    </Card>
                                ))}
                            </div>
                        </Card>

                    </div>

                    {/* Desktop Layout (12-column grid) */}
                    <div className="relative hidden grid-cols-12 gap-6 lg:grid">

                        {/* Bildung - col-span-7 */}
                        <motion.div
                            className="col-span-7 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm"
                            initial={{opacity: 0, x: -50}}
                            whileInView={{opacity: 1, x: 0}}
                            viewport={{once: true, margin: "-100px"}}
                            transition={{duration: 0.6, delay: 0.1}}
                        >
                            <h3 className="mb-6 text-3xl font-bold text-white">Bildung</h3>

                            <div className="relative space-y-8 border-l-2 border-cyan-500/30 pl-8">

                                {/* Current - B.Sc. */}
                                <motion.div
                                    className="relative"
                                    initial={{opacity: 0, y: 20}}
                                    whileInView={{opacity: 1, y: 0}}
                                    viewport={{once: true}}
                                    transition={{duration: 0.5, delay: 0.3}}
                                >
                                    <div
                                        className="absolute -left-10.25 top-1 h-4 w-4 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"/>

                                    <Badge
                                        className="mb-2 inline-block rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/20">
                                        seit 10/2024
                                    </Badge>
                                    <h4 className="mb-1 text-xl font-semibold text-white">B.Sc. Informatik</h4>
                                    <p className="text-white/60">Friedrich-Schiller-Universität Jena</p>
                                </motion.div>

                                {/* Abitur */}
                                <motion.div
                                    className="relative"
                                    initial={{opacity: 0, y: 20}}
                                    whileInView={{opacity: 1, y: 0}}
                                    viewport={{once: true}}
                                    transition={{duration: 0.5, delay: 0.4}}
                                >
                                    <div className="absolute -left-10.25 top-1 h-4 w-4 rounded-full bg-white/30"/>

                                    <Badge
                                        className="mb-2 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70 hover:bg-white/10">
                                        2024
                                    </Badge>
                                    <h4 className="mb-1 text-xl font-semibold text-white">Abitur</h4>
                                    <p className="text-white/60">Marie-Curie-Gymnasium Bad Berka</p>
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Portrait - col-span-5 */}
                        <motion.div
                            className="col-span-5 flex items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-cyan-900/20 to-blue-900/20"
                            initial={{opacity: 0, scale: 0.9}}
                            whileInView={{opacity: 1, scale: 1}}
                            viewport={{once: true, margin: "-100px"}}
                            transition={{duration: 0.6, delay: 0.2}}
                        >
                            <img
                                src={aboutPortraitImage}
                                alt="Jan Vogt"
                                className="h-full w-full max-h-85 object-contain object-bottom"
                            />
                        </motion.div>

                        {/* Referee - col-span-4 */}
                        <motion.div
                            className="col-span-4 flex items-end justify-center overflow-visible rounded-3xl bg-linear-to-br from-purple-900/30 to-pink-900/30 p-6 pb-0"
                            style={{minHeight: '600px'}}
                            initial={{opacity: 0, x: -50}}
                            whileInView={{opacity: 1, x: 0}}
                            viewport={{once: true, margin: "-100px"}}
                            transition={{duration: 0.6, delay: 0.3}}
                        >
                            <img
                                src={refereeImage}
                                alt="Jan Vogt als Schiedsrichter"
                                className="h-full w-full object-contain object-bottom"
                            />
                        </motion.div>

                        {/* Engagement + Awards - col-span-8 */}
                        <div className="col-span-8 space-y-6">

                            {/* Engagement Card */}
                            <AnimatedCard
                                className="rounded-3xl border-white/10 bg-white/5 p-8 backdrop-blur-sm"
                                animation="slideInFromRight"
                                duration="0.6s"
                            >
                                <h3 className="mb-6 text-3xl font-bold text-white">Engagement</h3>

                                <div className="space-y-4">
                                    {/* Elite-Kader */}
                                    <AnimatedCard
                                        className="rounded-2xl border-white/5 bg-white/5 p-5 transition-all duration-300 hover:translate-x-1 hover:border-white/10 hover:bg-white/10"
                                        animation="slideInFromBottom"
                                        duration="0.5s"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="rounded-lg bg-linear-to-br from-purple-500 to-pink-600 p-2">
                                                <Users className="h-5 w-5 text-white"/>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-purple-400">Elite-Kader Thüringen</h4>
                                                <p className="text-sm text-white/60">Fußball-Schiedsrichter
                                                    Thüringenliga & Junioren-Bundesliga</p>
                                            </div>
                                        </div>
                                    </AnimatedCard>

                                    {/* Redaktionsmitglied */}
                                    <AnimatedCard
                                        className="rounded-2xl border-white/5 bg-white/5 p-5 transition-all duration-300 hover:translate-x-1 hover:border-white/10 hover:bg-white/10"
                                        animation="slideInFromBottom"
                                        duration="0.5s"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="rounded-lg bg-linear-to-br from-pink-500 to-rose-600 p-2">
                                                <BookOpen className="h-5 w-5 text-white"/>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-pink-400">Redaktionsmitglied</h4>
                                                <p className="text-sm text-white/60">"Die Wurzel" - Zeitschrift für
                                                    Mathematik</p>
                                            </div>
                                        </div>
                                    </AnimatedCard>

                                    {/* Jugendvertretung */}
                                    <AnimatedCard
                                        className="rounded-2xl border-white/5 bg-white/5 p-5 transition-all duration-300 hover:translate-x-1 hover:border-white/10 hover:bg-white/10"
                                        animation="slideInFromBottom"
                                        duration="0.5s"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="rounded-lg bg-linear-to-br from-cyan-500 to-blue-600 p-2">
                                                <GraduationCap className="h-5 w-5 text-white"/>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-cyan-400">Jugendvertretung Bad
                                                    Berka</h4>
                                                <p className="text-sm text-white/60">Stadtentwicklung &
                                                    ISEK-Workshops</p>
                                            </div>
                                        </div>
                                    </AnimatedCard>
                                </div>
                            </AnimatedCard>

                            {/* Auszeichnungen Card */}
                            <AnimatedCard
                                className="rounded-3xl border-white/10 bg-white/5 p-8 backdrop-blur-sm"
                                animation="fadeInUp"
                                duration="0.5s"
                            >
                                <h3 className="mb-4 flex items-center gap-2 text-2xl font-bold text-white">
                                    <Award className="h-5 w-5 text-yellow-500"/>
                                    Auszeichnungen
                                </h3>

                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        {year: "2024", text: "DMV-Abiturpreis Mathematik"},
                                        {year: "2024", text: "DPG-Abiturpreis Physik"},
                                        {year: "2024", text: "Pierre-de-Coubertin-Preis"},
                                        {year: "2022", text: "Marie-Curie-Preis"},
                                        {year: "2022", text: "Schiedsrichter des Jahres"},
                                        {year: "2016-24", text: "Olympia-Preise"},
                                    ].map((award, i) => (
                                        <AnimatedCard
                                            key={i}
                                            className="flex items-center gap-2 rounded-lg border-white/5 bg-white/5 px-3 py-2 transition-all duration-300 hover:scale-105 hover:border-yellow-500/30 hover:bg-yellow-500/5"
                                            animation="slideInFromBottom"
                                            duration="0.4s"
                                        >
                                            <span className="text-sm font-semibold text-yellow-500">{award.year}</span>
                                            <span className="text-xs text-white/70">{award.text}</span>
                                        </AnimatedCard>
                                    ))}
                                </div>
                            </AnimatedCard>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default About;