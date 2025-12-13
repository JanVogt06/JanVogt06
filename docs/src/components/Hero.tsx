import {Button} from "@/components/ui/button"
import {GraduationCap, Sparkles, Coffee, ArrowDown, MapPin} from "lucide-react"
import {motion} from "framer-motion"
import portraitImage from "@/assets/images/portrait.png"

// CSS Animations
const cssAnimations = `
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
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

const cards = [
    {icon: GraduationCap, text: "B.Sc. Informatik", subtext: "FSU Jena", color: "text-cyan-400", gradient: "from-cyan-500 to-blue-600"},
    {icon: Sparkles, text: "Elite-Kader", subtext: "Schiedsrichter", color: "text-pink-400", gradient: "from-pink-500 to-purple-600"},
    {icon: Coffee, text: "Die Wurzel", subtext: "Redaktion", color: "text-purple-400", gradient: "from-purple-500 to-pink-600"},
    {icon: MapPin, text: "Bad Berka", subtext: "Thüringen", color: "text-emerald-400", gradient: "from-emerald-500 to-teal-600"},
];

const Hero = () => {
    return (
        <>
            <style>{cssAnimations}</style>
            <section className="relative min-h-screen w-full overflow-hidden bg-[#0c0515]">

                {/* Animated gradient background */}
                <div className="absolute inset-0">
                    <div className="absolute -left-1/4 top-0 h-[800px] w-[800px] rounded-full bg-purple-600/20 blur-[150px] animate-pulse"/>
                    <div className="absolute -right-1/4 bottom-0 h-[600px] w-[600px] rounded-full bg-pink-600/20 blur-[150px] animate-pulse" style={{animationDelay: '1s'}}/>
                    <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/10 blur-[100px]"/>
                </div>

                {/* Grid pattern overlay */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                        backgroundSize: '50px 50px'
                    }}
                />

                {/* Centered Portrait - Anchored to Bottom */}
                <div className="absolute inset-x-0 bottom-0 z-0 flex justify-center">
                    <motion.div
                        initial={{opacity: 0, y: 50}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 1, delay: 0.2, ease: "easeOut"}}
                    >
                        <img
                            src={portraitImage}
                            alt="Jan Vogt"
                            className="h-[50vh] w-auto object-cover object-bottom opacity-40 sm:h-[60vh] sm:opacity-50 lg:h-[85vh] lg:opacity-100"
                        />
                    </motion.div>
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl grid-cols-1 px-6 sm:px-8 lg:grid-cols-2 lg:px-12">

                    {/* Left Side: Name & CTA */}
                    <div className="flex flex-col justify-start pt-12 sm:pt-16 lg:justify-center lg:pt-0">

                        {/* Overline */}
                        <motion.p
                            className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-purple-400"
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.6, delay: 0.3}}
                        >
                            Informatik • Developer • Referee
                        </motion.p>

                        {/* Giant Name */}
                        <div className="relative">
                            <motion.h1
                                className="text-7xl font-black leading-[0.85] tracking-tighter text-white sm:text-8xl lg:text-9xl"
                                initial={{opacity: 0, x: -80}}
                                animate={{opacity: 1, x: 0}}
                                transition={{duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1]}}
                            >
                                JAN
                            </motion.h1>
                            <motion.h1
                                className="text-7xl font-black leading-[0.85] tracking-tighter sm:text-8xl lg:text-9xl"
                                initial={{opacity: 0, x: -80}}
                                animate={{opacity: 1, x: 0}}
                                transition={{duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1]}}
                            >
                                <span className="bg-linear-to-r from-purple-400 via-pink-500 to-purple-400 bg-clip-text text-transparent">
                                    VOGT
                                </span>
                            </motion.h1>

                            {/* Decorative line */}
                            <motion.div
                                className="mt-4 h-1 w-24 rounded-full bg-linear-to-r from-purple-500 to-pink-500 lg:w-32"
                                initial={{scaleX: 0, originX: 0}}
                                animate={{scaleX: 1}}
                                transition={{duration: 0.8, delay: 0.7}}
                            />
                        </div>

                        {/* Subtitle */}
                        <motion.p
                            className="mt-6 max-w-md text-lg text-white/60"
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.6, delay: 0.8}}
                        >
                            Student an der FSU Jena mit Leidenschaft für
                            <span className="text-purple-400"> Naturwissenschaften</span> und
                            <span className="text-pink-400"> Fußball</span>.
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div
                            className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4"
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.6, delay: 0.9}}
                        >
                            <Button
                                size="lg"
                                className="group rounded-full bg-linear-to-r from-purple-500 to-pink-500 px-8 py-6 text-base font-semibold text-white transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(168,85,247,0.4)]"
                                onClick={() => document.getElementById('contact')?.scrollIntoView({behavior: 'smooth'})}
                            >
                                Kontakt aufnehmen
                                <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
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

                    {/* Right Side: Floating Cards - Desktop */}
                    <div className="hidden items-center justify-end lg:flex">
                        <div className="flex flex-col gap-3">
                            {cards.map((card, i) => (
                                <div
                                    key={i}
                                    className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-all duration-300 hover:-translate-x-2 hover:scale-[1.02] hover:border-white/20 hover:bg-white/10"
                                    style={{
                                        opacity: 0,
                                        animation: `slideInFromRight 0.6s ease-out ${0.8 + i * 0.15}s forwards`
                                    }}
                                >
                                    <div className={`rounded-xl bg-linear-to-br ${card.gradient} p-2.5`}>
                                        <card.icon className="h-5 w-5 text-white"/>
                                    </div>
                                    <div>
                                        <p className={`text-sm font-semibold ${card.color}`}>{card.text}</p>
                                        <p className="text-xs text-white/50">{card.subtext}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Mobile Cards - Bottom */}
                <div className="absolute bottom-16 left-0 right-0 z-20 px-4 sm:bottom-20 sm:px-6 lg:hidden">
                    <div className="flex flex-wrap justify-center gap-2">
                        {cards.map((card, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/60 px-3 py-2 backdrop-blur-md"
                                style={{
                                    opacity: 0,
                                    animation: `fadeInUp 0.5s ease-out ${1 + i * 0.1}s forwards`
                                }}
                            >
                                <div className={`rounded-lg bg-linear-to-br ${card.gradient} p-1.5`}>
                                    <card.icon className="h-3.5 w-3.5 text-white"/>
                                </div>
                                <div>
                                    <p className={`text-xs font-semibold ${card.color}`}>{card.text}</p>
                                    <p className="text-[10px] text-white/50">{card.subtext}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2"
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{duration: 0.6, delay: 1.4}}
                >
                    <motion.div
                        className="flex flex-col items-center gap-2 text-white/30"
                        animate={{y: [0, 8, 0]}}
                        transition={{duration: 2, repeat: Infinity, ease: "easeInOut"}}
                    >
                        <span className="text-xs uppercase tracking-widest">Scroll</span>
                        <ArrowDown className="h-4 w-4"/>
                    </motion.div>
                </motion.div>

            </section>
        </>
    );
};

export default Hero;