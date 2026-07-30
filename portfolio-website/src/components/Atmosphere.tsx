import {useCallback, useRef, useState} from "react"
import NebulaWebGL from "./NebulaWebGL"
import useScrollProgress from "@/lib/useScrollProgress"

/**
 * Der Hintergrund der GANZEN Seite – eine Schicht, die ueber alle Sektionen
 * hinweg stehen bleibt und sich mit dem Scroll wandelt.
 *
 * Vorher hat jede Sektion ihren eigenen Hintergrund gemalt: zwei weichgezeichnete
 * Farbflecken, ein Raster, teils eine Rauschebene – vier Mal derselbe Aufbau mit
 * anderen Werten. Genau daran sah man die Naht zwischen den Sektionen, und genau
 * das laesst eine Seite zusammengesetzt statt gebaut wirken.
 *
 * Jetzt gibt es EINEN Raum, durch den man sich bewegt. Die Farbe wandert mit dem
 * Fortschritt: Violett im Hero, Cyan durch Werdegang und Projekte (die Farbe der
 * Arbeit), Violett wieder zum Kontakt – die Seite schliesst sich damit dort, wo
 * sie angefangen hat.
 *
 * Die Deckkraft der Ebenen wird pro Frame direkt geschrieben, nicht ueber
 * React-State: das sind drei style-Zuweisungen statt eines Renderbaums.
 */

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1)

/* Wo die drei Stimmungen ihren Hoehepunkt haben, als Anteil der Seitenlaenge.
   HERO_END etwas hinter dem ersten Bildschirm, damit das Violett nicht schon
   verschwunden ist, wenn der Hero noch zu sehen ist. */
const HERO_END = 0.24
const WORK_CENTER = 0.52
const WORK_SPREAD = 0.42
const CONTACT_START = 0.76

/* Der Nebel ist bei NEBULA_END ausgeblendet; erst ab NEBULA_PAUSE haelt der
   Shader an. Der Abstand dazwischen ist Hysterese: ohne ihn wuerde ein Wackeln
   um die Schwelle die Schleife dauernd an- und abschalten. */
const NEBULA_END = 0.34
const NEBULA_PAUSE = 0.4

const Atmosphere = () => {
    const pageRef = useRef<HTMLElement>(document.documentElement)
    const heroRef = useRef<HTMLDivElement>(null)
    const workRef = useRef<HTMLDivElement>(null)
    const contactRef = useRef<HTMLDivElement>(null)
    const nebulaRef = useRef<HTMLDivElement>(null)
    const [nebulaPaused, setNebulaPaused] = useState(false)

    const onProgress = useCallback((p: number) => {
        if (heroRef.current) {
            heroRef.current.style.opacity = String(clamp01(1 - p / HERO_END))
        }
        if (workRef.current) {
            workRef.current.style.opacity = String(clamp01(1 - Math.abs(p - WORK_CENTER) / WORK_SPREAD))
        }
        if (contactRef.current) {
            contactRef.current.style.opacity = String(clamp01((p - CONTACT_START) / (1 - CONTACT_START)))
        }
        if (nebulaRef.current) {
            /* Drift nach oben erzeugt Tiefe, ohne dass etwas erkennbar
               "wandert". Die Ebenen darunter tragen den Raum weiter, wenn der
               Nebel ausgeblendet ist. */
            nebulaRef.current.style.opacity = String(clamp01(1 - p / NEBULA_END))
            nebulaRef.current.style.transform = `translate3d(0, ${(-p * 5).toFixed(2)}vh, 0)`
        }
        setNebulaPaused(p > NEBULA_PAUSE)
    }, [])

    useScrollProgress(pageRef, onProgress)

    return (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">

            {/* Grundton, immer da */}
            <div className="absolute inset-0 bg-page"/>

            {/* Hero – Violett */}
            <div
                ref={heroRef}
                className="absolute inset-0"
                style={{
                    background:
                        "radial-gradient(120% 90% at 50% 0%, #1b0f33 0%, rgba(11,7,22,0.65) 45%, transparent 75%)",
                }}
            />

            {/* Werdegang und Projekte – Cyan, die Farbe der Arbeit */}
            <div
                ref={workRef}
                className="absolute inset-0"
                style={{
                    opacity: 0,
                    background:
                        "radial-gradient(90% 70% at 85% 15%, rgba(34,211,238,0.10) 0%, transparent 60%), radial-gradient(80% 70% at 10% 85%, rgba(8,145,178,0.12) 0%, transparent 60%)",
                }}
            />

            {/* Kontakt – zurueck zu Violett */}
            <div
                ref={contactRef}
                className="absolute inset-0"
                style={{
                    opacity: 0,
                    background:
                        "radial-gradient(100% 80% at 15% 100%, rgba(139,92,246,0.18) 0%, transparent 60%), radial-gradient(70% 60% at 90% 20%, rgba(34,211,238,0.07) 0%, transparent 60%)",
                }}
            />

            {/* Nebel-Shader – einmal fuer die ganze Seite statt nur im Hero */}
            <div ref={nebulaRef} className="absolute inset-0 will-change-transform">
                <NebulaWebGL paused={nebulaPaused}/>
            </div>

            {/* Raster und Rauschen liegen ueber allem, EINMAL statt pro Sektion */}
            <div
                className="absolute inset-0 opacity-[0.025]"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
                    backgroundSize: "64px 64px",
                }}
            />
            <div
                className="absolute inset-0 opacity-[0.015]"
                style={{
                    backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                }}
            />

            {/* Vignette: haelt den Blick in der Mitte */}
            <div
                className="absolute inset-0"
                style={{
                    background:
                        "radial-gradient(130% 100% at 50% 50%, transparent 55%, rgba(5,7,13,0.7) 100%)",
                }}
            />
        </div>
    )
}

export default Atmosphere
