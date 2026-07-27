import {Github, Globe, Satellite, Zap, Receipt, Sword, Waves, ArrowRight, Gamepad2, FolderGit2, GitCommitHorizontal} from "lucide-react"
import type {LucideIcon} from "lucide-react"
import {motion} from "framer-motion"
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

// Eine Projekt-Karte, gestaltet wie ein Git-Commit.
const ProjectCard = ({project}: { project: Project }) => {
    const Icon = iconMap[project.icon] ?? FolderGit2;
    const primary = primaryLinkOf(project.links);

    return (
        <motion.div variants={scaleIn} className="h-full">
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

                    {/* Links – unten ausgerichtet, damit die Karten im Raster
                        eine gemeinsame Grundlinie haben */}
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
        </motion.div>
    );
};

const Projects = () => {
    return (
        <section id="projects" className="relative overflow-hidden py-20 md:py-28">

            {/* Hintergrund – wie im Werdegang: Cyan = Arbeit/Technik */}
            <div className="absolute inset-0">
                <div
                    className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-brand/10 blur-[150px]"/>
                <div
                    className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-brand-deep/10 blur-[150px]"/>
            </div>

            {/* Raster-Linien */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                    backgroundSize: '60px 60px'
                }}
            />

            <div className="relative mx-auto max-w-[88rem] px-6 sm:px-8 lg:px-12">

                <SectionHeader
                    command="git log"
                    argument="--oneline projekte/"
                    title="Meine"
                    accent="Projekte"
                    lead="Jedes Projekt ein Commit – eine Auswahl aus verschiedenen Bereichen"
                />

                {/* Projects Grid */}
                <Reveal variants={stagger(0.12)} className="grid gap-5 md:grid-cols-2">
                    {projects.map((project) => (
                        <ProjectCard key={project.title} project={project}/>
                    ))}
                </Reveal>

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
