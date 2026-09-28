import {useCallback, useEffect, useRef, useState} from "react"
import type {CSSProperties, ReactNode, RefObject} from "react"
import {ArrowLeft, ArrowRight, ArrowUpRight} from "lucide-react"
import Reveal from "./Reveal"
import ProjectPanel from "./ProjectPanel"
import ProjectHud from "./ProjectHud"
import Band from "./band/Band"
import type {BandHandle} from "./band/Band"
import Action, {ActionLink} from "./band/Action"
import Slate from "./band/Slate"
import Scramble from "./type/Scramble"
import Rise from "./type/Rise"
import {fadeUp} from "@/lib/motion"
import {projects} from "@/lib/projects"
import useScrollProgress, {smallViewport} from "@/lib/useScrollProgress"
import {space} from "@/lib/space/controller"
import {stationPosition, stationProgress, trackScreens, trackTravel} from "@/lib/stations"
import {bandWeight, smooth} from "@/lib/band"
import Stops, {ChapterCue} from "./Stops"
import {scrollToY} from "@/lib/smoothScroll"

const total = projects.length

const REPOSITORIES = "https://github.com/JanVogt06?tab=repositories"

const APPROACH = 0.08

// The frame arrives once the camera has mostly turned onto the ring.
const FRAME_FROM = 0.45

const STOPS = projects.map((_, i) => stationProgress(i, total))

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

const StepButton = ({
    onClick,
    disabled,
    label,
    children,
}: {
    onClick: () => void
    disabled: boolean
    label: string
    children: ReactNode
}) => (
    <button
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className="group flex h-11 items-center px-1.5 transition-opacity duration-200 disabled:opacity-30"
    >
        <span aria-hidden="true" className="transition-transform duration-200 group-hover:-translate-x-[2px] group-disabled:translate-x-0">[</span>
        <span className="px-2 text-fg transition-colors duration-200 group-hover:text-signal group-disabled:text-fg">{children}</span>
        <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-[2px] group-disabled:translate-x-0">]</span>
    </button>
)

const ProjectCopy = ({index, animated}: {index: number; animated: boolean}) => {
    const project = projects[index]

    const details = (
        <>
            <p className="mt-3 line-clamp-2 max-w-[56ch] text-pretty text-body text-fg-2 sm:line-clamp-1">
                {project.tagline}
            </p>
            <p className="mt-3 truncate font-mono text-data text-fg-3">
                {project.tech.join(" · ")}
            </p>
        </>
    )

    return (
        <>
            <p className="flex items-baseline gap-3 font-mono text-label uppercase tracking-[0.08em] text-fg-3">
                <span className="shrink-0 whitespace-nowrap tabular-nums text-fg">
                    {String(index + 1).padStart(2, "0")}
                    <span className="text-fg-3"> / {String(total).padStart(2, "0")}</span>
                </span>
                {animated ? (
                    <Scramble text={project.subtitle} className="truncate" delay={60}/>
                ) : (
                    <span className="truncate">{project.subtitle}</span>
                )}
            </p>

            <h3 className="mt-3 text-heading text-fg">
                {animated ? <Rise delay={60}>{project.title}</Rise> : project.title}
            </h3>

            {animated ? (
                <Rise mode="fade" delay={200} as="div">
                    {details}
                </Rise>
            ) : (
                details
            )}
        </>
    )
}

const ProjectBand = ({
    index,
    copyRef,
    onSelect,
    onJump,
}: {
    index: number
    copyRef?: RefObject<HTMLDivElement | null>
    onSelect: (index: number) => void
    onJump: (index: number) => void
}) => {

    return (
        <>
            <Slate>
                <h2 className="shrink-0">
                    <Scramble text="02 Projekte"/>
                </h2>
            </Slate>

            <nav aria-label="Projekte" className="-mx-1 mt-1 flex">
                {projects.map((entry, i) => (
                    <button
                        key={entry.slug}
                        onClick={() => onJump(i)}
                        aria-current={i === index ? "true" : undefined}
                        aria-label={`Projekt ${i + 1}: ${entry.title}`}
                        className="group flex h-11 flex-1 items-center px-1"
                    >
                        <span
                            className={`block h-px w-full transition-colors duration-300 ${
                                i === index
                                    ? "bg-signal"
                                    : i < index
                                      ? "bg-white/40 group-hover:bg-white/60"
                                      : "bg-white/15 group-hover:bg-white/40"
                            }`}
                        />
                    </button>
                ))}
            </nav>

            {/* The band's top is what frames the crystal above it, so its
                height must not change from one project to the next: every
                copy is laid out unseen in the same cell as the current one. */}
            <div ref={copyRef} className="grid">
                <div key={`copy-${projects[index].slug}`} className="col-start-1 row-start-1">
                    <ProjectCopy index={index} animated/>
                </div>
                {projects.map((entry, i) => (
                    <div
                        key={`size-${entry.slug}`}
                        aria-hidden="true"
                        className="invisible col-start-1 row-start-1"
                    >
                        <ProjectCopy index={i} animated={false}/>
                    </div>
                ))}
            </div>

            <div className="mt-6 flex items-center gap-3 short:mt-4">
                <Action
                    tone="primary"
                    onClick={() => onSelect(index)}
                    icon={<ArrowUpRight className="h-3.5 w-3.5"/>}
                >
                    Projekt öffnen
                </Action>

                {/* The display toggle lives on a wrapper: a class on the link
                    itself would race the link's own inline-flex. */}
                <span className="ml-3 hidden sm:contents">
                    <ActionLink
                        href={REPOSITORIES}
                        target="_blank"
                        rel="noopener noreferrer"
                        tone="quiet"
                        icon={<ArrowUpRight className="h-3 w-3"/>}
                    >
                        Alle Repositories
                    </ActionLink>
                </span>

                <div className="ml-auto flex items-center font-mono text-label text-fg-3">
                    <StepButton
                        onClick={() => onJump(index - 1)}
                        disabled={index === 0}
                        label="Vorheriges Projekt"
                    >
                        <ArrowLeft className="h-3.5 w-3.5"/>
                    </StepButton>
                    <StepButton
                        onClick={() => onJump(index + 1)}
                        disabled={index === total - 1}
                        label="Nächstes Projekt"
                    >
                        <ArrowRight className="h-3.5 w-3.5"/>
                    </StepButton>
                </div>
            </div>
        </>
    )
}

const ProjectField = ({onSelect}: {onSelect: (index: number) => void}) => {
    const sectionRef = useRef<HTMLDivElement>(null)
    const bandRef = useRef<BandHandle>(null)
    const copyRef = useRef<HTMLDivElement>(null)
    const [index, setIndex] = useState(0)

    const onProgress = useCallback((raw: number) => {
        const progress = clamp01(raw)

        const position = stationPosition(progress, total)
        const span = Math.max(total - 1, 1)

        space.setFieldProgress(position / span)
        space.setFieldScroll(progress)

        const approach = Math.min(
            clamp01((raw + APPROACH) / APPROACH),
            clamp01((1 + APPROACH - raw) / APPROACH),
        )
        space.setApproach(approach)

        // The frame holds steady across the whole field so the scene's rail
        // never moves; only the copy inside it dissolves between crystals,
        // and it swaps while it is invisible.
        bandRef.current?.setWeight(smooth((approach - FRAME_FROM) / (1 - FRAME_FROM)))

        const nearest = Math.round(position)
        if (copyRef.current) copyRef.current.style.opacity = String(bandWeight(position - nearest))
        setIndex(nearest)
    }, [])

    useScrollProgress(sectionRef, onProgress)

    const onJump = useCallback((wanted: number) => {
        const track = sectionRef.current
        if (!track) return
        const target = Math.min(Math.max(wanted, 0), total - 1)
        const top = track.getBoundingClientRect().top + window.scrollY
        const travel = track.offsetHeight - smallViewport()
        scrollToY(top + stationProgress(target, total) * travel)
    }, [])

    return (
        <>
            <div
                ref={sectionRef}
                className="track relative"
                style={{"--screens": trackScreens(total)} as CSSProperties}
            >
                <Stops at={STOPS} travel={trackTravel(total)} entry={0}/>
            </div>

            <Band ref={bandRef}>
                <ProjectBand index={index} copyRef={copyRef} onSelect={onSelect} onJump={onJump}/>
            </Band>
        </>
    )
}

const ProjectStack = () => {
    const [activeSlug, setActiveSlug] = useState<string | null>(null)

    return (
        <div className="mx-auto max-w-[80rem] px-[var(--gutter)] pb-24 pt-24 md:pt-32">
            <Band flow className="mb-4">
                <Slate>
                    <h2 className="shrink-0">
                        <Scramble text="02 Projekte"/>
                    </h2>
                </Slate>
            </Band>

            {projects.map((project, i) => (
                <Reveal key={project.slug} variants={fadeUp} className="border-b border-hair py-16 md:py-24">
                    <ProjectPanel
                        project={project}
                        index={i}
                        total={total}
                        active={activeSlug === project.slug}
                        onActivate={() => setActiveSlug(project.slug)}
                        onClose={() => setActiveSlug(null)}
                    />
                </Reveal>
            ))}

            <div className="pt-12">
                <ActionLink
                    href={REPOSITORIES}
                    target="_blank"
                    rel="noopener noreferrer"
                    tone="secondary"
                    icon={<ArrowUpRight className="h-3.5 w-3.5"/>}
                >
                    Weitere Projekte auf GitHub
                </ActionLink>
            </div>
        </div>
    )
}

const Projects = ({
    crystals,
    selected,
    onSelect,
}: {
    crystals: boolean
    selected: number | null
    onSelect: (index: number | null) => void
}) => {
    useEffect(() => {
        space.setSelected(selected)
    }, [selected])

    return (
        <section id="projects" className={crystals ? "track-join relative" : "relative"}>
            {!crystals && <ChapterCue chapter="projects"/>}
            {crystals ? (
                <>
                    <ProjectField onSelect={onSelect}/>
                    {selected !== null && (
                        <ProjectHud index={selected} onClose={() => onSelect(null)}/>
                    )}
                </>
            ) : (
                <ProjectStack/>
            )}
        </section>
    )
}

export default Projects
