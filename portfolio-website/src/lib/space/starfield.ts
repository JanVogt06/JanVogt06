import * as THREE from "three"
import {galacticOrientation} from "./galactic"

const vertexShader = `
    attribute float aSize;
    attribute float aBright;
    attribute vec3 aColor;

    uniform float uTime;
    uniform float uPixelRatio;

    uniform float uAttenuate;
    uniform float uSizeScale;

    uniform vec2 uNearFade;
    uniform float uMaxSize;

    varying vec3 vColor;
    varying float vBright;

    void main() {
        vColor = aColor;

        vec4 view = modelViewMatrix * vec4(position, 1.0);
        float dist = max(-view.z, 0.001);

        float nearFade = mix(1.0, smoothstep(uNearFade.x, uNearFade.y, dist), uAttenuate);

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

    radius: number

    parallax: boolean

    brightness?: number
    bandFraction?: number

    nearFade?: [number, number]
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

    let state = seed
    const rand = () => {
        state = (state * 16807) % 2147483647
        return state / 2147483647
    }

    const gauss = () => {
        const u = Math.max(rand(), 1e-6)
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand())
    }

    const dustAt = (lon: number) =>
        0.55 +
        0.45 *
            (0.5 +
                0.5 *
                    Math.sin(lon * 2.0 + 0.7) *
                    0.6 *
                    (1 + 0.6 * Math.sin(lon * 5.0 - 1.3) + 0.4 * Math.sin(lon * 11.0 + 2.1)))

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
            const lat = gauss() * 0.11
            v.set(
                Math.cos(lon) * Math.cos(lat),
                Math.sin(lat),
                Math.sin(lon) * Math.cos(lat),
            )

            v.applyQuaternion(orientation)
        } else {
            const u = rand() * 2 - 1
            const s = Math.sqrt(1 - u * u)
            v.set(Math.cos(lon) * s, u, Math.sin(lon) * s)
            lon = Math.atan2(v.z, v.x)
        }

        const r = radius * (0.55 + rand() * 0.45)
        positions[i * 3] = v.x * r
        positions[i * 3 + 1] = v.y * r
        positions[i * 3 + 2] = v.z * r

        const mag = Math.pow(rand(), 2.3)

        if (inBand) {
            brights[i] = (0.11 + mag * 0.5) * dustAt(lon) * brightness
            sizes[i] = 0.85 + mag * 1.3
        } else {
            brights[i] = (0.16 + mag * 0.9) * brightness
            sizes[i] = (parallax ? 1.5 : 1.1) + mag * 3.2 + rand() * 0.5

            if (mag > 0.9) {
                sizes[i] *= 1.7
                brights[i] = Math.min(1.05, brights[i] * 1.3)
            }
        }

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
