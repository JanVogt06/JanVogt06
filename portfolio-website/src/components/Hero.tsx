import {useRef, useCallback} from "react"
import {Button} from "@/components/ui/button"
import {GraduationCap, Sparkles, Coffee, ArrowDown, MapPin, Briefcase} from "lucide-react"
import {motion} from "framer-motion"
import portraitImage from "../data/images/portrait.webp"
import NebulaWebGL from "./NebulaWebGL"
import type {NebulaHandle} from "./NebulaWebGL"
import QualitySlider from "./QualitySlider"
import {EASE, stagger, fadeUp} from "@/lib/motion"

/* Nur noch dekorative Endlos-/Hover-Effekte als CSS – alle Eintritts-
   Animationen laufen über framer-motion. */
const styles = `
@keyframes gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
}

@keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}

@keyframes pulse-glow {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.05); }
}

.animate-gradient-shift {
    animation: gradient-shift 6s ease infinite;
    background-size: 200% 200%;
}

.animate-pulse-glow {
    animation: pulse-glow 4s ease-in-out infinite;
}
`;

/* Einträge der "git status"-Liste im Terminalfenster.
   Einheitlich statt fünf verschiedener Gradients: in einem echten `git status`
   sind die Einträge auch nicht farbcodiert. */
const cards = [
    {icon: GraduationCap, text: "B.Sc. Informatik", subtext: "FSU Jena"},
    {icon: Briefcase, text: "Werkstudent", subtext: "Carl Zeiss Meditec AG."},
    {icon: Sparkles, text: "Oberliga", subtext: "Schiedsrichter"},
    {icon: Coffee, text: "Die Wurzel", subtext: "Redaktion"},
    {icon: MapPin, text: "Bad Berka", subtext: "Thüringen"},
];

const PortraitGlow = () => {
    return (
        <div className="absolute inset-x-0 bottom-0 flex justify-center overflow-hidden pointer-events-none">
            <div
                className="absolute bottom-0 h-[70vh] w-[50vw] animate-pulse-glow"
                style={{
                    background: `
                        radial-gradient(ellipse 60% 50% at 50% 100%, rgba(139, 92, 246, 0.40) 0%, transparent 50%),
                        radial-gradient(ellipse 40% 40% at 50% 100%, rgba(103, 60, 209, 0.30) 0%, transparent 40%)
                    `,
                }}
            />
        </div>
    );
};

// Terminalfenster, das den Werdegang als "git status" zeigt.
const StatusTerminal = () => (
    <motion.div
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0714]/80 shadow-2xl backdrop-blur-md"
        variants={stagger(0.08, 0.9)}
        initial="hidden"
        animate="show"
    >
        {/* Fenster-Titelleiste */}
        <motion.div variants={fadeUp}
                    className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.03] px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15"/>
            <span className="h-2.5 w-2.5 rounded-full bg-white/15"/>
            <span className="h-2.5 w-2.5 rounded-full bg-white/15"/>
            <span className="ml-2 font-mono text-xs text-white/40">jan@vogt: ~/portfolio</span>
        </motion.div>

        <div className="space-y-1 p-4 font-mono text-sm">
            <motion.p variants={fadeUp} className="text-white/40">
                <span className="text-status">$</span> git status
            </motion.p>
            <motion.p variants={fadeUp} className="pb-1.5 text-white/30">
                On branch <span className="text-brand">main</span> · 5 tracked
            </motion.p>

            {cards.map((card) => (
                <motion.div
                    key={card.text}
                    variants={fadeUp}
                    className="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.04]"
                >
                    <card.icon className="h-4 w-4 shrink-0 text-brand"/>
                    <div className="flex min-w-0 flex-1 items-baseline gap-2">
                        <p className="truncate text-sm text-white/85">{card.text}</p>
                        <p className="truncate text-xs text-white/35">{card.subtext}</p>
                    </div>
                </motion.div>
            ))}
        </div>
    </motion.div>
);

const Hero = () => {
    const nebulaRef = useRef<NebulaHandle>(null);

    const handleQualityChange = useCallback((quality: number) => {
        nebulaRef.current?.setQuality(quality);
    }, []);

    return (
        <>
            <style>{styles}</style>
            <section id="hero" className="relative min-h-screen w-full overflow-hidden">

                <div className="absolute inset-0">
                    {/* Violett lebt nur hier und im Kontakt – die "menschlichen"
                        Klammern der Seite. Endet auf --color-page, damit der
                        Übergang in den Werdegang nahtlos ist. */}
                    <div className="absolute inset-0 bg-gradient-to-b from-page via-[#160b2a] to-page"/>
                    <NebulaWebGL ref={nebulaRef} initialQuality={0.5}/>
                    <div
                        className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                            backgroundSize: '50px 50px'
                        }}
                    />
                    <div
                        className="absolute inset-0 opacity-[0.015] pointer-events-none"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                        }}
                    />
                </div>

                <PortraitGlow/>

                <div className="absolute inset-x-0 bottom-0 z-0 flex justify-center">
                    <motion.div
                        initial={{opacity: 0, y: 80, scale: 0.95}}
                        animate={{opacity: 1, y: 0, scale: 1}}
                        transition={{duration: 1, delay: 0.2, ease: EASE}}
                    >
                        <img
                            src={portraitImage}
                            alt="Jan Vogt"
                            className="h-[50vh] w-auto object-cover object-bottom opacity-40 drop-shadow-[0_0_80px_rgba(139,92,246,0.3)] sm:h-[60vh] sm:opacity-50 lg:h-[85vh] lg:opacity-100"
                        />
                    </motion.div>
                </div>

                <div
                    className="relative z-10 mx-auto grid min-h-screen max-w-[88rem] grid-cols-1 pl-6 pr-6 pt-14 sm:pl-16 sm:pr-8 lg:grid-cols-2 lg:pl-24 lg:pr-12">

                    <div className="flex flex-col justify-start pt-12 sm:pt-16 lg:justify-center lg:pt-0">

                        <motion.p
                            className="mb-4 flex items-center gap-2 font-mono text-sm text-white/55"
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.6, delay: 0.3, ease: EASE}}
                        >
                            <span className="text-status">$</span> whoami
                            <span className="text-white/35">— informatik · developer · referee</span>
                        </motion.p>

                        <div className="relative">
                            <motion.h1
                                className="text-7xl font-black leading-[0.85] tracking-tighter text-white sm:text-8xl lg:text-9xl"
                                initial={{opacity: 0, x: -80, filter: "blur(8px)"}}
                                animate={{opacity: 1, x: 0, filter: "blur(0px)"}}
                                transition={{duration: 0.8, delay: 0.4, ease: EASE}}
                            >
                                JAN
                            </motion.h1>
                            <motion.h1
                                className="text-7xl font-black leading-[0.85] tracking-tighter sm:text-8xl lg:text-9xl"
                                initial={{opacity: 0, x: -80, filter: "blur(8px)"}}
                                animate={{opacity: 1, x: 0, filter: "blur(0px)"}}
                                transition={{duration: 0.8, delay: 0.5, ease: EASE}}
                            >
                                <span
                                    className="bg-gradient-to-r from-glow via-[#c4a3ff] to-glow bg-clip-text text-transparent animate-gradient-shift">
                                    VOGT
                                </span>
                            </motion.h1>

                            <motion.div
                                className="mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-glow to-glow/10 lg:w-32"
                                initial={{scaleX: 0, originX: 0}}
                                animate={{scaleX: 1}}
                                transition={{duration: 0.8, delay: 0.7, ease: EASE}}
                            />
                        </div>

                        <motion.p
                            className="mt-6 max-w-md text-lg text-white/60"
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.6, delay: 0.8, ease: EASE}}
                        >
                            Informatik-Student an der FSU Jena,
                            <span className="text-brand"> Werkstudent bei ZEISS</span> und
                            <span className="text-white/85"> Schiedsrichter</span> im NOFV.
                        </motion.p>

                        <motion.div
                            className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4"
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.6, delay: 0.9, ease: EASE}}
                        >
                            <Button
                                size="lg"
                                className="group relative overflow-hidden rounded-full bg-glow px-8 py-6 text-base font-semibold text-white transition-all hover:scale-105 hover:bg-glow/90 hover:shadow-[0_0_40px_rgba(139,92,246,0.4)]"
                                onClick={() => document.getElementById('contact')?.scrollIntoView({behavior: 'smooth'})}
                            >
                                <span
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:animate-[shimmer_0.75s_ease]"
                                />
                                <span className="relative">Kontakt aufnehmen</span>
                                <span className="relative ml-2 transition-transform group-hover:translate-x-1">→</span>
                            </Button>

                            <Button
                                size="lg"
                                variant="outline"
                                className="rounded-full border-white/[0.12] bg-white/[0.03] px-8 py-6 text-base font-semibold text-white backdrop-blur-sm transition-all hover:scale-105 hover:border-white/30 hover:bg-white/[0.07] hover:text-white"
                                onClick={() => document.getElementById('projects')?.scrollIntoView({behavior: 'smooth'})}
                            >
                                Projekte
                            </Button>
                        </motion.div>
                    </div>

                    {/* Terminal-Statusfenster (Desktop) */}
                    <div className="hidden items-center justify-end lg:flex">
                        <StatusTerminal/>
                    </div>

                </div>

                {/* Kompakte Chips (Mobile) */}
                <motion.div
                    className="absolute bottom-24 left-0 right-0 z-20 px-4 sm:bottom-20 sm:px-6 lg:hidden"
                    variants={stagger(0.08, 1)}
                    initial="hidden"
                    animate="show"
                >
                    <div className="flex flex-wrap justify-center gap-2">
                        {cards.map((card) => (
                            <motion.div
                                key={card.text}
                                variants={fadeUp}
                                className="flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.06] px-3 py-1.5 backdrop-blur-xl"
                            >
                                <card.icon className="h-3.5 w-3.5 shrink-0 text-brand"/>
                                <p className="font-mono text-[11px] text-white/80">{card.text}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2"
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{duration: 0.6, delay: 1.4}}
                >
                    <motion.div
                        className="flex cursor-pointer flex-col items-center gap-2 text-white/30 transition-colors hover:text-white/50"
                        animate={{y: [0, 8, 0]}}
                        transition={{duration: 2, repeat: Infinity, ease: "easeInOut"}}
                        onClick={() => document.getElementById('about')?.scrollIntoView({behavior: 'smooth'})}
                    >
                        <span className="text-xs uppercase tracking-widest">Scroll</span>
                        <ArrowDown className="h-4 w-4"/>
                    </motion.div>
                </motion.div>

                <QualitySlider onChange={handleQualityChange} initialValue={0.5}/>

            </section>
        </>
    );
};

export default Hero;
