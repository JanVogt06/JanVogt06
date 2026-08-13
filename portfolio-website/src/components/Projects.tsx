import {useCallback, useEffect, useRef, useState} from "react"
import {ArrowRight} from "lucide-react"
import Reveal from "./Reveal"
import ProjectPanel from "./ProjectPanel"
import ProjectHud from "./ProjectHud"
import CrystalCallouts from "./CrystalCallouts"
import {fadeUp} from "@/lib/motion"
import {projects} from "@/lib/projects"
import useScrollProgress from "@/lib/useScrollProgress"
import {HudSectionHeader} from "./Hud"
import {space} from "@/lib/space/controller"
import {scrollToPosition} from "@/lib/smoothScroll"

/**
 * Projekte als Kristallring.
 *
 * Die Sektion ist so hoch wie die Anzahl der Projekte in Bildschirmhoehen; darin
 * klebt ein bildschirmhoher Rahmen. Solange er klebt, laeuft der Fortschritt von
 * 0 auf 1 – und daran haengt die Drehung des Rings: bei jedem ganzen Schritt
 * steht ein Stein vorne und die Kamera zieht an ihn heran.
 *
 * Die Mitte bleibt absichtlich frei. Dort stehen die Steine, und ihre
 * Beschriftung haengt als Fahne an ihnen (CrystalCallouts). Hier liegt nur, was
 * kein Kristall sein kann: die Abschnittsueberschrift oben und eine Steuerzeile
 * unten.
 *
 * Alles ist ohne Maus bedienbar: die Fortschrittsstriche sind Knoepfe zum
 * jeweiligen Stein, "Projekt oeffnen" tut dasselbe wie ein Klick auf den
 * Kristall. Ein Projekt, das man nur durch Klicken auf ein 3D-Objekt erreicht,
 * waere fuer einen Teil der Besucher gar nicht erreichbar.
 */

const total = projects.length

const SectionIntro = () => (
    <div className="flex items-end justify-between gap-6">
        <HudSectionHeader
            id="02"
            title="Meine"
            accent="Projekte"
            className="min-w-0 flex-1"
        />

        <a
            href="https://github.com/JanVogt06?tab=repositories"
            target="_blank"
            rel="noopener noreferrer"
            className="group hidden shrink-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/35 transition-colors hover:text-brand sm:inline-flex"
        >
            alle Repositories
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"/>
        </a>
    </div>
)

/**
 * Ueber welchen Anteil der Strecke der Ring heranzieht, bevor die Sektion oben
 * ankommt. 0.16 von vier Bildschirmhoehen sind gut eine halbe Fensterhoehe
 * Vorlauf.
 */
const APPROACH = 0.16

const ProjectField = ({onSelect}: {onSelect: (index: number) => void}) => {
    const sectionRef = useRef<HTMLDivElement>(null)
    const [index, setIndex] = useState(0)

    /**
     * Ein Signal fuer beides.
     *
     * `raw` ist nicht begrenzt: vor der Sektion negativ, danach groesser als 1.
     * Daraus kommt das Heranziehen des Rings (approach) – und zwar durchgehend
     * beim Scrollen. Vorher hing das an einem IntersectionObserver; dessen
     * Rueckruf kann verspaetet oder gar nicht kommen, und dann zieht der Ring nie
     * heran und die Beschriftung erscheint nie. Ein Effekt, der sich beim
     * Heranscrollen aufbaut, gehoert an das Scrollen selbst.
     */
    const onProgress = useCallback((raw: number) => {
        const progress = Math.min(Math.max(raw, 0), 1)
        space.setFieldProgress(progress)
        space.setApproach(Math.min(Math.max((raw + APPROACH) / APPROACH, 0), 1))
        setIndex(Math.round(progress * (total - 1)))
    }, [])

    useScrollProgress(sectionRef, onProgress)

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

                {/* Die Mitte gehoert den Kristallen. */}
                <div className="min-h-0 flex-1"/>

                <div className="mx-auto w-full max-w-[88rem] shrink-0 px-6 pb-10 sm:px-10 lg:px-16">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                        <button
                            onClick={() => onSelect(index)}
                            className="group inline-flex items-center gap-2 border border-brand/30 bg-brand/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-brand transition-colors hover:bg-brand/20 hover:text-white"
                        >
                            Projekt öffnen
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"/>
                        </button>

                        <div className="flex min-w-[12rem] flex-1 items-center gap-4">
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
                                <span className="text-white/70">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                /{String(total).padStart(2, "0")}
                            </span>
                        </div>
                    </div>
                </div>
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
}) => {
    // Der Szene sagen, welcher Stein offen ist – sie zieht dann noch etwas heran.
    useEffect(() => {
        space.setSelected(selected)
    }, [selected])

    return (
        <section id="projects" className="relative">
            {crystals ? (
                <>
                    <CrystalCallouts/>
                    <ProjectField onSelect={onSelect}/>
                    {selected !== null && (
                        <ProjectHud index={selected} onClose={() => onSelect(null)}/>
                    )}
                </>
            ) : (
                <ProjectStack/>
            )}
        </section>
    )
}

export default Projects
