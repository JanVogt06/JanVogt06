import {useCallback, useRef} from "react"
import {ArrowDown} from "lucide-react"
import {motion} from "framer-motion"
import {EASE} from "@/lib/motion"
import Band from "./band/Band"
import type {BandHandle} from "./band/Band"
import Action from "./band/Action"
import useScrollProgress from "@/lib/useScrollProgress"
import {scrollToElement} from "@/lib/smoothScroll"

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1)

const EXIT_RATE = 1.6
const EXIT_DRIFT_VH = 6

const step = (duration: number, delay: number) => ({
    duration: duration / 1000,
    delay: delay / 1000,
    ease: EASE,
})

const Hero = ({ready}: {ready: boolean}) => {
    const sectionRef = useRef<HTMLElement>(null)
    const bandRef = useRef<BandHandle>(null)
    const cueRef = useRef<HTMLButtonElement>(null)

    const onProgress = useCallback((raw: number) => {
        const p = clamp01(raw)
        const weight = Math.max(0, 1 - p * EXIT_RATE)

        bandRef.current?.setWeight(weight, (-p * EXIT_DRIFT_VH * window.innerHeight) / 100)

        if (cueRef.current) cueRef.current.style.opacity = String(weight)
    }, [])

    useScrollProgress(sectionRef, onProgress, "exit")

    const show = ready ? {opacity: 1, y: 0} : {opacity: 0, y: 8}

    return (
        <section ref={sectionRef} id="hero" className="stage-min relative w-full">
            <Band ref={bandRef} className="lg:flex lg:items-end lg:gap-x-16">
                <div className="min-w-0 lg:flex-1">
                <motion.p
                    className="text-label uppercase tracking-[0.14em] text-fg-3"
                    initial={{opacity: 0, y: 8}}
                    animate={show}
                    transition={step(380, 200)}
                >
                    Informatik · Entwicklung · Schiedsrichter
                </motion.p>

                <motion.h1
                    className="mt-3 text-name uppercase text-fg"
                    initial={{opacity: 0, letterSpacing: "0.34em"}}
                    animate={ready ? {opacity: 1, letterSpacing: "0.22em"} : {opacity: 0}}
                    transition={step(720, 280)}
                >
                    Jan Vogt
                </motion.h1>

                <motion.p
                    className="mt-5 max-w-[52ch] text-lead text-fg-2"
                    initial={{opacity: 0, y: 8}}
                    animate={show}
                    transition={step(460, 560)}
                >
                    Informatik-Student an der FSU Jena,
                    <span className="font-medium text-fg"> Werkstudent bei ZEISS</span> und
                    <span className="font-medium text-fg"> Schiedsrichter</span> im NOFV.
                </motion.p>

                <motion.div
                    className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-2"
                    initial={{opacity: 0, y: 8}}
                    animate={show}
                    transition={step(420, 700)}
                >
                    <Action
                        onClick={() => scrollToElement("projects")}
                        icon={<ArrowDown className="h-3 w-3"/>}
                    >
                        Projekte ansehen
                    </Action>

                    <Action
                        onClick={() => scrollToElement("contact")}
                        icon={<ArrowDown className="h-3 w-3"/>}
                    >
                        Kontakt
                    </Action>
                </motion.div>
                </div>

                <motion.p
                    className="mt-7 max-w-[46ch] text-fine text-fg-3 lg:mt-0 lg:w-[19rem] lg:shrink-0"
                    initial={{opacity: 0}}
                    animate={{opacity: ready ? 1 : 0}}
                    transition={step(380, 880)}
                >
                    Diese Seite ist mit KI-Unterstützung entstanden. Ich habe hier neue
                    Modelle getestet. Konzept, Design und jede Entscheidung sind von mir.
                </motion.p>
            </Band>

            <motion.button
                ref={cueRef}
                onClick={() => scrollToElement("about")}
                aria-label="Zum Werdegang scrollen"
                className="absolute bottom-5 right-[var(--gutter)] z-20 flex h-11 w-11 items-center justify-center"
                initial={{opacity: 0}}
                animate={{opacity: ready ? 1 : 0}}
                transition={step(360, 1100)}
            >
                <span className="sr-only">Scroll</span>
                <span
                    aria-hidden="true"
                    className="relative block h-[26px] w-px bg-white/15 after:absolute after:inset-x-0 after:top-0 after:block after:h-[7px] after:bg-fg after:content-[''] after:animate-cue"
                />
            </motion.button>
        </section>
    )
}

export default Hero
