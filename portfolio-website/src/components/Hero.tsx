import {ArrowDown} from "lucide-react"
import Shot from "./Shot"
import Rise from "./type/Rise"
import Cta from "./ui/Cta"
import {SHOT} from "@/lib/journey"
import {scrollToChapter} from "@/lib/smoothScroll"

const Hero = ({flow}: {flow: boolean}) => (
    <Shot at={SHOT.hero} flow={flow}>
        {/* The statement stays small and set right, in the dark of the sky
            above the haze on the horizon. */}
        <div className="absolute right-[var(--gutter)] top-24 hidden max-w-[22rem] text-right md:block">
            <p className="label text-fg-2">
                <Rise mode="fade" delay={500}>Portfolio · 2026</Rise>
            </p>
            <p className="mt-3 font-mono text-data leading-relaxed text-fg">
                <Rise mode="fade" delay={640}>
                    Ich baue Software zwischen Mathematik, Physik und Web, vom Tsunami-Solver bis zur
                    Spesenabrechnung.
                </Rise>
            </p>
        </div>

        {/* Sits in the row of the corner chrome, between the sound and the
            clock, so it never crowds the copy above it. */}
        <div
            aria-hidden="true"
            className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 hidden h-11 -translate-x-1/2 items-center gap-3 md:flex"
        >
            <span className="label text-fg-2">Scrollen</span>
            <span className="relative block h-3 w-px overflow-hidden bg-fg/20">
                <span className="animate-cue absolute inset-0 bg-fg"/>
            </span>
        </div>

        <div className="mt-auto">
            <h1 className="text-display font-medium text-fg">
                <Rise delay={150} duration={1300}>Jan Vogt</Rise>
            </h1>

            <div className="mt-6 flex flex-col gap-7 md:mt-8 md:flex-row md:items-end md:justify-between">
                <p className="max-w-[34ch] text-lead text-fg-2">
                    <Rise mode="fade" delay={420}>
                        Informatik-Student an der FSU Jena, <span className="text-fg">Werkstudent bei ZEISS</span>{" "}
                        und <span className="text-fg">Schiedsrichter</span> im NOFV.
                    </Rise>
                </p>

                <Rise mode="fade" delay={560} as="div">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        <Cta tone="solid" onClick={() => scrollToChapter("projects")} icon={<ArrowDown className="h-3.5 w-3.5"/>}>
                            Projekte ansehen
                        </Cta>
                        <Cta onClick={() => scrollToChapter("contact")}>Kontakt</Cta>
                    </div>
                </Rise>
            </div>
        </div>
    </Shot>
)

export default Hero
