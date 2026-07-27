import {useCallback, useEffect, useRef, useState} from "react"
import {
    Github, Globe, Satellite, Zap, Receipt, Sword, Waves, ArrowRight, Gamepad2, FolderGit2,
    GitCommitHorizontal,
} from "lucide-react"
import type {LucideIcon} from "lucide-react"
import {motion, useReducedMotion, useScroll, useTransform} from "framer-motion"
import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import projectsData from "@/data/projects.json"
import Reveal from "./Reveal"
import SectionHeader from "./SectionHeader"
import {fadeUp, scaleIn, stagger} from "@/lib/motion"

// Projekt-Form wie in src/data/projects.json hinterlegt.
// Projekte dort hinzufügen/ändern – keine Code-Änderung nötig.
interface Project {
    icon: string;
    type: string;       // Conventional-Commit-Präfix, z.B. "feat" / "feat(game)"
    hash: string;       // kurzer Commit-Hash (Deko)
    title: string;
    subtitle: string;
    description: string;
    tech: string[];
    links: {
        github?: string;
        website?: string;
        app?: string;
        play?: string;
    };
}

// Mappt den `icon`-String aus der JSON auf die lucide-Komponente.
const iconMap: Record<string, LucideIcon> = {
    Satellite,
    Zap,
    Receipt,
    Sword,
    Waves,
};

const projects = projectsData as Project[];

/* Der Haupt-Link einer Karte (Website / App / Play) – einheitlich in Brand
   statt fünf verschiedener Projekt-Gradients. Commits sind auch nicht
   farbcodiert, sie haben einen Hash und einen Typ. */
const primaryLinkOf = (links: Project["links"]) => {
    if (links.website) return {href: links.website, label: "Website", icon: Globe};
    if (links.app) return {href: links.app, label: "Zur App", icon: Globe};
    if (links.play) return {href: links.play, label: "Play Now", icon: Gamepad2};
    return null;
};

/**
 * Der Karteninhalt – bewusst ohne motion, damit er in beiden Layouts
 * funktioniert: im vertikalen Raster gestaffelt eingeblendet, im gepinnten
 * Verlauf ohne eigene Einblend-Animation (dort ist die horizontale Bewegung
 * schon der Auftritt).
 */
const ProjectCardBody = ({project}: { project: Project }) => {
    const Icon = iconMap[project.icon] ?? FolderGit2;
    const primary = primaryLinkOf(project.links);

    return (
        <div className="surface surface-hover group relative flex h-full flex-col rounded-2xl p-6">

            {/* Glow beim Hover – einheitlich Brand, nicht pro Projekt */}
            <div
                className="pointer-events-none absolute -inset-px rounded-2xl bg-brand opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-[0.07]"/>

            <div className="relative flex h-full flex-col">
                {/* Commit-Kopfzeile: Knoten + Hash + Conventional-Commit-Typ */}
                <div className="mb-5 flex items-center gap-2 font-mono text-xs">
                    <GitCommitHorizontal className="h-4 w-4 text-brand/50"/>
                    <span className="text-white/30">{project.hash}</span>
                    <span
                        className="rounded bg-status/10 px-1.5 py-0.5 font-semibold text-status ring-1 ring-status/20">
                        {project.type}
                    </span>
                </div>

                {/* Commit-Betreff = Titel */}
                <div className="mb-4 flex items-center gap-4">
                    <div
                        className="rounded-xl bg-brand/10 p-3 ring-1 ring-brand/20 transition-colors duration-300 group-hover:bg-brand/15">
                        <Icon className="h-6 w-6 text-brand"/>
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-xl font-semibold tracking-tight text-white">{project.title}</h3>
                        <p className="text-sm text-white/45">{project.subtitle}</p>
                    </div>
                </div>

                {/* Commit-Body = Beschreibung */}
                <p className="mb-5 text-sm leading-relaxed text-white/55">
                    {project.description}
                </p>

                {/* Tech-Stack – neutrale Mono-Chips. Grün bleibt der
                    git-Semantik vorbehalten, sonst leuchtet die halbe Karte. */}
                <div className="mb-6 flex flex-wrap gap-1.5">
                    {project.tech.map((tech) => (
                        <Badge
                            key={tech}
                            className="rounded-full border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 font-mono text-[11px] font-normal text-white/55 hover:bg-white/[0.03]"
                        >
                            {tech}
                        </Badge>
                    ))}
                </div>

                {/* Links – unten ausgerichtet, damit die Karten eine gemeinsame
                    Grundlinie haben */}
                <div className="mt-auto flex flex-wrap gap-2">
                    {project.links.github && (
                        <Button variant="outline" size="sm"
                                className="border-white/[0.08] bg-white/[0.03] text-white/70 hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                                asChild>
                            <a href={project.links.github} target="_blank" rel="noopener noreferrer">
                                <Github className="mr-2 h-4 w-4"/>
                                Code
                            </a>
                        </Button>
                    )}
                    {primary && (
                        <Button size="sm"
                                className="bg-brand/15 text-brand ring-1 ring-brand/30 transition-colors hover:bg-brand/25 hover:text-white"
                                asChild>
                            <a href={primary.href} target="_blank" rel="noopener noreferrer">
                                <primary.icon className="mr-2 h-4 w-4"/>
                                {primary.label}
                            </a>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

/** Karte im vertikalen Raster: gestaffelt eingeblendet. */
const ProjectCard = ({project}: { project: Project }) => (
    <motion.div variants={scaleIn} className="h-full">
        <ProjectCardBody project={project}/>
    </motion.div>
);

/** Vertikales Raster – Mobile, Tablet und bei prefers-reduced-motion. */
const ProjectGrid = ({className}: { className?: string }) => (
    <Reveal variants={stagger(0.12)} className={`grid gap-5 md:grid-cols-2 ${className ?? ""}`}>
        {projects.map((project) => (
            <ProjectCard key={project.title} project={project}/>
        ))}
    </Reveal>
);

/**
 * Gepinnter horizontaler Commit-Verlauf – nur ab lg.
 *
 * Der Abschnitt bleibt stehen, während die Projekte seitwärts durchlaufen: eine
 * git-log-Zeitachse, durch die man scrollt. Auf Touch ist so etwas fast immer
 * Murks (es kämpft mit dem natürlichen Scrollen), deshalb bekommen Mobile und
 * Tablet das unveränderte vertikale Raster – das ist keine Notlösung, sondern
 * die richtige Antwort für Touch.
 *
 * Die Scroll-Distanz wird aus der tatsächlichen Breite des Tracks gemessen,
 * nicht geschätzt: so passt sie automatisch, wenn Projekte in der JSON
 * hinzukommen oder wegfallen.
 */
const PinnedProjects = () => {
    const pinRef = useRef<HTMLDivElement>(null)
    const viewportRef = useRef<HTMLDivElement>(null)
    const trackRef = useRef<HTMLDivElement>(null)
    const [overflow, setOverflow] = useState(0)

    const measure = useCallback(() => {
        const track = trackRef.current
        const viewport = viewportRef.current
        if (!track || !viewport) return
        setOverflow(Math.max(0, track.scrollWidth - viewport.clientWidth))
    }, [])

    useEffect(() => {
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(document.body)
        if (trackRef.current) ro.observe(trackRef.current)
        window.addEventListener("resize", measure)
        return () => {
            ro.disconnect()
            window.removeEventListener("resize", measure)
        }
    }, [measure])

    // Fortschritt, solange der Abschnitt gepinnt ist.
    const {scrollYProgress} = useScroll({
        target: pinRef,
        offset: ["start start", "end end"],
    })

    const x = useTransform(scrollYProgress, [0, 1], [0, -overflow])
    // Fortschrittsbalken und Zähler – ohne Orientierung fühlt sich ein
    // gepinnter Abschnitt kaputt an ("warum scrollt die Seite nicht?").
    const barScale = useTransform(scrollYProgress, [0, 1], [1 / projects.length, 1])
    const [current, setCurrent] = useState(1)

    useEffect(() => {
        const unsubscribe = scrollYProgress.on("change", (v) => {
            const index = Math.min(projects.length, Math.max(1, Math.round(v * (projects.length - 1)) + 1))
            setCurrent(index)
        })
        return unsubscribe
    }, [scrollYProgress])

    return (
        <div ref={pinRef} className="relative hidden lg:block" style={{height: `calc(100vh + ${overflow}px)`}}>
            <div
                ref={viewportRef}
                className="sticky top-14 flex h-[calc(100vh-3.5rem)] flex-col justify-center overflow-hidden"
            >
                {/* Zähler im git-log-Stil */}
                <div className="mb-6 flex items-center gap-4 font-mono text-xs text-white/40">
                    <span>
                        commit <span className="text-brand">{current}</span>
                        <span className="text-white/25">/{projects.length}</span>
                    </span>
                    <div className="h-px w-40 overflow-hidden bg-white/10">
                        <motion.div
                            className="h-full origin-left bg-brand"
                            style={{scaleX: barScale}}
                        />
                    </div>
                    <span className="text-white/25">scrollen blättert weiter</span>
                </div>

                <motion.div ref={trackRef} className="flex gap-5" style={{x}}>
                    {projects.map((project) => (
                        <div key={project.title} className="w-[25rem] shrink-0 xl:w-[27rem]">
                            <ProjectCardBody project={project}/>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    )
}

const Projects = () => {
    const reduced = useReducedMotion()

    return (
        /* KEIN overflow-hidden auf der Section: das macht sie zum Scroll-Container
           und position: sticky im gepinnten Verlauf würde nicht mehr greifen.
           Das Clipping der Blur-Blobs übernimmt der Hintergrund-Wrapper. */
        <section id="projects" className="relative py-20 md:py-28">

            {/* Hintergrund – wie im Werdegang: Cyan = Arbeit/Technik */}
            <div className="absolute inset-0 overflow-hidden">
                <div
                    className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-brand/10 blur-[150px]"/>
                <div
                    className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-brand-deep/10 blur-[150px]"/>

                {/* Raster-Linien */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                        backgroundSize: '60px 60px'
                    }}
                />
            </div>

            <div className="relative mx-auto max-w-[88rem] px-6 sm:px-8 lg:px-12">

                <SectionHeader
                    command="git log"
                    argument="--oneline projekte/"
                    title="Meine"
                    accent="Projekte"
                    lead="Jedes Projekt ein Commit – eine Auswahl aus verschiedenen Bereichen"
                />

                {reduced ? (
                    <ProjectGrid/>
                ) : (
                    <>
                        <ProjectGrid className="lg:hidden"/>
                        <PinnedProjects/>
                    </>
                )}

                {/* More Projects Link */}
                <Reveal variants={fadeUp} className="mt-12">
                    <a
                        href="https://github.com/JanVogt06?tab=repositories"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-2 font-mono text-sm text-brand transition-colors hover:text-white"
                    >
                        weitere Projekte auf GitHub
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/>
                    </a>
                </Reveal>
            </div>
        </section>
    );
};

export default Projects;
