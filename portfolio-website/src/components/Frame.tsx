import {useCallback, useEffect, useRef, useState} from "react"
import {AnimatePresence, motion} from "framer-motion"
import {ArrowUpRight} from "lucide-react"
import {EASE} from "@/lib/motion"
import {chapterAt, chapters, journey} from "@/lib/journey"
import type {Chapter} from "@/lib/journey"
import {clockAt} from "@/lib/sea/light"
import {channels} from "@/lib/channels"
import {scrollToChapter} from "@/lib/smoothScroll"
import {sound} from "@/lib/sound"
import useDialog from "@/lib/useDialog"

/** Over the scene the camera says where the reader is; in the document the
 *  last chapter whose top has passed the middle of the screen does. */
const useChapter = (scene: boolean) => {
    const [active, setActive] = useState<Chapter>("hero")

    useEffect(() => {
        if (scene) return journey.subscribe((shot) => setActive(chapterAt(shot)))

        let frame = 0
        const measure = () => {
            frame = 0
            let current: Chapter = "hero"
            chapters.forEach(({id}) => {
                const el = document.getElementById(id)
                if (el && el.getBoundingClientRect().top <= window.innerHeight / 2) current = id
            })
            setActive(current)
        }
        const request = () => {
            if (!frame) frame = requestAnimationFrame(measure)
        }
        measure()
        window.addEventListener("scroll", request, {passive: true})
        return () => {
            window.removeEventListener("scroll", request)
            if (frame) cancelAnimationFrame(frame)
        }
    }, [scene])

    return active
}

const useSound = () => {
    const [on, setOn] = useState(sound.isOn)
    useEffect(() => sound.subscribe(setOn), [])
    return on
}

const SoundToggle = ({className = ""}: {className?: string}) => {
    const on = useSound()
    return (
        <button
            onClick={sound.toggle}
            aria-pressed={on}
            className={`label group flex h-11 items-center gap-3 text-fg-2 transition-colors duration-300 hover:text-fg ${className}`}
        >
            <span aria-hidden="true" className="flex h-3 items-end gap-[2px]">
                {[0, 1, 2, 3].map((i) => (
                    <span
                        key={i}
                        className={`block h-full w-px origin-bottom bg-current ${on ? "animate-bars" : ""}`}
                        style={{animationDelay: `${i * -0.27}s`, transform: on ? undefined : "scaleY(0.3)"}}
                    />
                ))}
            </span>
            Ton: {on ? "An" : "Aus"}
        </button>
    )
}

/** The scene's own clock, from first light to the night at the end. */
const Clock = () => {
    const ref = useRef<HTMLSpanElement>(null)
    useEffect(
        () =>
            journey.subscribe((shot) => {
                const minutes = clockAt(shot)
                const text = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
                if (ref.current && ref.current.textContent !== text) ref.current.textContent = text
            }),
        [],
    )
    return (
        <p className="label flex h-11 items-center gap-3 text-fg-2">
            <span className="text-fg-3">Ortszeit</span>
            <span ref={ref} className="tabular-nums text-fg">06:12</span>
        </p>
    )
}

const Menu = ({active, onClose}: {active: Chapter; onClose: () => void}) => {
    const rootRef = useRef<HTMLDivElement>(null)
    const closeRef = useRef<HTMLButtonElement>(null)

    useDialog(rootRef, onClose, closeRef)

    const go = (id: string) => {
        onClose()
        scrollToChapter(id)
    }

    return (
        <motion.div
            ref={rootRef}
            id="site-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            data-native-scroll
            className="fixed inset-0 z-[60] flex flex-col overflow-y-auto overscroll-contain bg-page px-[var(--gutter)] pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] pt-[env(safe-area-inset-top)]"
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.3, ease: EASE}}
        >
            <div className="flex h-16 shrink-0 items-center justify-between">
                <span className="text-[0.9375rem] font-medium tracking-[-0.02em] text-fg">Jan Vogt</span>
                <button ref={closeRef} onClick={onClose} className="label -mr-3 flex h-11 items-center px-3 text-fg">
                    Schließen
                </button>
            </div>

            <nav aria-label="Kapitel" className="mt-[10vh] flex flex-col">
                {chapters.map((chapter, i) => (
                    <motion.button
                        key={chapter.id}
                        onClick={() => go(chapter.id)}
                        aria-current={active === chapter.id ? "true" : undefined}
                        className="flex items-baseline gap-5 border-b border-hair py-5 text-left"
                        initial={{opacity: 0, y: 16}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.6, delay: 0.05 + i * 0.06, ease: EASE}}
                    >
                        <span className="w-6 shrink-0 font-mono text-data tabular-nums text-fg-3">{chapter.index}</span>
                        <span className={`text-heading font-medium ${active === chapter.id ? "text-fg" : "text-fg-3"}`}>
                            {chapter.label}
                        </span>
                    </motion.button>
                ))}
            </nav>

            <div className="mt-auto pt-12">
                <ul className="flex flex-col">
                    {channels.map((channel) => (
                        <li key={channel.label}>
                            <a
                                href={channel.href}
                                target={channel.external ? "_blank" : undefined}
                                rel={channel.external ? "noopener noreferrer" : undefined}
                                className="flex min-h-11 items-center justify-between gap-4 text-sub text-fg-2"
                            >
                                <span>
                                    <span className="label mr-3 inline-block w-20 text-fg-3">{channel.label}</span>
                                    {channel.value}
                                </span>
                                <ArrowUpRight className="h-3.5 w-3.5 text-fg-3"/>
                            </a>
                        </li>
                    ))}
                </ul>
                <SoundToggle className="mt-4"/>
            </div>
        </motion.div>
    )
}

/**
 * The chrome holds the four corners of the frame, like a viewfinder: the
 * name and the chapters on top, the sound and the scene's clock below.
 */
const Frame = ({ready, scene}: {ready: boolean; scene: boolean}) => {
    const active = useChapter(scene)
    const [open, setOpen] = useState(false)
    const close = useCallback(() => setOpen(false), [])

    return (
        <>
            <motion.header
                data-overlay
                initial={{opacity: 0}}
                animate={{opacity: ready ? 1 : 0}}
                transition={{duration: 0.8, delay: 0.2, ease: EASE}}
                className={`ink fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] ${scene ? "" : "bg-page/60 backdrop-blur-md"}`}
            >
                <div className="flex h-16 items-center justify-between gap-6 px-[var(--gutter)]">
                    <button
                        onClick={() => scrollToChapter("top")}
                        className="flex h-11 items-center text-[0.9375rem] font-medium tracking-[-0.02em] text-fg"
                    >
                        Jan Vogt
                    </button>

                    <nav aria-label="Kapitel" className="hidden items-center gap-8 md:flex">
                        {chapters.map((chapter) => {
                            const isActive = active === chapter.id
                            return (
                                <button
                                    key={chapter.id}
                                    onClick={() => scrollToChapter(chapter.id)}
                                    aria-current={isActive ? "true" : undefined}
                                    className={`label relative flex h-11 items-center gap-2 transition-colors duration-300 ${
                                        isActive ? "text-fg" : "text-fg-3 hover:text-fg"
                                    }`}
                                >
                                    <span className="tabular-nums opacity-60">{chapter.index}</span>
                                    {chapter.label}
                                    {isActive && (
                                        <motion.span
                                            layoutId="frame-active"
                                            aria-hidden="true"
                                            className="absolute inset-x-0 bottom-2 h-px bg-fg"
                                            transition={{type: "spring", stiffness: 380, damping: 36}}
                                        />
                                    )}
                                </button>
                            )
                        })}
                    </nav>

                    <button
                        onClick={() => setOpen(true)}
                        aria-expanded={open}
                        aria-controls="site-menu"
                        className="label -mr-3 flex h-11 items-center gap-2.5 px-3 text-fg md:hidden"
                    >
                        Menü
                    </button>
                </div>
            </motion.header>

            {scene && (
                <motion.div
                    data-overlay
                    initial={{opacity: 0}}
                    animate={{opacity: ready ? 1 : 0}}
                    transition={{duration: 0.8, delay: 0.5, ease: EASE}}
                    className="ink pointer-events-none fixed inset-x-0 bottom-0 z-40 hidden items-center justify-between px-[var(--gutter)] pb-[max(1rem,env(safe-area-inset-bottom))] md:flex"
                >
                    <div className="pointer-events-auto">
                        <SoundToggle/>
                    </div>
                    <Clock/>
                </motion.div>
            )}

            <AnimatePresence>{open && <Menu key="menu" active={active} onClose={close}/>}</AnimatePresence>
        </>
    )
}

export default Frame
