import {useId, useRef, useState} from "react"
import {X} from "lucide-react"
import {FolderGit2, Satellite, Zap, Receipt, Waves} from "lucide-react"
import type {LucideIcon} from "lucide-react"
import BrowserFrame from "./BrowserFrame"
import {CtaLink} from "./ui/Cta"
import {projects, primaryLinkOf} from "@/lib/projects"
import {screenshotFor} from "@/lib/screenshots"
import useDialog from "@/lib/useDialog"

const iconMap: Record<string, LucideIcon> = {Satellite, Zap, Receipt, Waves}

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
            className="animate-hud fixed inset-0 z-[60] bg-page/95 backdrop-blur-sm"
        >
            <div className="mx-auto flex h-full w-full max-w-[88rem] flex-col px-[var(--gutter)] pt-[env(safe-area-inset-top)]">
                <div className="flex h-16 shrink-0 items-center justify-between gap-6">
                    <p className="label min-w-0 truncate text-fg-3">
                        <span className="tabular-nums text-fg">Projekt {String(index + 1).padStart(2, "0")}</span>
                        <span> / {String(projects.length).padStart(2, "0")}</span>
                    </p>

                    <button
                        ref={closeRef}
                        onClick={onClose}
                        aria-label="Projekt schließen"
                        className="label -mr-3 flex h-11 shrink-0 items-center gap-2.5 px-3 text-fg transition-opacity duration-200 hover:opacity-70"
                    >
                        <span className="hidden sm:inline">Schließen</span>
                        <X className="h-4 w-4"/>
                    </button>
                </div>

                {/* On a phone the whole sheet is one scroller, links first; from
                    lg the copy and the preview share the frame side by side. */}
                <div
                    data-native-scroll
                    className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))] lg:overflow-visible"
                >
                    <div className="grid gap-8 pt-2 lg:h-full lg:grid-cols-12 lg:gap-14">
                        <div className="lg:col-span-4 lg:flex lg:flex-col lg:justify-end lg:pb-2">
                            <h2 id={titleId} className="text-heading font-medium text-fg">
                                {project.title}
                            </h2>
                            <p className="mt-3 text-lead text-fg">{project.subtitle}</p>
                            <p className="mt-5 max-w-[52ch] text-body text-fg-2">{project.description}</p>
                            <p className="mt-5 font-mono text-data text-fg-3">{project.tech.join("  ·  ")}</p>

                            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-1">
                                {primary && (
                                    <CtaLink href={primary.href} external tone="solid">
                                        {primary.label}
                                    </CtaLink>
                                )}
                                {project.links.github && (
                                    <CtaLink href={project.links.github} external>
                                        Code auf GitHub
                                    </CtaLink>
                                )}
                            </div>
                        </div>

                        <div className="relative w-full lg:col-span-8 lg:max-w-[calc((100svh-9rem)*1.6)] lg:self-center lg:justify-self-end">
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
