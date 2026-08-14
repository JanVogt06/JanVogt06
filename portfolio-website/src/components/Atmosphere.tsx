import {useCallback, useEffect, useRef, useState} from "react"
import {SpaceScene} from "@/lib/space/SpaceScene"
import type {Pick} from "@/lib/space/SpaceScene"
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
 * Jetzt gibt es EINEN Raum: Farbebenen aus CSS, darauf die WebGL-Szene mit Nebel,
 * Galaxie und Kristallen.
 *
 * Die Ebenen sind absichtlich sehr dunkel und kaum gefaerbt. Sie trugen einmal
 * ein kraeftiges Violett und ein deutliches Cyan – zusammen mit dem damals
 * magentafarbenen Nebel war die ganze Seite lila. Leerer Weltraum ist fast
 * schwarz; Farbe gehoert in einzelne Strukturen (Galaxie, Emissionsnebel,
 * Sterne), nicht als Waesche darueber. Die Ebenen geben nur noch Tiefe und einen
 * Hauch Richtung: kuehl im Hero, ein Anflug Cyan bei der Arbeit, gedecktes
 * Blauviolett zum Schluss.
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
    onPick,
}: {
    /** Laeuft die WebGL-Szene (Nebel)? Sonst bleibt es bei den CSS-Ebenen. */
    scene: boolean
    /** Anzahl anklickbarer Steine. 0 = Nebel ohne Kristalle. */
    crystalCount: number
    /** Ein Klick im Raum – auf einen Kristall oder auf einen Planeten. */
    onPick: (pick: Pick) => void
}) => {
    const pageRef = useRef<HTMLElement>(document.documentElement)
    const heroRef = useRef<HTMLDivElement>(null)
    const workRef = useRef<HTMLDivElement>(null)
    const contactRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<SpaceScene | null>(null)

    const [hovered, setHovered] = useState<Pick | null>(null)

    /* Die Callbacks liegen in Refs, damit ein neues onPick nicht die Szene neu
       aufbaut – das waere jedes Mal ein neuer WebGL-Kontext. */
    const selectRef = useRef(onPick)
    useEffect(() => {
        selectRef.current = onPick
    }, [onPick])

    useEffect(() => {
        if (!canvasRef.current || !sceneEnabled) return

        const scene = new SpaceScene({
            container: canvasRef.current,
            count: crystalCount,
            onHover: setHovered,
            onSelect: (pick) => selectRef.current(pick),
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

            {/* Hero.
                Stand auf einem kraeftigen Violett (#2a1552). Das war neben dem
                Nebel die zweite Quelle des Lilastichs und lag als Flaeche ueber
                dem ganzen ersten Bildschirm. Jetzt ein sehr dunkles Blaugrau: es
                gibt dem Hero Tiefe, ohne ihn zu faerben – und traegt weiterhin
                den Fall, dass die Szene gar nicht laeuft (schwaches Geraet,
                reduzierte Bewegung, kein WebGL). Flach schwarz ist er nie. */}
            <div
                ref={heroRef}
                className="absolute inset-0"
                style={{
                    background:
                        "radial-gradient(115% 80% at 50% -10%, #101728 0%, #0a0f1c 38%, rgba(7,9,16,0.6) 62%, transparent 82%)",
                }}
            />

            {/* Werdegang und Projekte – ein Hauch Cyan, halbiert. Es soll die
                Sektion einfaerben, nicht sie beleuchten. */}
            <div
                ref={workRef}
                className="absolute inset-0"
                style={{
                    opacity: 0,
                    background:
                        "radial-gradient(90% 70% at 85% 15%, rgba(34,211,238,0.05) 0%, transparent 62%), radial-gradient(80% 70% at 10% 85%, rgba(8,145,178,0.06) 0%, transparent 62%)",
                }}
            />

            {/* Kontakt – die Seite schliesst sich, aber gedeckt: ein tiefes
                Blauviolett bei einem Drittel der vorherigen Deckkraft. */}
            <div
                ref={contactRef}
                className="absolute inset-0"
                style={{
                    opacity: 0,
                    background:
                        "radial-gradient(100% 80% at 15% 100%, rgba(94,78,168,0.09) 0%, transparent 62%), radial-gradient(70% 60% at 90% 20%, rgba(34,211,238,0.04) 0%, transparent 62%)",
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

            {/* Zeigt an, dass etwas im Raum anklickbar ist – ein Stein in den
                Projekten oder ein Planet im Werdegang. Die Canvas selbst kann
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
