import {useCallback, useRef} from "react"
import {ArrowDown, ArrowRight} from "lucide-react"
import {motion, useReducedMotion} from "framer-motion"
import portraitImage from "../data/images/portrait.webp"
import {EASE} from "@/lib/motion"
import useTypewriter from "@/lib/useTypewriter"
import useScrollProgress from "@/lib/useScrollProgress"
import {scrollToElement} from "@/lib/smoothScroll"

/**
 * Hero als Titelkarte: Atmosphaere, ein riesiger Name, eine Zeile, weiter.
 *
 * Vorher standen hier vier Dinge gleichzeitig um Aufmerksamkeit: das Portrait
 * mittig, der Nebel, ein Terminalfenster rechts und der Qualitaets-Regler oben
 * rechts. Auf einem 1280er-Fenster hat das Portrait die Ueberschrift beschnitten.
 *
 * Das Terminalfenster ist ganz weg, nicht nur verschoben. Es zeigte als
 * `git status` genau die fuenf Punkte, die der Werdegang direkt darunter
 * ausfuehrlich erzaehlt – B.Sc., Werkstudent, Oberliga, Wurzel, Bad Berka. Die
 * gleiche Liste zweimal auf zwei Bildschirmen ist keine Verdichtung, sondern
 * Wiederholung. Vom Terminal bleibt die Idee an der Stelle, wo sie etwas kostet:
 * die `$ whoami`-Zeile tippt sich selbst.
 *
 * Das Portrait bleibt – ein Portfolio ohne Gesicht ist aermer –, aber rechts und
 * angeschnitten statt mittig, damit es die Typografie rahmt statt mit ihr zu
 * konkurrieren.
 *
 * Beim Scrollen zieht der Text schneller weg als das Portrait und blendet aus.
 * Das ist derselbe Griff wie bei der Projekt-Schiene: die Bewegung gehoert dem
 * Scroll, nicht einer Zeitachse.
 */

const COMMAND = "whoami"

const Hero = () => {
    const sectionRef = useRef<HTMLElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const portraitRef = useRef<HTMLDivElement>(null)
    const reduced = useReducedMotion()

    const {typed, done} = useTypewriter(COMMAND, {startDelay: 550, cps: 18, enabled: !reduced})

    const onProgress = useCallback((p: number) => {
        if (contentRef.current) {
            contentRef.current.style.transform = `translate3d(0, ${(-p * 18).toFixed(2)}vh, 0)`
            contentRef.current.style.opacity = String(Math.max(0, 1 - p * 1.6))
        }
        if (portraitRef.current) {
            // Langsamer als der Text: dadurch entsteht Tiefe.
            portraitRef.current.style.transform = `translate3d(0, ${(-p * 7).toFixed(2)}vh, 0)`
            portraitRef.current.style.opacity = String(Math.max(0, 1 - p * 1.15))
        }
    }, [])

    useScrollProgress(sectionRef, onProgress, "exit")

    return (
        <section ref={sectionRef} id="hero" className="relative min-h-screen w-full overflow-hidden">

            {/* Portrait: rechts, angeschnitten, hinter dem Text */}
            <div
                ref={portraitRef}
                className="pointer-events-none absolute inset-y-0 right-0 z-0 hidden w-[55%] justify-end will-change-transform md:flex"
            >
                <motion.img
                    src={portraitImage}
                    alt="Jan Vogt"
                    initial={{opacity: 0, scale: 1.04}}
                    animate={{opacity: 1, scale: 1}}
                    transition={{duration: 1.2, delay: 0.15, ease: EASE}}
                    className="h-full w-auto self-end object-contain object-bottom"
                    style={{
                        /* Nach links und oben ausblenden, damit keine Kante
                           entsteht und der Text auf jedem Untergrund lesbar
                           bleibt. */
                        maskImage:
                            "linear-gradient(to left, black 55%, transparent 100%), linear-gradient(to top, black 70%, transparent 100%)",
                        maskComposite: "intersect",
                        WebkitMaskImage:
                            "linear-gradient(to left, black 55%, transparent 100%), linear-gradient(to top, black 70%, transparent 100%)",
                        WebkitMaskComposite: "source-in",
                    }}
                />
            </div>

            <div
                ref={contentRef}
                className="relative z-10 mx-auto flex min-h-screen max-w-[88rem] flex-col justify-center px-6 pt-14 will-change-transform sm:px-8 lg:px-12"
            >
                <motion.p
                    className="mb-6 font-mono text-sm text-white/50"
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{duration: 0.5, delay: 0.3, ease: EASE}}
                >
                    <span className="text-status">$</span> {typed}
                    {!done && <Caret/>}
                    {/* Der Zusatz erst ab sm: auf 375 px bricht die Zeile sonst um. */}
                    {done && (
                        <span className="hidden text-white/35 sm:inline">
                            {" "}— informatik · developer · referee
                        </span>
                    )}
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

/** Blinkender Block-Cursor. */
const Caret = () => (
    <span className="ml-0.5 inline-block h-[1.05em] w-[0.5em] translate-y-[0.15em] bg-brand animate-caret"/>
)

export default Hero
