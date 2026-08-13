import {useCallback, useRef} from "react"
import {ArrowDown, ArrowRight} from "lucide-react"
import {motion} from "framer-motion"
import {EASE} from "@/lib/motion"
import useScrollProgress from "@/lib/useScrollProgress"
import {scrollToElement} from "@/lib/smoothScroll"

/**
 * Hero als Titelkarte: der Name, eine Zeile, der Kristallring dahinter.
 *
 * Hier standen einmal vier Dinge gleichzeitig um Aufmerksamkeit: Portrait mittig,
 * Nebel, Terminalfenster rechts, Qualitaets-Regler oben rechts.
 *
 * Das Terminalfenster ist ganz weg, nicht verschoben. Es zeigte als `git status`
 * genau die fuenf Punkte, die der Werdegang direkt darunter ausfuehrlich
 * erzaehlt. Dieselbe Liste zweimal ist keine Verdichtung, sondern Wiederholung.
 * Vom Terminal bleibt die Idee da, wo sie etwas kostet: die `$ whoami`-Zeile
 * tippt sich selbst.
 *
 * Das Portrait ist ebenfalls raus. Der Kristallring der Projekte ist jetzt ueber
 * die ganze Seite sichtbar und kreist im Hero genau dort, wo das Portrait stand –
 * beide auf der rechten Haelfte. Zwei Blickfaenger auf derselben Flaeche gewinnt
 * keiner. Die Datei portrait.webp bleibt liegen, falls es woanders einen Platz
 * bekommt.
 *
 * Beim Scrollen zieht der Text weg und blendet aus, waehrend der Ring naeher
 * kommt: die Bewegung gehoert dem Scroll, nicht einer Zeitachse.
 */

const Hero = () => {
    const sectionRef = useRef<HTMLElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)

    const onProgress = useCallback((raw: number) => {
        // useScrollProgress begrenzt nicht mehr; oberhalb des Hero ist raw < 0.
        const p = Math.min(Math.max(raw, 0), 1)
        if (contentRef.current) {
            contentRef.current.style.transform = `translate3d(0, ${(-p * 18).toFixed(2)}vh, 0)`
            contentRef.current.style.opacity = String(Math.max(0, 1 - p * 1.6))
        }
    }, [])

    useScrollProgress(sectionRef, onProgress, "exit")

    return (
        <section ref={sectionRef} id="hero" className="relative min-h-screen w-full overflow-hidden">

            <div
                ref={contentRef}
                className="relative z-10 mx-auto flex min-h-screen max-w-[88rem] flex-col justify-center px-6 pt-14 will-change-transform sm:px-8 lg:px-12"
            >
                <motion.p
                    className="mb-6 font-mono text-[11px] uppercase tracking-[0.3em] text-white/40"
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{duration: 0.5, delay: 0.3, ease: EASE}}
                >
                    Informatik · Entwicklung · Schiedsrichter
                </motion.p>

                {/* Der Name als Bildmarke: eine Zeile pro Wort, dicht gesetzt,
                    Groesse an die Fensterbreite gekoppelt statt in Stufen. */}
                <h1 className="font-black uppercase leading-[0.82] tracking-[-0.045em]">
                    {["Jan", "Vogt"].map((word, i) => (
                        <span key={word} className="block overflow-hidden">
                            <motion.span
                                className={`block text-[clamp(4.5rem,15vw,13rem)] ${
                                    i === 1
                                        ? "bg-gradient-to-r from-glow via-[#c4a3ff] to-glow bg-clip-text text-transparent animate-gradient-shift"
                                        : "text-white"
                                }`}
                                initial={{y: "110%"}}
                                animate={{y: 0}}
                                transition={{duration: 1, delay: 0.35 + i * 0.1, ease: EASE}}
                            >
                                {word}
                            </motion.span>
                        </span>
                    ))}
                </h1>

                <motion.p
                    className="mt-8 max-w-md text-lg leading-relaxed text-white/60"
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.6, delay: 0.7, ease: EASE}}
                >
                    Informatik-Student an der FSU Jena,
                    <span className="text-brand"> Werkstudent bei ZEISS</span> und
                    <span className="text-white/85"> Schiedsrichter</span> im NOFV.
                </motion.p>

                <motion.div
                    className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4"
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.6, delay: 0.85, ease: EASE}}
                >
                    <button
                        onClick={() => scrollToElement("projects")}
                        className="group inline-flex items-center gap-2 text-base font-medium text-white"
                    >
                        Projekte ansehen
                        <ArrowRight className="h-4 w-4 text-brand transition-transform group-hover:translate-x-1"/>
                    </button>

                    <button
                        onClick={() => scrollToElement("contact")}
                        className="text-base text-white/50 transition-colors hover:text-white"
                    >
                        Kontakt
                    </button>
                </motion.div>
            </div>

            {/* Scroll-Hinweis */}
            <motion.button
                onClick={() => scrollToElement("about")}
                className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 text-white/30 transition-colors hover:text-white/60"
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                transition={{duration: 0.6, delay: 1.2}}
                aria-label="Zum Werdegang scrollen"
            >
                <motion.span
                    className="flex flex-col items-center gap-2"
                    animate={{y: [0, 7, 0]}}
                    transition={{duration: 2.2, repeat: Infinity, ease: "easeInOut"}}
                >
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em]">scroll</span>
                    <ArrowDown className="h-4 w-4"/>
                </motion.span>
            </motion.button>
        </section>
    )
}


export default Hero
