import * as THREE from "three"

/**
 * Die leuchtende Scheibe der Galaxie – der diffuse Teil, ohne den Punkte keine
 * Galaxie ergeben.
 *
 * WARUM
 *
 * Die Galaxie bestand nur aus Punkten. Von aussen sah das aus wie eine mit dem
 * Stift gezeichnete Spirale: zwei duenne Faeden aus Kruemeln, dazwischen leerer
 * Raum, in der Mitte ein Klumpen. Auf jeder echten Aufnahme ist das Gegenteil zu
 * sehen – eine durchgehend leuchtende Scheibe, in der die Arme HELLERE Bereiche
 * sind, keine einzelnen Linien. Was man als "Arm" erkennt, ist zu 90 % diffuses
 * Licht unaufloesbar vieler Sterne und Gas.
 *
 * Genau dieselbe Erkenntnis wie beim Sternenhimmel (milkyway.ts): der diffuse Teil
 * gehoert auf eine Flaeche, die Koernung auf Punkte. Zusammen ergeben sie das Bild.
 *
 * WARUM MEHRERE LAGEN
 *
 * Eine einzige Scheibe waere unendlich duenn. Beim Durchflug – und darum geht es
 * hier – kreuzt die Kamera die Ebene, und eine unendlich duenne Flaeche
 * verschwindet in genau diesem Moment vollstaendig. Deshalb liegen mehrere Lagen
 * gestapelt, mit nach aussen abnehmendem Gewicht: das gibt der Scheibe Dicke und
 * der Durchflug bekommt ein Innen.
 *
 * WARUM DER SCHEIN AUS DER NAEHE VERSCHWINDET
 *
 * Diffuses Licht ist eine Naeherung fuer Entfernung: es steht fuer Sterne, die man
 * nicht einzeln trennen kann. Fliegt man hinein, KANN man sie trennen – dann sind
 * es Punkte, und der Schein hat dort nichts mehr zu suchen. Genau daran ist es
 * zuerst gescheitert: aus 14 Einheiten Abstand war die Galaxie eine ausgebrannte
 * weisse Flaeche, weil der Fernfeld-Schein einfach weiter mitgerechnet wurde.
 *
 * Deshalb blendet jede Lage pro Pixel nach ihrem Abstand aus. Das laeuft weich und
 * ortsabhaengig: waehrend die Scheibe direkt vor der Nase in Sterne aufloest,
 * leuchtet sie in der Ferne weiter – so, wie man es auch sehen wuerde.
 *
 * DIE ARME
 *
 * Sie folgen derselben logarithmischen Spirale wie die Punkte, mit denselben
 * Konstanten (arms, wind) und derselben differentiellen Drehung. Waeren es zwei
 * getrennte Rechnungen, wuerden Schein und Koernung mit der Zeit auseinander
 * laufen – die Punkte drehen sich naemlich im Vertex-Shader mit.
 */

const vertexShader = `
    varying vec2 vPos;
    varying float vDist;

    void main() {
        vPos = position.xy;
        vec4 view = modelViewMatrix * vec4(position, 1.0);
        vDist = -view.z;
        gl_Position = projectionMatrix * view;
    }
`

const fragmentShader = `
    precision highp float;

    varying vec2 vPos;
    varying float vDist;

    uniform float uTime;
    /** Zwischen diesen Abstaenden loest der Schein in Einzelsterne auf. */
    uniform vec2 uResolve;
    uniform float uOpacity;
    uniform float uWeight;
    uniform float uRadius;
    uniform float uArms;
    uniform float uWind;
    uniform float uQuality;
    uniform float uSeed;

    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed) * 43758.5453123);
    }

    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
    }

    float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
        int octaves = 3 + int(uQuality * 2.0 + 0.5);
        for (int i = 0; i < 5; i++) {
            if (i >= octaves) break;
            v += a * noise(p);
            p = rot * p * 2.03;
            a *= 0.5;
        }
        return v;
    }

    void main() {
        float r = length(vPos);
        if (r > uRadius * 1.45) discard;

        /* Aufloesen aus der Naehe: siehe Dateikopf. Unter uResolve.x bleibt vom
           Schein nichts, ueber uResolve.y ist er voll da.
           Das steht VOR dem Rauschen und nicht am Ende: genau im Durchflug deckt
           die Scheibe den ganzen Bildschirm, und dann waeren es fuenf Lagen mal
           zwei FBM-Auswertungen pro Pixel – fuer ein Ergebnis, das mit Null
           multipliziert wird. */
        float resolve = smoothstep(uResolve.x, uResolve.y, vDist);
        if (resolve <= 0.002) discard;

        /* Dieselbe differentielle Drehung wie im Punkt-Shader: innen schneller als
           aussen. Ohne sie laufen Schein und Koernung auseinander. */
        float theta = atan(vPos.y, vPos.x) - uTime * (0.10 / (1.0 + r * 0.16));

        /* Dieselbe logarithmische Spirale wie die Punkte. Der Faktor 3.2 auf wind
           stammt aus galaxy.ts – die Arme muessen aufeinander liegen. */
        float phase = theta - log(1.0 + r) * uWind * 3.2;
        float arm = 0.5 + 0.5 * cos(uArms * phase);

        /* Hoch potenziert wird aus dem Cosinus ein Arm mit Kante statt einer
           Welle – nach innen breiter, weil sich dort die Arme zusammenschieben. */
        float sharpness = mix(1.4, 3.4, smoothstep(0.1, 0.75, r / uRadius));
        arm = pow(arm, sharpness);

        /* Wolken laengs der Arme: eine Aufnahme zeigt Ketten von
           Sternentstehungsgebieten, keinen gleichmaessigen Bogen. */
        float clouds = fbm(vec2(phase * 2.4, r * 0.42));
        arm *= 0.45 + 1.1 * clouds;

        /* Zwischen den Armen ist es nicht leer – dort steht die aeltere
           Scheibenpopulation. Ohne diesen Sockel sieht die Galaxie aus wie mit dem
           Stift gezeichnet. */
        float disc = 0.30 + 0.70 * arm;

        /* Radiales Profil: nach aussen exponentiell abnehmend, wie bei echten
           Scheiben. Der Rand loest sich auf, statt zu enden. */
        float rr = r / uRadius;
        disc *= exp(-rr * 2.3) * smoothstep(1.42, 0.55, rr);

        /* Staubbahnen. Sie sitzen an der Innenkante der Arme – das ist der
           auffaelligste Kontrast auf jeder Galaxienaufnahme. */
        float dust = fbm(vec2(phase * 3.1 + 8.0, r * 0.6 - 4.0));
        disc *= 1.0 - 0.5 * smoothstep(0.34, 0.6, dust) * smoothstep(0.08, 0.3, rr);

        /* Bulge: die zentrale Verdickung. Warm, weil dort alte Sterne stehen.
           Breiter und flacher als zuerst (0.16 / 1.5): zusammen mit dem
           Kernschein war die Mitte ein ausgebrannter weisser Fleck. Ein echter
           Bulge ist ein Verlauf, keine Scheibe. */
        float bulge = exp(-pow(rr / 0.24, 1.25));

        vec3 armColor = mix(vec3(0.62, 0.74, 0.92), vec3(0.42, 0.54, 0.76), rr);
        vec3 bulgeColor = vec3(1.0, 0.84, 0.62);
        vec3 col = armColor * disc + bulgeColor * bulge * 0.75;

        gl_FragColor = vec4(col * uWeight * uOpacity * resolve * 0.8, 1.0);
    }
`

export type GalaxyDisc = {
    object: THREE.Object3D
    setTime: (time: number) => void
    setOpacity: (opacity: number) => void
    setQuality: (quality: number) => void
    dispose: () => void
}

export type GalaxyDiscOptions = {
    radius: number
    arms: number
    /** Wickelung der Spirale – muss der Punktverteilung entsprechen. */
    wind: number
    /** Halbe Dicke der Scheibe in Weltenheiten. */
    thickness?: number
    /** Anzahl gestapelter Lagen. Ungerade, damit eine genau in der Ebene liegt. */
    layers?: number
    quality?: number
    /** Abstaende, zwischen denen der Schein in Einzelsterne aufloest. */
    resolve?: [number, number]
    seed?: number
}

export const createGalaxyDisc = ({
    radius,
    arms,
    wind,
    thickness = 1.3,
    layers = 5,
    quality = 1,
    resolve = [7, 30],
    seed = 3,
}: GalaxyDiscOptions): GalaxyDisc => {
    const object = new THREE.Object3D()
    /* Eine Geometrie fuer alle Lagen. 1.45 mal Radius, damit der Rand innerhalb der
       Flaeche ausblendet und nicht an ihrer Kante abgeschnitten wird. */
    const geometry = new THREE.CircleGeometry(radius * 1.45, 72)
    const materials: THREE.ShaderMaterial[] = []

    for (let i = 0; i < layers; i++) {
        /* Gewichte als Glocke ueber der Dicke: die Mittellage traegt am meisten,
           die aeusseren geben den weichen Rand. Die Summe ist 1, damit die
           Gesamthelligkeit nicht von der Zahl der Lagen abhaengt. */
        const offset = layers === 1 ? 0 : (i / (layers - 1)) * 2 - 1
        const raw = Math.exp(-(offset * offset) * 1.8)

        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: {value: 0},
                uOpacity: {value: 1},
                uWeight: {value: raw},
                uRadius: {value: radius},
                uArms: {value: arms},
                uWind: {value: wind},
                uQuality: {value: quality},
                uResolve: {value: new THREE.Vector2(resolve[0], resolve[1])},
                uSeed: {value: seed},
            },
            side: THREE.DoubleSide,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        })
        materials.push(material)

        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.z = offset * thickness
        object.add(mesh)
    }

    // Gewichte normieren, nachdem alle bekannt sind.
    const total = materials.reduce((sum, m) => sum + m.uniforms.uWeight.value, 0)
    materials.forEach((m) => {
        m.uniforms.uWeight.value /= total
    })

    return {
        object,
        setTime: (time) => {
            materials.forEach((m) => {
                m.uniforms.uTime.value = time
            })
        },
        setOpacity: (opacity) => {
            materials.forEach((m) => {
                m.uniforms.uOpacity.value = opacity
            })
        },
        setQuality: (value) => {
            materials.forEach((m) => {
                m.uniforms.uQuality.value = value
            })
        },
        dispose: () => {
            geometry.dispose()
            materials.forEach((m) => m.dispose())
        },
    }
}
