import * as THREE from "three"

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

    varying vec3 vColor;
    varying float vBright;

    void main() {
        vColor = aColor;

        vec4 view = modelViewMatrix * vec4(position, 1.0);
        float dist = max(-view.z, 0.001);

        /* Sehr nahe Sterne ausblenden, sonst schiebt sich beim Vorbeifliegen ein
           einzelner als Flaeche vor das Bild. Gilt nur fuers Nahfeld – der Himmel
           ist immer gleich weit weg. */
        float nearFade = mix(1.0, smoothstep(1.0, 14.0, dist), uAttenuate);

        /* Sechs Prozent Schwankung. Mehr waere Funkeln, und Funkeln ist
           Luftunruhe – im Weltraum gibt es keine. */
        float flicker = 0.94 + 0.06 * sin(uTime * (0.5 + aBright * 2.0) + aSize * 30.0);

        vBright = aBright * nearFade * flicker;

        gl_Position = projectionMatrix * view;

        float attenuated = uSizeScale / dist;
        float size = aSize * mix(1.0, attenuated, uAttenuate);
        gl_PointSize = clamp(size * uPixelRatio, 0.6, 26.0);
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
    seed?: number
}

export const createStarfield = ({
    count,
    radius,
    parallax,
    brightness = 1,
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

    const color = new THREE.Color()

    for (let i = 0; i < count; i++) {
        /* Gleichmaessig auf der Kugel: der Kosinus des Polarwinkels muss
           gleichverteilt sein, nicht der Winkel selbst – sonst haeufen sich die
           Sterne an den Polen. */
        const u = rand() * 2 - 1
        const theta = rand() * Math.PI * 2
        const s = Math.sqrt(1 - u * u)
        /* Die Schale hat Tiefe. Beim Nahfeld erzeugt gerade das die Parallaxe:
           nahe Sterne wandern schneller als ferne. */
        const r = radius * (0.55 + rand() * 0.45)

        positions[i * 3] = Math.cos(theta) * s * r
        positions[i * 3 + 1] = Math.sin(theta) * s * r
        positions[i * 3 + 2] = u * r

        /* Helligkeit: eine flache Potenz und eine Untergrenze. Viele schwache,
           einzelne sehr helle – aber keiner unsichtbar. */
        const mag = Math.pow(rand(), 2.3)
        brights[i] = (0.16 + mag * 0.9) * brightness

        /* Farbe nach Sterntemperatur, insgesamt Richtung Weiss gezogen: am
           Nachthimmel sind die meisten Sterne nahezu farblos. */
        const temp = rand()
        color.setRGB(1, 0.82, 0.66).lerp(new THREE.Color(0.76, 0.85, 1), Math.min(1, temp * 1.3))
        color.lerp(new THREE.Color(1, 0.99, 0.97), 0.45)
        colors[i * 3] = color.r
        colors[i * 3 + 1] = color.g
        colors[i * 3 + 2] = color.b

        // Helle Sterne sind auch etwas groesser – aber nur etwas.
        sizes[i] = (parallax ? 1.5 : 1.2) + mag * 2.2 + rand() * 0.5
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
            uSizeScale: {value: 26},
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    })

    const points = new THREE.Points(geometry, material)
    /* Der Himmel darf nie weggeschnitten werden, egal wie weit die Kamera
       reist – seine Kugel wird jeden Frame auf die Kamera gesetzt. */
    points.frustumCulled = !parallax ? false : true

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
