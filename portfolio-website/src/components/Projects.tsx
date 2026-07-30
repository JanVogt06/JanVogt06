import {useCallback, useEffect, useRef, useState} from "react"
import {ArrowRight, ArrowUpRight, Github, X} from "lucide-react"
import Reveal from "./Reveal"
import ProjectPanel from "./ProjectPanel"
import {fadeUp} from "@/lib/motion"
import {projects} from "@/lib/projects"
import {primaryLinkOf} from "@/lib/projects"
import useScrollProgress from "@/lib/useScrollProgress"
import {space} from "@/lib/space/controller"
import {scrollToPosition} from "@/lib/smoothScroll"

/**
 * Projekte als Kristallfeld.
 *
 * Die Sektion ist so hoch wie die Anzahl der Projekte in Bildschirmhoehen; darin
 * klebt ein bildschirmhoher Rahmen. Solange er klebt, laeuft der Fortschritt von
 * 0 auf 1 – und daran haengt die Kamera, die durch das Feld fliegt. Ein
 * Bildschirm Scrollen entspricht damit einem Stein.
 *
 * Die Steine selbst liegen NICHT hier, sondern in der Szene hinter der Seite
 * (Atmosphere.tsx). Das ist eine Absicht: es gibt genau einen WebGL-Kontext fuer
 * die ganze Seite, weil die Live-Vorschauen selbst welche brauchen. Hier liegt
 * nur der Text, und der gehoert ins DOM – markierbar, vorlesbar, auffindbar.
 *
 * Alles ist ohne Maus bedienbar: die Fortschrittsstriche sind Knoepfe zum
 * jeweiligen Stein, und "Projekt oeffnen" macht dasselbe wie ein Klick auf den
 * Kristall. Ein Projekt, das man nur durch Klicken auf ein 3D-Objekt erreicht,
 * waere fuer einen Teil der Besucher gar nicht erreichbar.
 */

const total = projects.length

const SectionIntro = () => (
    <div className="flex items-end justify-between gap-6">
        <div>
            <p className="mb-3 font-mono text-sm text-white/40">
                <span className="text-status">$</span> git log
                <span className="text-white/25"> --oneline projekte/</span>
            </p>
            <h2 className="text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
                Meine{" "}
                <span className="bg-gradient-to-r from-brand to-brand-deep bg-clip-text text-transparent">
                    Projekte
                </span>
            </h2>
        </div>

        <a
            href="https://github.com/JanVogt06?tab=repositories"
            target="_blank"
            rel="noopener noreferrer"
            className="group hidden shrink-0 items-center gap-2 font-mono text-sm text-white/40 transition-colors hover:text-brand sm:inline-flex"
        >
            alle Repositories
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/>
        </a>
    </div>
)

/** Der Textblock zum Stein, der gerade vor der Kamera steht. */
const FieldCaption = ({index, onOpen}: {index: number; onOpen: () => void}) => {
    const project = projects[index]
    const primary = primaryLinkOf(project.links)

    return (
        /* key am Wrapper: bei jedem Wechsel ein neues Element, dadurch laeuft die
           Einblend-Animation erneut, statt dass der Text hart umspringt. */
        <div key={project.slug} className="animate-caption max-w-lg">
            <p className="mb-4 flex items-center gap-3 font-mono text-xs text-white/35">
                <span className="text-brand">{String(index + 1).padStart(2, "0")}</span>
                <span className="h-px w-6 bg-white/15"/>
                <span>{project.hash}</span>
            </p>

            <h3 className="text-4xl font-semibold tracking-[-0.03em] text-white lg:text-5xl">
                {project.title}
            </h3>
            <p className="mt-2 text-lg text-white/45">{project.subtitle}</p>
            <p className="mt-5 leading-relaxed text-white/60">{project.description}</p>
            <p className="mt-6 font-mono text-[11px] leading-relaxed text-white/40">
                {project.tech.join("  ·  ")}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <button
                    onClick={onOpen}
                    className="group inline-flex items-center gap-2 rounded-full bg-brand/10 px-5 py-2.5 text-sm font-medium text-brand ring-1 ring-brand/30 transition-colors hover:bg-brand/20 hover:text-white"
                >
                    Projekt öffnen
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/>
                </button>

                {project.links.github && (
                    <a
                        href={project.links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
                    >
                        <Github className="h-4 w-4"/>
                        Code
                        <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/>
                    </a>
                )}
                {primary && (
                    <a
                        href={primary.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
                    >
                        {primary.label}
                        <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/>
                    </a>
                )}
            </div>
        </div>
    )
}

const ProjectField = ({
    selected,
    onSelect,
}: {
    selected: number | null
    onSelect: (index: number | null) => void
}) => {
    const sectionRef = useRef<HTMLDivElement>(null)
    const [index, setIndex] = useState(0)

    const onProgress = useCallback((progress: number) => {
        space.setFieldProgress(progress)
        setIndex(Math.round(progress * (total - 1)))
    }, [])

    useScrollProgress(sectionRef, onProgress)

    /* Das Feld nur beleben, wenn die Sektion in der Naehe ist – sonst laeuft die
       Szene fuer Steine, die niemand sieht. */
    useEffect(() => {
        const el = sectionRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            ([entry]) => space.setFieldVisible(entry.isIntersecting),
            {rootMargin: "50% 0px"},
        )
        observer.observe(el)
        return () => {
            observer.disconnect()
            space.setFieldVisible(false)
        }
    }, [])

    // Kamera auf den gewaehlten Stein richten, solange das Panel offen ist.
    useEffect(() => {
        space.setFocus(selected)
    }, [selected])

    /** Zu Stein i scrollen – die Fortschrittsstriche sind Knoepfe. */
    const goToCrystal = (target: number) => {
        const el = sectionRef.current
        if (!el) return
        const travel = el.offsetHeight - window.innerHeight
        const top = el.getBoundingClientRect().top + window.scrollY
        scrollToPosition(top + (target / (total - 1)) * travel)
    }

    return (
        <div ref={sectionRef} style={{height: `${total * 100}vh`}}>
            <div className="sticky top-0 flex h-screen flex-col overflow-hidden pt-14">
                <div className="mx-auto w-full max-w-[88rem] shrink-0 px-6 pt-8 sm:px-10 lg:px-16">
                    <SectionIntro/>
                </div>

                {/* Text links; rechts bleibt der Blick auf die Kristalle frei. */}
                <div className="mx-auto flex w-full max-w-[88rem] flex-1 items-center px-6 sm:px-10 lg:px-16">
                    <FieldCaption index={index} onOpen={() => onSelect(index)}/>
                </div>

                {/* Fortschritt: ein Knopf pro Projekt */}
                <div className="mx-auto w-full max-w-[88rem] shrink-0 px-6 pb-10 sm:px-10 lg:px-16">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-1 gap-1.5">
                            {projects.map((project, i) => (
                                <button
                                    key={project.slug}
                                    onClick={() => goToCrystal(i)}
                                    aria-label={`Zu ${project.title}`}
                                    aria-current={i === index}
                                    className="group flex-1 py-3"
                                >
                                    <span
                                        className={`block h-px w-full transition-colors duration-500 ${
                                            i <= index
                                                ? "bg-brand/70"
                                                : "bg-white/10 group-hover:bg-white/30"
                                        }`}
                                    />
                                </button>
                            ))}
                        </div>
                        <span className="shrink-0 font-mono text-xs text-white/35">
                            <span className="text-white/70">{String(index + 1).padStart(2, "0")}</span>
                            /{String(total).padStart(2, "0")}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * Das geoeffnete Projekt.
 *
 * data-native-scroll: lib/smoothScroll.ts laesst das Rad diesem Element, statt
 * die Seite darunter weiterzuschieben – sonst wandert das Kristallfeld unter dem
 * Panel weg, waehrend man darin liest.
 */
const ProjectOverlay = ({index, onClose}: {index: number; onClose: () => void}) => {
    /* Der Zustand liegt hier und nicht in Projects: das Panel wird beim
       Schliessen ausgehaengt, damit setzt sich die Vorschau von selbst zurueck –
       ohne einen Effect, der State aufraeumt. */
    const [previewActive, setPreviewActive] = useState(false)

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

    const project = projects[index]

    return (
        <div
            data-native-scroll
            role="dialog"
            aria-modal="true"
            aria-label={project.title}
            className="animate-overlay fixed inset-0 z-40 overflow-y-auto bg-page/80 backdrop-blur-xl"
        >
            <button
                onClick={onClose}
                aria-label="Projekt schließen"
                className="fixed right-6 top-20 z-10 rounded-full border border-white/10 bg-white/[0.04] p-2.5 text-white/60 transition-colors hover:border-white/25 hover:bg-white/[0.08] hover:text-white"
            >
                <X className="h-4 w-4"/>
            </button>

            <div className="min-h-screen pt-20">
                <ProjectPanel
                    project={project}
                    index={index}
                    total={total}
                    active={previewActive}
                    onActivate={() => setPreviewActive(true)}
                    onClose={() => setPreviewActive(false)}
                />
            </div>
        </div>
    )
}

/** Rueckfallebene: gestapelte Liste, wenn die Szene nicht laeuft. */
const ProjectStack = () => {
    const [activeSlug, setActiveSlug] = useState<string | null>(null)

    return (
        <div className="pb-20 pt-24">
            <div className="px-6 sm:px-10">
                <SectionIntro/>
            </div>

            {projects.map((project, i) => (
                <Reveal key={project.slug} variants={fadeUp} className="min-h-screen py-16">
                    <ProjectPanel
                        project={project}
                        index={i}
                        total={total}
                        active={activeSlug === project.slug}
                        onActivate={() => setActiveSlug(project.slug)}
                        onClose={() => setActiveSlug(null)}
                    />
                </Reveal>
            ))}

            <div className="px-6 sm:px-10">
                <a
                    href="https://github.com/JanVogt06?tab=repositories"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 font-mono text-sm text-brand transition-colors hover:text-white"
                >
                    weitere Projekte auf GitHub
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/>
                </a>
            </div>
        </div>
    )
}

const Projects = ({
    crystals,
    selected,
    onSelect,
}: {
    /** Laeuft die Kristall-Szene? Sonst gestapelte Liste. */
    crystals: boolean
    selected: number | null
    onSelect: (index: number | null) => void
}) => (
    <section id="projects" className="relative">
        {crystals ? (
            <>
                <ProjectField selected={selected} onSelect={onSelect}/>
                {selected !== null && (
                    <ProjectOverlay index={selected} onClose={() => onSelect(null)}/>
                )}
            </>
        ) : (
            <ProjectStack/>
        )}
    </section>
)

export default Projects
