import {useCallback, useEffect, useRef, useState} from "react"
import type {CSSProperties} from "react"
import {ArrowRight} from "lucide-react"
import Reveal from "./Reveal"
import ProjectPanel from "./ProjectPanel"
import ProjectHud from "./ProjectHud"
import CrystalCallouts from "./CrystalCallouts"
import {fadeUp} from "@/lib/motion"
import {projects} from "@/lib/projects"
import {useTagline} from "@/lib/github"
import useScrollProgress from "@/lib/useScrollProgress"
import {HudSectionHeader} from "./Hud"
import {space} from "@/lib/space/controller"

const total = projects.length

const SectionIntro = () => (
    <div className="flex items-end justify-between gap-6">
        <HudSectionHeader
            id="02"
            title="Meine"
            accent="Projekte"
            className="min-w-0 flex-1"
        />

        <a
            href="https://github.com/JanVogt06?tab=repositories"
            target="_blank"
            rel="noopener noreferrer"
            className="group hidden shrink-0 items-center gap-2 text-sm text-white/55 transition-colors hover:text-white sm:inline-flex"
        >
            Alle Repositories
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5"/>
        </a>
    </div>
)

/** What the leader lines carry on wide screens; portrait has no room beside the crystal. */
const CrystalCaption = ({index}: {index: number}) => {
    const project = projects[index]
    const tagline = useTagline(project)

    return (
        <div className="mb-6 lg:hidden short:mb-4 squat:mb-0 squat:min-w-0 squat:flex-1">
            <p className="text-2xl font-semibold tracking-[-0.03em] text-white short:text-xl squat:text-lg">
                {project.title}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/60 squat:mt-1 squat:line-clamp-2 squat:text-[13px]">{tagline}</p>
        </div>
    )
}

const APPROACH = 0.16

const ProjectField = ({onSelect}: {onSelect: (index: number) => void}) => {
    const sectionRef = useRef<HTMLDivElement>(null)
    const [index, setIndex] = useState(0)

    const onProgress = useCallback((raw: number) => {
        const progress = Math.min(Math.max(raw, 0), 1)
        space.setFieldProgress(progress)

        const ramp = (v: number) => Math.min(Math.max(v, 0), 1)
        space.setApproach(
            Math.min(ramp((raw + APPROACH) / APPROACH), ramp((1 + APPROACH - raw) / APPROACH)),
        )

        setIndex(Math.round(progress * (total - 1)))
    }, [])

    useScrollProgress(sectionRef, onProgress)

    return (
        <div
            ref={sectionRef}
            className="track"
            style={{"--screens": total} as CSSProperties}
        >
            <div className="stage sticky top-0 flex flex-col overflow-hidden pt-20 squat:pt-16 lg:pt-14">
                <div className="mx-auto w-full max-w-[88rem] shrink-0 px-6 pt-8 sm:px-10 lg:px-16 short:pt-4">
                    <SectionIntro/>
                </div>

                <div className="min-h-0 flex-1"/>

                <div className="mx-auto w-full max-w-[88rem] shrink-0 px-6 pb-10 sm:px-10 lg:px-16 squat:flex squat:items-end squat:justify-between squat:gap-8 squat:pb-6">
                    <CrystalCaption index={index}/>

                    <button
                        onClick={() => onSelect(index)}
                        className="action group squat:shrink-0"
                    >
                        Projekt öffnen
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5"/>
                    </button>
                </div>
            </div>
        </div>
    )
}

/** Fallback: a stacked list when the scene is not running. */
const ProjectStack = () => {
    const [activeSlug, setActiveSlug] = useState<string | null>(null)

    return (
        <div className="pb-20 pt-24">
            <div className="px-6 sm:px-10">
                <SectionIntro/>
            </div>

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

            <div className="px-6 sm:px-10">
                <a
                    href="https://github.com/JanVogt06?tab=repositories"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 text-sm font-medium text-brand transition-colors hover:text-white"
                >
                    Weitere Projekte auf GitHub
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/>
                </a>
            </div>
        </div>
    )
}

const Projects = ({
    crystals,
    selected,
    onSelect,
}: {
    /** Whether the crystal scene runs; otherwise a stacked list. */
    crystals: boolean
    selected: number | null
    onSelect: (index: number | null) => void
}) => {
    // Tell the scene which crystal is open.
    useEffect(() => {
        space.setSelected(selected)
    }, [selected])

    return (
        <section id="projects" className="relative">
            {crystals ? (
                <>
                    <CrystalCallouts/>
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
