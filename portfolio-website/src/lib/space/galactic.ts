import * as THREE from "three"

/**
 * Wo die Ebene der Milchstrasse liegt.
 *
 * Steht hier und nicht in den beiden Dateien, die sie brauchen, weil die
 * Milchstrasse aus zwei Teilen besteht, die genau uebereinander liegen muessen:
 *
 * - milkyway.ts zeichnet den diffusen Schimmer (eine Himmelskugel)
 * - starfield.ts setzt die koernigen Einzelsterne ins selbe Band
 *
 * Standen die Werte doppelt, lagen sie auch prompt auseinander: der Pol des
 * Sternbands war (0.27, 0.81, 0.52), der des Schimmers (0.42, 0.90, -0.15). Das
 * sind zwei verschiedene Baender – ein koerniger Streifen quer durch einen
 * milchigen. Genau die Art Fehler, die eine Datei mit einer Konstante verhindert.
 *
 * Angegeben ist die Lage ueber den POL, denn das Band ist der Grosskreis senkrecht
 * dazu. Das ist die brauchbare Groesse: steht der Pol senkrecht zur
 * Blickrichtung, laeuft das Band durch die Bildmitte. Der z-Anteil schiebt es aus
 * der Mitte, damit es nicht symmetrisch liegt.
 *
 * Ueber Euler-Winkel war das nicht zu treffen – (0.5, 0, -0.34) legte das Band in
 * die obere rechte Ecke, zu 90 % aus dem Bild.
 */
export const GALACTIC_POLE = new THREE.Vector3(0.42, 0.9, -0.15).normalize()

/**
 * Drehung um den Pol. Sie entscheidet, welcher Teil des Bandes vorne liegt – und
 * damit, ob man den hellen Wulst Richtung Zentrum sieht.
 */
export const GALACTIC_SPIN = Math.PI * 0.5

/** Die Drehung, die ein Band bei y = 0 in die galaktische Ebene legt. */
export const galacticOrientation = () =>
    new THREE.Quaternion()
        .setFromAxisAngle(GALACTIC_POLE, GALACTIC_SPIN)
        .multiply(
            new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                GALACTIC_POLE,
            ),
        )
