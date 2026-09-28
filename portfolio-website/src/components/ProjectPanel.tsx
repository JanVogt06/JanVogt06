import {FolderGit2, Satellite, Zap, Receipt, Sword, Waves} from "lucide-react"
import type {LucideIcon} from "lucide-react"
import {ArrowUpRight} from "lucide-react"
import BrowserFrame from "./BrowserFrame"
import {ActionLink} from "./band/Action"
import type {Project} from "@/lib/projects"
import {primaryLinkOf} from "@/lib/projects"

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
        <div className="relative flex h-full w-full flex-col justify-center gap-8 lg:grid lg:grid-cols-12 lg:items-center lg:gap-12">

            <div className="relative lg:col-span-5">
                <p className="flex items-baseline gap-3 font-mono text-label uppercase tracking-[0.08em] text-fg-3">
                    <span className="tabular-nums text-fg">
                        {String(index + 1).padStart(2, "0")}
                        <span className="text-fg-3"> / {String(total).padStart(2, "0")}</span>
                    </span>
                    <span className="truncate">{project.subtitle}</span>
                </p>

                <h3 className="mt-4 text-heading text-fg">{project.title}</h3>

                <p className="mt-5 max-w-[52ch] text-body text-fg-2">
                    {project.description}
                </p>

                <p className="mt-5 font-mono text-data text-fg-3">{project.tech.join(" · ")}</p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                    {primary && (
                        <ActionLink
                            href={primary.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            tone="primary"
                            icon={<ArrowUpRight className="h-3.5 w-3.5"/>}
                        >
                            {primary.label}
                        </ActionLink>
                    )}
                    {project.links.github && (
                        <ActionLink
                            href={project.links.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            tone="secondary"
                            icon={<ArrowUpRight className="h-3.5 w-3.5"/>}
                        >
                            Code
                        </ActionLink>
                    )}
                </div>
            </div>

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
