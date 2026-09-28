import {useId, useRef, useState} from "react"
import {ArrowUpRight, X} from "lucide-react"
import {
    FolderGit2, Satellite, Zap, Receipt, Sword, Waves,
} from "lucide-react"
import type {LucideIcon} from "lucide-react"
import BrowserFrame from "./BrowserFrame"
import {ActionLink} from "./band/Action"
import {projects, primaryLinkOf} from "@/lib/projects"
import useDialog from "@/lib/useDialog"

const iconMap: Record<string, LucideIcon> = {Satellite, Zap, Receipt, Sword, Waves}

const screenshots = import.meta.glob<string>(
    "../data/images/screenshots/*.{png,jpg,jpeg,webp}",
    {eager: true, import: "default"},
)

const screenshotFor = (slug: string) =>
    Object.entries(screenshots).find(([path]) => path.includes(`/${slug}.`))?.[1]

const ProjectHud = ({index, onClose}: {index: number; onClose: () => void}) => {
    const project = projects[index]
    const primary = primaryLinkOf(project.links)
    const Icon = iconMap[project.icon] ?? FolderGit2
    const titleId = useId()

    const rootRef = useRef<HTMLDivElement>(null)
    const closeRef = useRef<HTMLButtonElement>(null)
    const [previewActive, setPreviewActive] = useState(false)

    useDialog(rootRef, onClose, closeRef)

    return (
        <div
            ref={rootRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="animate-hud fixed inset-0 z-[60] bg-page"
        >
            <div className="mx-auto flex h-full w-full max-w-[84rem] flex-col px-[var(--gutter)] pt-[env(safe-area-inset-top)]">
                <div className="flex h-14 shrink-0 items-center justify-between gap-6">
                    <p className="min-w-0 truncate font-mono text-label uppercase tracking-[0.08em] text-fg-3">
                        <span className="tabular-nums text-fg">
                            Projekt {String(index + 1).padStart(2, "0")}
                        </span>
                        <span> / {String(projects.length).padStart(2, "0")}</span>
                    </p>

                    <button
                        ref={closeRef}
                        onClick={onClose}
                        aria-label="Projekt schließen"
                        className="-mr-3 flex h-11 shrink-0 items-center gap-2.5 px-3 font-mono text-label uppercase tracking-[0.08em] text-fg transition-colors duration-200 hover:text-signal"
                    >
                        <span className="hidden sm:inline">Esc</span>
                        <X className="h-4 w-4"/>
                    </button>
                </div>

                {/* On a phone the whole sheet is one scroller, links first; from
                    lg the copy and the preview share the frame side by side. */}
                <div
                    data-native-scroll
                    className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))] lg:overflow-visible"
                >
                    <div className="grid gap-8 pt-2 lg:h-full lg:grid-cols-12 lg:gap-12">
                        <div className="lg:col-span-5 lg:flex lg:flex-col lg:justify-end">
                            <p className="font-mono text-label uppercase tracking-[0.08em] text-fg-3">
                                {project.subtitle}
                            </p>
                            <h2 id={titleId} className="mt-3 text-heading text-fg">
                                {project.title}
                            </h2>

                            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1">
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

                            <p className="mt-6 max-w-[52ch] text-body text-fg-2">{project.description}</p>

                            <p className="mt-5 font-mono text-data text-fg-3">
                                {project.tech.join(" · ")}
                            </p>
                        </div>

                        <div className="relative aspect-[16/10] lg:col-span-7 lg:aspect-auto lg:h-full lg:min-h-0">
                            <BrowserFrame
                                url={primary?.href}
                                embeddable={project.embed !== false}
                                poster={screenshotFor(project.slug)}
                                icon={Icon}
                                note={project.previewNote}
                                eager
                                active={previewActive}
                                onActivate={() => setPreviewActive(true)}
                                onClose={() => setPreviewActive(false)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProjectHud
