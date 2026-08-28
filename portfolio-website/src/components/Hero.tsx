import {useCallback, useRef} from "react"
import {ArrowDown, ArrowRight} from "lucide-react"
import {motion} from "framer-motion"
import {EASE} from "@/lib/motion"
import useScrollProgress from "@/lib/useScrollProgress"
import {scrollToElement} from "@/lib/smoothScroll"

const Hero = () => {
    const sectionRef = useRef<HTMLElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)

    const onProgress = useCallback((raw: number) => {
        // Above the hero, raw is < 0.
        const p = Math.min(Math.max(raw, 0), 1)
        if (contentRef.current) {
            contentRef.current.style.transform = `translate3d(0, ${(-p * 18).toFixed(2)}vh, 0)`
            contentRef.current.style.opacity = String(Math.max(0, 1 - p * 1.6))
        }
    }, [])

    useScrollProgress(sectionRef, onProgress, "exit")

    return (
        <section ref={sectionRef} id="hero" className="relative min-h-screen w-full overflow-hidden">

            <div
                ref={contentRef}
                className="relative z-10 mx-auto flex min-h-screen max-w-[88rem] flex-col justify-center px-6 pt-14 will-change-transform sm:px-8 lg:px-12"
            >
                <motion.p
                    className="mb-7 text-sm font-medium text-white/55"
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{duration: 0.5, delay: 0.3, ease: EASE}}
                >
                    Informatik · Entwicklung · Schiedsrichter
                </motion.p>

                {}
                <h1 className="font-black uppercase leading-[0.82] tracking-[-0.045em]">
                    {["Jan", "Vogt"].map((word, i) => (
                        <span key={word} className="block overflow-hidden">
                            <motion.span
                                className={`block bg-clip-text text-transparent text-[clamp(4.5rem,15vw,13rem)] ${
                                    i === 1
                                        ? "bg-gradient-to-br from-brand via-[#f8cda2] to-brand-deep"
                                        : "bg-gradient-to-b from-white via-white/95 to-white/55"
                                }`}
                                initial={{y: "110%"}}
                                animate={{y: 0}}
                                transition={{duration: 1, delay: 0.35 + i * 0.1, ease: EASE}}
                            >
                                {word}
                            </motion.span>
                        </span>
                    ))}
                </h1>

                <motion.p
                    className="mt-8 max-w-md text-lg leading-relaxed text-white/60"
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.6, delay: 0.7, ease: EASE}}
                >
                    Informatik-Student an der FSU Jena,
                    <span className="text-white/85"> Werkstudent bei ZEISS</span> und
                    <span className="text-white/85"> Schiedsrichter</span> im NOFV.
                </motion.p>

                <motion.div
                    className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4"
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.6, delay: 0.85, ease: EASE}}
                >
                    <button
                        onClick={() => scrollToElement("projects")}
                        className="action group"
                    >
                        Projekte ansehen
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5"/>
                    </button>

                    <button
                        onClick={() => scrollToElement("contact")}
                        className="action-quiet rim"
                    >
                        Kontakt
                    </button>
                </motion.div>
            </div>

            {/* Scroll hint */}
            <motion.button
                onClick={() => scrollToElement("about")}
                className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 text-white/50 transition-colors hover:text-white/60"
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                transition={{duration: 0.6, delay: 1.2}}
                aria-label="Zum Werdegang scrollen"
            >
                <motion.span
                    className="flex flex-col items-center gap-2"
                    animate={{y: [0, 7, 0]}}
                    transition={{duration: 2.2, repeat: Infinity, ease: "easeInOut"}}
                >
                    <span className="text-[11px] tracking-[0.02em]">Scroll</span>
                    <ArrowDown className="h-4 w-4"/>
                </motion.span>
            </motion.button>

            {/* Sits above the scroll hint on narrow screens. */}
            <motion.p
                className="absolute bottom-24 right-6 z-20 max-w-[16rem] text-right text-[11px] leading-relaxed text-white/50 sm:bottom-8 sm:right-8 lg:right-12"
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                transition={{duration: 0.6, delay: 1.4}}
            >
                Diese Seite ist mit KI-Unterstützung entstanden — ich habe hier neue
                Modelle getestet. Konzept, Design und jede Entscheidung sind von mir.
            </motion.p>
        </section>
    )
}


export default Hero
