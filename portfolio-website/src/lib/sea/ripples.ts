import * as THREE from "three"
import {passVertex} from "./glsl"

/** Side of the patch of sea the solver covers, in metres. It travels with
 *  the camera and always lies in front of it. */
export const RIPPLE_SIZE = 30

const RESOLUTION = 256
const CELL = RIPPLE_SIZE / RESOLUTION

// The linear wave equation, leapfrogged on a grid: a wave moves a third of a
// cell per step, well inside the stable range, and loses a percent of itself
// every step so a ring fades within a few seconds.
const COURANT_SQUARED = 0.12
const DAMPING = 0.99
const STEPS_PER_SECOND = 60

/** How many disturbances along panel edges the solver takes in one step. */
export const SOURCES = 8

const fragment = /* glsl */ `
    precision highp float;

    uniform sampler2D uState;
    uniform vec2 uShift;
    uniform vec4 uStroke;
    uniform float uStrokeStrength;
    uniform vec4 uSources[${SOURCES}];
    uniform float uSourceStrength[${SOURCES}];

    varying vec2 vUv;

    const float TEXEL = ${(1 / RESOLUTION).toFixed(8)};
    const float RADIUS = ${(1.3 / RESOLUTION).toFixed(8)};

    float segment(vec2 p, vec2 a, vec2 b) {
        vec2 ab = b - a;
        float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-8), 0.0, 1.0);
        return length(p - a - ab * t);
    }

    void main() {
        vec2 uv = vUv + uShift;
        vec2 state = texture2D(uState, uv).rg;
        float h = state.r;
        float before = state.g;
        float around = texture2D(uState, uv + vec2(TEXEL, 0.0)).r + texture2D(uState, uv - vec2(TEXEL, 0.0)).r
            + texture2D(uState, uv + vec2(0.0, TEXEL)).r + texture2D(uState, uv - vec2(0.0, TEXEL)).r;
        float next = (2.0 * h - before + ${COURANT_SQUARED} * (around - 4.0 * h)) * ${DAMPING};

        float d = segment(vUv, uStroke.xy, uStroke.zw);
        next += uStrokeStrength * exp(-(d * d) / (RADIUS * RADIUS));

        for (int i = 0; i < ${SOURCES}; i++) {
            vec4 s = uSources[i];
            vec2 along = vec2(cos(s.z), sin(s.z)) * s.w;
            float e = segment(vUv, s.xy - along, s.xy + along);
            next += uSourceStrength[i] * exp(-(e * e) / (RADIUS * RADIUS * 0.5));
        }

        // The edge of the patch soaks waves up rather than throwing them back.
        float edge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
        next *= mix(0.86, 1.0, smoothstep(0.0, 0.07, edge));

        gl_FragColor = vec4(next, h, 0.0, 1.0);
    }
`

export type RippleSource = {x: number; z: number; angle: number; half: number; strength: number}

export type Ripples = {
    texture: () => THREE.Texture
    center: THREE.Vector2
    /** Pushes the water down along a stroke in world space. */
    stroke: (from: THREE.Vector2, to: THREE.Vector2, strength: number) => void
    update: (renderer: THREE.WebGLRenderer, dt: number, focus: THREE.Vector2, sources: RippleSource[]) => void
    dispose: () => void
}

export const createRipples = (): Ripples => {
    // Filtered, so the water reads the field smoothly; the solver only ever
    // samples cell centres, where filtering changes nothing.
    const targets = [0, 1].map(
        () =>
            new THREE.WebGLRenderTarget(RESOLUTION, RESOLUTION, {
                type: THREE.HalfFloatType,
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                wrapS: THREE.ClampToEdgeWrapping,
                wrapT: THREE.ClampToEdgeWrapping,
                depthBuffer: false,
            }),
    )

    const material = new THREE.ShaderMaterial({
        vertexShader: passVertex,
        fragmentShader: fragment,
        uniforms: {
            uState: {value: null},
            uShift: {value: new THREE.Vector2()},
            uStroke: {value: new THREE.Vector4()},
            uStrokeStrength: {value: 0},
            uSources: {value: Array.from({length: SOURCES}, () => new THREE.Vector4())},
            uSourceStrength: {value: new Array(SOURCES).fill(0)},
        },
        depthTest: false,
        depthWrite: false,
    })
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
    quad.frustumCulled = false
    const scene = new THREE.Scene()
    scene.add(quad)
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const center = new THREE.Vector2()
    const pendingFrom = new THREE.Vector2()
    const pendingTo = new THREE.Vector2()
    let pending = 0
    let read = 0
    let carry = 0
    let started = false

    const toUv = (p: THREE.Vector2, out: THREE.Vector2) =>
        out.set((p.x - center.x) / RIPPLE_SIZE + 0.5, (p.y - center.y) / RIPPLE_SIZE + 0.5)

    return {
        texture: () => targets[read].texture,
        center,

        stroke: (from, to, strength) => {
            // Strokes between two frames are merged into the latest one.
            if (pending === 0) pendingFrom.copy(from)
            pendingTo.copy(to)
            pending = Math.min(pending + strength, 1.5)
        },

        update: (renderer, dt, focus, sources) => {
            const previous = renderer.getRenderTarget()
            const u = material.uniforms

            // Follow the camera in whole cells, so the field moves without
            // ever being resampled between them.
            const nx = Math.round(focus.x / CELL) * CELL
            const nz = Math.round(focus.y / CELL) * CELL
            const shift = started ? new THREE.Vector2((nx - center.x) / RIPPLE_SIZE, (nz - center.y) / RIPPLE_SIZE) : new THREE.Vector2()
            center.set(nx, nz)
            started = true

            carry += dt * STEPS_PER_SECOND
            const steps = Math.min(Math.floor(carry), 3)
            carry -= Math.floor(carry)

            for (let i = 0; i < steps; i++) {
                u.uState.value = targets[read].texture
                u.uShift.value.copy(i === 0 ? shift : new THREE.Vector2())

                const from = toUv(pendingFrom, new THREE.Vector2())
                const to = toUv(pendingTo, new THREE.Vector2())
                u.uStroke.value.set(from.x, from.y, to.x, to.y)
                u.uStrokeStrength.value = i === 0 ? -0.6 * pending : 0

                sources.slice(0, SOURCES).forEach((s, k) => {
                    const at = toUv(new THREE.Vector2(s.x, s.z), new THREE.Vector2())
                    u.uSources.value[k].set(at.x, at.y, s.angle, s.half / RIPPLE_SIZE)
                    u.uSourceStrength.value[k] = s.strength / steps
                })
                for (let k = sources.length; k < SOURCES; k++) u.uSourceStrength.value[k] = 0

                renderer.setRenderTarget(targets[1 - read])
                renderer.render(scene, camera)
                read = 1 - read
            }
            if (steps > 0) pending = 0
            renderer.setRenderTarget(previous)
        },

        dispose: () => {
            targets.forEach((t) => t.dispose())
            material.dispose()
            quad.geometry.dispose()
        },
    }
}

export const RIPPLE_TEXEL = 1 / RESOLUTION
