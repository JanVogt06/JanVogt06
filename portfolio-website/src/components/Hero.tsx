import {useRef, useCallback} from "react"
import {Button} from "@/components/ui/button"
import {Card} from "@/components/ui/card"
import {GraduationCap, Sparkles, Coffee, ArrowDown, MapPin} from "lucide-react"
import {motion} from "framer-motion"
import portraitImage from "@/assets/images/portrait.png"
import NebulaWebGL from "./NebulaWebGL"
import type {NebulaHandle} from "./NebulaWebGL"
import QualitySlider from "./QualitySlider"

const styles = `
@keyframes gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
}

@keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}

@keyframes slideInFromRight {
    from { opacity: 0; transform: translateX(50px); }
    to { opacity: 1; transform: translateX(0); }
}

@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
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

.liquid-glass-card {
    position: relative;
}

.liquid-glass-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.3) 0%,
        transparent 50%
    );
    pointer-events: none;
}
`;

const cards = [
    {
        icon: GraduationCap,
        text: "B.Sc. Informatik",
        subtext: "FSU Jena",
        color: "text-cyan-400",
        gradient: "from-cyan-500 to-blue-600"
    },
    {
        icon: Sparkles,
        text: "Elite-Kader",
        subtext: "Schiedsrichter",
        color: "text-pink-400",
        gradient: "from-pink-500 to-purple-600"
    },
    {
        icon: Coffee,
        text: "Die Wurzel",
        subtext: "Redaktion",
        color: "text-purple-400",
        gradient: "from-purple-500 to-pink-600"
    },
    {
        icon: MapPin,
        text: "Bad Berka",
        subtext: "Thüringen",
        color: "text-emerald-400",
        gradient: "from-emerald-500 to-teal-600"
    },
];

const PortraitGlow = () => {
    return (
        <div className="absolute inset-x-0 bottom-0 flex justify-center overflow-hidden pointer-events-none">
            <div
                className="absolute bottom-0 h-[70vh] w-[50vw] animate-pulse-glow"
                style={{
                    background: `
                        radial-gradient(ellipse 60% 50% at 50% 100%, rgba(139, 92, 246, 0.4) 0%, transparent 50%),
                        radial-gradient(ellipse 40% 40% at 50% 100%, rgba(236, 72, 153, 0.3) 0%, transparent 40%)
                    `,
                }}
            />
        </div>
    );
};

const Hero = () => {
    const nebulaRef = useRef<NebulaHandle>(null);

    const handleQualityChange = useCallback((quality: number) => {
        nebulaRef.current?.setQuality(quality);
    }, []);

    return (
        <>
            <style>{styles}</style>
            <section className="relative min-h-screen w-full overflow-hidden bg-[#0c0515]">

                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0c0515] via-[#1a0a2e] to-[#0c0515]"/>
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
                        transition={{duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1]}}
                    >
                        <img
                            src={portraitImage}
                            alt="Jan Vogt"
                            className="h-[50vh] w-auto object-cover object-bottom opacity-40 drop-shadow-[0_0_80px_rgba(139,92,246,0.3)] sm:h-[60vh] sm:opacity-50 lg:h-[85vh] lg:opacity-100"
                        />
                    </motion.div>
                </div>

                <div
                    className="relative z-10 mx-auto grid min-h-screen max-w-7xl grid-cols-1 px-6 sm:px-8 lg:grid-cols-2 lg:px-12">

                    <div className="flex flex-col justify-start pt-12 sm:pt-16 lg:justify-center lg:pt-0">

                        <motion.p
                            className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-purple-400"
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.6, delay: 0.3}}
                        >
                            Informatik • Developer • Referee
                        </motion.p>

                        <div className="relative">
                            <motion.h1
                                className="text-7xl font-black leading-[0.85] tracking-tighter text-white sm:text-8xl lg:text-9xl"
                                initial={{opacity: 0, x: -80, filter: "blur(8px)"}}
                                animate={{opacity: 1, x: 0, filter: "blur(0px)"}}
                                transition={{duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1]}}
                            >
                                JAN
                            </motion.h1>
                            <motion.h1
                                className="text-7xl font-black leading-[0.85] tracking-tighter sm:text-8xl lg:text-9xl"
                                initial={{opacity: 0, x: -80, filter: "blur(8px)"}}
                                animate={{opacity: 1, x: 0, filter: "blur(0px)"}}
                                transition={{duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1]}}
                            >
                                <span
                                    className="bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 bg-clip-text text-transparent animate-gradient-shift">
                                    VOGT
                                </span>
                            </motion.h1>

                            <motion.div
                                className="mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 lg:w-32"
                                initial={{scaleX: 0, originX: 0}}
                                animate={{scaleX: 1}}
                                transition={{duration: 0.8, delay: 0.7}}
                            />
                        </div>

                        <motion.p
                            className="mt-6 max-w-md text-lg text-white/60"
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.6, delay: 0.8}}
                        >
                            Student an der FSU Jena mit Leidenschaft für
                            <span className="text-purple-400"> Naturwissenschaften</span> und
                            <span className="text-pink-400"> Sport</span>.
                        </motion.p>

                        <motion.div
                            className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4"
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.6, delay: 0.9}}
                        >
                            <Button
                                size="lg"
                                className="group relative overflow-hidden rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-6 text-base font-semibold text-white transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(168,85,247,0.4)]"
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
                                className="rounded-full border-white/20 bg-white/5 px-8 py-6 text-base font-semibold text-white backdrop-blur-sm transition-all hover:scale-105 hover:border-white/40 hover:bg-white/10 hover:text-white"
                                onClick={() => document.getElementById('projects')?.scrollIntoView({behavior: 'smooth'})}
                            >
                                Projekte
                            </Button>
                        </motion.div>
                    </div>

                    <div className="hidden items-center justify-end lg:flex">
                        <div className="flex flex-col gap-3">
                            {cards.map((card, i) => (
                                <Card
                                    key={i}
                                    className="group flex items-center gap-3 rounded-2xl border-white/10 bg-white/5 p-4 backdrop-blur-md transition-all duration-300 hover:-translate-x-2 hover:scale-[1.02] hover:border-white/20 hover:bg-white/10"
                                    style={{
                                        opacity: 0,
                                        animation: `slideInFromRight 0.6s ease-out ${0.8 + i * 0.15}s forwards`
                                    }}
                                >
                                    <div className={`rounded-xl bg-gradient-to-br ${card.gradient} p-2.5`}>
                                        <card.icon className="h-5 w-5 text-white"/>
                                    </div>
                                    <div>
                                        <p className={`text-sm font-semibold ${card.color}`}>{card.text}</p>
                                        <p className="text-xs text-white/50 text-center">{card.subtext}</p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>

                </div>

                <div className="absolute bottom-24 left-0 right-0 z-20 px-4 sm:bottom-20 sm:px-6 lg:hidden">
                    <div className="flex flex-wrap justify-center gap-2">
                        {cards.map((card, i) => (
                            <Card
                                key={i}
                                className="liquid-glass-card flex items-center gap-2 rounded-xl border-white/20 px-3 py-2"
                                style={{
                                    opacity: 0,
                                    animation: `fadeInUp 0.5s ease-out ${1 + i * 0.1}s forwards`,
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.1) 100%)',
                                    backdropFilter: 'blur(24px) saturate(1.8) brightness(1.05)',
                                    WebkitBackdropFilter: 'blur(24px) saturate(1.8) brightness(1.05)',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(255,255,255,0.1)',
                                }}
                            >
                                <div className={`rounded-lg bg-gradient-to-br ${card.gradient} p-1.5`}>
                                    <card.icon className="h-3.5 w-3.5 text-white"/>
                                </div>
                                <div>
                                    <p className={`text-xs font-semibold ${card.color}`}>{card.text}</p>
                                    <p className="text-[10px] text-white/50">{card.subtext}</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

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

                {/* Quality Slider - now positioned top-right inside the component */}
                <QualitySlider onChange={handleQualityChange} initialValue={0.5}/>

            </section>
        </>
    );
};

export default Hero;