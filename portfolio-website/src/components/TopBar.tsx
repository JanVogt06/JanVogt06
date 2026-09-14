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

const TopBar = ({ready}: {ready: boolean}) => {
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
        <>
            <div aria-hidden="true" className="scrim-top"/>

            <motion.header
                initial={{opacity: 0}}
                animate={{opacity: ready ? 1 : 0}}
                transition={{duration: 0.5, ease: EASE}}
                className="fixed inset-x-0 top-0 z-50 flex h-11 items-center gap-3 px-[var(--gutter)] pt-[env(safe-area-inset-top)] sm:gap-6"
            >
                <button
                    onClick={() => scrollToElement("hero")}
                    className="shrink-0 text-label uppercase tracking-[0.18em] text-fg-2 transition-colors duration-200 hover:text-fg max-[359px]:hidden"
                >
                    Jan Vogt
                </button>

                <nav className="ml-auto flex min-w-0 items-center gap-3 sm:gap-6">
                    {sections.map((s) => {
                        const isActive = active === s.id
                        return (
                            <button
                                key={s.id}
                                onClick={() => scrollToElement(s.id)}
                                aria-current={isActive ? "true" : undefined}
                                className={`relative -my-3 shrink-0 py-3 text-label uppercase tracking-[0.10em] transition-colors duration-200 sm:tracking-[0.14em] ${
                                    isActive ? "text-fg" : "text-fg-3 hover:text-fg-2"
                                }`}
                            >
                                {isActive && (
                                    <motion.span
                                        layoutId="topbar-active"
                                        aria-hidden="true"
                                        className="absolute inset-x-0 -bottom-2 h-px bg-signal"
                                        transition={{type: "spring", stiffness: 420, damping: 34}}
                                    />
                                )}
                                {s.label}
                            </button>
                        )
                    })}
                </nav>

                <a
                    href="https://github.com/JanVogt06"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHub-Profil von Jan Vogt"
                    className="-my-3 shrink-0 py-3 text-fg-3 transition-colors duration-200 hover:text-fg"
                >
                    <Github className="h-3.5 w-3.5"/>
                </a>
            </motion.header>
        </>
    )
}

export default TopBar
