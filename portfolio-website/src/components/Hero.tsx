import {useEffect, useState} from "react"
import {ArrowDown} from "lucide-react"
import Shot from "./Shot"
import Rise from "./type/Rise"
import Letters from "./type/Letters"
import Cta from "./ui/Cta"
import {SHOT} from "@/lib/journey"
import {scrollToChapter} from "@/lib/smoothScroll"
import {sea} from "@/lib/sea/controller"
import useMediaQuery from "@/lib/useMediaQuery"

/** A hint that the sea answers the pointer, until the visitor has found out. */
const StirHint = () => {
    const [stirred, setStirred] = useState(sea.isStirred)
    const touch = useMediaQuery("(pointer: coarse)")
    useEffect(() => sea.subscribeStirred(() => setStirred(true)), [])

    return (
        <div
            aria-hidden="true"
            className={`absolute right-[var(--gutter)] top-24 flex items-center gap-3 transition-opacity duration-700 ${stirred ? "opacity-0" : "opacity-100"}`}
        >
            <span className="label text-fg-2">
                <Rise mode="fade" delay={1400}>
                    {touch ? "Tipp aufs Wasser" : "Fahr mit der Maus übers Wasser"}
                </Rise>
            </span>
            <span className="relative block h-5 w-5">
                <span className="animate-ring absolute inset-0 rounded-full border border-fg/70"/>
                <span className="animate-ring absolute inset-0 rounded-full border border-fg/70 [animation-delay:0.8s]"/>
                <span className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg"/>
            </span>
        </div>
    )
}

const Hero = ({flow}: {flow: boolean}) => (
    <Shot at={SHOT.hero} flow={flow}>
        {!flow && <StirHint/>}
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
                <Letters text="Jan Vogt" delay={200} stagger={45} duration={1300}/>
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
