import { Button } from "@/components/ui/button"
import { GraduationCap, Sparkles, Coffee } from "lucide-react"
import { motion } from "framer-motion"
import portraitImage from "@/assets/images/portrait.png"

// CSS Animation
const slideInAnimation = `
@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(150px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
`;

const Hero = () => {
    return (
        <>
            <style>{slideInAnimation}</style>
            <section className="relative min-h-screen w-full overflow-x-clip bg-linear-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e]">

                {/* Animated Background Blobs */}
                <div className="absolute -left-40 top-20 h-96 w-96 animate-pulse rounded-full bg-purple-600/20 blur-3xl" />
                <div className="absolute -right-40 bottom-20 h-96 w-96 animate-pulse rounded-full bg-pink-600/20 blur-3xl" style={{ animationDelay: '1s' }} />

                {/* Background Portrait */}
                <motion.div
                    className="absolute inset-0 z-0 flex items-end justify-center"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                >
                    <img
                        src={portraitImage}
                        alt="Jan Vogt"
                        className="h-[85vh] w-auto object-cover object-bottom"
                    />
                    <div className="absolute inset-0 bg-linear-to-r from-[#1a0b2e]/90 via-transparent to-[#1a0b2e]/90" />
                    <div className="absolute inset-0 bg-linear-to-b from-[#1a0b2e]/40 via-transparent to-[#1a0b2e]/60" />
                </motion.div>

                {/* Content Grid */}
                <div className="relative z-10 grid min-h-screen lg:grid-cols-2">

                    {/* Left Side - Mit Animation */}
                    <div className="flex items-center px-8 py-20 lg:px-16">
                        <div className="max-w-xl">

                            {/* Main Heading */}
                            <div className="mb-6 overflow-hidden">
                                <motion.h1
                                    className="text-7xl font-bold leading-none tracking-tight text-white lg:text-8xl xl:text-9xl"
                                    initial={{ x: -200, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{
                                        duration: 0.8,
                                        delay: 0.3,
                                        ease: [0.16, 1, 0.3, 1]
                                    }}
                                >
                                    Jan
                                </motion.h1>

                                <motion.div
                                    className="bg-linear-to-r from-pink-500 via-purple-500 to-cyan-400 bg-clip-text text-7xl font-bold leading-none tracking-tight text-transparent lg:text-8xl xl:text-9xl"
                                    initial={{ x: -180, opacity: 0, rotateZ: -8 }}
                                    animate={{ x: 0, opacity: 1, rotateZ: 0 }}
                                    transition={{
                                        duration: 0.9,
                                        delay: 0.5,
                                        ease: [0.16, 1, 0.3, 1]
                                    }}
                                >
                                    Vogt
                                </motion.div>
                            </div>

                            {/* Subtitle */}
                            <motion.p
                                className="mb-8 text-xl font-light text-gray-300 lg:text-2xl"
                                initial={{ x: -120, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{
                                    duration: 0.7,
                                    delay: 0.8,
                                    ease: [0.16, 1, 0.3, 1]
                                }}
                            >
                                Informatikstudent & Developer<br/>
                                <span className="text-gray-400">Bad Berka, Thüringen</span>
                            </motion.p>

                            {/* Buttons */}
                            <motion.div
                                className="flex flex-wrap gap-4"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{
                                    duration: 0.5,
                                    delay: 1,
                                    ease: [0.16, 1, 0.3, 1]
                                }}
                            >
                                <Button
                                    size="lg"
                                    className="rounded-full bg-linear-to-r from-pink-500 to-purple-600 px-8 py-6 text-lg font-semibold text-white transition-all hover:scale-105 hover:from-pink-600 hover:to-purple-700 hover:shadow-[0_0_30px_rgba(236,72,153,0.5)]"
                                >
                                    Let's Connect
                                </Button>

                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="rounded-full border-2 border-purple-400/50 bg-purple-950/50 px-8 py-6 text-lg font-semibold text-white backdrop-blur-sm transition-all hover:scale-105 hover:border-purple-400 hover:bg-purple-900/60 hover:text-white"
                                >
                                    View Projects
                                </Button>
                            </motion.div>

                        </div>
                    </div>

                    {/* Right Side - Pure CSS Animation */}
                    <div className="flex items-center justify-end px-8 py-20 lg:px-16">
                        <div className="space-y-4 max-w-sm">

                            {/* Card 1 */}
                            <div
                                className="group rounded-xl border border-purple-500/20 bg-purple-950/30 p-4 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/40 hover:bg-purple-900/30 hover:-translate-x-2 hover:scale-[1.02]"
                                style={{
                                    animation: 'slideInFromRight 0.6s linear 1.4s both'
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-linear-to-br from-cyan-500 to-blue-600 p-2 transition-transform duration-500 group-hover:rotate-360">
                                        <GraduationCap className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-cyan-400">B.Sc. Informatik</h3>
                                        <p className="text-xs text-gray-400">FSU Jena</p>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2 */}
                            <div
                                className="group rounded-xl border border-purple-500/20 bg-purple-950/30 p-4 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/40 hover:bg-purple-900/30 hover:-translate-x-2 hover:scale-[1.02]"
                                style={{
                                    animation: 'slideInFromRight 0.6s linear 1.7s both'
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-linear-to-br from-pink-500 to-purple-600 p-2 transition-transform duration-500 group-hover:rotate-360">
                                        <Sparkles className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-pink-400">Fußball-Schiedsrichter</h3>
                                        <p className="text-xs text-gray-400">Thüringen</p>
                                    </div>
                                </div>
                            </div>

                            {/* Card 3 */}
                            <div
                                className="group rounded-xl border border-purple-500/20 bg-purple-950/30 p-4 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/40 hover:bg-purple-900/30 hover:-translate-x-2 hover:scale-[1.02]"
                                style={{
                                    animation: 'slideInFromRight 0.6s linear 2.0s both'
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-linear-to-br from-purple-500 to-pink-600 p-2 transition-transform duration-500 group-hover:rotate-360">
                                        <Coffee className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-purple-400">Redaktionsmitglied</h3>
                                        <p className="text-xs text-gray-400">"Die Wurzel"</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>

                {/* Scroll Indicator */}
                <motion.div
                    className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.8 }}
                >
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-sm font-light text-white/60">Scroll</span>
                        <div className="h-12 w-6 rounded-full border-2 border-white/40 animate-pulse">
                            <div className="mx-auto mt-2 h-2 w-2 rounded-full bg-white/60 animate-bounce" />
                        </div>
                    </div>
                </motion.div>

            </section>
        </>
    );
};

export default Hero;