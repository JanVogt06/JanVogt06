import {useEffect} from "react"
import type {RefObject} from "react"

/**
 * Wie weit die Strecke reicht, ueber die gemessen wird.
 *
 * `pin`  – Elementhoehe minus ein Fenster: die Strecke, auf der ein
 *          `position: sticky`-Kind darin oben festklebt. Fuer die gepinnte
 *          Projekt-Schiene.
 * `exit` – die ganze Elementhoehe: 1 ist erreicht, wenn das Element oben ganz
 *          hinausgescrollt ist. Fuer bildschirmhohe Abschnitte wie den Hero, wo
 *          `pin` eine Strecke von null ergaebe.
 */
export type ProgressMode = "pin" | "exit"

/**
 * Scroll-Fortschritt eines Elements. 0, sobald seine Oberkante die Oberkante des
 * Fensters erreicht; 1 am Ende der Strecke, die `mode` festlegt.
 *
 * ABSICHTLICH NICHT auf 0..1 begrenzt. Vor dem Element ist der Wert negativ,
 * danach groesser als 1 – und genau das braucht man: mit Begrenzung stand der
 * Wert vor dem Element konstant auf 0, der Rueckruf feuerte nicht mehr, und
 * Effekte, die sich beim HERANSCROLLEN aufbauen sollen, konnten nicht wissen, wie
 * weit es noch ist. Wer nur 0..1 will, begrenzt selbst.
 *
 * Angetrieben von scroll-Ereignissen, nicht von einer Dauerschleife: der
 * Fortschritt kann sich nur aendern, wenn gescrollt wird. Eine rAF-Stufe
 * dazwischen fasst mehrere Ereignisse pro Frame zusammen und sorgt dafuer, dass
 * gemessen wird, wenn der Browser ohnehin zeichnet. Da lib/smoothScroll.ts jeden
 * Frame scrollt, ist das bildgenau.
 *
 * Absichtlich ohne React-State: 60 Zustandsaenderungen pro Sekunde wuerden 60
 * Renderbaeume erzeugen. Der Rueckruf schreibt direkt in `style` – bei
 * scroll-gebundener Animation der uebliche Weg, framer-motion macht es intern
 * genauso.
 */
export const useScrollProgress = (
    ref: RefObject<HTMLElement | null>,
    onProgress: (progress: number) => void,
    mode: ProgressMode = "pin",
) => {
    useEffect(() => {
        const el = ref.current
        if (!el) return

        let frame = 0
        let last = -1

        const measure = () => {
            const travel =
                mode === "exit" ? el.offsetHeight : el.offsetHeight - window.innerHeight
            const progress = travel <= 0 ? 0 : -el.getBoundingClientRect().top / travel

            // Nur melden, wenn sich sichtbar etwas geaendert hat.
            if (Math.abs(progress - last) < 0.0001) return
            last = progress
            onProgress(progress)
        }

        const request = () => {
            if (frame) return
            frame = requestAnimationFrame(() => {
                frame = 0
                measure()
            })
        }

        // Ausgangszustand sofort, ohne auf das erste Ereignis zu warten – nach
        // einem Reload mitten in der Sektion muss die Schiene gleich stimmen.
        measure()

        window.addEventListener("scroll", request, {passive: true})
        window.addEventListener("resize", request)

        return () => {
            window.removeEventListener("scroll", request)
            window.removeEventListener("resize", request)
            if (frame) cancelAnimationFrame(frame)
        }
    }, [ref, onProgress, mode])
}

export default useScrollProgress
