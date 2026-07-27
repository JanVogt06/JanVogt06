import {Github, Globe, Gamepad2, FolderGit2, Satellite, Zap, Receipt, Sword, Waves} from "lucide-react"
import type {LucideIcon} from "lucide-react"
import {motion} from "framer-motion"
import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import BrowserFrame from "./BrowserFrame"
import Reveal from "./Reveal"
import {fadeUp, slideInRight, stagger} from "@/lib/motion"
import type {Project} from "@/lib/projects"
import {primaryLinkOf} from "@/lib/projects"

/**
 * Ein Projekt auf einer ganzen Bildschirmhöhe.
 *
 * Links die Fakten, rechts die laufende Anwendung. Die Commit-Metapher bleibt
 * bewusst auf eine Mono-Zeile reduziert: auf einer ganzen Bildschirmhöhe ist das
 * Projekt der Star, nicht die Verpackung.
 *
 * `scroll-snap-align: start` lässt die Folie an der Bildschirmkante einrasten,
 * `scroll-margin-top` hält sie unter der Repo-Leiste frei. Die Seite nutzt dafür
 * `scroll-snap-type: proximity` und nicht `mandatory` – mandatory kann Leute
 * beim Scrollen einsperren und bricht Tastaturnavigation und Seitensuche.
 */

// Mappt den `icon`-String aus der JSON auf die lucide-Komponente.
const iconMap: Record<string, LucideIcon> = {Satellite, Zap, Receipt, Sword, Waves}

/* Screenshots werden aus dem Ordner gelesen, nicht einzeln importiert: so
   genügt es, eine Datei mit dem passenden Slug dort abzulegen – kein Code muss
   angefasst werden. Fehlt sie, zeigt BrowserFrame seinen Poster-Zustand. */
const screenshots = import.meta.glob<string>(
    "../data/images/screenshots/*.{png,jpg,jpeg,webp}",
    {eager: true, import: "default"},
)

const screenshotFor = (slug: string) =>
    Object.entries(screenshots).find(([path]) => path.includes(`/${slug}.`))?.[1]

const ProjectSlide = ({
    project,
    index,
    total,
    active,
    onActivate,
    onClose,
}: {
    project: Project
    index: number
    total: number
    active: boolean
    onActivate: () => void
    onClose: () => void
}) => {
    const Icon = iconMap[project.icon] ?? FolderGit2
    const primary = primaryLinkOf(project.links)

    return (
        <div className="snap-slide flex min-h-screen items-center py-24 lg:py-28">
            <div className="grid w-full items-center gap-10 lg:grid-cols-12 lg:gap-14">

                {/* Fakten */}
                <Reveal variants={stagger(0.08)} className="lg:col-span-5">
                    {/* Reduzierte Commit-Metapher: Nummer, Hash, Typ in einer Zeile */}
                    <motion.div variants={fadeUp} className="mb-5 flex items-center gap-3 font-mono text-xs">
                        <span className="text-brand">
                            {String(index + 1).padStart(2, "0")}
                            <span className="text-white/25">/{String(total).padStart(2, "0")}</span>
                        </span>
                        <span className="h-px w-8 bg-white/15"/>
                        <span className="text-white/30">{project.hash}</span>
                        <span
                            className="rounded bg-status/10 px-1.5 py-0.5 font-semibold text-status ring-1 ring-status/20">
                            {project.type}
                        </span>
                    </motion.div>

                    <motion.h3
                        variants={fadeUp}
                        className="text-4xl font-semibold tracking-[-0.02em] text-white sm:text-5xl lg:text-6xl"
                    >
                        {project.title}
                    </motion.h3>
                    <motion.p variants={fadeUp} className="mt-2 text-lg text-white/45">
                        {project.subtitle}
                    </motion.p>

                    <motion.p variants={fadeUp} className="mt-6 max-w-xl leading-relaxed text-white/60">
                        {project.description}
                    </motion.p>

                    <motion.div variants={fadeUp} className="mt-7 flex flex-wrap gap-1.5">
                        {project.tech.map((tech) => (
                            <Badge
                                key={tech}
                                className="rounded-full border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 font-mono text-[11px] font-normal text-white/55 hover:bg-white/[0.03]"
                            >
                                {tech}
                            </Badge>
                        ))}
                    </motion.div>

                    <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-2">
                        {project.links.github && (
                            <Button
                                variant="outline"
                                className="border-white/[0.08] bg-white/[0.03] text-white/70 hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                                asChild
                            >
                                <a href={project.links.github} target="_blank" rel="noopener noreferrer">
                                    <Github className="mr-2 h-4 w-4"/>
                                    Code
                                </a>
                            </Button>
                        )}
                        {primary && (
                            <Button
                                className="bg-brand/15 text-brand ring-1 ring-brand/30 transition-colors hover:bg-brand/25 hover:text-white"
                                asChild
                            >
                                <a href={primary.href} target="_blank" rel="noopener noreferrer">
                                    {primary.label === "Play Now"
                                        ? <Gamepad2 className="mr-2 h-4 w-4"/>
                                        : <Globe className="mr-2 h-4 w-4"/>}
                                    {primary.label}
                                </a>
                            </Button>
                        )}
                    </motion.div>
                </Reveal>

                {/* Laufende Anwendung */}
                <Reveal
                    variants={slideInRight}
                    className="aspect-[16/10] w-full lg:col-span-7 lg:aspect-auto lg:h-[68vh]"
                >
                    <BrowserFrame
                        url={primary?.href}
                        embeddable={project.embed !== false}
                        poster={screenshotFor(project.slug)}
                        icon={Icon}
                        note={project.previewNote}
                        active={active}
                        onActivate={onActivate}
                        onClose={onClose}
                    />
                </Reveal>
            </div>
        </div>
    )
}

export default ProjectSlide
