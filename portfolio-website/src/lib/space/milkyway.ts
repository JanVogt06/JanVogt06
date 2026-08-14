import * as THREE from "three"
import {galacticOrientation} from "./galactic"

/**
 * Das Band der Milchstrasse als Himmelskugel.
 *
 * WARUM ES DAS BRAUCHT
 *
 * Ein Sternenhimmel aus Punkten allein sieht nie echt aus, und zwar aus einem
 * handfesten Grund: der auffaelligste Teil des echten Himmels ist gar nicht
 * punktfoermig. Wir sitzen in der Scheibe unserer Galaxie und schauen laengs durch
 * sie hindurch – in dieser Richtung stehen so viele Sterne, dass kein Auge und
 * keine Kamera sie einzeln trennt. Sie verschmelzen zu einem milchigen Band. Genau
 * daher hat die Milchstrasse ihren Namen.
 *
 * Ein solcher Schimmer laesst sich mit Punkten nicht bauen. Man braeuchte
 * Hunderttausende, jeder unter einem Pixel – das ist teuer und ergibt trotzdem
 * Kruemel statt Fluss. Also ist der diffuse Teil eine Flaeche und nur die
 * aufloesbaren Einzelsterne sind Punkte (starfield.ts). Beides zusammen ist das
 * Bild.
 *
 * WAS DARIN STECKT
 *
 * - das Band mit weichem Abfall zu den Seiten
 * - eine helle Verdickung: die Richtung zum galaktischen Zentrum
 * - Wolkenstruktur, damit das Band nicht gleichmaessig ist – es ist es nie
 * - Staubwolken davor, die es dunkel durchschneiden (der Grosse Riss)
 *
 * Die Kugel folgt jeden Frame der Kamera und liegt damit im Unendlichen. Sie ist
 * innen sichtbar (BackSide) und schreibt keine Tiefe: alles andere liegt davor.
 */

const vertexShader = `
    varying vec3 vDir;

    void main() {
        /* Die Richtung im lokalen System der Kugel. Die Neigung des Bandes steckt
           in der Drehung des Meshes, deshalb liegt das Band hier immer bei y = 0 –
           das haelt den Shader einfach. */
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`

const fragmentShader = `
    precision highp float;

    varying vec3 vDir;

    uniform float uOpacity;
    uniform float uQuality;

    /* --- Rauschen in drei Dimensionen ---
       Auf einer Kugel braucht es das: zweidimensionales Rauschen ueber
       Kugelkoordinaten laeuft an den Polen zusammen und bekommt an der
       Datumsgrenze eine Naht. */
    float hash(vec3 p) {
        p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }

    float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
            mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
                mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
            mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
            f.z);
    }

    float fbm(vec3 p) {
        float v = 0.0;
        float a = 0.5;
        int octaves = 3 + int(uQuality * 3.0 + 0.5);
        for (int i = 0; i < 6; i++) {
            if (i >= octaves) break;
            v += a * noise(p);
            p *= 2.02;
            a *= 0.5;
        }
        return v;
    }

    void main() {
        vec3 dir = normalize(vDir);

        /* Breite: der Abstand von der Ebene des Bandes. Der Exponent 1.5 gibt eine
           schmale helle Mitte mit langen Auslaeufern – ein reiner Gauss ist zu
           rund, eine Stufe zu hart. */
        float lat = asin(clamp(dir.y, -1.0, 1.0));

        /* Die Richtung zum Zentrum. Dort ist das Band deutlich breiter und heller,
           und genau diese Unsymmetrie macht den Unterschied zwischen "Streifen" und
           "Milchstrasse". */
        float lon = atan(dir.z, dir.x);
        float toCore = cos(lon - 0.6);
        float bulge = smoothstep(0.1, 1.0, toCore);

        float thickness = 0.12 + 0.13 * bulge;
        float band = exp(-pow(abs(lat) / thickness, 1.5));

        /* Wolken: das Band ist kein Streifen, sondern eine Kette von Aufhellungen.
           Das Rauschen laeuft laengs mit hoher und quer mit niedriger Frequenz –
           die Strukturen sind gestreckt, so wie es Spiralarme in der Aufsicht von
           innen sind. */
        /* Weniger gestreckt als zuerst versucht. Mit y * 13 wurden die Strukturen
           so lang gezogen, dass das Band nach Bodennebel aussah statt nach
           Sternwolken – die sind rundlich und liegen in Ketten. */
        float clouds = fbm(vec3(dir.x * 5.5, dir.y * 8.0, dir.z * 5.5));
        clouds = pow(clamp(clouds, 0.0, 1.0), 1.35);
        band *= 0.22 + 1.7 * clouds;

        /* Staub davor. Er sitzt in derselben Ebene wie die Sterne, ist also nur
           innerhalb des Bandes zu sehen – und dort schneidet er es auf. Ohne diese
           dunklen Risse sieht jedes Band nach Farbverlauf aus. */
        float dust = fbm(vec3(dir.x * 7.5 + 11.0, dir.y * 19.0, dir.z * 7.5 - 7.0));
        float lane = smoothstep(0.30, 0.56, dust);
        float dustMask = exp(-pow(abs(lat) / (thickness * 1.6), 2.0));
        band *= 1.0 - 0.85 * lane * dustMask;

        /* Farbe: das aufsummierte Licht vieler Sterne ist cremeweiss. Zum Zentrum
           hin roeten es die Staubmassen davor – deshalb dort waermer. Nur ganz
           schwach: eine kraeftig gefaerbte Milchstrasse ist Bildbearbeitung, keine
           Beobachtung. */
        vec3 cream = vec3(0.80, 0.76, 0.68);
        vec3 warm = vec3(0.86, 0.66, 0.47);
        vec3 col = mix(cream, warm, bulge * 0.8) * band;

        /* Ein sehr schwacher allgemeiner Grund: auch abseits des Bandes ist der
           Himmel nicht absolut schwarz. */
        col += vec3(0.012, 0.014, 0.022) * (0.5 + 0.5 * clouds);

        /* Klein halten: das Band soll da sein, nicht leuchten. Es ist am echten
           Himmel gerade so heller als der Hintergrund – und darueber liegen ja noch
           die Einzelsterne, die Galaxie und der Nebel. */
        gl_FragColor = vec4(col * 0.155 * uOpacity, 1.0);
    }
`

export type MilkyWay = {
    object: THREE.Mesh
    setOpacity: (opacity: number) => void
    setQuality: (quality: number) => void
    dispose: () => void
}

export const createMilkyWay = ({radius = 900, quality = 1} = {}): MilkyWay => {
    /* 48x24 Segmente. Der Shader rechnet pro Pixel, die Geometrie muss nur rund
       genug sein, damit die Kugel keine Kanten zeigt. */
    const geometry = new THREE.SphereGeometry(radius, 48, 24)

    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            uOpacity: {value: 1},
            uQuality: {value: quality},
        },
        side: THREE.BackSide,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        transparent: true,
    })

    const object = new THREE.Mesh(geometry, material)
    // Dieselbe Lage wie die Bandsterne in starfield.ts – siehe galactic.ts.
    object.quaternion.copy(galacticOrientation())
    /* Zuerst zeichnen: die Kugel ist der Hintergrund fuer alles andere. */
    object.renderOrder = -1
    object.frustumCulled = false

    return {
        object,
        setOpacity: (opacity) => {
            material.uniforms.uOpacity.value = opacity
        },
        setQuality: (value) => {
            material.uniforms.uQuality.value = value
        },
        dispose: () => {
            geometry.dispose()
            material.dispose()
        },
    }
}
