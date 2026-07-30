import {useCallback, useRef, useState} from "react"
import {ArrowRight} from "lucide-react"
import Reveal from "./Reveal"
import ProjectPanel from "./ProjectPanel"
import {fadeUp} from "@/lib/motion"
import {projects} from "@/lib/projects"
import useMediaQuery from "@/lib/useMediaQuery"
import useScrollProgress from "@/lib/useScrollProgress"

/**
 * Projekte als gepinnte Schiene: die Sektion bleibt stehen, die Projekte ziehen
 * seitwaerts durch, waehrend man vertikal scrollt.
 *
 * Die Rechnung ist eine Zeile. Die Sektion ist so hoch wie die Anzahl der
 * Projekte in Bildschirmhoehen; darin klebt ein bildschirmhoher Rahmen. Damit
 * bleibt eine Pinn-Strecke von (n-1) Bildschirmhoehen – und genau (n-1)
 * Bildschirmbreiten muss die Schiene wandern. Vertikal und horizontal stehen
 * also 1:1, ohne Rest.
 *
 * Warum der Kopf INNERHALB des klebenden Rahmens sitzt: stuende er darueber,
 * beginnt das Kleben erst, wenn er durchgescrollt ist – die Schiene faengt dann
 * zu spaet an und laeuft am Ende in eine leere Bildschirmhoehe. Genau das war
 * der Leerraum, an dem diese Idee hier schon einmal gescheitert ist.
 *
 * Unter lg wird gestapelt statt gepinnt: ein Projekt in 390 px Breite zu
 * zwingen, macht Text und Vorschau gleichzeitig unlesbar.
 *
 * Es ist immer nur EINE Live-Vorschau aktiv, deshalb liegt der Zustand hier und
 * nicht im Panel: fuenf gleichzeitig laufende Web-Apps waeren fuenf iframes im
 * Speicher, und im Hero ist schon ein WebGL-Kontext belegt.
 */

/* Wie stark ein Panel zurueticktritt, wenn es eine ganze Breite von der Mitte
   entfernt ist. Genug, dass die Bewegung das Auge fuehrt; wenig genug, dass die
   Nachbarn nicht wie ausgeschaltet wirken. */
const OFF_CENTER_FADE = 0.75
const OFF_CENTER_SCALE = 0.08

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

const ProjectRail = ({
    activeSlug,
    setActiveSlug,
}: {
    activeSlug: string | null
    setActiveSlug: (slug: string | null) => void
}) => {
    const sectionRef = useRef<HTMLDivElement>(null)
    const trackRef = useRef<HTMLDivElement>(null)
    const total = projects.length

    /* Nur fuer die Beschriftung "03/05" – die aendert sich fuenfmal, nicht
       sechzigmal pro Sekunde, deshalb darf sie React-State sein. */
    const [index, setIndex] = useState(0)

    const onProgress = useCallback((progress: number) => {
        const track = trackRef.current
        if (!track) return

        /* Die Schiene ist `total` Bildschirme breit. Um sie um (total-1)
           Bildschirme zu verschieben, sind das (total-1)/total ihrer eigenen
           Breite. In Prozent, damit eine sichtbare Scrollbar die Rechnung nicht
           verfaelscht, wie 100vw es taete. */
        const shift = (progress * (total - 1) * 100) / total
        track.style.transform = `translate3d(-${shift}%, 0, 0)`

        // Panels treten zurueck, je weiter sie von der Mitte weg sind.
        const position = progress * (total - 1)
        for (let i = 0; i < track.children.length; i++) {
            const panel = track.children[i] as HTMLElement
            const distance = Math.min(1, Math.abs(position - i))
            panel.style.opacity = String(1 - distance * OFF_CENTER_FADE)
            panel.style.transform = `scale(${1 - distance * OFF_CENTER_SCALE})`
        }

        setIndex(Math.round(position))
    }, [total])

    useScrollProgress(sectionRef, onProgress)

    return (
        <div ref={sectionRef} style={{height: `${total * 100}vh`}}>
            <div className="sticky top-0 flex h-screen flex-col overflow-hidden pt-14">
                <div className="mx-auto w-full max-w-[88rem] shrink-0 px-6 pt-8 sm:px-10 lg:px-16">
                    <SectionIntro/>

                    {/* Fortschrittsleiste: ein Strich pro Projekt */}
                    <div className="mt-6 flex items-center gap-4">
                        <div className="flex flex-1 gap-1.5">
                            {projects.map((project, i) => (
                                <span
                                    key={project.slug}
                                    className={`h-px flex-1 transition-colors duration-500 ${
                                        i <= index ? "bg-brand/70" : "bg-white/10"
                                    }`}
                                />
                            ))}
                        </div>
                        <span className="shrink-0 font-mono text-xs text-white/35">
                            <span className="text-white/70">{String(index + 1).padStart(2, "0")}</span>
                            /{String(total).padStart(2, "0")}
                        </span>
                    </div>
                </div>

                <div className="relative min-h-0 flex-1">
                    <div
                        ref={trackRef}
                        className="flex h-full will-change-transform"
                        style={{width: `${total * 100}%`}}
                    >
                        {projects.map((project, i) => (
                            <div
                                key={project.slug}
                                /* Breite als Bruchteil der SCHIENE, nicht w-full:
                                   die Schiene ist `total` Bildschirme breit, ein
                                   w-full-Panel waere also genauso breit statt
                                   einen Bildschirm. */
                                style={{width: `${100 / total}%`}}
                                className="h-full shrink-0"
                            >
                                <ProjectPanel
                                    project={project}
                                    index={i}
                                    total={total}
                                    active={activeSlug === project.slug}
                                    onActivate={() => setActiveSlug(project.slug)}
                                    onClose={() => setActiveSlug(null)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

const ProjectStack = ({
    activeSlug,
    setActiveSlug,
}: {
    activeSlug: string | null
    setActiveSlug: (slug: string | null) => void
}) => (
    <div className="pb-20 pt-24">
        <div className="px-6 sm:px-10">
            <SectionIntro/>
        </div>

        {projects.map((project, i) => (
            <Reveal key={project.slug} variants={fadeUp} className="min-h-screen py-16">
                <ProjectPanel
                    project={project}
                    index={i}
                    total={projects.length}
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

const Projects = () => {
    const [activeSlug, setActiveSlug] = useState<string | null>(null)
    const pinned = useMediaQuery("(min-width: 1024px)")

    return (
        <section id="projects" className="relative">
            {pinned ? (
                <ProjectRail activeSlug={activeSlug} setActiveSlug={setActiveSlug}/>
            ) : (
                <ProjectStack activeSlug={activeSlug} setActiveSlug={setActiveSlug}/>
            )}
        </section>
    )
}

export default Projects
