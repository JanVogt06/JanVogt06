/**
 * Zwei getrennte Fragen, die vorher versehentlich eine waren:
 *
 * 1. Laeuft die WebGL-Szene ueberhaupt (also der Nebel)?
 * 2. Kommen darin auch die anklickbaren Kristalle vor?
 *
 * Sie zusammenzuwerfen hiess: ein schmales Desktop-Fenster verliert nicht nur die
 * Kristalle, sondern auch den Nebel – und der Hintergrund ist dort nur noch CSS,
 * obwohl das Geraet mehr koennte.
 *
 * Das Ergebnis des Kontext-Tests wird gemerkt: er legt selbst einen WebGL-Kontext
 * an, und die sind knapp.
 */

let webgl2: boolean | null = null

const hasWebGL2 = () => {
    if (webgl2 !== null) return webgl2
    try {
        const canvas = document.createElement("canvas")
        const context = canvas.getContext("webgl2")
        webgl2 = context !== null
        /* Kontext ausdruecklich freigeben. Ohne das haelt ihn der Browser bis zur
           Garbage Collection, und die Live-Vorschauen brauchen jeden. */
        context?.getExtension("WEBGL_lose_context")?.loseContext()
    } catch {
        webgl2 = false
    }
    return webgl2
}

/** Ab dieser Breite passen Steine und Textblock nebeneinander. */
export const CRYSTALS_MIN_WIDTH = 1024

/**
 * Darf die Szene laufen?
 *
 * - WebGL2 muss da sein, sonst gibt es kein Bild.
 * - Keine reduzierte Bewegung: ein sich ewig umwaelzender Nebel und eine Kamera,
 *   die durch ein Feld fliegt, sind genau die Bewegung, die dort abgewaehlt wurde.
 * - Kein grober Zeiger: auf Telefonen und Tablets bleibt es beim CSS-Hintergrund.
 *   Nicht weil sie es nicht koennten, sondern weil Akku und Waerme dort mehr
 *   zaehlen als eine Ebene, die man kaum sieht – und die Farbebenen sind genau
 *   fuer diesen Fall kraeftig genug gebaut.
 */
export const sceneSupported = () =>
    hasWebGL2() &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    !window.matchMedia("(pointer: coarse)").matches

/** Und kommen die anklickbaren Steine dazu? Nur wenn auch Platz dafuer ist. */
export const crystalsSupported = () =>
    sceneSupported() && window.innerWidth >= CRYSTALS_MIN_WIDTH
