import {useCallback, useEffect, useRef, useState} from "react"
import type {CSSProperties} from "react"
import {ArrowUpRight} from "lucide-react"
import Reveal from "./Reveal"
import ProjectPanel from "./ProjectPanel"
import ProjectHud from "./ProjectHud"
import Band from "./band/Band"
import type {BandHandle} from "./band/Band"
import Action, {ActionLink} from "./band/Action"
import Slate from "./band/Slate"
import {fadeUp} from "@/lib/motion"
import {projects} from "@/lib/projects"
import {useTagline} from "@/lib/github"
import useScrollProgress from "@/lib/useScrollProgress"
import {space} from "@/lib/space/controller"
import {stationPosition, trackScreens} from "@/lib/stations"
import {scrollToY} from "@/lib/smoothScroll"

const total = projects.length

const REPOSITORIES = "https://github.com/JanVogt06?tab=repositories"

const APPROACH = 0.16

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

const ProjectBand = ({
    index,
    onSelect,
    onJump,
}: {
    index: number
    onSelect: (index: number) => void
    onJump: (index: number) => void
}) => {
    const project = projects[index]
    const tagline = useTagline(project)

    return (
        <>
            <Slate>
                <h2 className="shrink-0 text-label uppercase tracking-[0.14em] text-fg-3">
                    <span className="mr-3 text-data">02</span>
                    Meine Projekte
                </h2>
            </Slate>

            <nav aria-label="Projekte" className="mt-4 flex gap-x-3.5">
                {projects.map((entry, i) => (
                    <button
                        key={entry.slug}
                        onClick={() => onJump(i)}
                        aria-current={i === index ? "true" : undefined}
                        aria-label={`Projekt ${i + 1}: ${entry.title}`}
                        className={`relative -my-3 py-3 text-data tabular-nums transition-colors duration-200 ${
                            i === index
                                ? "text-fg after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:bg-signal after:content-['']"
                                : "text-fg-3/60 hover:text-fg-2"
                        }`}
                    >
                        {String(i + 1).padStart(2, "0")}
                    </button>
                ))}
            </nav>

            <h3 className="mt-4 text-title text-fg">{project.title}</h3>

            <p className="mt-2 max-w-[46ch] text-body text-fg-2">{tagline}</p>

            <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-3">
                <Action onClick={() => onSelect(index)} icon={<ArrowUpRight className="h-3 w-3"/>}>
                    Projekt öffnen
                </Action>

                <ActionLink
                    href={REPOSITORIES}
                    target="_blank"
                    rel="noopener noreferrer"
                    icon={<ArrowUpRight className="h-3 w-3"/>}
                >
                    Alle Repositories
                </ActionLink>
            </div>
        </>
    )
}

const ProjectField = ({onSelect}: {onSelect: (index: number) => void}) => {
    const sectionRef = useRef<HTMLDivElement>(null)
    const bandRef = useRef<BandHandle>(null)
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

        // The band holds steady across the whole field; only the copy inside it
        // swaps, and it swaps at the station the camera has settled on.
        bandRef.current?.setWeight(approach)

        setIndex(Math.round(position))
    }, [])

    useScrollProgress(sectionRef, onProgress)

    const onJump = useCallback((target: number) => {
        const track = sectionRef.current
        if (!track) return
        const top = track.getBoundingClientRect().top + window.scrollY
        const travel = track.offsetHeight - window.innerHeight
        scrollToY(top + (target / Math.max(total - 1, 1)) * travel)
    }, [])

    return (
        <>
            <div
                ref={sectionRef}
                className="track"
                style={{"--screens": trackScreens(total)} as CSSProperties}
            />

            <Band ref={bandRef}>
                <ProjectBand index={index} onSelect={onSelect} onJump={onJump}/>
            </Band>
        </>
    )
}

const ProjectStack = () => {
    const [activeSlug, setActiveSlug] = useState<string | null>(null)

    return (
        <div className="px-[var(--gutter)] pb-20 pt-24">
            <Band flow className="mb-12">
                <Slate>
                    <h2 className="shrink-0 text-label uppercase tracking-[0.14em] text-fg-3">
                        <span className="mr-3 text-data">02</span>
                        Meine Projekte
                    </h2>
                </Slate>
            </Band>

            {projects.map((project, i) => (
                <Reveal key={project.slug} variants={fadeUp} className="stage-min py-16">
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

            <a
                href={REPOSITORIES}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 text-label uppercase tracking-[0.14em] text-fg-3 transition-colors duration-200 hover:text-fg"
            >
                Weitere Projekte auf GitHub
                <ArrowUpRight className="h-3 w-3"/>
            </a>
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
        <section id="projects" className="relative">
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
