import {useEffect, useState} from "react"
import {motion} from "framer-motion"
import {GitBranch, Star, Check, Copy, Github} from "lucide-react"
import {EASE} from "@/lib/motion"

/**
 * Fixierte "Repository-Leiste" – das Leitmotiv der Seite: sie ist als
 * Git-Repository inszeniert. Branch-Pill, Navigation als Dateibaum, "git clone"
 * zum Kopieren.
 */

const GITHUB_USER = "https://github.com/JanVogt06"
const GITHUB_REPO = `${GITHUB_USER}/JanVogt06`
const CLONE_CMD = `git clone ${GITHUB_REPO}.git`

/* `short` fuer schmale Viewports: die vollen Dateinamen sind zusammen mit
   Repo-Pfad und Stern breiter als ein 375-px-Bildschirm. */
const sections = [
    {id: "about", label: "werdegang.md", short: "werdegang"},
    {id: "projects", label: "projekte/", short: "projekte"},
    {id: "contact", label: "kontakt.pr", short: "kontakt"},
]

const RepoBar = () => {
    const [active, setActive] = useState<string>("")
    const [copied, setCopied] = useState(false)

    // Aktiven Abschnitt anhand der Scroll-Position markieren.
    useEffect(() => {
        const ids = ["hero", ...sections.map((s) => s.id)]
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) setActive(e.target.id)
                })
            },
            {rootMargin: "-45% 0px -50% 0px"},
        )
        ids.forEach((id) => {
            const el = document.getElementById(id)
            if (el) observer.observe(el)
        })
        return () => observer.disconnect()
    }, [])

    const copyClone = async () => {
        try {
            await navigator.clipboard.writeText(CLONE_CMD)
            setCopied(true)
            setTimeout(() => setCopied(false), 1800)
        } catch {
            /* Clipboard nicht verfügbar – still ignorieren */
        }
    }

    const go = (id: string) => document.getElementById(id)?.scrollIntoView({behavior: "smooth"})

    return (
        <motion.header
            initial={{y: -64, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            transition={{duration: 0.6, ease: EASE, delay: 0.2}}
            className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-page/70 backdrop-blur-xl"
        >
            {/* overflow-hidden: die fixierte Leiste darf die Seite unter keinen
                Umstaenden seitwaerts scrollbar machen. */}
            <div className="mx-auto flex h-14 max-w-[88rem] items-center gap-1.5 overflow-hidden px-4 sm:gap-3 sm:px-6 lg:px-8">
                {/* Repo-Pfad – wie auf GitHub zwei getrennte Links: Benutzername
                    zum Profil, Repo-Name zum Repo. */}
                <div className="flex shrink-0 items-center gap-2 text-sm font-medium">
                    <a
                        href={GITHUB_USER}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2 text-white/40 transition-colors hover:text-white"
                    >
                        <Github className="h-4 w-4 text-white/60 transition-colors group-hover:text-white"/>
                        <span className="hidden sm:inline">jan-vogt</span>
                    </a>
                    <span className="hidden text-white/30 sm:inline">/</span>
                    <a
                        href={GITHUB_REPO}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-white/80 transition-colors hover:text-white"
                    >
                        portfolio
                    </a>
                </div>

                {/* Branch-Pill */}
                <span className="hidden items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 font-mono text-xs font-medium text-brand md:inline-flex">
                    <GitBranch className="h-3.5 w-3.5"/>
                    main
                </span>

                {/* Datei-/Abschnitts-Navigation */}
                <nav className="ml-auto flex min-w-0 items-center gap-0.5 font-mono text-[11px] sm:gap-1 sm:text-sm">
                    {sections.map((s) => {
                        const isActive = active === s.id
                        return (
                            <button
                                key={s.id}
                                onClick={() => go(s.id)}
                                className={`relative shrink-0 rounded-md px-2 py-1.5 transition-colors sm:px-3 ${
                                    isActive ? "text-white" : "text-white/50 hover:text-white/80"
                                }`}
                            >
                                <span className="sm:hidden">{s.short}</span>
                                <span className="hidden sm:inline">{s.label}</span>
                                {isActive && (
                                    <motion.span
                                        layoutId="repobar-active"
                                        className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-brand to-brand-deep"
                                        transition={{type: "spring", stiffness: 400, damping: 32}}
                                    />
                                )}
                            </button>
                        )
                    })}
                </nav>

                {/* git clone (kopieren) */}
                <button
                    onClick={copyClone}
                    title={CLONE_CMD}
                    className="ml-1 hidden shrink-0 items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 font-mono text-xs text-white/60 transition-colors hover:border-white/20 hover:bg-white/[0.07] hover:text-white lg:flex"
                >
                    {copied ? <Check className="h-3.5 w-3.5 text-status"/> : <Copy className="h-3.5 w-3.5"/>}
                    <span>{copied ? "kopiert!" : "git clone"}</span>
                </button>

                {/* Star */}
                {/* Aufs Repo, nicht aufs Profil: einen Stern gibt man einem
                    Repository. */}
                <a
                    href={GITHUB_REPO}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex shrink-0 items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium text-white/70 transition-colors hover:border-brand/30 hover:bg-brand/10 hover:text-brand"
                >
                    <Star className="h-3.5 w-3.5"/>
                    <span className="hidden sm:inline">Star</span>
                </a>
            </div>
        </motion.header>
    )
}

export default RepoBar
