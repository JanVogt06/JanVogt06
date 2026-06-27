import {useEffect, useState} from "react"
import {motion} from "framer-motion"
import {GitBranch, Star, Check, Copy, Github} from "lucide-react"
import {EASE} from "@/lib/motion"

/**
 * Sticky "Repository-Leiste" – das Leitmotiv der Seite: die ganze Seite ist
 * als Git-Repository inszeniert. Branch-Pill, dateibaum-artige Navigation und
 * ein "git clone"-Befehl zum Kopieren.
 */

const CLONE_CMD = "git clone https://github.com/JanVogt06/JanVogt06.git"

const sections = [
    {id: "about", label: "werdegang.md"},
    {id: "projects", label: "projekte/"},
    {id: "contact", label: "kontakt.pr"},
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
            className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0c0515]/70 backdrop-blur-xl"
        >
            <div className="mx-auto flex h-14 max-w-[88rem] items-center gap-3 px-4 sm:px-6 lg:px-8">
                {/* Repo-Pfad */}
                <button
                    onClick={() => go("hero")}
                    className="flex shrink-0 items-center gap-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
                >
                    <Github className="h-4 w-4 text-white/60"/>
                    <span className="hidden sm:inline text-white/40">jan-vogt</span>
                    <span className="hidden sm:inline text-white/30">/</span>
                    <span className="font-semibold">portfolio</span>
                </button>

                {/* Branch-Pill */}
                <span className="hidden items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 font-mono text-xs font-medium text-cyan-300 md:inline-flex">
                    <GitBranch className="h-3.5 w-3.5"/>
                    main
                </span>

                {/* Datei-/Abschnitts-Navigation */}
                <nav className="ml-auto flex items-center gap-1 font-mono text-xs sm:text-sm">
                    {sections.map((s) => {
                        const isActive = active === s.id
                        return (
                            <button
                                key={s.id}
                                onClick={() => go(s.id)}
                                className={`relative rounded-md px-2.5 py-1.5 transition-colors sm:px-3 ${
                                    isActive ? "text-white" : "text-white/50 hover:text-white/80"
                                }`}
                            >
                                {s.label}
                                {isActive && (
                                    <motion.span
                                        layoutId="repobar-active"
                                        className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500"
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
                    className="ml-1 hidden shrink-0 items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 font-mono text-xs text-white/60 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white lg:flex"
                >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400"/> : <Copy className="h-3.5 w-3.5"/>}
                    <span>{copied ? "kopiert!" : "git clone"}</span>
                </button>

                {/* Star */}
                <a
                    href="https://github.com/JanVogt06"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex shrink-0 items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/70 transition-colors hover:border-yellow-400/30 hover:bg-yellow-500/10 hover:text-yellow-300"
                >
                    <Star className="h-3.5 w-3.5"/>
                    <span className="hidden sm:inline">Star</span>
                </a>
            </div>
        </motion.header>
    )
}

export default RepoBar
