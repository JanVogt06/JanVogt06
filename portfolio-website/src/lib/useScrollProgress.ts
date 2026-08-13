import {useEffect} from "react"
import type {RefObject} from "react"

/**
 * Wie weit die Strecke reicht, ueber die gemessen wird.
 *
 * `pin`  – Elementhoehe minus ein Fenster: die Strecke, auf der ein
 *          `position: sticky`-Kind darin oben festklebt. Fuer die gepinnte
 *          Projekt-Schiene und den Werdegang.
 * `exit` – die ganze Elementhoehe: 1 ist erreicht, wenn das Element oben ganz
 *          hinausgescrollt ist. Fuer bildschirmhohe Abschnitte wie den Hero, wo
 *          `pin` eine Strecke von null ergaebe.
 */
export type ProgressMode = "pin" | "exit"

type Entry = {
    el: HTMLElement
    mode: ProgressMode
    onProgress: (progress: number) => void
    last: number
}

/**
 * ALLE Beobachter in einer Runde – und das ist keine Sparsamkeit, sondern der
 * Grund, warum das Scrollen ueberhaupt fluessig ist.
 *
 * Vorher hatte jeder Aufruf seine eigene rAF-Stufe. Fuenf Abschnitte heisst dann
 * pro Frame: Rechteck lesen, Stile schreiben, Rechteck lesen, Stile schreiben …
 * Jedes Lesen NACH einem Schreiben zwingt den Browser, das Layout neu zu
 * berechnen – gemessen sieben Layout-Anfragen pro Frame. Das ist Layout
 * Thrashing, und es war der Grund fuer das ruckelige Durchscrollen.
 *
 * Jetzt gibt es eine Runde mit zwei getrennten Phasen: erst werden ALLE
 * Rechtecke gelesen, danach werden alle Rueckrufe aufgerufen. Damit faellt genau
 * ein Layout pro Frame an, egal wie viele Abschnitte mitmachen.
 */
const entries = new Set<Entry>()
let frame = 0

const flush = () => {
    frame = 0

    // Phase 1: nur lesen.
    const viewport = window.innerHeight
    const measured: Array<{entry: Entry; progress: number}> = []
    entries.forEach((entry) => {
        const travel = entry.mode === "exit" ? entry.el.offsetHeight : entry.el.offsetHeight - viewport
        const progress = travel <= 0 ? 0 : -entry.el.getBoundingClientRect().top / travel
        measured.push({entry, progress})
    })

    // Phase 2: nur schreiben.
    measured.forEach(({entry, progress}) => {
        // Nur melden, wenn sich sichtbar etwas geaendert hat.
        if (Math.abs(progress - entry.last) < 0.0001) return
        entry.last = progress
        entry.onProgress(progress)
    })
}

const request = () => {
    if (frame) return
    frame = requestAnimationFrame(flush)
}

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
 * Fortschritt kann sich nur aendern, wenn gescrollt wird. Da lib/smoothScroll.ts
 * jeden Frame scrollt, ist das bildgenau.
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

        const entry: Entry = {el, mode, onProgress, last: -1}
        entries.add(entry)

        /* Der erste Beobachter bringt die Ereignisse mit, der letzte nimmt sie
           wieder weg. */
        if (entries.size === 1) {
            window.addEventListener("scroll", request, {passive: true})
            window.addEventListener("resize", request)
        }

        // Ausgangszustand sofort, ohne auf das erste Ereignis zu warten – nach
        // einem Reload mitten in einer Sektion muss der Stand gleich stimmen.
        flush()

        return () => {
            entries.delete(entry)
            if (entries.size === 0) {
                window.removeEventListener("scroll", request)
                window.removeEventListener("resize", request)
                if (frame) cancelAnimationFrame(frame)
                frame = 0
            }
        }
    }, [ref, onProgress, mode])
}

export default useScrollProgress
