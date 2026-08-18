import * as THREE from "three"
import {createGalaxyDisc} from "./galaxyDisc"

const ARMS = 2

/** How tightly the arms are wound. Smaller = more open. */
const ARM_WIND = 0.42

const BULGE_SHARE = 0.14
const HALO_SHARE = 0.1

const COLOR_BULGE = new THREE.Color("#ffd9a0")
const COLOR_INNER = new THREE.Color("#fff2df")
const COLOR_ARM = new THREE.Color("#c3dced")
const COLOR_OUTER = new THREE.Color("#7d9cba")
/* HII regions glow reddish in H-alpha. */
const COLOR_HII = new THREE.Color("#d9808c")
const COLOR_HALO = new THREE.Color("#9aa8bd")

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1)

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

        float r = length(position.xy);
        float angle = uTime * (0.10 / (1.0 + r * 0.16));
        float s = sin(angle);
        float c = cos(angle);
        vec3 spun = vec3(position.x * c - position.y * s, position.x * s + position.y * c, position.z);

        vec4 view = modelViewMatrix * vec4(spun, 1.0);
        float dist = -view.z;

        vFade = aBright * smoothstep(0.8, 5.0, dist) * (1.0 - smoothstep(90.0, 160.0, dist));

        gl_Position = projectionMatrix * view;

        gl_PointSize = min(aSize * uPixelRatio * uSizeScale / max(dist, 1.0), 16.0);
    }
`

const fragmentShader = `
    precision highp float;

    varying vec3 vColor;
    varying float vFade;

    uniform float uOpacity;

    void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        if (d > 1.0) discard;
        float a = 1.0 - d;
        a = a * a;

        gl_FragColor = vec4(vColor, a * vFade * uOpacity);
    }
`

export type Galaxy = {
    /** Stars and core glow together, tilted. */
    object: THREE.Object3D
    setPixelRatio: (ratio: number) => void
    setOpacity: (opacity: number) => void
    /** Camera distance to the core; fades out the core glow up close. */
    setProximity: (distance: number) => void
    setTime: (time: number) => void
    setQuality: (quality: number) => void
    dispose: () => void
}

export const createGalaxy = (count: number, radius: number, quality = 1): Galaxy => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const brights = new Float32Array(count)

    let seed = 1
    const rand = () => {
        seed = (seed * 16807) % 2147483647
        return seed / 2147483647
    }
    const gauss = () => (rand() + rand() - 1)

    let opacity = 1

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
            // --- Bulge: spherical, strongly concentrated toward the center ---
            const t = Math.pow(rand(), 2.4)
            const r = t * radius * 0.3
            const theta = rand() * Math.PI * 2
            const phi = Math.acos(gauss())
            x = r * Math.sin(phi) * Math.cos(theta)
            y = r * Math.sin(phi) * Math.sin(theta)
            z = r * Math.cos(phi) * 0.6

            color.copy(COLOR_BULGE).lerp(COLOR_INNER, rand() * 0.5)
            size = 1.0 + rand() * 1.2
            bright = 0.42 + rand() * 0.38
        } else if (i < bulgeCount + haloCount) {
            // --- Halo: a few faint stars far out ---
            const r = radius * (0.5 + rand() * 0.9)
            const theta = rand() * Math.PI * 2
            x = Math.cos(theta) * r
            y = Math.sin(theta) * r
            z = gauss() * radius * 0.22

            color.copy(COLOR_HALO)
            size = 0.7 + rand() * 0.8
            bright = 0.1 + rand() * 0.22
        } else {
            // --- Disc: logarithmic arms with clumping ---
            const t = Math.sqrt(rand())
            const r = radius * (0.12 + t * 0.88)
            const arm = i % ARMS

            const clump = 0.75 + 0.25 * Math.sin(r * 1.9 + arm * 2.1)
            const spread = (0.10 + t * 0.34) * clump

            const theta =
                (arm / ARMS) * Math.PI * 2 + Math.log(1 + r) * ARM_WIND * 3.2 + gauss() * spread

            x = Math.cos(theta) * r
            y = Math.sin(theta) * r
            // The disc is thicker inside than outside.
            z = gauss() * (1 - t * 0.7) * 1.3

            if (rand() < 0.22) {
                const free = rand() * Math.PI * 2
                x = Math.cos(free) * r
                y = Math.sin(free) * r
            }

            color.copy(COLOR_INNER).lerp(COLOR_ARM, Math.min(1, t * 2.1))
            if (t > 0.5) color.lerp(COLOR_OUTER, (t - 0.5) / 0.5)

            size = 0.8 + rand() * 1.1
            bright = 0.28 + rand() * 0.5

            if (rand() > 0.991) {
                color.copy(COLOR_HII)
                size *= 1.7
                bright = 0.85
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
            uSizeScale: {value: 80},
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    })

    const points = new THREE.Points(geometry, material)

    const coreCanvas = document.createElement("canvas")
    coreCanvas.width = coreCanvas.height = 384
    const ctx = coreCanvas.getContext("2d")
    if (ctx) {
        const gradient = ctx.createRadialGradient(192, 192, 0, 192, 192, 192)
        gradient.addColorStop(0, "rgba(255,247,230,0.42)")
        gradient.addColorStop(0.3, "rgba(255,214,158,0.16)")
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
    core.scale.setScalar(radius * 0.3)

    const disc = createGalaxyDisc({
        radius,
        arms: ARMS,
        wind: ARM_WIND,
        quality,
        layers: quality >= 0.5 ? 5 : 3,
    })

    // Tilted, so the spiral is not seen face-on.
    const group = new THREE.Group()
    group.rotation.set(1.15, 0.25, 0.15)
    group.add(disc.object)
    group.add(points)
    group.add(core)

    const CORE_NEAR = 18
    const CORE_FAR = 46
    let coreProximity = 1

    return {
        object: group,
        setProximity: (distance) => {
            coreProximity = clamp01((distance - CORE_NEAR) / (CORE_FAR - CORE_NEAR))
            coreMaterial.opacity = opacity * coreProximity
        },
        setPixelRatio: (ratio) => {
            material.uniforms.uPixelRatio.value = ratio
        },
        setOpacity: (value) => {
            opacity = value
            material.uniforms.uOpacity.value = value
            coreMaterial.opacity = value * coreProximity
            disc.setOpacity(value)
        },
        setTime: (time) => {
            material.uniforms.uTime.value = time
            disc.setTime(time)
        },
        setQuality: (value) => {
            disc.setQuality(value)
        },
        dispose: () => {
            geometry.dispose()
            material.dispose()
            coreTexture.dispose()
            coreMaterial.dispose()
            disc.dispose()
        },
    }
}
