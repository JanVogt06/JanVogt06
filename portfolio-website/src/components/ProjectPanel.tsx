import {Github, Globe, Gamepad2, FolderGit2, Satellite, Zap, Receipt, Sword, Waves} from "lucide-react"
import type {LucideIcon} from "lucide-react"
import {ArrowUpRight} from "lucide-react"
import BrowserFrame from "./BrowserFrame"
import type {Project} from "@/lib/projects"
import {primaryLinkOf} from "@/lib/projects"

// Maps the `icon` string from the JSON to the lucide component.
const iconMap: Record<string, LucideIcon> = {Satellite, Zap, Receipt, Sword, Waves}

const screenshots = import.meta.glob<string>(
    "../data/images/screenshots/*.{png,jpg,jpeg,webp}",
    {eager: true, import: "default"},
)

const screenshotFor = (slug: string) =>
    Object.entries(screenshots).find(([path]) => path.includes(`/${slug}.`))?.[1]

const ProjectPanel = ({
    project,
    index,
    total,
    active,
    onActivate,
    onClose,
}: {
    project: Project
    index: number
    total: number
    active: boolean
    onActivate: () => void
    onClose: () => void
}) => {
    const Icon = iconMap[project.icon] ?? FolderGit2
    const primary = primaryLinkOf(project.links)

    return (
        <div className="relative flex h-full w-full flex-col justify-center gap-8 px-6 sm:px-10 lg:grid lg:grid-cols-12 lg:items-center lg:gap-12 lg:px-16">

            {}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute -left-2 top-2 select-none font-mono text-[7rem] font-bold leading-none text-white/[0.035] sm:text-[10rem] lg:-left-4 lg:top-0 lg:text-[16rem]"
            >
                {String(index + 1).padStart(2, "0")}
            </span>

            {/* Facts */}
            <div className="relative lg:col-span-5">
                <p className="mb-5 flex items-center gap-3 font-mono text-xs tabular-nums text-white/35">
                    <span className="text-brand">{String(index + 1).padStart(2, "0")}</span>
                    <span className="h-px w-6 bg-white/15"/>
                    <span className="text-white/20">/{String(total).padStart(2, "0")}</span>
                </p>

                <h3 className="text-4xl font-semibold leading-[1.05] tracking-[-0.035em] text-white sm:text-5xl lg:text-6xl">
                    {project.title}
                </h3>
                <p className="mt-2 text-lg text-white/45">{project.subtitle}</p>

                <p className="mt-6 max-w-xl leading-relaxed text-white/60">
                    {project.description}
                </p>

                <ul className="mt-7 flex flex-wrap gap-2">
                    {project.tech.map((tech) => (
                        <li
                            key={tech}
                            className="rim relative rounded-full bg-white/[0.05] px-3 py-1.5 font-mono text-[11px] text-white/60"
                        >
                            {tech}
                        </li>
                    ))}
                </ul>

                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                    {primary && (
                        <a
                            href={primary.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="action group"
                        >
                            {primary.label === "Play Now"
                                ? <Gamepad2 className="h-4 w-4"/>
                                : <Globe className="h-4 w-4"/>}
                            {primary.label}
                            <ArrowUpRight
                                className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/>
                        </a>
                    )}
                    {project.links.github && (
                        <a
                            href={project.links.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
                        >
                            <Github className="h-4 w-4"/>
                            Code
                            <ArrowUpRight
                                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/>
                        </a>
                    )}
                </div>
            </div>

            {/* Live app */}
            <div className="relative aspect-[16/10] w-full lg:col-span-7 lg:aspect-auto lg:h-[62vh]">
                <BrowserFrame
                    url={primary?.href}
                    embeddable={project.embed !== false}
                    poster={screenshotFor(project.slug)}
                    icon={Icon}
                    note={project.previewNote}
                    active={active}
                    onActivate={onActivate}
                    onClose={onClose}
                />
            </div>
        </div>
    )
}

export default ProjectPanel
