import * as THREE from "three"

/**
 * Eine Spiralgalaxie aus Punkten, durch die man hindurchfliegt.
 *
 * Sie ist der Grund, warum die Seite ueberhaupt eine Reise sein kann: vorher gab
 * es einen Nebel als Tapete und einen Kristallring, und dazwischen nichts.
 *
 * WARUM SIE ZUERST FAST UNSICHTBAR WAR
 *
 * Die Punktgroesse stand auf `aSize * pixelRatio * (14 / dist)`. Bei den
 * tatsaechlichen Abstaenden (~30 Einheiten) und aSize um 1,5 ergibt das gut EINEN
 * Pixel – und ein Pixel mit weichem Rand und additiver Mischung ist nichts. Die
 * Galaxie war da, nur eben als Staub in Subpixelgroesse. Jetzt traegt die Formel
 * einen deutlich groesseren Faktor, und die Helligkeit steckt in einem eigenen
 * Attribut statt in der Groesse.
 *
 * WIE SIE REALISTISCHER WIRD
 *
 * Eine echte Spiralgalaxie ist nicht ein Muster aus gleich hellen Punkten. Sie
 * hat drei Bestandteile, und die haben hier jeweils ihre eigene Verteilung:
 *
 *   Bulge   – dichter, kugeliger Kern. Alte Sterne, deshalb warm-gelblich.
 *             Radial stark zur Mitte verdichtet.
 *   Scheibe – die Arme. Junge Sterne, deshalb blau-weiss. Logarithmische
 *             Spirale mit Klumpung: echte Arme sind keine glatten Linien,
 *             sondern Ketten von Sternentstehungsgebieten.
 *   Halo    – wenige, schwache Sterne weit ausserhalb der Scheibe. Ohne ihn
 *             hoert die Galaxie an einer sichtbaren Kante auf.
 *
 * Dazu ein paar helle rosa Knoten in den Armen – HII-Regionen, das auffaelligste
 * Merkmal echter Spiralarme. Und ein weicher Kernschein als eigene Flaeche, weil
 * ein Haufen Punkte allein keinen leuchtenden Kern ergibt.
 *
 * Additiv gemischt: ueberlagerte Punkte summieren sich zu dichten, hellen
 * Bereichen, ohne dass dafuer etwas gerechnet werden muss.
 */

const ARMS = 2

/** Wie stark die Arme aufgewickelt sind. Kleiner = offener. */
const ARM_WIND = 0.42

/**
 * Anteile der drei Bestandteile.
 *
 * Der Bulge stand auf 30 %. Zusammen mit einem Kernschein, der fast die ganze
 * Scheibe ueberdeckte, sah die Galaxie dadurch wie ein Kugelsternhaufen aus: ein
 * heller Klumpen mit Streupunkten drumherum, keine Spirale. Fast die Haelfte
 * aller Punkte sass in der Mitte.
 *
 * 14 % lassen den Kern dicht, geben die Punkte aber den Armen – und die tragen
 * die Form, an der man eine Spiralgalaxie erkennt.
 */
const BULGE_SHARE = 0.14
const HALO_SHARE = 0.1

/* Farben. Warm im Kern (alte Sterne), blau-weiss in den Armen (junge Sterne) –
   das ist die echte Farbverteilung einer Spiralgalaxie. Cyan als Primaerakzent
   der Seite sitzt in den Armen, Violett/Rosa in den HII-Knoten. */
const COLOR_BULGE = new THREE.Color("#ffd9a0")
const COLOR_INNER = new THREE.Color("#fff2df")
const COLOR_ARM = new THREE.Color("#c3dced")
const COLOR_OUTER = new THREE.Color("#7d9cba")
/* HII-Regionen sind roetlich, nicht bonbonrosa: sie leuchten in Halpha. */
const COLOR_HII = new THREE.Color("#d9808c")
const COLOR_HALO = new THREE.Color("#9aa8bd")

const vertexShader = `
    attribute float aSize;
    attribute float aBright;
    attribute vec3 aColor;

    uniform float uTime;
    uniform float uPixelRatio;
    uniform float uSizeScale;

    varying vec3 vColor;
    varying float vFade;

    void main() {
        vColor = aColor;

        /* Rotation um die Scheibenachse, innen schneller als aussen – so drehen
           sich echte Galaxien (differentielle Rotation), und die Arme scheren
           dabei leicht. Laeuft in der Vertex-Stufe, damit dafuer nichts pro Frame
           auf die CPU faellt. */
        float r = length(position.xy);
        float angle = uTime * (0.10 / (1.0 + r * 0.16));
        float s = sin(angle);
        float c = cos(angle);
        vec3 spun = vec3(position.x * c - position.y * s, position.x * s + position.y * c, position.z);

        vec4 view = modelViewMatrix * vec4(spun, 1.0);
        float dist = -view.z;

        /* Nahe Punkte ausblenden, BEVOR sie gross werden. Die Groesse waechst mit
           1/dist, also verdoppelt jede Halbierung des Abstands den Durchmesser:
           bei zwei Einheiten Abstand waeren es rechnerisch ueber 100 px, und ein
           einzelner Stern wuerde beim Durchflug durch die Scheibe das Bild
           fuellen. Die Ausblendung laeuft deshalb ueber 0…9 Einheiten. */
        vFade = aBright * smoothstep(0.0, 9.0, dist) * (1.0 - smoothstep(90.0, 160.0, dist));

        gl_Position = projectionMatrix * view;

        /* Zusaetzlich hart begrenzt: die Ausblendung allein genuegt nicht, weil ein
           sehr heller Stern auch halbtransparent noch als Flaeche auffaellt. */
        /* Deckel bei 20 statt 34: mit der viel hoeheren Punktzahl traegt die
           DICHTE das Bild, nicht die Groesse einzelner Punkte. Grosse Punkte waren
           im Nahflug genau der Grund, warum die Scheibe verschwommen aussah. */
        gl_PointSize = min(aSize * uPixelRatio * uSizeScale / max(dist, 1.0), 20.0);
    }
`

const fragmentShader = `
    precision highp float;

    varying vec3 vColor;
    varying float vFade;

    uniform float uOpacity;

    void main() {
        /* Weicher runder Punkt mit heissem Zentrum: der Verlauf ist quadratisch,
           dadurch hat jeder Stern einen Kern und einen Hof statt einer flachen
           Scheibe. Das laesst dichte Bereiche zusammenlaufen, wie bei echten
           Sternfeldern. */
        float d = length(gl_PointCoord - 0.5) * 2.0;
        if (d > 1.0) discard;
        float a = 1.0 - d;
        a = a * a;

        gl_FragColor = vec4(vColor, a * vFade * uOpacity);
    }
`

export type Galaxy = {
    /** Sterne und Kernschein zusammen, gekippt. Das haengt in die Szene. */
    object: THREE.Object3D
    setPixelRatio: (ratio: number) => void
    setOpacity: (opacity: number) => void
    setTime: (time: number) => void
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
    const brights = new Float32Array(count)

    /* Deterministisch: die Galaxie soll bei jedem Laden gleich aussehen.
       Math.random waere jedes Mal eine andere. */
    let seed = 1
    const rand = () => {
        seed = (seed * 16807) % 2147483647
        return seed / 2147483647
    }
    /* Zwei Zufallszahlen gemittelt ergeben eine Haeufung um die Mitte – billiger
       Ersatz fuer eine Normalverteilung, und genau das braucht der Bulge. */
    const gauss = () => (rand() + rand() - 1)

    const bulgeCount = Math.floor(count * BULGE_SHARE)
    const haloCount = Math.floor(count * HALO_SHARE)
    const color = new THREE.Color()

    for (let i = 0; i < count; i++) {
        let x: number
        let y: number
        let z: number
        let size: number
        let bright: number

        if (i < bulgeCount) {
            // --- Bulge: kugelig, stark zur Mitte verdichtet ---
            const t = Math.pow(rand(), 2.4)
            const r = t * radius * 0.3
            const theta = rand() * Math.PI * 2
            const phi = Math.acos(gauss())
            x = r * Math.sin(phi) * Math.cos(theta)
            y = r * Math.sin(phi) * Math.sin(theta)
            z = r * Math.cos(phi) * 0.6

            color.copy(COLOR_BULGE).lerp(COLOR_INNER, rand() * 0.5)
            size = 1.1 + rand() * 1.4
            bright = 0.55 + rand() * 0.45
        } else if (i < bulgeCount + haloCount) {
            // --- Halo: wenige, schwache Sterne weit draussen ---
            const r = radius * (0.5 + rand() * 0.9)
            const theta = rand() * Math.PI * 2
            x = Math.cos(theta) * r
            y = Math.sin(theta) * r
            z = gauss() * radius * 0.22

            color.copy(COLOR_HALO)
            size = 0.7 + rand() * 0.8
            bright = 0.1 + rand() * 0.22
        } else {
            // --- Scheibe: logarithmische Arme mit Klumpung ---
            const t = Math.sqrt(rand())
            const r = radius * (0.12 + t * 0.88)
            const arm = i % ARMS

            /* Streuung waechst nach aussen, und ein Sinus entlang des Arms
               verdichtet ihn stellenweise – dadurch entstehen Ketten statt einer
               glatten Linie. Deutlich enger als zuvor: mit 0.10 + t * 0.5 waren
               die Arme so breit, dass sie zu einer Scheibe verschmolzen und die
               Spirale nicht mehr zu erkennen war. */
            const clump = 0.55 + 0.45 * Math.sin(r * 1.9 + arm * 2.1)
            const spread = (0.05 + t * 0.22) * clump

            const theta =
                (arm / ARMS) * Math.PI * 2 + Math.log(1 + r) * ARM_WIND * 3.2 + gauss() * spread

            x = Math.cos(theta) * r
            y = Math.sin(theta) * r
            // Die Scheibe ist innen dicker als aussen.
            z = gauss() * (1 - t * 0.7) * 1.3

            color.copy(COLOR_INNER).lerp(COLOR_ARM, Math.min(1, t * 2.1))
            if (t > 0.5) color.lerp(COLOR_OUTER, (t - 0.5) / 0.5)

            size = 0.8 + rand() * 1.1
            bright = 0.28 + rand() * 0.5

            /* HII-Regionen: einzelne, deutlich hellere rosa Knoten in den Armen.
               Das auffaelligste Merkmal echter Spiralarme. */
            if (rand() > 0.982) {
                color.copy(COLOR_HII)
                size *= 2.4
                bright = 1
            }
        }

        positions[i * 3] = x
        positions[i * 3 + 1] = y
        positions[i * 3 + 2] = z
        colors[i * 3] = color.r
        colors[i * 3 + 1] = color.g
        colors[i * 3 + 2] = color.b
        sizes[i] = size
        brights[i] = bright
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
            /**
             * Der Faktor, an dem es zuerst gescheitert ist – der Regler fuer die
             * Sichtbarkeit der Galaxie.
             *
             * Er stand auf 14. Bei aSize um 1 und den tatsaechlichen Abstaenden
             * (30 Einheiten im Hero, 13 im Anflug) sind das 0,5 bis 1 Pixel: die
             * Galaxie war vorhanden, aber in Subpixelgroesse.
             *
             * 80 ergibt rund 4 px im Hero und 9 px im Anflug – ein Stern mit Hof.
             * Groesser wird es schnell teigig, kleiner verschwindet es wieder.
             */
            uSizeScale: {value: 80},
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    })

    const points = new THREE.Points(geometry, material)

    /**
     * Kernschein.
     *
     * Ein Haufen Punkte ergibt keinen leuchtenden Kern – dafuer braucht es eine
     * Flaeche. Ein Sprite ist immer zur Kamera gedreht, also bleibt der Schein
     * rund, auch wenn man die Scheibe schraeg oder von der Kante sieht.
     */
    const coreCanvas = document.createElement("canvas")
    /* 384 statt 128: der Schein wird im Nahflug bildschirmgross, und 128 Pixel
       sahen dort aus wie ein weichgezeichneter Fleck. */
    coreCanvas.width = coreCanvas.height = 384
    const ctx = coreCanvas.getContext("2d")
    if (ctx) {
        const gradient = ctx.createRadialGradient(192, 192, 0, 192, 192, 192)
        /* Warm nach aussen auslaufend, ohne Violett. Der Stop bei 0.65 war
           (180,140,255) – ein violetter Hof um den Kern, den es an einer echten
           Galaxie nicht gibt. */
        gradient.addColorStop(0, "rgba(255,247,230,0.72)")
        gradient.addColorStop(0.3, "rgba(255,214,158,0.26)")
        gradient.addColorStop(0.65, "rgba(190,170,140,0.06)")
        gradient.addColorStop(1, "rgba(0,0,0,0)")
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 384, 384)
    }
    const coreTexture = new THREE.CanvasTexture(coreCanvas)
    const coreMaterial = new THREE.SpriteMaterial({
        map: coreTexture,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
    })
    const core = new THREE.Sprite(coreMaterial)
    /* Klein halten. Mit radius * 0.85 lag der Schein ueber fast der ganzen
       Scheibe und hat die Arme ueberstrahlt – die Galaxie war ein Leuchtfleck. */
    core.scale.setScalar(radius * 0.3)

    // Gekippt: frontal waere die Spirale ein flaches Ornament.
    const group = new THREE.Group()
    group.rotation.set(0.5, 0.25, 0.15)
    group.add(points)
    group.add(core)

    return {
        object: group,
        setPixelRatio: (ratio) => {
            material.uniforms.uPixelRatio.value = ratio
        },
        setOpacity: (opacity) => {
            material.uniforms.uOpacity.value = opacity
            coreMaterial.opacity = opacity
        },
        setTime: (time) => {
            material.uniforms.uTime.value = time
        },
        dispose: () => {
            geometry.dispose()
            material.dispose()
            coreTexture.dispose()
            coreMaterial.dispose()
        },
    }
}
