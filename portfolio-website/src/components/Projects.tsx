import {useState} from "react"
import {ArrowRight} from "lucide-react"
import Reveal from "./Reveal"
import SectionHeader from "./SectionHeader"
import ProjectSlide from "./ProjectSlide"
import {fadeUp} from "@/lib/motion"
import {projects} from "@/lib/projects"

/**
 * Projekte – ein Projekt pro Bildschirmhöhe.
 *
 * Es ist immer nur EINE Live-Vorschau aktiv, deshalb liegt der Zustand hier und
 * nicht in der Folie: fuenf gleichzeitig laufende Web-Apps waeren fuenf iframes
 * im Speicher, und im Hero ist schon ein WebGL-Kontext belegt.
 */
const Projects = () => {
    const [activeSlug, setActiveSlug] = useState<string | null>(null)

    return (
        <section id="projects" className="relative">

            {/* Wie im Werdegang: Cyan = Arbeit/Technik */}
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

                <div className="pt-20 md:pt-28">
                    <SectionHeader
                        command="git log"
                        argument="--oneline projekte/"
                        title="Meine"
                        accent="Projekte"
                    />
                </div>

                {projects.map((project, i) => (
                    <ProjectSlide
                        key={project.slug}
                        project={project}
                        index={i}
                        total={projects.length}
                        active={activeSlug === project.slug}
                        onActivate={() => setActiveSlug(project.slug)}
                        onClose={() => setActiveSlug(null)}
                    />
                ))}

                <Reveal variants={fadeUp} className="pb-20 md:pb-28">
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
