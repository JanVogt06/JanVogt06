import {useCallback, useRef} from "react"
import {ArrowDown} from "lucide-react"
import {motion} from "framer-motion"
import {EASE} from "@/lib/motion"
import Band from "./band/Band"
import type {BandHandle} from "./band/Band"
import Action from "./band/Action"
import Scramble from "./type/Scramble"
import Rise from "./type/Rise"
import useScrollProgress from "@/lib/useScrollProgress"
import {scrollToChapter} from "@/lib/smoothScroll"
import {space} from "@/lib/space/controller"
import {bump, clamp01} from "@/lib/band"
import Interlude from "./Interlude"
import type {InterludeHandle} from "./Interlude"
import Stops, {ChapterCue} from "./Stops"

// The hero lets go almost at once so the first chapter title can take the
// frame while the camera dollies in towards the first planet.
const EXIT_DELAY = 0.08
const EXIT_RATE = 2.6
const EXIT_DRIFT_VH = 6

const TITLE: [number, number, number, number] = [0.24, 0.36, 0.76, 0.88]

const Hero = ({ready, scene}: {ready: boolean; scene: boolean}) => {
    const sectionRef = useRef<HTMLElement>(null)
    const bandRef = useRef<BandHandle>(null)
    const cueRef = useRef<HTMLDivElement>(null)
    const titleRef = useRef<InterludeHandle>(null)

    const onProgress = useCallback((raw: number) => {
        const p = clamp01(raw)
        const weight = 1 - clamp01((p - EXIT_DELAY) * EXIT_RATE)

        bandRef.current?.setWeight(weight, (-p * EXIT_DRIFT_VH * window.innerHeight) / 100)
        titleRef.current?.setWeight(bump(p, ...TITLE), (0.56 - p) * 0.05 * window.innerHeight)
        space.setHeroProgress(p)

        if (cueRef.current) cueRef.current.style.opacity = String(Math.max(0, 1 - p * 4))
    }, [])

    useScrollProgress(sectionRef, onProgress, "exit")

    return (
        <section
            ref={sectionRef}
            id="hero"
            className={
                scene
                    ? "stage-min relative w-full"
                    : "stage-min relative flex w-full flex-col justify-end px-[var(--gutter)] pb-16 pt-24"
            }
        >
            <ChapterCue chapter="hero"/>
            {scene && (
                <>
                    <Stops at={[0, 0.56]} travel={1} entry={0}/>
                    <ChapterCue chapter="about" at={0.3 + 0.5}/>
                    <Interlude
                        ref={titleRef}
                        index="01"
                        title="Über mich"
                        note="Drei Stationen · Mars bis Saturn"
                    />
                </>
            )}
            <Band
                ref={bandRef}
                armed={ready}
                flow={!scene}
                className={scene ? "" : "mx-auto w-full max-w-[72rem]"}
            >
                <p className="font-mono text-label uppercase tracking-[0.08em] text-fg-3">
                    <Scramble text="50°55′ N · 11°35′ E — Jena" delay={150}/>
                </p>

                <h1 className="mt-4 text-display font-normal text-fg">
                    <Rise delay={120} duration={1100}>Jan Vogt</Rise>
                </h1>

                <div className="mt-6 flex flex-col gap-6 lg:mt-7">
                    <Rise mode="fade" delay={380} as="div">
                        <p className="max-w-[40ch] text-lead text-fg-2">
                            Informatik-Student an der FSU Jena,{" "}
                            <span className="whitespace-nowrap text-fg">Werkstudent bei ZEISS</span> und{" "}
                            <span className="text-fg">Schiedsrichter</span> im NOFV.
                        </p>
                    </Rise>

                    <Rise mode="fade" delay={520} as="div">
                        <div className="flex flex-wrap items-center gap-3">
                            <Action
                                tone="primary"
                                onClick={() => scrollToChapter("projects")}
                                icon={<ArrowDown className="h-3.5 w-3.5"/>}
                            >
                                Projekte ansehen
                            </Action>
                            <Action tone="secondary" onClick={() => scrollToChapter("contact")}>
                                Kontakt
                            </Action>
                        </div>
                    </Rise>
                </div>
            </Band>

            <motion.div
                ref={cueRef}
                aria-hidden="true"
                className="pointer-events-none fixed right-[var(--gutter)] top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center gap-3 md:flex"
                initial={{opacity: 0}}
                animate={{opacity: ready ? 1 : 0}}
                transition={{duration: 0.4, delay: 1.1, ease: EASE}}
            >
                <span className="font-mono text-label uppercase tracking-[0.08em] text-fg-3 [writing-mode:vertical-rl]">
                    Scrollen
                </span>
                <span className="relative block h-10 w-px bg-white/15 after:absolute after:inset-x-0 after:top-0 after:block after:h-[9px] after:bg-fg after:content-[''] after:animate-cue"/>
            </motion.div>
        </section>
    )
}

export default Hero
