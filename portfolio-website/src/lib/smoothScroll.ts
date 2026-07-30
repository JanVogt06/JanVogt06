import {useEffect} from "react"

/**
 * Traeges Scrollen.
 *
 * Das Rad setzt nicht die Position, sondern ein ZIEL; die tatsaechliche Position
 * laeuft ihm jeden Frame ein Stueck nach. Daraus entsteht das schwere Gleiten,
 * das Seiten wie igloo.inc ihr Gefuehl gibt.
 *
 * Bewusst ueber window.scrollTo und NICHT ueber ein transformiertes Wrapper-Div:
 * ein Transform am Vorfahren macht `position: sticky` darin wirkungslos, und die
 * gepinnte Projekt-Sektion haengt genau daran. Ausserdem bleibt so die echte
 * Scrollbar, die Scroll-Position ueberlebt einen Reload, und Anker
 * funktionieren.
 *
 * Aus:
 * - bei prefers-reduced-motion – kuenstliche Traegheit ist genau die Bewegung,
 *   die dort nicht gewollt ist
 * - auf Touch-Geraeten: die haben ihre eigene, bessere Momentum-Physik, und
 *   preventDefault auf touchmove wuerde sie ersetzen statt ergaenzen
 */

/* 0.09 pro Frame: bei 60 Hz sind ~90 % der Strecke nach etwa 0,4 s geschafft.
   Hoeher wirkt hektisch, niedriger faengt an, sich nach Verzoegerung
   anzufuehlen statt nach Gewicht. */
const LERP = 0.09

/* Ab hier gilt das Ziel als erreicht. Unter einem halben Pixel ist keine
   Bewegung mehr zu sehen, die Schleife darf anhalten. */
const EPSILON = 0.5

/* Bewegt sich die Seite, waehrend unsere Schleife steht, war es jemand anders
   (Tastatur, Scrollbar, Seite-suchen) – dann uebernehmen wir dessen Position.
   Der Schwellwert faengt nur das Pixel-Runden von scrollY ab. */
const FOREIGN_SCROLL_THRESHOLD = 2

type Controller = {
    /** Ziel direkt setzen, z.B. fuer die Navigation. */
    scrollTo: (top: number) => void
    active: boolean
}

let controller: Controller | null = null

const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

const isTouch = () => window.matchMedia("(pointer: coarse)").matches

const maxScroll = () =>
    Math.max(0, document.documentElement.scrollHeight - window.innerHeight)

const clamp = (value: number) => Math.min(Math.max(value, 0), maxScroll())

/**
 * Scrollt ein Element in den Blick – ueber das Ziel des Smooth-Scrollings, wenn
 * es laeuft, sonst native. Die Navigation ruft nur das hier auf und muss nichts
 * ueber die Mechanik wissen.
 */
export const scrollToElement = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return

    if (controller?.active) {
        // scroll-padding-top des <html> beruecksichtigen, damit das Ziel nicht
        // unter der fixierten Repo-Leiste landet.
        const padding = parseFloat(
            getComputedStyle(document.documentElement).scrollPaddingTop || "0",
        )
        controller.scrollTo(el.getBoundingClientRect().top + window.scrollY - (padding || 0))
        return
    }

    el.scrollIntoView({behavior: prefersReducedMotion() ? "auto" : "smooth"})
}

/**
 * Scrollt ein Element mit eigener Scrollleiste unter dem Zeiger? Dann gehoert
 * das Rad ihm, nicht der Seite.
 */
const ownsWheel = (node: EventTarget | null, deltaY: number) => {
    let el = node instanceof Element ? node : null
    while (el && el !== document.body) {
        if (el.hasAttribute("data-native-scroll")) return true
        const style = getComputedStyle(el)
        const scrollable = /auto|scroll|overlay/.test(style.overflowY)
        if (scrollable && el.scrollHeight > el.clientHeight) {
            const atTop = el.scrollTop <= 0
            const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1
            // Nur solange es selbst noch scrollen kann; am Ende uebernimmt die Seite.
            if (!(deltaY < 0 && atTop) && !(deltaY > 0 && atBottom)) return true
        }
        el = el.parentElement
    }
    return false
}

/** Rad-Delta in Pixel – je nach Geraet kommen Zeilen oder Seiten. */
const deltaToPixels = (event: WheelEvent) => {
    if (event.deltaMode === 1) return event.deltaY * 16
    if (event.deltaMode === 2) return event.deltaY * window.innerHeight
    return event.deltaY
}

export const useSmoothScroll = () => {
    useEffect(() => {
        if (prefersReducedMotion() || isTouch()) {
            controller = {scrollTo: () => {}, active: false}
            return () => {
                controller = null
            }
        }

        let target = window.scrollY
        let current = target
        let frame = 0

        const tick = () => {
            const distance = target - current
            if (Math.abs(distance) < EPSILON) {
                current = target
                window.scrollTo(0, current)
                frame = 0
                return
            }
            current += distance * LERP
            window.scrollTo(0, current)
            frame = requestAnimationFrame(tick)
        }

        const start = () => {
            if (!frame) frame = requestAnimationFrame(tick)
        }

        const onWheel = (event: WheelEvent) => {
            if (event.ctrlKey) return // Pinch-Zoom
            if (ownsWheel(event.target, event.deltaY)) return
            event.preventDefault()
            target = clamp(target + deltaToPixels(event))
            start()
        }

        /**
         * Fremdes Scrollen uebernehmen – aber nur, solange die Schleife steht.
         *
         * Waehrend sie laeuft, gehoert die Scroll-Position uns, und jedes
         * scroll-Ereignis ist die Antwort auf unser eigenes scrollTo. Man darf es
         * dann NICHT mit der aktuellen Position vergleichen: Browser fassen
         * scroll-Ereignisse zusammen und liefern sie erst nach dem Frame, sodass
         * die gemeldete Position im Gleitflug regelmaessig um mehr als einen
         * Pixel hinterherhaengt. Genau daran ist eine fruehere Fassung
         * gescheitert – sie hielt das fuer fremdes Scrollen und brach nach drei
         * Frames ab.
         */
        const onScroll = () => {
            if (frame) return
            if (Math.abs(window.scrollY - current) <= FOREIGN_SCROLL_THRESHOLD) return
            current = target = window.scrollY
        }

        const onResize = () => {
            target = clamp(target)
        }

        controller = {
            active: true,
            scrollTo: (top) => {
                target = clamp(top)
                start()
            },
        }

        window.addEventListener("wheel", onWheel, {passive: false})
        window.addEventListener("scroll", onScroll, {passive: true})
        window.addEventListener("resize", onResize)

        return () => {
            if (frame) cancelAnimationFrame(frame)
            window.removeEventListener("wheel", onWheel)
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onResize)
            controller = null
        }
    }, [])
}
