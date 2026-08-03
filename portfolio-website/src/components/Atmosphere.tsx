import {useCallback, useEffect, useRef, useState} from "react"
import {SpaceScene} from "@/lib/space/SpaceScene"
import {attachScene, emitAnchor} from "@/lib/space/controller"
import useScrollProgress from "@/lib/useScrollProgress"

/**
 * Der Hintergrund der GANZEN Seite – eine Schicht, die ueber alle Sektionen
 * hinweg stehen bleibt und sich mit dem Scroll wandelt.
 *
 * Vorher hat jede Sektion ihren eigenen Hintergrund gemalt: zwei
 * weichgezeichnete Farbflecken, ein Raster, teils eine Rauschebene – vier Mal
 * derselbe Aufbau mit anderen Werten. Genau daran sah man die Naht zwischen den
 * Sektionen, und genau das laesst eine Seite zusammengesetzt statt gebaut wirken.
 *
 * Jetzt gibt es EINEN Raum: Farbebenen aus CSS, darauf die WebGL-Szene mit Nebel
 * und Kristallen. Die Stimmung wandert mit dem Fortschritt – Violett im Hero,
 * Cyan durch Werdegang und Projekte, Violett wieder zum Kontakt.
 *
 * Die Deckkraft der Ebenen wird pro Frame direkt geschrieben, nicht ueber
 * React-State: das sind drei style-Zuweisungen statt eines Renderbaums.
 */

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1)

/* Wo die drei Stimmungen ihren Hoehepunkt haben, als Anteil der Seitenlaenge. */
const HERO_END = 0.24
const WORK_CENTER = 0.52
const WORK_SPREAD = 0.42
const CONTACT_START = 0.76

const Atmosphere = ({
    scene: sceneEnabled,
    crystalCount,
    onSelectCrystal,
}: {
    /** Laeuft die WebGL-Szene (Nebel)? Sonst bleibt es bei den CSS-Ebenen. */
    scene: boolean
    /** Anzahl anklickbarer Steine. 0 = Nebel ohne Kristalle. */
    crystalCount: number
    onSelectCrystal: (index: number) => void
}) => {
    const pageRef = useRef<HTMLElement>(document.documentElement)
    const heroRef = useRef<HTMLDivElement>(null)
    const workRef = useRef<HTMLDivElement>(null)
    const contactRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<SpaceScene | null>(null)

    const [hovered, setHovered] = useState<number | null>(null)

    /* Die Callbacks liegen in Refs, damit ein neuer onSelectCrystal nicht die
       Szene neu aufbaut – das waere jedes Mal ein neuer WebGL-Kontext. */
    const selectRef = useRef(onSelectCrystal)
    useEffect(() => {
        selectRef.current = onSelectCrystal
    }, [onSelectCrystal])

    useEffect(() => {
        if (!canvasRef.current || !sceneEnabled) return

        const scene = new SpaceScene({
            container: canvasRef.current,
            count: crystalCount,
            onHover: setHovered,
            onSelect: (index) => selectRef.current(index),
            onAnchor: emitAnchor,
        })
        sceneRef.current = scene
        attachScene(scene)

        return () => {
            attachScene(null)
            sceneRef.current = null
            scene.dispose()
        }
    }, [sceneEnabled, crystalCount])

    const onProgress = useCallback((raw: number) => {
        // useScrollProgress begrenzt nicht mehr – hier ist 0..1 gewollt.
        const p = clamp01(raw)
        if (heroRef.current) {
            heroRef.current.style.opacity = String(clamp01(1 - p / HERO_END))
        }
        if (workRef.current) {
            workRef.current.style.opacity = String(clamp01(1 - Math.abs(p - WORK_CENTER) / WORK_SPREAD))
        }
        if (contactRef.current) {
            contactRef.current.style.opacity = String(clamp01((p - CONTACT_START) / (1 - CONTACT_START)))
        }
        sceneRef.current?.setPageProgress(p)
    }, [])

    useScrollProgress(pageRef, onProgress)

    return (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">

            {/* Grundton, immer da */}
            <div className="absolute inset-0 bg-page"/>

            {/* Hero – Violett.
                Kraeftig genug, dass der Hero auch ohne die Szene nach etwas
                aussieht: auf schwachen Geraeten laeuft sie auf Stufe 0, bei
                prefers-reduced-motion gar nicht, und ohne WebGL fehlt sie ganz.
                Der Hintergrund darf in keinem dieser Faelle flach schwarz sein. */}
            <div
                ref={heroRef}
                className="absolute inset-0"
                style={{
                    background:
                        "radial-gradient(115% 80% at 50% -10%, #2a1552 0%, #150c2b 35%, rgba(9,7,20,0.6) 60%, transparent 80%)",
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

            {/* Nebel und Kristalle – eine Canvas, ein WebGL-Kontext */}
            <div ref={canvasRef} className="absolute inset-0"/>

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

            {/* Vignette: haelt den Blick in der Mitte. Zurueckhaltend und spaet
                einsetzend – eine kraeftigere Fassung hat die Violett-Ebene am
                oberen Rand aufgefressen, genau dort, wo sie leuchten soll. */}
            <div
                className="absolute inset-0"
                style={{
                    background:
                        "radial-gradient(140% 110% at 50% 45%, transparent 70%, rgba(5,7,13,0.55) 100%)",
                }}
            />

            {/* Zeigt an, dass ein Stein anklickbar ist. Die Canvas selbst kann
                keinen cursor setzen, weil sie hinter dem Inhalt liegt und keine
                Zeiger-Ereignisse bekommt – deshalb haengt der Zeiger am body. */}
            {hovered !== null && <CursorHint/>}
        </div>
    )
}

/** Setzt den Zeiger auf "anklickbar", solange ein Stein unter ihm liegt. */
const CursorHint = () => {
    useEffect(() => {
        const previous = document.body.style.cursor
        document.body.style.cursor = "pointer"
        return () => {
            document.body.style.cursor = previous
        }
    }, [])
    return null
}

export default Atmosphere
