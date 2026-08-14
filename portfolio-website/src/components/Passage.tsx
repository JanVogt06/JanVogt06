import {useCallback, useRef} from "react"
import useScrollProgress from "@/lib/useScrollProgress"
import useMediaQuery from "@/lib/useMediaQuery"
import {space} from "@/lib/space/controller"

/**
 * Der Durchflug durch die Galaxie – die Etappe zwischen Werdegang und Projekten.
 *
 * Vorher endete der Werdegang-Flug sechs Einheiten vor der Scheibe: bei Station 03
 * steckte man schon darin, und der Durchflug selbst fiel mitten in die
 * Projekt-Sektion. Beides zur falschen Zeit.
 *
 * Jetzt bringt der Werdegang die Kamera bis VOR die Galaxie (sie naehert sich
 * ueber die drei Stationen von 66 auf 28 Einheiten), und diese Etappe fliegt
 * hindurch, bevor die Projekte uebernehmen.
 *
 * ABSICHTLICH OHNE INHALT
 *
 * Kein Text, keine Ueberschrift, nichts – der Durchflug ist der Inhalt. Alles,
 * was hier stehen wuerde, muesste gegen ein bildschirmfuellendes Sternenfeld
 * ankommen und wuerde dabei verlieren. Die Sektion ist reine Scroll-Strecke: eine
 * Hoehe und ein Fortschritt, der die Kamera fuehrt.
 *
 * Sie entfaellt vollstaendig, wenn die Szene nicht laeuft (schmale oder flache
 * Fenster, reduzierte Bewegung). Dann waere es eine leere Flaeche, durch die man
 * grundlos scrollt.
 */

/** Wie lang die Strecke ist. Zwei Bildschirmhoehen tragen den Durchflug. */
const LENGTH_VH = 200

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

const PassageFlight = () => {
    const sectionRef = useRef<HTMLDivElement>(null)

    const onProgress = useCallback((raw: number) => {
        space.setPassageProgress(clamp01(raw))
    }, [])

    useScrollProgress(sectionRef, onProgress)

    return <div ref={sectionRef} aria-hidden="true" style={{height: `${LENGTH_VH}vh`}}/>
}

const Passage = () => {
    /* Dieselbe Bedingung wie beim Werdegang: nur wo der Flug ueberhaupt
       stattfindet, gibt es auch eine Strecke dafuer. */
    const roomy = useMediaQuery("(min-width: 1024px) and (min-height: 700px)")
    const reduced = useMediaQuery("(prefers-reduced-motion: reduce)")

    if (!roomy || reduced) return null
    return <PassageFlight/>
}

export default Passage
