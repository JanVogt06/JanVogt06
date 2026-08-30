import {useEffect, useRef, useState} from "react"
import {ArrowUpRight, Github, X} from "lucide-react"
import {
    FolderGit2, Satellite, Zap, Receipt, Sword, Waves,
} from "lucide-react"
import type {LucideIcon} from "lucide-react"
import BrowserFrame from "./BrowserFrame"
import Lens from "./Lens"
import {HudLabel} from "./Hud"
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
            className="animate-hud fixed inset-0 z-40 flex justify-center overflow-hidden bg-page/65 px-4 pb-4 pt-24 backdrop-blur-[10px] sm:px-8 sm:pb-8"
        >
            <div className="glass relative flex w-full max-w-[84rem] flex-col rounded-3xl p-5 sm:p-8">
                <Lens/>
                <div className="flex shrink-0 items-start justify-between gap-6 border-b border-white/[0.06] pb-4">
                    <div className="min-w-0">
                        <HudLabel tone="text-brand/80">
                            Projekt{" "}
                            <span className="font-mono tabular-nums">
                                {String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="text-white/55">
                                {" / "}
                                {String(projects.length).padStart(2, "0")}
                            </span>
                        </HudLabel>
                        <h2 className="mt-2 truncate text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
                            {project.title}
                        </h2>
                        <p className="mt-1 truncate text-sm text-white/55">{project.subtitle}</p>
                    </div>

                    <div className="flex shrink-0 items-center gap-4">
                        <kbd className="hidden rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] font-normal text-white/55 lg:inline">
                            Esc
                        </kbd>
                        <button
                            ref={closeRef}
                            onClick={onClose}
                            aria-label="Projekt schließen"
                            className="rounded-full bg-white/[0.06] p-2.5 text-white/60 transition-colors hover:bg-white/[0.12] hover:text-white"
                        >
                            <X className="h-4 w-4"/>
                        </button>
                    </div>
                </div>

                <div className="mt-5 grid min-h-0 flex-1 gap-6 lg:grid-cols-12 lg:gap-8">
                    <div className="flex min-h-0 flex-col overflow-y-auto lg:col-span-5">
                        <p className="leading-relaxed text-white/65">{project.description}</p>

                        <HudLabel className="mt-6">Stack</HudLabel>
                        <ul className="mt-3 flex flex-wrap gap-2">
                            {project.tech.map((tech) => (
                                <li
                                    key={tech}
                                    className="rim rounded-full bg-white/[0.05] px-3 py-1.5 font-mono text-[11px] text-white/60"
                                >
                                    {tech}
                                </li>
                            ))}
                        </ul>

                        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                            {primary && (
                                <a
                                    href={primary.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="action group"
                                >
                                    {primary.label}
                                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/>
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
                                </a>
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
