import type {SpaceScene, Anchor} from "./SpaceScene"

/**
 * Zugriff auf die eine Weltraum-Szene von ueberall auf der Seite.
 *
 * Es gibt genau eine Szene (einen WebGL-Kontext), und die Projekt-Sektion muss
 * ihr pro Frame ihren Scroll-Fortschritt geben – und umgekehrt jeden Frame
 * erfahren, wo der vordere Stein im Bild steht, um die Beschriftungspfeile
 * daranzuhaengen.
 *
 * Beides durch React zu schicken hiesse, sechzig Renderbaeume pro Sekunde zu
 * bauen, um am Ende Zahlen in style-Attribute zu schreiben. Reine Zustaende
 * (welches Projekt ist offen?) laufen weiter ueber Props – das gehoert React.
 * Hier liegt nur, was jeden Frame passiert.
 */

let current: SpaceScene | null = null
let anchorListener: ((anchor: Anchor) => void) | null = null

export const attachScene = (scene: SpaceScene | null) => {
    current = scene
}

/** Von der Szene aufgerufen, jeden Frame. */
export const emitAnchor = (anchor: Anchor) => {
    anchorListener?.(anchor)
}

/** Auf die Position des vorderen Steins hoeren. Gibt die Abmeldung zurueck. */
export const subscribeAnchor = (listener: (anchor: Anchor) => void) => {
    anchorListener = listener
    return () => {
        if (anchorListener === listener) anchorListener = null
    }
}

/** Alle Aufrufe sind wirkungslos, solange keine Szene laeuft (Rueckfallebene). */
export const space = {
    hasScene: () => current !== null,
    setFieldProgress: (progress: number) => current?.setFieldProgress(progress),
    /** 0 = Ring weit weg, 1 = Sektion steht. Steuert das Heranziehen. */
    setApproach: (approach: number) => current?.setApproach(approach),
    setPaused: (paused: boolean) => current?.setPaused(paused),
    setSelected: (index: number | null) => current?.setSelected(index),
}
