import * as THREE from "three"

/**
 * Eine Spiralgalaxie aus Punkten, durch die man hindurchfliegt.
 *
 * Sie ist der Grund, warum die Seite ueberhaupt eine Reise sein kann: vorher gab
 * es einen Nebel als Tapete und einen Kristallring, und dazwischen nichts. Der
 * Weg vom Hero zu den Projekten war eine Leerstelle, in die der Werdegang
 * hineingesetzt wurde – und genau das hat man gesehen. Jetzt liegt dort etwas,
 * das man durchquert.
 *
 * Aufbau: zwei Arme, logarithmisch aufgewickelt, mit Streuung nach aussen hin.
 * Die Scheibe liegt in der XY-Ebene, die Kamera fliegt entlang -Z hinein – so
 * sieht man die Spirale als Spirale und nicht von der Kante.
 *
 * Bewusst Punkte und keine Geometrie: 6000 Punkte kosten einen Draw-Call und
 * kein Licht. Additiv gemischt ueberlagern sie sich zu dichten Kernen, ohne dass
 * dafuer etwas gerechnet werden muss.
 */

const ARMS = 2
const ARM_WIND = 0.42
const CORE_RADIUS = 1.5

/* Farben von innen nach aussen: warmes Weiss im Kern, Cyan in der Scheibe,
   Violett an den Raendern. Bleibt im Farbraum der Seite. */
const COLOR_CORE = new THREE.Color("#fff4e6")
const COLOR_DISC = new THREE.Color("#22d3ee")
const COLOR_EDGE = new THREE.Color("#8b5cf6")

const vertexShader = `
    attribute float aSize;
    attribute vec3 aColor;

    uniform float uTime;
    uniform float uPixelRatio;

    varying vec3 vColor;
    varying float vFade;

    void main() {
        vColor = aColor;

        /* Langsame Eigenrotation um die Scheibenachse. Sie laeuft in der
           Vertex-Stufe, damit dafuer nichts pro Frame auf die CPU faellt. */
        float angle = uTime * 0.035;
        float s = sin(angle);
        float c = cos(angle);
        vec3 spun = vec3(position.x * c - position.y * s, position.x * s + position.y * c, position.z);

        vec4 view = modelViewMatrix * vec4(spun, 1.0);

        /* Punkte direkt an der Kamera ausblenden: sonst schiebt sich beim
           Durchflug ein einzelner Punkt als riesige Flaeche vor das Bild. */
        float dist = -view.z;
        vFade = smoothstep(0.0, 3.5, dist) * (1.0 - smoothstep(60.0, 110.0, dist));

        gl_Position = projectionMatrix * view;
        gl_PointSize = aSize * uPixelRatio * (14.0 / max(dist, 0.6));
    }
`

const fragmentShader = `
    precision highp float;

    varying vec3 vColor;
    varying float vFade;

    uniform float uOpacity;

    void main() {
        // Weicher runder Punkt statt eines Quadrats.
        float d = length(gl_PointCoord - 0.5);
        float alpha = smoothstep(0.5, 0.06, d);
        if (alpha <= 0.001) discard;

        gl_FragColor = vec4(vColor, alpha * vFade * uOpacity);
    }
`

export type Galaxy = {
    points: THREE.Points
    material: THREE.ShaderMaterial
    dispose: () => void
}

/**
 * @param count   Anzahl Punkte – skaliert mit der Qualitaetsstufe.
 * @param radius  Aussenradius der Scheibe.
 */
export const createGalaxy = (count: number, radius: number): Galaxy => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)

    /* Deterministisch: die Galaxie soll bei jedem Laden gleich aussehen.
       Math.random waere jedes Mal eine andere. */
    let seed = 1
    const rand = () => {
        seed = (seed * 16807) % 2147483647
        return seed / 2147483647
    }

    const color = new THREE.Color()

    for (let i = 0; i < count; i++) {
        /* Wurzel-Verteilung: sonst sitzen fast alle Punkte am Rand, weil die
           Flaeche eines Rings mit dem Radius waechst. */
        const t = Math.sqrt(rand())
        const r = CORE_RADIUS + t * radius

        const arm = i % ARMS
        const spread = 0.25 + t * 0.9
        const angle =
            (arm / ARMS) * Math.PI * 2 + r * ARM_WIND + (rand() - 0.5) * spread

        // Dicke: innen dick, aussen flach – wie eine echte Scheibe.
        const thickness = (1 - t * 0.75) * 1.6

        positions[i * 3] = Math.cos(angle) * r + (rand() - 0.5) * spread
        positions[i * 3 + 1] = Math.sin(angle) * r + (rand() - 0.5) * spread
        positions[i * 3 + 2] = (rand() - 0.5) * thickness

        color.copy(COLOR_CORE).lerp(COLOR_DISC, Math.min(1, t * 1.8))
        if (t > 0.55) color.lerp(COLOR_EDGE, (t - 0.55) / 0.45 * 0.7)
        colors[i * 3] = color.r
        colors[i * 3 + 1] = color.g
        colors[i * 3 + 2] = color.b

        // Der Kern bekommt die groesseren Punkte.
        sizes[i] = 0.5 + (1 - t) * 1.5 + rand() * 0.5
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1))

    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            uTime: {value: 0},
            uPixelRatio: {value: 1},
            uOpacity: {value: 1},
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    })

    const points = new THREE.Points(geometry, material)
    // Leicht gekippt: frontal waere die Spirale ein flaches Ornament.
    points.rotation.set(0.42, 0.2, 0)

    return {
        points,
        material,
        dispose: () => {
            geometry.dispose()
            material.dispose()
        },
    }
}
