import * as THREE from "three"
import {passVertex} from "./glsl"

/** Side of the patch of sea the detail texture tiles, in metres. */
export const DETAIL_SIZE = 18

const WAVES = 56
const RESOLUTION = 256
const WIND = 0.35
const WIND_SPEED = 6.5
const G = 9.81

// Every wave fits the patch a whole number of times, so the texture tiles;
// each moves at the speed deep water gives its wavelength.
const fragment = /* glsl */ `
    precision highp float;

    uniform vec4 uWaves[${WAVES}];
    uniform float uTime;

    varying vec2 vUv;

    void main() {
        vec2 x = vUv * ${DETAIL_SIZE.toFixed(1)};
        vec2 slope = vec2(0.0);
        float height = 0.0;
        for (int i = 0; i < ${WAVES}; i++) {
            vec4 w = uWaves[i];
            float k = length(w.xy);
            float phase = dot(w.xy, x) - sqrt(${G} * k) * uTime + w.w;
            float s = sin(phase);
            height += w.z * cos(phase);
            slope -= w.xy * w.z * s;
        }
        gl_FragColor = vec4(slope, height, 1.0);
    }
`

/** A Phillips spectrum: energy rises towards the wavelength the wind
 *  favours, falls away fast below it, and follows the wind's direction. */
const phillips = (kx: number, kz: number) => {
    const k = Math.hypot(kx, kz)
    const l = (WIND_SPEED * WIND_SPEED) / G
    const along = (kx * Math.cos(WIND) + kz * Math.sin(WIND)) / k
    return (Math.exp(-1 / ((k * l) * (k * l))) / Math.pow(k, 4)) * along * along * Math.exp(-k * k * 0.0004)
}

const createWaves = () => {
    let seed = 7
    const random = () => {
        seed = (seed * 16807) % 2147483647
        return seed / 2147483647
    }
    const unit = (2 * Math.PI) / DETAIL_SIZE
    const taken = new Set<string>()
    const waves: THREE.Vector4[] = []
    let slope = 0

    for (let i = 0; waves.length < WAVES && i < WAVES * 20; i++) {
        // Log-spaced from the patch itself down to a few centimetres.
        const t = (waves.length + random() * 0.8) / WAVES
        const magnitude = unit * Math.pow(70, t)
        const spread = (random() + random() + random() - 1.5) * 1.1
        const angle = WIND + spread
        const m = Math.round((magnitude * Math.cos(angle)) / unit)
        const n = Math.round((magnitude * Math.sin(angle)) / unit)
        const key = `${m},${n}`
        if ((m === 0 && n === 0) || taken.has(key)) continue
        taken.add(key)
        const kx = m * unit
        const kz = n * unit
        // A little more weight on the short waves than the spectrum gives
        // them: the ripples are what break a reflection up into glitter.
        const amplitude = Math.sqrt(phillips(kx, kz)) * Math.pow(Math.hypot(kx, kz), 0.45)
        slope += (amplitude * Math.hypot(kx, kz)) ** 2
        waves.push(new THREE.Vector4(kx, kz, amplitude, random() * Math.PI * 2))
    }

    // Normalised to a calm sea's slope rather than to any absolute energy.
    const scale = 0.11 / Math.sqrt(slope)
    waves.forEach((w) => (w.z *= scale))
    while (waves.length < WAVES) waves.push(new THREE.Vector4(1, 0, 0, 0))
    return waves
}

export type Ocean = {
    texture: THREE.Texture
    update: (renderer: THREE.WebGLRenderer, time: number) => void
    dispose: () => void
}

export const createOcean = (): Ocean => {
    const target = new THREE.WebGLRenderTarget(RESOLUTION, RESOLUTION, {
        type: THREE.HalfFloatType,
        wrapS: THREE.RepeatWrapping,
        wrapT: THREE.RepeatWrapping,
        minFilter: THREE.LinearMipmapLinearFilter,
        magFilter: THREE.LinearFilter,
        generateMipmaps: true,
        depthBuffer: false,
    })
    target.texture.anisotropy = 8

    const material = new THREE.ShaderMaterial({
        vertexShader: passVertex,
        fragmentShader: fragment,
        uniforms: {uWaves: {value: createWaves()}, uTime: {value: 0}},
        depthTest: false,
        depthWrite: false,
    })
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
    quad.frustumCulled = false
    const scene = new THREE.Scene()
    scene.add(quad)
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    return {
        texture: target.texture,
        update: (renderer, time) => {
            material.uniforms.uTime.value = time
            const previous = renderer.getRenderTarget()
            renderer.setRenderTarget(target)
            renderer.render(scene, camera)
            renderer.setRenderTarget(previous)
        },
        dispose: () => {
            target.dispose()
            material.dispose()
            quad.geometry.dispose()
        },
    }
}
