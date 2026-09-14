import {useEffect, useRef, useState} from "react"
import {ArrowUpRight, X} from "lucide-react"
import {
    FolderGit2, Satellite, Zap, Receipt, Sword, Waves,
} from "lucide-react"
import type {LucideIcon} from "lucide-react"
import BrowserFrame from "./BrowserFrame"
import {ActionLink} from "./band/Action"
import Slate from "./band/Slate"
import {projects, primaryLinkOf} from "@/lib/projects"
import {space} from "@/lib/space/controller"

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

    const closeRef = useRef<HTMLButtonElement>(null)
    const [previewActive, setPreviewActive] = useState(false)

    useEffect(() => {
        closeRef.current?.focus()
    }, [])

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [onClose])

    useEffect(() => {
        space.setPaused(previewActive)
        return () => space.setPaused(false)
    }, [previewActive])

    return (
        <div
            data-native-scroll
            role="dialog"
            aria-modal="true"
            aria-label={project.title}
            className="animate-hud fixed inset-0 z-40 overflow-hidden bg-page/92 backdrop-blur-[14px]"
        >
            <div className="relative mx-auto flex h-full w-full max-w-[84rem] flex-col px-[var(--gutter)] pb-5 pt-16">
                <div className="flex shrink-0 items-start justify-between gap-6 border-b border-hair pb-4">
                    <div className="min-w-0">
                        <p className="text-label uppercase tracking-[0.14em] text-fg-3">
                            Projekt{" "}
                            <span className="tabular-nums">
                                {String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="text-fg-3/70">
                                {" / "}
                                {String(projects.length).padStart(2, "0")}
                            </span>
                        </p>
                        <h2 className="mt-2 truncate text-title text-fg">{project.title}</h2>
                        <p className="mt-1 truncate text-sub text-fg-2">{project.subtitle}</p>
                    </div>

                    <div className="flex shrink-0 items-center gap-4">
                        <kbd className="hidden text-label uppercase tracking-[0.14em] text-fg-3 sm:inline">
                            Esc
                        </kbd>
                        <button
                            ref={closeRef}
                            onClick={onClose}
                            aria-label="Projekt schließen"
                            className="flex h-11 w-11 items-center justify-center rounded-full text-fg-2 transition-colors duration-200 hover:bg-white/[0.08] hover:text-fg"
                        >
                            <X className="h-4 w-4"/>
                        </button>
                    </div>
                </div>

                <div className="mt-6 grid min-h-0 flex-1 gap-6 lg:grid-cols-12 lg:gap-10">
                    <div className="flex min-h-0 flex-col overflow-y-auto lg:col-span-5">
                        <p className="max-w-[52ch] text-body text-fg-2">{project.description}</p>

                        <div className="mt-7">
                            <Slate>
                                <span className="shrink-0 text-label uppercase tracking-[0.14em] text-fg-3">
                                    Stack
                                </span>
                            </Slate>
                            <p className="mt-3 text-data text-fg-2">
                                {project.tech.join(" · ")}
                            </p>
                        </div>

                        <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3">
                            {primary && (
                                <ActionLink
                                    href={primary.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    icon={<ArrowUpRight className="h-3 w-3"/>}
                                >
                                    {primary.label}
                                </ActionLink>
                            )}
                            {project.links.github && (
                                <ActionLink
                                    href={project.links.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    icon={<ArrowUpRight className="h-3 w-3"/>}
                                >
                                    Code
                                </ActionLink>
                            )}
                        </div>
                    </div>

                    <div className="relative min-h-[14rem] lg:col-span-7 lg:min-h-0">
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
    )
}

export default ProjectHud
