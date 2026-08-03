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
 *
 * HOEHE
 *
 * Die Tafel ist immer so hoch wie das Fenster, nie hoeher – man soll darin nicht
 * scrollen muessen. Vorher war sie es: fester Innenabstand von 6 rem oben und
 * unten plus eine Vorschau von 58vh plus Kopfzeile und Datenblock ergaben
 * zwangslaeufig mehr als eine Bildschirmhoehe.
 *
 * Jetzt rechnet sie sich aus dem verfuegbaren Platz: der Rahmen ist ein
 * flex-Container mit max-h-full, Kopf- und Fusszeile sind shrink-0, und der
 * Mittelteil bekommt min-h-0 flex-1. Ohne min-h-0 waere er nicht kleiner als
 * sein Inhalt – das ist die Voreinstellung bei flex und der haeufigste Grund,
 * warum solche Layouts doch ueberlaufen. Die Vorschau bekommt h-full statt einer
 * vh-Hoehe und fuellt damit genau, was uebrig ist.
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
            /* items-stretch (Voreinstellung, deshalb kein items-center): die Tafel
               fuellt die Hoehe, die der Innenabstand uebrig laesst. Mit
               items-center war sie nur so hoch wie ihr Inhalt – auf 950 px
               Fensterhoehe blieben 455 px leer und die Vorschau war 311 px hoch. */
            className="animate-hud fixed inset-0 z-40 flex justify-center overflow-hidden bg-page/85 px-4 pb-4 pt-20 backdrop-blur-xl sm:px-8 sm:pb-8"
        >
            <div className="surface relative flex w-full max-w-[84rem] flex-col p-5 sm:p-8">
                <Corner at="tl"/>
                <Corner at="tr"/>
                <Corner at="bl"/>
                <Corner at="br"/>

                {/* Kopfzeile: Kennung und Schliessen */}
                <div className="flex shrink-0 items-start justify-between gap-6 border-b border-white/[0.07] pb-4">
                    <div className="min-w-0">
                        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-brand/80">
                            // Projekt {String(index + 1).padStart(2, "0")}
                            <span className="text-white/25"> · {project.hash}</span>
                        </p>
                        <h2 className="mt-2 truncate text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
                            {project.title}
                        </h2>
                        <p className="mt-1 truncate text-sm text-white/45">{project.subtitle}</p>
                    </div>

                    <div className="flex shrink-0 items-center gap-4">
                        <span className="hidden font-mono text-[10px] uppercase tracking-[0.28em] text-white/25 lg:inline">
                            Esc
                        </span>
                        <button
                            ref={closeRef}
                            onClick={onClose}
                            aria-label="Projekt schließen"
                            className="border border-white/10 p-2.5 text-white/60 transition-colors hover:border-brand/40 hover:bg-brand/10 hover:text-brand"
                        >
                            <X className="h-4 w-4"/>
                        </button>
                    </div>
                </div>

                {/* min-h-0: sonst waere der Mittelteil nie kleiner als sein Inhalt */}
                <div className="mt-5 grid min-h-0 flex-1 gap-6 lg:grid-cols-12 lg:gap-8">
                    {/* Datenblock. Auf kurzen Fenstern darf NUR diese Spalte
                        scrollen – die Tafel selbst bleibt bildschirmhoch. */}
                    <div className="flex min-h-0 flex-col overflow-y-auto lg:col-span-5">
                        <p className="leading-relaxed text-white/65">{project.description}</p>

                        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.28em] text-white/30">
                            // Stack
                        </p>
                        <ul className="mt-3 grid grid-cols-2 border border-white/[0.07]">
                            {project.tech.map((tech) => (
                                <li
                                    key={tech}
                                    className="border-b border-r border-white/[0.05] bg-white/[0.02] px-3 py-2 font-mono text-[11px] text-white/60"
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

                    {/* Laufende Anwendung – fuellt genau, was uebrig bleibt. */}
                    <div className="relative min-h-[14rem] lg:col-span-7 lg:min-h-0">
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
        </div>
    )
}

export default ProjectHud
