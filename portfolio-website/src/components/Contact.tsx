import {useCallback, useRef, useState} from "react"
import type {CSSProperties} from "react"
import {AnimatePresence} from "framer-motion"
import {ArrowUpRight} from "lucide-react"
import Band from "./band/Band"
import type {BandHandle} from "./band/Band"
import Action, {ActionLink} from "./band/Action"
import Slate from "./band/Slate"
import Scramble from "./type/Scramble"
import Rise from "./type/Rise"
import Credits from "./Credits"
import Stops, {ChapterCue} from "./Stops"
import {EMAIL, channels} from "@/lib/channels"
import useScrollProgress from "@/lib/useScrollProgress"
import {space} from "@/lib/space/controller"
import {clamp01, smooth} from "@/lib/band"

const SCREENS = 2.1
const TRAVEL = SCREENS - 1

// The band waits for the camera to pull off the last crystal, then arrives
// as it turns to the galaxy.
const ARRIVE_FROM = 0.14
const ARRIVE_SPAN = 0.24

const YEAR = new Date().getFullYear()

/** Kept short on purpose: the galaxy is the finale, the band only frames it. */
const ContactBody = ({onCredits}: {onCredits: () => void}) => (
    <div className="md:grid md:grid-cols-12 md:items-end md:gap-x-12">
        <div className="md:col-span-7">
            <Slate>
                <h2 className="shrink-0">
                    <Scramble text="03 Kontakt"/>
                </h2>
            </Slate>

            <p className="mt-4 text-heading text-fg short:mt-3">
                <Rise delay={60}>Sag Hallo.</Rise>
            </p>

            {/* A landscape phone has no room for the lead; the heading and the
                address carry the section there. */}
            <Rise mode="fade" delay={180} as="div" className="squat:hidden">
                <p className="mt-3 max-w-[40ch] text-lead text-fg-2">
                    Interessiert an einer Zusammenarbeit oder einfach nur ein Gespräch über
                    Technologie?
                </p>
            </Rise>
        </div>

        <Rise mode="fade" delay={300} as="div" className="mt-6 squat:mt-3 md:col-span-5 md:mt-0">
            <p className="flex items-center gap-2.5 font-mono text-label uppercase tracking-[0.08em] text-status">
                <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-status animate-pulse-soft"
                />
                Offen für Gespräche
            </p>

            <a
                href={`mailto:${EMAIL}`}
                className="group mt-3 inline-flex min-h-11 items-center gap-2.5 border-b border-white/20 text-title text-fg transition-colors duration-200 hover:border-signal hover:text-signal"
            >
                {EMAIL}
                <ArrowUpRight className="h-4 w-4 shrink-0 text-fg-3 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-signal"/>
            </a>

            <div className="mt-3 flex flex-wrap items-center gap-x-4">
                {channels
                    .filter((channel) => channel.kind === "social")
                    .map((channel) => (
                        <ActionLink
                            key={channel.label}
                            href={channel.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            tone="secondary"
                            icon={<ArrowUpRight className="h-3 w-3"/>}
                        >
                            {channel.label}
                        </ActionLink>
                    ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 border-t border-hair pt-3 squat:mt-2 font-mono text-label uppercase tracking-[0.08em] text-fg-3">
                <span>© {YEAR} Jan Vogt</span>
                <Action onClick={onCredits}>Credits</Action>
            </div>
        </Rise>
    </div>
)

const ContactFinale = ({onCredits}: {onCredits: () => void}) => {
    const sectionRef = useRef<HTMLDivElement>(null)
    const bandRef = useRef<BandHandle>(null)

    const onProgress = useCallback((raw: number) => {
        const progress = clamp01(raw)
        space.setArrivalProgress(progress)

        const arrived = smooth((progress - ARRIVE_FROM) / ARRIVE_SPAN)
        bandRef.current?.setWeight(arrived, (1 - arrived) * 16)
    }, [])

    useScrollProgress(sectionRef, onProgress)

    return (
        <>
            <div
                ref={sectionRef}
                className="track relative"
                style={{"--screens": SCREENS} as CSSProperties}
            >
                <Stops at={[1]} travel={TRAVEL} entry={0}/>
                <ChapterCue chapter="contact" at={ARRIVE_FROM * TRAVEL + 0.5}/>
            </div>

            <Band ref={bandRef}>
                <ContactBody onCredits={onCredits}/>
            </Band>
        </>
    )
}

const Contact = ({scene}: {scene: boolean}) => {
    const [credits, setCredits] = useState(false)
    const openCredits = useCallback(() => setCredits(true), [])
    const closeCredits = useCallback(() => setCredits(false), [])

    return (
        <section id="contact" className={scene ? "track-join relative" : "relative"}>
            {scene ? (
                <ContactFinale onCredits={openCredits}/>
            ) : (
                <div className="mx-auto max-w-[72rem] px-[var(--gutter)] pb-[max(3rem,calc(env(safe-area-inset-bottom)+2rem))] pt-24 md:pt-32">
                    <ChapterCue chapter="contact"/>
                    <Band flow>
                        <ContactBody onCredits={openCredits}/>
                    </Band>
                </div>
            )}

            <AnimatePresence>
                {credits && <Credits key="credits" onClose={closeCredits}/>}
            </AnimatePresence>
        </section>
    )
}

export default Contact
