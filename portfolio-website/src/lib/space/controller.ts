import type {SpaceScene} from "./SpaceScene"

/**
 * Zugriff auf die eine Weltraum-Szene von ueberall auf der Seite.
 *
 * Es gibt genau eine Szene (einen WebGL-Kontext), und die Projekt-Sektion muss
 * ihr pro Frame ihren Scroll-Fortschritt geben. Das durch einen React-Context zu
 * schicken hiesse, sechzig Renderbaeume pro Sekunde zu bauen, um am Ende eine
 * Zahl in eine Klasse zu schreiben.
 *
 * Reine Zustaende (welches Projekt ist offen?) laufen weiter ueber Props –
 * das gehoert React. Hier liegt nur, was jeden Frame passiert.
 */

let current: SpaceScene | null = null

export const attachScene = (scene: SpaceScene | null) => {
    current = scene
}

/** Alle Aufrufe sind wirkungslos, solange keine Szene laeuft (Rueckfallebene). */
export const space = {
    hasScene: () => current !== null,
    setFieldProgress: (progress: number) => current?.setFieldProgress(progress),
    setFieldVisible: (visible: boolean) => current?.setFieldVisible(visible),
    setPaused: (paused: boolean) => current?.setPaused(paused),
    setFocus: (index: number | null) => current?.setFocus(index),
}
