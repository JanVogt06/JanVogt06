import {useEffect, useRef, useState} from "react"
import {ArrowUpRight, Github, X} from "lucide-react"
import {
    FolderGit2, Satellite, Zap, Receipt, Sword, Waves,
} from "lucide-react"
import type {LucideIcon} from "lucide-react"
import BrowserFrame from "./BrowserFrame"
import {projects, primaryLinkOf} from "@/lib/projects"
import {space} from "@/lib/space/controller"

/**
 * Das HUD, das ein angeklickter Kristall oeffnet.
 *
 * Bewusst als Instrumententafel gebaut und nicht als Karte: Eckklammern statt
 * Rahmen, Mono-Beschriftungen mit Doppelslash, feine Cyan-Linien, ein Datenblock
 * fuer die Technik. Das ist die einzige Stelle der Seite, an der es laut sein
 * darf – man hat sie ausdruecklich aufgerufen.
 *
 * data-native-scroll: lib/smoothScroll.ts laesst das Rad diesem Element, statt
 * die Seite darunter weiterzuschieben. Sonst dreht sich der Ring unter dem HUD
 * weg, waehrend man darin liest.
 */

const iconMap: Record<string, LucideIcon> = {Satellite, Zap, Receipt, Sword, Waves}

const screenshots = import.meta.glob<string>(
    "../data/images/screenshots/*.{png,jpg,jpeg,webp}",
    {eager: true, import: "default"},
)

const screenshotFor = (slug: string) =>
    Object.entries(screenshots).find(([path]) => path.includes(`/${slug}.`))?.[1]

/** Eckklammer – vier davon rahmen die Tafel, ohne sie einzukasteln. */
const Corner = ({at}: {at: "tl" | "tr" | "bl" | "br"}) => {
    const sides = {
        tl: "left-0 top-0 border-l border-t",
        tr: "right-0 top-0 border-r border-t",
        bl: "left-0 bottom-0 border-l border-b",
        br: "right-0 bottom-0 border-r border-b",
    }[at]
    return <span aria-hidden="true" className={`absolute h-5 w-5 border-brand/50 ${sides}`}/>
}

const ProjectHud = ({index, onClose}: {index: number; onClose: () => void}) => {
    const project = projects[index]
    const primary = primaryLinkOf(project.links)
    const Icon = iconMap[project.icon] ?? FolderGit2

    const closeRef = useRef<HTMLButtonElement>(null)
    const [previewActive, setPreviewActive] = useState(false)

    // Fokus ins HUD holen, damit Tastatur und Screenreader hier landen.
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

    /* Solange eine Live-Vorschau laeuft, haelt die Szene an. Riptide braucht
       WebGL2 und Cryptborne ist ein Unity-Build – beide wollen einen eigenen
       Kontext, und die Zahl gleichzeitiger Kontexte ist knapp. */
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
            className="animate-hud fixed inset-0 z-40 overflow-y-auto bg-page/85 backdrop-blur-xl"
        >
            <div className="mx-auto max-w-[84rem] px-6 py-24 sm:px-10">
                <div className="relative surface p-6 sm:p-10">
                    <Corner at="tl"/>
                    <Corner at="tr"/>
                    <Corner at="bl"/>
                    <Corner at="br"/>

                    {/* Kopfzeile: Kennung und Schliessen */}
                    <div className="flex items-start justify-between gap-6 border-b border-white/[0.07] pb-5">
                        <div className="min-w-0">
                            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-brand/80">
                                // Projekt {String(index + 1).padStart(2, "0")}
                                <span className="text-white/25"> · {project.hash}</span>
                            </p>
                            <h2 className="mt-3 truncate text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
                                {project.title}
                            </h2>
                            <p className="mt-1 text-white/45">{project.subtitle}</p>
                        </div>

                        <button
                            ref={closeRef}
                            onClick={onClose}
                            aria-label="Projekt schließen"
                            className="shrink-0 rounded-sm border border-white/10 p-2.5 text-white/60 transition-colors hover:border-brand/40 hover:bg-brand/10 hover:text-brand"
                        >
                            <X className="h-4 w-4"/>
                        </button>
                    </div>

                    <div className="mt-8 grid gap-10 lg:grid-cols-12">
                        {/* Datenblock */}
                        <div className="lg:col-span-5">
                            <p className="leading-relaxed text-white/65">{project.description}</p>

                            <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.28em] text-white/30">
                                // Stack
                            </p>
                            <ul className="mt-3 grid grid-cols-2 gap-px overflow-hidden border border-white/[0.07]">
                                {project.tech.map((tech) => (
                                    <li
                                        key={tech}
                                        className="bg-white/[0.02] px-3 py-2 font-mono text-[11px] text-white/60 outline outline-1 outline-white/[0.05]"
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
                                        className="group inline-flex items-center gap-2 border border-brand/30 bg-brand/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-brand transition-colors hover:bg-brand/20 hover:text-white"
                                    >
                                        {primary.label}
                                        <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/>
                                    </a>
                                )}
                                {project.links.github && (
                                    <a
                                        href={project.links.github}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-white/50 transition-colors hover:text-white"
                                    >
                                        <Github className="h-3.5 w-3.5"/>
                                        Code
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Laufende Anwendung */}
                        <div className="relative aspect-[16/10] lg:col-span-7 lg:aspect-auto lg:h-[58vh]">
                            <BrowserFrame
                                url={primary?.href}
                                embeddable={project.embed !== false}
                                poster={screenshotFor(project.slug)}
                                icon={Icon}
                                note={project.previewNote}
                                active={previewActive}
                                onActivate={() => setPreviewActive(true)}
                                onClose={() => setPreviewActive(false)}
                            />
                        </div>
                    </div>
                </div>

                <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.28em] text-white/25">
                    Esc zum Schließen
                </p>
            </div>
        </div>
    )
}

export default ProjectHud
