import {useEffect, useState} from "react"
import {motion} from "framer-motion"
import {Github} from "lucide-react"
import {EASE} from "@/lib/motion"
import {scrollToElement} from "@/lib/smoothScroll"
import Lens from "./Lens"

const sections = [
    {id: "about", label: "Über mich"},
    {id: "projects", label: "Projekte"},
    {id: "contact", label: "Kontakt"},
]

const TopBar = () => {
    const [active, setActive] = useState<string>("")

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
            className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6"
        >
            <div className="glass mx-auto flex h-12 max-w-[64rem] items-center gap-2 rounded-full pl-4 pr-2 sm:gap-3">
                <Lens/>
                <button
                    onClick={() => scrollToElement("hero")}
                    className="shrink-0 text-sm font-semibold tracking-[-0.01em] text-white/85 transition-colors hover:text-white"
                >
                    Jan Vogt
                </button>

                <nav className="ml-auto flex min-w-0 items-center text-[13px]">
                    {sections.map((s) => {
                        const isActive = active === s.id
                        return (
                            <button
                                key={s.id}
                                onClick={() => scrollToElement(s.id)}
                                className={`relative shrink-0 rounded-full px-2.5 py-1.5 transition-colors sm:px-3.5 ${
                                    isActive ? "text-white" : "text-white/55 hover:text-white/80"
                                }`}
                            >
                                {isActive && (
                                    <motion.span
                                        layoutId="topbar-active"
                                        aria-hidden="true"
                                        className="absolute inset-0 rounded-full bg-white/[0.09]"
                                        transition={{type: "spring", stiffness: 420, damping: 34}}
                                    />
                                )}
                                <span className="relative">{s.label}</span>
                            </button>
                        )
                    })}
                </nav>

                <a
                    href="https://github.com/JanVogt06"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub-Profil von Jan Vogt"
                    className="shrink-0 rounded-full p-2 text-white/50 transition-colors hover:bg-white/[0.09] hover:text-white"
                >
                    <Github className="h-4 w-4"/>
                </a>
            </div>
        </motion.header>
    )
}

export default TopBar
