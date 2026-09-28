import {useCallback, useEffect, useRef, useState} from "react"
import {AnimatePresence, motion} from "framer-motion"
import {ArrowUpRight, Github} from "lucide-react"
import {EASE} from "@/lib/motion"
import {scrollToChapter} from "@/lib/smoothScroll"
import useScrollProgress, {smallViewport} from "@/lib/useScrollProgress"
import {PresenceContext, createPresence} from "@/lib/presence"
import Scramble from "./type/Scramble"
import {channels} from "@/lib/channels"
import useDialog from "@/lib/useDialog"
import {chapters} from "@/lib/chapters"

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1)

/** The chapter whose last cue has passed the middle of the viewport. Cues
 *  sit where each chapter's first words arrive, not where its track begins,
 *  so the label changes together with the content. */
const useActiveChapter = () => {
    const [active, setActive] = useState<string>("hero")

    useEffect(() => {
        let frame = 0

        const measure = () => {
            frame = 0
            // The cues are placed in svh, so the line is measured in svh too.
            const line = smallViewport() / 2
            const cues = document.querySelectorAll<HTMLElement>("[data-chapter]")
            let current = "hero"
            cues.forEach((cue) => {
                if (cue.getBoundingClientRect().top <= line) current = cue.dataset.chapter ?? current
            })
            // A short last chapter can reach the end of the page before its
            // cue reaches the line; the end of the page is always the last one.
            const end = document.documentElement.scrollHeight - window.innerHeight - 2
            if (cues.length && window.scrollY >= end) {
                current = cues[cues.length - 1].dataset.chapter ?? current
            }
            setActive(current)
        }

        const request = () => {
            if (!frame) frame = requestAnimationFrame(measure)
        }

        measure()
        window.addEventListener("scroll", request, {passive: true})
        window.addEventListener("resize", request)
        return () => {
            if (frame) cancelAnimationFrame(frame)
            window.removeEventListener("scroll", request)
            window.removeEventListener("resize", request)
        }
    }, [])

    return active
}

/** A hairline across the very top of the frame that fills with the page. */
const Progress = () => {
    const pageRef = useRef<HTMLElement>(document.documentElement)
    const fillRef = useRef<HTMLSpanElement>(null)

    const onProgress = useCallback((raw: number) => {
        if (fillRef.current) fillRef.current.style.transform = `scaleX(${clamp01(raw)})`
    }, [])

    useScrollProgress(pageRef, onProgress)

    return (
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-white/[0.06]">
            <span
                ref={fillRef}
                className="block h-px origin-left bg-signal/70"
                style={{transform: "scaleX(0)"}}
            />
        </span>
    )
}

/** The chapter the reader is in, decoded afresh on every change. */
const ChapterMark = ({active}: {active: string}) => {
    const chapter = chapters.find((c) => c.id === active)
    const [{presence, set}] = useState(createPresence)

    useEffect(() => {
        set(true)
    }, [set])

    // The live region stays mounted on the hero too: a region that appears
    // together with its first words is never announced.
    return (
        <PresenceContext.Provider value={presence}>
            <span className="flex min-w-0 items-center gap-2.5 text-fg-3" aria-live="polite">
                {chapter && (
                    <>
                        <span aria-hidden="true" className="h-px w-3 bg-white/25"/>
                        <Scramble
                            key={chapter.id}
                            text={`${chapter.index} ${chapter.label}`}
                            className="truncate font-mono text-label uppercase tracking-[0.08em] text-fg-2"
                        />
                    </>
                )}
            </span>
        </PresenceContext.Provider>
    )
}

const Menu = ({active, onClose}: {active: string; onClose: () => void}) => {
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
            transition={{duration: 0.28, ease: EASE}}
        >
            <div className="flex h-14 shrink-0 items-center justify-between">
                <span className="font-mono text-label uppercase tracking-[0.12em] text-fg-2">
                    Jan Vogt
                </span>
                <button
                    ref={closeRef}
                    onClick={onClose}
                    className="-mr-3 flex h-11 items-center gap-2.5 px-3 font-mono text-label uppercase tracking-[0.08em] text-fg"
                >
                    Schließen
                    <span aria-hidden="true" className="relative block h-3 w-3">
                        <span className="absolute left-0 top-1/2 h-px w-3 rotate-45 bg-current"/>
                        <span className="absolute left-0 top-1/2 h-px w-3 -rotate-45 bg-current"/>
                    </span>
                </button>
            </div>

            <nav aria-label="Kapitel" className="mt-[8vh] flex flex-col">
                {chapters.map((chapter, i) => (
                    <motion.button
                        key={chapter.id}
                        onClick={() => go(chapter.id)}
                        aria-current={active === chapter.id ? "true" : undefined}
                        className="group flex items-baseline gap-5 border-b border-hair py-5 text-left"
                        initial={{opacity: 0, y: 16}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.6, delay: 0.06 + i * 0.06, ease: EASE}}
                    >
                        <span className="w-6 shrink-0 font-mono text-data tabular-nums text-fg-3">
                            {chapter.index}
                        </span>
                        <span
                            className={`text-heading transition-colors duration-200 ${
                                active === chapter.id ? "text-fg" : "text-fg-2 group-hover:text-fg"
                            }`}
                        >
                            {chapter.label}
                        </span>
                    </motion.button>
                ))}
            </nav>

            <motion.div
                className="mt-auto pt-12"
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                transition={{duration: 0.5, delay: 0.3, ease: EASE}}
            >
                <p className="font-mono text-label uppercase tracking-[0.08em] text-fg-3">
                    Kanäle
                </p>
                <ul className="mt-3 flex flex-col">
                    {channels.map((channel) => (
                            <li key={channel.label}>
                                <a
                                    href={channel.href}
                                    target={channel.external ? "_blank" : undefined}
                                    rel={channel.external ? "noopener noreferrer" : undefined}
                                    className="flex min-h-11 items-center justify-between gap-4 text-sub text-fg-2 transition-colors duration-200 hover:text-fg"
                                >
                                    <span>
                                        <span className="mr-3 inline-block w-20 font-mono text-label uppercase tracking-[0.08em] text-fg-3">
                                            {channel.label}
                                        </span>
                                        {channel.value}
                                    </span>
                                    <ArrowUpRight className="h-3.5 w-3.5 text-fg-3"/>
                                </a>
                            </li>
                        ))}
                </ul>
            </motion.div>
        </motion.div>
    )
}

const TopBar = ({ready, scene}: {ready: boolean; scene: boolean}) => {
    const active = useActiveChapter()
    const [open, setOpen] = useState(false)
    const close = useCallback(() => setOpen(false), [])

    return (
        <>
            <div aria-hidden="true" className="scrim-top"/>

            <motion.header
                initial={{opacity: 0}}
                animate={{opacity: ready ? 1 : 0}}
                transition={{duration: 0.6, ease: EASE}}
                className={`fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] ${
                    // A document scrolls under the bar, so without a scene it
                    // needs a ground of its own.
                    scene ? "etched" : "border-b border-hair bg-page/85 backdrop-blur-md"
                }`}
            >
                <Progress/>

                <div className="flex h-14 items-center gap-4 px-[var(--gutter)]">
                    <button
                        onClick={() => scrollToChapter("hero")}
                        className="flex h-11 shrink-0 items-center font-mono text-label uppercase tracking-[0.12em] text-fg transition-colors duration-200 hover:text-signal"
                    >
                        Jan Vogt
                    </button>

                    <ChapterMark active={active}/>

                    <nav aria-label="Kapitel" className="ml-auto hidden items-center gap-7 md:flex">
                        {chapters.map((chapter) => {
                            const isActive = active === chapter.id
                            return (
                                <button
                                    key={chapter.id}
                                    onClick={() => scrollToChapter(chapter.id)}
                                    aria-current={isActive ? "true" : undefined}
                                    className={`group relative flex h-11 items-center gap-2 font-mono text-label uppercase tracking-[0.08em] transition-colors duration-200 ${
                                        isActive ? "text-fg" : "text-fg-3 hover:text-fg-2"
                                    }`}
                                >
                                    <span className="tabular-nums text-fg-3">{chapter.index}</span>
                                    {chapter.label}
                                    {isActive && (
                                        <motion.span
                                            layoutId="topbar-active"
                                            aria-hidden="true"
                                            className="absolute inset-x-0 bottom-1.5 h-px bg-signal"
                                            transition={{type: "spring", stiffness: 420, damping: 34}}
                                        />
                                    )}
                                </button>
                            )
                        })}

                        <a
                            href="https://github.com/JanVogt06"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="GitHub-Profil von Jan Vogt"
                            className="-mx-3.5 flex h-11 w-11 items-center justify-center text-fg-3 transition-colors duration-200 hover:text-fg"
                        >
                            <Github className="h-3.5 w-3.5"/>
                        </a>
                    </nav>

                    <button
                        onClick={() => setOpen(true)}
                        aria-expanded={open}
                        aria-controls="site-menu"
                        className="-mr-3 ml-auto flex h-11 shrink-0 items-center gap-2.5 px-3 font-mono text-label uppercase tracking-[0.08em] text-fg md:hidden"
                    >
                        Menü
                        <span aria-hidden="true" className="flex w-3.5 flex-col gap-[5px]">
                            <span className="h-px w-full bg-current"/>
                            <span className="h-px w-2/3 self-end bg-current"/>
                        </span>
                    </button>
                </div>
            </motion.header>

            <AnimatePresence>
                {open && <Menu key="menu" active={active} onClose={close}/>}
            </AnimatePresence>
        </>
    )
}

export default TopBar
