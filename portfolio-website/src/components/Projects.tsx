import type {ReactNode} from "react"
import {ArrowLeft, ArrowRight} from "lucide-react"
import Shot from "./Shot"
import Rise from "./type/Rise"
import Cta, {CtaLink} from "./ui/Cta"
import {Eyebrow} from "./About"
import {projects, primaryLinkOf} from "@/lib/projects"
import type {Project} from "@/lib/projects"
import {SHOT, scrollYForShot} from "@/lib/journey"
import {screenshotFor} from "@/lib/screenshots"
import {scrollToY} from "@/lib/smoothScroll"

const total = projects.length

export const REPOSITORIES = "https://github.com/JanVogt06?tab=repositories"

const pad = (n: number) => String(n).padStart(2, "0")

const Step = ({label, disabled, onClick, children}: {label: string; disabled: boolean; onClick: () => void; children: ReactNode}) => (
    <button
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-hair text-fg transition-colors duration-300 hover:border-fg/60 disabled:opacity-30 disabled:hover:border-hair"
    >
        {children}
    </button>
)

const ProjectCopy = ({
    project,
    index,
    flow,
    onOpen,
}: {
    project: Project
    index: number
    flow: boolean
    onOpen: () => void
}) => {
    const primary = primaryLinkOf(project.links)
    const jump = (to: number) => scrollToY(scrollYForShot(SHOT.projects[to]))

    return (
        <div className="mt-auto flex w-full items-end justify-between gap-10">
            <div className="w-full max-w-[34rem]">
                <Eyebrow index="02" label="Projekte" count={`${pad(index + 1)} / ${pad(total)}`}/>

                <h2 className="mt-4 text-heading font-medium text-fg">
                    <Rise delay={60}>{project.title}</Rise>
                </h2>

                <Rise mode="fade" delay={180} as="div">
                    <p className="mt-3 text-lead text-fg">{project.subtitle}</p>
                    <p className="mt-3 line-clamp-3 max-w-[48ch] text-body text-fg-2 short:line-clamp-2 squat:hidden">
                        {project.description}
                    </p>
                    <p className="mt-4 font-mono text-data text-fg-3 short:mt-3">{project.tech.join("  ·  ")}</p>
                </Rise>

                <Rise mode="fade" delay={300} as="div">
                    <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-1 short:mt-4">
                        {!flow && (
                            <Cta tone="solid" onClick={onOpen}>
                                Projekt ansehen
                            </Cta>
                        )}
                        {primary && (
                            <CtaLink href={primary.href} external tone={flow ? "solid" : "line"}>
                                {primary.label}
                            </CtaLink>
                        )}
                        {project.links.github && (
                            <CtaLink href={project.links.github} external>
                                Code
                            </CtaLink>
                        )}
                    </div>
                </Rise>
            </div>

            {!flow && (
                <div className="hidden shrink-0 items-center gap-2 lg:flex">
                    <Step label="Vorheriges Projekt" disabled={index === 0} onClick={() => jump(index - 1)}>
                        <ArrowLeft className="h-4 w-4"/>
                    </Step>
                    <Step label="Nächstes Projekt" disabled={index === total - 1} onClick={() => jump(index + 1)}>
                        <ArrowRight className="h-4 w-4"/>
                    </Step>
                </div>
            )}
        </div>
    )
}

const Projects = ({flow, onOpen}: {flow: boolean; onOpen: (index: number) => void}) => (
    <>
        {projects.map((project, i) => (
            <Shot
                key={project.slug}
                at={SHOT.projects[i]}
                flow={flow}
                media={
                    <img
                        src={screenshotFor(project.slug)}
                        alt={`Screenshot von ${project.title}`}
                        loading="lazy"
                        className="w-full border border-hair object-cover"
                    />
                }
            >
                <ProjectCopy project={project} index={i} flow={flow} onOpen={() => onOpen(i)}/>
            </Shot>
        ))}
    </>
)

export default Projects
