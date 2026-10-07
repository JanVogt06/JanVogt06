import {ArrowUpRight} from "lucide-react"
import Shot from "./Shot"
import Rise from "./type/Rise"
import Letters from "./type/Letters"
import Cta, {CtaLink} from "./ui/Cta"
import {Eyebrow} from "./About"
import {REPOSITORIES} from "./Projects"
import {EMAIL, channels} from "@/lib/channels"
import {SHOT} from "@/lib/journey"

const YEAR = new Date().getFullYear()

/** Kept short: the night sea is the finale, the copy only frames it. */
const Contact = ({flow, onCredits}: {flow: boolean; onCredits: () => void}) => (
    <Shot at={SHOT.contact} flow={flow}>
        <div className="mt-auto w-full">
            <Eyebrow index="03" label="Kontakt"/>

            <p className="mt-4 text-display font-medium text-fg">
                <Letters text="Sag Hallo." delay={60} stagger={32} duration={1100}/>
            </p>

            <div className="mt-8 grid gap-8 md:grid-cols-12 md:items-end md:gap-12 short:mt-5">
                <Rise mode="fade" delay={220} as="div" className="md:col-span-6">
                    <p className="max-w-[36ch] text-lead text-fg-2">
                        Für eine Zusammenarbeit, eine Frage oder einfach ein Gespräch über Technologie.
                    </p>
                    <a
                        href={`mailto:${EMAIL}`}
                        className="group mt-5 inline-flex min-h-11 items-center gap-3 border-b border-fg/30 pb-1 text-title text-fg transition-colors duration-300 hover:border-fg"
                    >
                        {EMAIL}
                        <ArrowUpRight className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"/>
                    </a>
                </Rise>

                <Rise mode="fade" delay={340} as="div" className="md:col-span-6 md:justify-self-end">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                        {channels
                            .filter((channel) => channel.kind === "social")
                            .map((channel) => (
                                <CtaLink key={channel.label} href={channel.href} external>
                                    {channel.label}
                                </CtaLink>
                            ))}
                        <CtaLink href={REPOSITORIES} external>
                            Repositories
                        </CtaLink>
                    </div>
                    <div className="label mt-3 flex items-center gap-6 text-fg-3 md:justify-end">
                        <span>© {YEAR} Jan Vogt</span>
                        <Cta onClick={onCredits} className="text-fg-3 hover:text-fg">
                            Credits
                        </Cta>
                    </div>
                </Rise>
            </div>
        </div>
    </Shot>
)

export default Contact
