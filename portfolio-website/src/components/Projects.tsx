import {useEffect, useRef, useState} from "react"
import {ArrowDown} from "lucide-react"
import Shot from "./Shot"
import Rise from "./type/Rise"
import Cta, {CtaLink} from "./ui/Cta"
import {Eyebrow} from "./About"
import {projects, primaryLinkOf} from "@/lib/projects"
import type {Project} from "@/lib/projects"
import {SHOT, journey, presence, scrollYForShot} from "@/lib/journey"
import {screenshotFor} from "@/lib/screenshots"
import {scrollToY} from "@/lib/smoothScroll"

const total = projects.length

export const REPOSITORIES = "https://github.com/JanVogt06?tab=repositories"

const pad = (n: number) => String(n).padStart(2, "0")

const jump = (to: number) => scrollToY(scrollYForShot(SHOT.projects[Math.min(Math.max(to, 0), total - 1)]))

/** The shot that opens the work, looking down the row of screens. */
const Opening = () => (
    <Shot at={SHOT.work} flow={false}>
        <div className="mt-auto w-full">
            <p className="label text-fg-2">Kapitel 02</p>
            <h2 className="mt-4 text-display font-medium text-fg">
                <Rise delay={80} duration={1200}>Projekte</Rise>
            </h2>
            <div className="mt-6 flex flex-col gap-6 md:mt-8 md:flex-row md:items-end md:justify-between">
                <p className="max-w-[38ch] text-lead text-fg-2">
                    <Rise mode="fade" delay={320}>
                        Fünf Dinge, die ich gebaut habe: von der Tsunami-Simulation im Browser bis zum
                        Dungeon-Crawler.
                    </Rise>
                </p>
                <Rise mode="fade" delay={460} as="div">
                    <Cta onClick={() => jump(0)} icon={<ArrowDown className="h-3.5 w-3.5"/>}>
                        Zum ersten Projekt
                    </Cta>
                </Rise>
            </div>
        </div>
    </Shot>
)

/**
 * The list of the work, held on the right edge for as long as the camera is
 * among the screens. It stays put while the copy below changes, so moving
 * from one project to the next reads as browsing a catalogue.
 */
const Index = () => {
    const rootRef = useRef<HTMLElement>(null)
    const [active, setActive] = useState(0)

    useEffect(
        () =>
            journey.subscribe((shot) => {
                const root = rootRef.current
                if (!root) return
                const first = SHOT.projects[0]
                const last = SHOT.projects[total - 1]
                const weight = shot < first ? presence(shot, first) : shot > last ? presence(shot, last) : 1
                root.style.opacity = String(weight)
                root.style.visibility = weight > 0.02 ? "visible" : "hidden"
                setActive(Math.min(Math.max(Math.round(shot - first), 0), total - 1))
            }),
        [],
    )

    return (
        <nav
            ref={rootRef}
            aria-label="Projekte"
            data-overlay
            className="ink fixed right-[var(--gutter)] top-1/2 z-20 hidden -translate-y-1/2 lg:block"
            style={{opacity: 0, visibility: "hidden"}}
        >
            <ol className="flex flex-col items-end">
                {projects.map((project, j) => {
                    const current = j === active
                    return (
                        <li key={project.slug}>
                            <button
                                onClick={() => jump(j)}
                                aria-current={current ? "true" : undefined}
                                className={`label group flex h-10 items-center gap-3 transition-colors duration-300 ${
                                    current ? "text-fg" : "text-fg-3 hover:text-fg"
                                }`}
                            >
                                <span>{project.title}</span>
                                <span className="tabular-nums opacity-70">{pad(j + 1)}</span>
                                <span
                                    aria-hidden="true"
                                    className={`h-px transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                                        current ? "w-8 bg-fg" : "w-3 bg-fg/40 group-hover:w-5"
                                    }`}
                                />
                            </button>
                        </li>
                    )
                })}
            </ol>
        </nav>
    )
}

const Actions = ({project, flow, onOpen}: {project: Project; flow: boolean; onOpen: () => void}) => {
    const primary = primaryLinkOf(project.links)
    return (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
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
    )
}

/** The screen holds the middle of the frame, so the copy lies beneath it
 *  in two columns: what it is on the left, what it does on the right. */
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
}) => (
    <div className="mt-auto grid w-full gap-x-12 gap-y-4 lg:grid-cols-12 lg:items-end lg:pr-56 xl:pr-64">
        <div className="lg:col-span-6">
            <Eyebrow index="02" label="Projekte" count={`${pad(index + 1)} / ${pad(total)}`}/>
            <h2 className="mt-4 text-heading font-medium text-fg short:mt-3">
                <Rise delay={60}>{project.title}</Rise>
            </h2>
            <Rise mode="fade" delay={160} as="div">
                <p className="mt-3 text-lead text-fg">{project.subtitle}</p>
            </Rise>
            <Rise mode="fade" delay={320} as="div" className="mt-6 hidden lg:block short:mt-4">
                <Actions project={project} flow={flow} onOpen={onOpen}/>
            </Rise>
        </div>

        <Rise mode="fade" delay={240} as="div" className="lg:col-span-6 lg:pb-1.5">
            <p className="line-clamp-3 max-w-[52ch] text-body text-fg-2 lg:line-clamp-4 short:line-clamp-2 squat:hidden">
                {project.description}
            </p>
            <p className="mt-3 font-mono text-data text-fg-3">{project.tech.join("  ·  ")}</p>
        </Rise>

        <Rise mode="fade" delay={320} as="div" className="mt-2 lg:hidden">
            <Actions project={project} flow={flow} onOpen={onOpen}/>
        </Rise>
    </div>
)

const Projects = ({flow, onOpen}: {flow: boolean; onOpen: (index: number) => void}) => (
    <>
        {!flow && <Opening/>}
        {!flow && <Index/>}
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
                        className="w-full rounded-[10px] border border-hair object-cover"
                    />
                }
            >
                <ProjectCopy project={project} index={i} flow={flow} onOpen={() => onOpen(i)}/>
            </Shot>
        ))}
    </>
)

export default Projects
