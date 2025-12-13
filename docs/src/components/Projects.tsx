import {Github, Globe, Satellite, Zap, Receipt, Sword, ArrowRight, Gamepad2} from "lucide-react"
import {motion} from "framer-motion"
import {useEffect, useRef, useState} from "react"

// CSS Animations
const cssAnimations = `
@keyframes slideInFromBottom {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

// Hook for intersection observer
const useInView = <T extends HTMLElement = HTMLElement>(options = {}) => {
    const ref = useRef<T>(null);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsInView(true);
                observer.disconnect();
            }
        }, {threshold: 0.1, ...options});

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    return {ref, isInView};
};

// Project data
const projects = [
    {
        icon: Satellite,
        iconGradient: "from-cyan-500 to-blue-600",
        glowColor: "cyan",
        title: "SatTrak",
        subtitle: "3D Satellitenvisualisierung",
        description: "Interaktive Echtzeit-Verfolgung von über 12.000 Satelliten auf einem virtuellen Globus. Mit Heatmap-Darstellung, Tag/Nacht-Zyklus und Zeitsteuerung.",
        tech: ["Unity", "C#", "Cesium"],
        links: {
            github: "https://github.com/JanVogt06/SatTrak-SatelliteVisualization"
        }
    },
    {
        icon: Zap,
        iconGradient: "from-yellow-500 to-orange-600",
        glowColor: "yellow",
        title: "SolarFlow",
        subtitle: "Smart Energy Management",
        description: "Intelligentes Energie-Management-System für Photovoltaik-Anlagen. Maximiert den Eigenverbrauch durch automatische Steuerung von Verbrauchern.",
        tech: ["Python", "FastAPI", "SQLite", "JavaScript"],
        links: {
            github: "https://github.com/JanVogt06/SolarFlow-SmartEnergyManagement",
            website: "https://solarflow.jan-vogt.dev/"
        }
    },
    {
        icon: Receipt,
        iconGradient: "from-green-500 to-emerald-600",
        glowColor: "green",
        title: "TFV Spesen Generator",
        subtitle: "Automatisierte Spesenabrechnung",
        description: "Web-Anwendung zur automatisierten Spesenabrechnung für Fußballschiedsrichter in Thüringen. Scrapt Spielansetzungen und generiert Word-Dokumente.",
        tech: ["Python", "FastAPI", "React", "TypeScript", "Docker"],
        links: {
            github: "https://github.com/JanVogt06/dfb-spesen-generator",
            app: "https://spesen-generator.jan-vogt.dev/"
        }
    },
    {
        icon: Sword,
        iconGradient: "from-purple-500 to-pink-600",
        glowColor: "purple",
        title: "Cryptborne",
        subtitle: "3D Dungeon-Crawler",
        description: "Prozedural generierter Dungeon-Crawler im mittelalterlichen Fantasy-Setting. Mit variantenreichem Waffensystem und intelligenter Enemy-AI.",
        tech: ["Unity", "C#", "Procedural Gen"],
        links: {
            github: "https://github.com/JY-Studios/cryptborne",
            play: "https://cryptborne.jan-vogt.dev/"
        }
    }
];

// Project Card Component
const ProjectCard = ({project, index}: { project: typeof projects[0], index: number }) => {
    const {ref, isInView} = useInView<HTMLDivElement>();
    const Icon = project.icon;

    return (
        <div
            ref={ref}
            className="group relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/10"
            style={{
                opacity: 0,
                animation: isInView ? `slideInFromBottom 0.6s ease-out ${index * 0.1}s forwards` : 'none'
            }}
        >
            {/* Glow effect on hover */}
            <div
                className={`absolute -inset-px rounded-2xl bg-linear-to-r ${project.iconGradient} opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-20`}/>

            <div className="relative">
                {/* Header */}
                <div className="mb-4 flex items-center gap-4">
                    <div className={`rounded-xl bg-linear-to-br ${project.iconGradient} p-3 shadow-lg`}>
                        <Icon className="h-6 w-6 text-white"/>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">{project.title}</h3>
                        <p className="text-sm text-white/50">{project.subtitle}</p>
                    </div>
                </div>

                {/* Description */}
                <p className="mb-5 text-sm leading-relaxed text-white/60">
                    {project.description}
                </p>

                {/* Tech Stack */}
                <div className="mb-5 flex flex-wrap gap-2">
                    {project.tech.map((tech, i) => (
                        <span
                            key={i}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                        >
                            {tech}
                        </span>
                    ))}
                </div>

                {/* Links */}
                <div className="flex flex-wrap gap-2">
                    {project.links.github && (
                        <a
                            href={project.links.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
                        >
                            <Github className="h-4 w-4"/>
                            Code
                        </a>
                    )}
                    {project.links.website && (
                        <a
                            href={project.links.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 rounded-lg bg-linear-to-r ${project.iconGradient} px-4 py-2 text-sm font-medium text-white shadow-lg transition-all hover:scale-105`}
                        >
                            <Globe className="h-4 w-4"/>
                            Website
                        </a>
                    )}
                    {project.links.app && (
                        <a
                            href={project.links.app}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 rounded-lg bg-linear-to-r ${project.iconGradient} px-4 py-2 text-sm font-medium text-white shadow-lg transition-all hover:scale-105`}
                        >
                            <Globe className="h-4 w-4"/>
                            Zur App
                        </a>
                    )}
                    {project.links.play && (
                        <a
                            href={project.links.play}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 rounded-lg bg-linear-to-r ${project.iconGradient} px-4 py-2 text-sm font-medium text-white shadow-lg transition-all hover:scale-105`}
                        >
                            <Gamepad2 className="h-4 w-4"/>
                            Play Now
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

const Projects = () => {
    return (
        <>
            <style>{cssAnimations}</style>
            <section id="projects" className="relative overflow-hidden bg-[#0a0a12] py-20 md:py-28">

                {/* Background - Grid pattern with purple tint */}
                <div className="absolute inset-0">
                    <div
                        className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-purple-600/10 blur-[150px]"/>
                    <div
                        className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-pink-600/10 blur-[150px]"/>
                </div>

                {/* Grid lines */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                        backgroundSize: '60px 60px'
                    }}
                />

                <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">

                    {/* Section Header */}
                    <motion.div
                        className="mb-16 text-center"
                        initial={{opacity: 0, y: 30}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true, margin: "-100px"}}
                        transition={{duration: 0.6}}
                    >
                        <h2 className="mb-4 text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
                            Meine <span
                            className="bg-linear-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Projekte</span>
                        </h2>
                        <p className="mx-auto max-w-2xl text-lg text-white/60">
                            Eine Auswahl meiner Projekte aus verschiedenen Bereichen
                        </p>
                    </motion.div>

                    {/* Projects Grid */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {projects.map((project, index) => (
                            <ProjectCard key={project.title} project={project} index={index}/>
                        ))}
                    </div>

                    {/* More Projects Link */}
                    <motion.div
                        className="mt-12 text-center"
                        initial={{opacity: 0, y: 20}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true}}
                        transition={{duration: 0.5, delay: 0.4}}
                    >
                        <a
                            href="https://github.com/JanVogt06?tab=repositories"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center gap-2 text-lg font-medium text-purple-400 transition-colors hover:text-purple-300"
                        >
                            Weitere Projekte auf GitHub
                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1"/>
                        </a>
                    </motion.div>
                </div>
            </section>
        </>
    );
};

export default Projects;