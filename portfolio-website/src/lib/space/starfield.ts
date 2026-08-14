import * as THREE from "three"
import {galacticOrientation} from "./galactic"

/**
 * Sterne als echte Punkte im Raum.
 *
 * WARUM SIE NICHT MEHR IM HINTERGRUND-SHADER LIEGEN
 *
 * Vorher zeichnete der Nebel-Shader sie mit: ein bildschirmfuellendes Rechteck
 * vor einer orthografischen Kamera. Dieses Rechteck bewegt sich NIE. Egal wie weit
 * die Kamera durch den Raum fliegt, die Sterne standen still – und genau daran
 * merkt man, dass etwas aufgeklebt ist. Beim Zoom in die Galaxie wuchs die Galaxie,
 * der Himmel dahinter nicht.
 *
 * Als Punkte in der Szene machen sie die Bewegung mit. Das ist der Unterschied
 * zwischen einem Bild vom Weltraum und dem Gefuehl, sich darin zu bewegen.
 *
 * ZWEI FELDER
 *
 * `sky`  – folgt der Kamera und liegt damit praktisch im Unendlichen: der
 *          Sternenhimmel. Er dreht sich nicht mit und laeuft nicht weg.
 * `near` – steht fest im Raum. An ihm zieht man vorbei, und DAS erzeugt die
 *          Parallaxe. Ohne dieses Feld gibt es keine Bewegung, mit ihm fliegt man.
 *
 * DIE MILCHSTRASSE
 *
 * Gleichmaessig ueber eine Kugel verteilte Punkte ergeben keinen Sternenhimmel,
 * sondern ein Punktemuster – und so sah es auch aus. Der echte Himmel hat eine
 * Struktur, und zwar genau eine grosse: das Band der Milchstrasse. Wir schauen von
 * innen durch die Scheibe unserer Galaxie, deshalb stehen dort ueberwaeltigend
 * viele Sterne, die einzeln nicht mehr aufloesbar sind und als milchiges Licht
 * verschmelzen. Quer darueber liegen Staubwolken – die dunklen Risse.
 *
 * Deshalb liegt hier der Grossteil der Sterne in einem Band: sehr viele, sehr
 * kleine, sehr schwache. Sie sind einzeln kaum zu sehen und ergeben zusammen den
 * Schimmer. Die helleren Einzelsterne stehen weiter darueber verteilt.
 *
 * HELLIGKEITSVERTEILUNG
 *
 * Ein erster Versuch nahm die fuenfte Potenz einer Zufallszahl. Das ist zwar die
 * Richtung, in die echte Helligkeiten verteilt sind, war aber viel zu scharf: fast
 * alle Sterne landeten bei 4 % Helligkeit und der Himmel war leer. Hier steht die
 * Verteilung flacher und mit einer Untergrenze – viele gut sichtbare schwache
 * Sterne, einzelne sehr helle.
 */

const vertexShader = `
    attribute float aSize;
    attribute float aBright;
    attribute vec3 aColor;

    uniform float uTime;
    uniform float uPixelRatio;
    /** 0 = feste Groesse (Himmel), 1 = mit der Entfernung kleiner (Nahfeld). */
    uniform float uAttenuate;
    uniform float uSizeScale;
    /** Ab wo das Nahfeld einblendet und ab wo es voll da ist. */
    uniform vec2 uNearFade;
    uniform float uMaxSize;

    varying vec3 vColor;
    varying float vBright;

    void main() {
        vColor = aColor;

        vec4 view = modelViewMatrix * vec4(position, 1.0);
        float dist = max(-view.z, 0.001);

        /* Sehr nahe Sterne ausblenden, sonst schiebt sich beim Vorbeifliegen ein
           einzelner als Flaeche vor das Bild. Gilt nur fuers Nahfeld – der Himmel
           ist immer gleich weit weg. */
        float nearFade = mix(1.0, smoothstep(uNearFade.x, uNearFade.y, dist), uAttenuate);

        /* Sechs Prozent Schwankung. Mehr waere Funkeln, und Funkeln ist
           Luftunruhe – im Weltraum gibt es keine. */
        float flicker = 0.94 + 0.06 * sin(uTime * (0.5 + aBright * 2.0) + aSize * 30.0);

        vBright = aBright * nearFade * flicker;

        gl_Position = projectionMatrix * view;

        float attenuated = uSizeScale / dist;
        float size = aSize * mix(1.0, attenuated, uAttenuate);
        gl_PointSize = clamp(size * uPixelRatio, 0.5, uMaxSize);
    }
`

const fragmentShader = `
    precision highp float;

    varying vec3 vColor;
    varying float vBright;

    uniform float uOpacity;

    void main() {
        /* Kern mit Hof: der quadratische Verlauf gibt jedem Stern eine harte Mitte
           und einen weichen Saum. Genau so sieht ein Stern auf einer Aufnahme aus –
           helle wirken gross, ohne groesser zu sein. */
        float d = length(gl_PointCoord - 0.5) * 2.0;
        if (d > 1.0) discard;
        float a = 1.0 - d;
        a = a * a * (0.55 + 0.45 * a);

        gl_FragColor = vec4(vColor, a * vBright * uOpacity);
    }
`

export type Starfield = {
    points: THREE.Points
    setPixelRatio: (ratio: number) => void
    setTime: (time: number) => void
    setOpacity: (opacity: number) => void
    dispose: () => void
}

export type StarfieldOptions = {
    count: number
    /** Radius der Kugelschale, auf der die Sterne liegen. */
    radius: number
    /** true = Nahfeld mit Groessenabnahme und Parallaxe, false = Himmel. */
    parallax: boolean
    /** Verschiebt die Verteilung heller/dunkler, 1 = normal. */
    brightness?: number
    /**
     * Anteil der Sterne im Band der Milchstrasse (0 = kein Band). Diese Sterne
     * sind absichtlich winzig und schwach: einzeln kaum sichtbar, zusammen der
     * milchige Schimmer.
     */
    bandFraction?: number
    /** Nur beim Nahfeld: ab welcher Entfernung ein Stern voll sichtbar ist. */
    nearFade?: [number, number]
    /**
     * Nur beim Nahfeld: wie stark die Groesse mit der Naehe waechst. Muss zur
     * Entfernung des Feldes passen – bei 26 und einer Schale in 100 Einheiten
     * Abstand blieb jeder Stern unter einem Pixel und das ganze Feld unsichtbar.
     */
    sizeScale?: number
    maxSize?: number
    seed?: number
}

export const createStarfield = ({
    count,
    radius,
    parallax,
    brightness = 1,
    bandFraction = 0,
    nearFade = [1, 14],
    sizeScale = 26,
    maxSize = 26,
    seed = 7,
}: StarfieldOptions): Starfield => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const brights = new Float32Array(count)

    /* Deterministisch: derselbe Himmel bei jedem Laden. */
    let state = seed
    const rand = () => {
        state = (state * 16807) % 2147483647
        return state / 2147483647
    }

    /** Normalverteilt – fuer die Dicke des Bandes. */
    const gauss = () => {
        const u = Math.max(rand(), 1e-6)
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand())
    }

    /**
     * Staubwolken laengs des Bandes: eine Summe aus drei Sinuskurven ueber dem
     * Laengengrad. Kein Rauschen, aber es leistet dasselbe – unregelmaessige
     * dunkle Abschnitte, wie der Grosse Riss im Sternbild Schwan. Ohne das ist das
     * Band ein gleichmaessiger Streifen, und gleichmaessig ist es nie.
     */
    const dustAt = (lon: number) =>
        0.55 +
        0.45 *
            (0.5 +
                0.5 *
                    Math.sin(lon * 2.0 + 0.7) *
                    0.6 *
                    (1 + 0.6 * Math.sin(lon * 5.0 - 1.3) + 0.4 * Math.sin(lon * 11.0 + 2.1)))

    /* Die Lage des Bandes kommt aus galactic.ts – dieselbe wie beim diffusen
       Schimmer in milkyway.ts. Zwei Werte waeren zwei Baender. */
    const orientation = galacticOrientation()

    const color = new THREE.Color()
    const warm = new THREE.Color(1, 0.82, 0.66)
    const cool = new THREE.Color(0.76, 0.85, 1)
    const white = new THREE.Color(1, 0.99, 0.97)
    const v = new THREE.Vector3()

    const bandCount = Math.round(count * bandFraction)

    for (let i = 0; i < count; i++) {
        const inBand = i < bandCount

        let lon = rand() * Math.PI * 2
        if (inBand) {
            /* Im Band: Laengengrad gleichverteilt, Breite normalverteilt und
               schmal. So entsteht ein Streifen mit weichen Raendern statt eines
               Rechtecks. */
            const lat = gauss() * 0.11
            v.set(
                Math.cos(lon) * Math.cos(lat),
                Math.sin(lat),
                Math.sin(lon) * Math.cos(lat),
            )
            // In die galaktische Ebene drehen – waagerecht waere es ein Balken.
            v.applyQuaternion(orientation)
        } else {
            /* Ausserhalb gleichmaessig auf der Kugel: der Kosinus des Polarwinkels
               muss gleichverteilt sein, nicht der Winkel selbst – sonst haeufen
               sich die Sterne an den Polen. */
            const u = rand() * 2 - 1
            const s = Math.sqrt(1 - u * u)
            v.set(Math.cos(lon) * s, u, Math.sin(lon) * s)
            lon = Math.atan2(v.z, v.x)
        }

        /* Die Schale hat Tiefe. Beim Nahfeld erzeugt gerade das die Parallaxe:
           nahe Sterne wandern schneller als ferne. */
        const r = radius * (0.55 + rand() * 0.45)
        positions[i * 3] = v.x * r
        positions[i * 3 + 1] = v.y * r
        positions[i * 3 + 2] = v.z * r

        /* Helligkeit: eine flache Potenz und eine Untergrenze. Viele schwache,
           einzelne sehr helle – aber keiner unsichtbar. */
        const mag = Math.pow(rand(), 2.3)

        if (inBand) {
            /* Die Sterne des Bandes stehen fuer die unaufgeloeste Masse: klein,
               schwach, und dort dunkler, wo Staub davor liegt. Einzeln sieht man
               sie kaum – ihre Summe ist der Schimmer. */
            brights[i] = (0.11 + mag * 0.5) * dustAt(lon) * brightness
            sizes[i] = 0.85 + mag * 1.3
        } else {
            brights[i] = (0.16 + mag * 0.9) * brightness
            sizes[i] = (parallax ? 1.5 : 1.1) + mag * 3.2 + rand() * 0.5

            /* Die hellsten paar Prozent duerfen deutlich herausstechen. Ohne sie
               ist der Himmel ein gleichmaessiger Griess aus Ein-Pixel-Punkten – am
               echten Himmel gibt es Wega und Deneb, und die sieht man zuerst. */
            if (mag > 0.9) {
                sizes[i] *= 1.7
                brights[i] = Math.min(1.05, brights[i] * 1.3)
            }
        }

        /* Farbe nach Sterntemperatur, insgesamt Richtung Weiss gezogen: am
           Nachthimmel sind die meisten Sterne nahezu farblos. */
        color.copy(warm).lerp(cool, Math.min(1, rand() * 1.3))
        color.lerp(white, 0.45)
        colors[i * 3] = color.r
        colors[i * 3 + 1] = color.g
        colors[i * 3 + 2] = color.b
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute("aBright", new THREE.BufferAttribute(brights, 1))

    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            uTime: {value: 0},
            uPixelRatio: {value: 1},
            uOpacity: {value: 1},
            uAttenuate: {value: parallax ? 1 : 0},
            uSizeScale: {value: sizeScale},
            uNearFade: {value: new THREE.Vector2(nearFade[0], nearFade[1])},
            uMaxSize: {value: maxSize},
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    })

    const points = new THREE.Points(geometry, material)
    /* Der Himmel darf nie weggeschnitten werden, egal wie weit die Kamera
       reist – seine Kugel wird jeden Frame auf die Kamera gesetzt. */
    points.frustumCulled = parallax

    return {
        points,
        setPixelRatio: (ratio) => {
            material.uniforms.uPixelRatio.value = ratio
        },
        setTime: (time) => {
            material.uniforms.uTime.value = time
        },
        setOpacity: (opacity) => {
            material.uniforms.uOpacity.value = opacity
        },
        dispose: () => {
            geometry.dispose()
            material.dispose()
        },
    }
}
