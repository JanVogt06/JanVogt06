import {useEffect, useState} from "react"
import {motion} from "framer-motion"
import {Github} from "lucide-react"
import {EASE} from "@/lib/motion"
import {scrollToElement} from "@/lib/smoothScroll"

const sections = [
    {id: "about", label: "Über mich"},
    {id: "projects", label: "Projekte"},
    {id: "contact", label: "Kontakt"},
]

const TopBar = () => {
    const [active, setActive] = useState<string>("")

    // Mark the active section from the scroll position.
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

    return (
        <motion.header
            initial={{y: -64, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            transition={{duration: 0.6, ease: EASE, delay: 0.2}}
            className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-page/60 backdrop-blur-xl"
        >
            {}
            <div className="mx-auto flex h-14 max-w-[88rem] items-center gap-4 overflow-hidden px-4 sm:px-6 lg:px-8">
                <button
                    onClick={() => scrollToElement("hero")}
                    className="shrink-0 font-mono text-[11px] uppercase tracking-[0.3em] text-white/80 transition-colors hover:text-white"
                >
                    Jan Vogt
                </button>

                <nav className="ml-auto flex min-w-0 items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] sm:gap-2 sm:text-[11px]">
                    {sections.map((s) => {
                        const isActive = active === s.id
                        return (
                            <button
                                key={s.id}
                                onClick={() => scrollToElement(s.id)}
                                className={`relative shrink-0 px-2 py-1.5 transition-colors sm:px-3 ${
                                    isActive ? "text-white" : "text-white/45 hover:text-white/80"
                                }`}
                            >
                                {s.label}
                                {isActive && (
                                    <motion.span
                                        layoutId="topbar-active"
                                        className="absolute inset-x-1 -bottom-px h-px bg-gradient-to-r from-brand to-brand-deep"
                                        transition={{type: "spring", stiffness: 400, damping: 32}}
                                    />
                                )}
                            </button>
                        )
                    })}
                </nav>

                <a
                    href="https://github.com/JanVogt06"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub-Profil von Jan Vogt"
                    className="shrink-0 border border-white/[0.08] p-2 text-white/55 transition-colors hover:border-brand/30 hover:bg-brand/10 hover:text-brand"
                >
                    <Github className="h-3.5 w-3.5"/>
                </a>
            </div>
        </motion.header>
    )
}

export default TopBar
