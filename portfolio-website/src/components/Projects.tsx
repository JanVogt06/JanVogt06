import {Github, Globe, Satellite, Zap, Receipt, Sword, Waves, ArrowRight, Gamepad2, FolderGit2, GitCommitHorizontal} from "lucide-react"
import type {LucideIcon} from "lucide-react"
import {motion} from "framer-motion"
import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import projectsData from "@/data/projects.json"
import Reveal from "./Reveal"
import {fadeUp, scaleIn, stagger} from "@/lib/motion"

// Projekt-Form wie in src/data/projects.json hinterlegt.
// Projekte dort hinzufügen/ändern – keine Code-Änderung nötig.
interface Project {
    icon: string;
    type: string;       // Conventional-Commit-Präfix, z.B. "feat" / "feat(game)"
    hash: string;       // kurzer Commit-Hash (Deko)
    iconGradient: string;
    glowColor: string;
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

// Eine Projekt-Karte, gestaltet wie ein Git-Commit.
const ProjectCard = ({project}: { project: Project }) => {
    const Icon = iconMap[project.icon] ?? FolderGit2;

    return (
        <motion.div variants={scaleIn}>
            <div
                className="group relative h-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-colors duration-300 hover:border-white/20 hover:bg-white/10"
            >
                {/* Glow-Effekt beim Hover */}
                <div
                    className={`absolute -inset-px rounded-2xl bg-linear-to-r ${project.iconGradient} opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-20`}/>

                <div className="relative">
                    {/* Commit-Kopfzeile: Knoten + Hash + Conventional-Commit-Typ */}
                    <div className="mb-4 flex items-center gap-2 font-mono text-xs">
                        <GitCommitHorizontal className="h-4 w-4 text-white/40"/>
                        <span className="text-white/35">{project.hash}</span>
                        <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
                            {project.type}
                        </span>
                    </div>

                    {/* Commit-Betreff = Titel */}
                    <div className="mb-4 flex items-center gap-4">
                        <div className={`rounded-xl bg-linear-to-br ${project.iconGradient} p-3 shadow-lg`}>
                            <Icon className="h-6 w-6 text-white"/>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">{project.title}</h3>
                            <p className="text-sm text-white/50">{project.subtitle}</p>
                        </div>
                    </div>

                    {/* Commit-Body = Beschreibung */}
                    <p className="mb-5 text-sm leading-relaxed text-white/60">
                        {project.description}
                    </p>

                    {/* Diff-Stat: Tech-Stack als "Additions" */}
                    <div className="mb-5 flex flex-wrap gap-2">
                        {project.tech.map((tech) => (
                            <Badge
                                key={tech}
                                className="rounded-full border-emerald-400/15 bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-300/90 hover:bg-emerald-500/10"
                            >
                                {tech}
                            </Badge>
                        ))}
                    </div>

                    {/* Links */}
                    <div className="flex flex-wrap gap-2">
                        {project.links.github && (
                            <Button variant="outline" size="sm"
                                    className="border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white"
                                    asChild>
                                <a href={project.links.github} target="_blank" rel="noopener noreferrer">
                                    <Github className="mr-2 h-4 w-4"/>
                                    Code
                                </a>
                            </Button>
                        )}
                        {project.links.website && (
                            <Button size="sm"
                                    className={`bg-linear-to-r ${project.iconGradient} text-white shadow-lg transition-all hover:scale-105`}
                                    asChild>
                                <a href={project.links.website} target="_blank" rel="noopener noreferrer">
                                    <Globe className="mr-2 h-4 w-4"/>
                                    Website
                                </a>
                            </Button>
                        )}
                        {project.links.app && (
                            <Button size="sm"
                                    className={`bg-linear-to-r ${project.iconGradient} text-white shadow-lg transition-all hover:scale-105`}
                                    asChild>
                                <a href={project.links.app} target="_blank" rel="noopener noreferrer">
                                    <Globe className="mr-2 h-4 w-4"/>
                                    Zur App
                                </a>
                            </Button>
                        )}
                        {project.links.play && (
                            <Button size="sm"
                                    className={`bg-linear-to-r ${project.iconGradient} text-white shadow-lg transition-all hover:scale-105`}
                                    asChild>
                                <a href={project.links.play} target="_blank" rel="noopener noreferrer">
                                    <Gamepad2 className="mr-2 h-4 w-4"/>
                                    Play Now
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

                {/* Section Header */}
                <Reveal variants={fadeUp} className="mb-16 text-center">
                    <p className="mb-3 font-mono text-sm text-white/40">
                        <span className="text-emerald-400">$</span> git log <span
                        className="text-white/30">--oneline projekte/</span>
                    </p>
                    <h2 className="mb-4 text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
                        Meine <span
                        className="bg-linear-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Projekte</span>
                    </h2>
                    <p className="mx-auto max-w-2xl text-lg text-white/60">
                        Jedes Projekt ein Commit – eine Auswahl aus verschiedenen Bereichen
                    </p>
                </Reveal>

                {/* Projects Grid */}
                <Reveal variants={stagger(0.12)} className="grid gap-6 md:grid-cols-2">
                    {projects.map((project) => (
                        <ProjectCard key={project.title} project={project}/>
                    ))}
                </Reveal>

                {/* More Projects Link */}
                <Reveal variants={fadeUp} className="mt-12 text-center">
                    <a
                        href="https://github.com/JanVogt06?tab=repositories"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-2 text-lg font-medium text-purple-400 transition-colors hover:text-purple-300"
                    >
                        Weitere Projekte auf GitHub
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1"/>
                    </a>
                </Reveal>
            </div>
        </section>
    );
};

export default Projects;
