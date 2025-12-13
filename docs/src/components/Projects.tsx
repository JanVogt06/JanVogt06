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

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
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
        title: "SatTrak",
        subtitle: "3D Satellitenvisualisierung",
        description: "Interaktive Echtzeit-Verfolgung von über 12.000 Satelliten auf einem virtuellen Globus. Mit Heatmap-Darstellung, Tag/Nacht-Zyklus und Zeitsteuerung für historische Ansichten.",
        tech: ["Unity", "C#", "Cesium"],
        links: {
            github: "https://github.com/JanVogt06/SatTrak-SatelliteVisualization"
        }
    },
    {
        icon: Zap,
        iconGradient: "from-yellow-500 to-orange-600",
        title: "SolarFlow",
        subtitle: "Smart Energy Management",
        description: "Intelligentes Energie-Management-System für Photovoltaik-Anlagen. Maximiert den Eigenverbrauch durch automatische Steuerung von Verbrauchern basierend auf Solarüberschuss.",
        tech: ["Python", "FastAPI", "SQLite", "JavaScript"],
        links: {
            github: "https://github.com/JanVogt06/SolarFlow-SmartEnergyManagement",
            website: "https://solarflow.jan-vogt.dev/"
        }
    },
    {
        icon: Receipt,
        iconGradient: "from-green-500 to-emerald-600",
        title: "TFV Spesen Generator",
        subtitle: "Automatisierte Spesenabrechnung",
        description: "Web-Anwendung zur automatisierten Spesenabrechnung für Fußballschiedsrichter in Thüringen. Scrapt Spielansetzungen aus DFBnet und generiert professionelle Word-Dokumente.",
        tech: ["Python", "FastAPI", "React", "TypeScript", "Docker"],
        links: {
            github: "https://github.com/JanVogt06/dfb-spesen-generator",
            app: "https://spesen-generator.jan-vogt.dev/"
        }
    },
    {
        icon: Sword,
        iconGradient: "from-purple-500 to-pink-600",
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
const ProjectCard = ({project, index}: {project: typeof projects[0], index: number}) => {
    const {ref, isInView} = useInView<HTMLDivElement>();
    const Icon = project.icon;

    return (
        <div
            ref={ref}
            className="group relative rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl sm:p-6"
            style={{
                opacity: 0,
                animation: isInView ? `slideInFromBottom 0.6s linear ${index * 0.15}s forwards` : 'none'
            }}
        >
            {/* Header */}
            <div className="mb-3 flex items-center gap-3 sm:mb-4">
                <div className={`rounded-xl bg-linear-to-br ${project.iconGradient} p-2.5 shadow-lg transition-transform duration-300 group-hover:scale-110 sm:p-3`}>
                    <Icon className="h-5 w-5 text-white sm:h-6 sm:w-6"/>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 sm:text-xl">{project.title}</h3>
                    <p className="text-sm text-gray-500">
                        {project.subtitle}
                    </p>
                </div>
            </div>

            {/* Description */}
            <p className="mb-4 text-sm leading-relaxed text-gray-600 sm:mb-5">
                {project.description}
            </p>

            {/* Tech Stack */}
            <div className="mb-4 flex flex-wrap gap-1.5 sm:mb-5 sm:gap-2">
                {project.tech.map((tech, i) => (
                    <span
                        key={i}
                        className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 sm:px-3"
                    >
                        {tech}
                    </span>
                ))}
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
                {project.links.github && (
                    <a
                        href={project.links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-100 sm:gap-2 sm:px-4"
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
                        className={`flex items-center gap-1.5 rounded-lg bg-linear-to-r ${project.iconGradient} px-3 py-2 text-sm font-medium text-white shadow-md transition-all hover:scale-105 hover:shadow-lg sm:gap-2 sm:px-4`}
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
                        className={`flex items-center gap-1.5 rounded-lg bg-linear-to-r ${project.iconGradient} px-3 py-2 text-sm font-medium text-white shadow-md transition-all hover:scale-105 hover:shadow-lg sm:gap-2 sm:px-4`}
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
                        className={`flex items-center gap-1.5 rounded-lg bg-linear-to-r ${project.iconGradient} px-3 py-2 text-sm font-medium text-white shadow-md transition-all hover:scale-105 hover:shadow-lg sm:gap-2 sm:px-4`}
                    >
                        <Gamepad2 className="h-4 w-4"/>
                        Play Now
                    </a>
                )}
            </div>

            {/* Hover Glow Effect - Hidden on mobile */}
            <div className="pointer-events-none absolute inset-0 hidden rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:block"
                 style={{
                     background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(147, 51, 234, 0.06), transparent 40%)'
                 }}
            />
        </div>
    );
};

const Projects = () => {
    return (
        <>
            <style>{cssAnimations}</style>
            <section id="projects" className="relative overflow-hidden bg-linear-to-b from-gray-50 via-white to-gray-50 py-16 md:py-24">

                {/* Background Decoration */}
                <div className="absolute -right-40 top-20 h-60 w-60 rounded-full bg-purple-100/50 blur-3xl md:h-80 md:w-80"/>
                <div className="absolute -left-40 bottom-20 h-60 w-60 rounded-full bg-pink-100/50 blur-3xl md:h-80 md:w-80"/>

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                    {/* Section Header */}
                    <motion.div
                        className="mb-10 text-center md:mb-16"
                        initial={{opacity: 0, y: 30}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true, margin: "-100px"}}
                        transition={{duration: 0.6}}
                    >
                        <h2 className="mb-3 text-4xl font-bold text-gray-900 sm:text-5xl lg:text-6xl">
                            Projekte
                        </h2>
                        <p className="mx-auto max-w-2xl text-lg text-gray-600 sm:text-xl">
                            Eine Auswahl meiner Projekte aus verschiedenen Bereichen
                        </p>
                    </motion.div>

                    {/* Projects Grid */}
                    <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                        {projects.map((project, index) => (
                            <ProjectCard key={project.title} project={project} index={index}/>
                        ))}
                    </div>

                    {/* More Projects Link */}
                    <motion.div
                        className="mt-10 text-center md:mt-12"
                        initial={{opacity: 0, y: 20}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true}}
                        transition={{duration: 0.5, delay: 0.6}}
                    >
                        <a
                            href="https://github.com/JanVogt06?tab=repositories"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center gap-2 text-base font-medium text-purple-600 transition-colors hover:text-purple-700 sm:text-lg"
                        >
                            Weitere Projekte auf GitHub
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 sm:h-5 sm:w-5"/>
                        </a>
                    </motion.div>

                </div>
            </section>
        </>
    );
};

export default Projects;