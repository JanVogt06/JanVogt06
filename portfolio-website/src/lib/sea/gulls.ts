import * as THREE from "three"
import {SKY} from "./glsl"

const COUNT = 7

const vertex = /* glsl */ `
    attribute float aSpan;
    attribute float aPhase;

    uniform float uTime;

    varying vec3 vWorld;
    varying vec3 vNormal;

    void main() {
        // A few quick beats, then a long glide with the wings held a little
        // raised, the way gulls fly.
        float beat = sin(uTime * 15.0 + aPhase);
        float flapping = smoothstep(0.2, 0.6, sin(uTime * 0.7 + aPhase * 1.9));
        float lift = mix(0.12, beat * 0.55, flapping);
        vec3 p = position;
        p.y += lift * pow(aSpan, 1.4) - 0.08 * aSpan * aSpan;

        vec4 world = modelMatrix * instanceMatrix * vec4(p, 1.0);
        vWorld = world.xyz;
        vNormal = normalize(mat3(modelMatrix * instanceMatrix) * vec3(0.0, 1.0, 0.0));
        gl_Position = projectionMatrix * viewMatrix * world;
    }
`

const fragment = /* glsl */ `
    precision highp float;

    ${SKY}

    varying vec3 vWorld;
    varying vec3 vNormal;

    void main() {
        // Seen from below a gull is mostly shadow, with the sun catching the
        // upper side of a wing as it beats.
        vec3 n = normalize(vNormal);
        vec3 c = vec3(0.07) * lit(n) + vec3(0.5) * lit(-n) * 0.25;
        float dist = length(cameraPosition - vWorld);
        c = mix(c, horizonColor(vWorld - cameraPosition), fogAmount(dist));
        gl_FragColor = vec4(c, 0.0);
    }
`

/** One bird, nose to -z: a slim body and two wings that bend at the elbow. */
const createBird = () => {
    const positions: number[] = []
    const spans: number[] = []
    const tri = (...points: Array<[number, number, number]>) => {
        points.forEach(([x, z, span]) => {
            positions.push(x, 0, z)
            spans.push(span)
        })
    }
    tri([0, -0.42, 0], [0.07, 0, 0], [-0.07, 0, 0])
    tri([0.07, 0, 0], [0, 0.4, 0], [-0.07, 0, 0])
    for (const side of [1, -1]) {
        tri([0.06 * side, -0.12, 0.05], [0.48 * side, -0.05, 0.5], [0.06 * side, 0.14, 0.05])
        tri([0.06 * side, 0.14, 0.05], [0.48 * side, -0.05, 0.5], [0.48 * side, 0.1, 0.5])
        tri([0.48 * side, -0.05, 0.5], [1 * side, 0.18, 1], [0.48 * side, 0.1, 0.5])
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute("aSpan", new THREE.Float32BufferAttribute(spans, 1))
    return geometry
}

type Gull = {radius: number; height: number; speed: number; angle: number; drift: number}

export type Gulls = {
    mesh: THREE.InstancedMesh
    update: (time: number, dt: number, around: THREE.Vector3, day: number) => void
    dispose: () => void
}

/** A loose flock wheeling over the water ahead of the camera, by day only. */
export const createGulls = (shared: Record<string, THREE.IUniform>): Gulls => {
    const geometry = createBird()
    const phases = new Float32Array(COUNT)
    let seed = 11
    const random = () => {
        seed = (seed * 16807) % 2147483647
        return seed / 2147483647
    }
    const gulls: Gull[] = Array.from({length: COUNT}, (_, i) => {
        phases[i] = random() * 10
        return {
            radius: 14 + random() * 22,
            height: 6 + random() * 9,
            speed: (0.13 + random() * 0.08) * (i % 3 === 0 ? -1 : 1),
            angle: random() * Math.PI * 2,
            drift: random() * 6,
        }
    })
    geometry.setAttribute("aPhase", new THREE.InstancedBufferAttribute(phases, 1))

    const material = new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: shared,
        side: THREE.DoubleSide,
    })
    const mesh = new THREE.InstancedMesh(geometry, material, COUNT)
    mesh.frustumCulled = false

    const center = new THREE.Vector3()
    let placed = false
    const matrix = new THREE.Matrix4()
    const quaternion = new THREE.Quaternion()
    const euler = new THREE.Euler(0, 0, 0, "YXZ")
    const position = new THREE.Vector3()
    const scale = new THREE.Vector3()

    return {
        mesh,
        update: (time, dt, around, day) => {
            // The flock follows the camera loosely, so it is never left behind
            // and never seems pinned to it either.
            if (!placed) center.copy(around)
            placed = true
            center.lerp(around, 1 - Math.exp(-dt / 6))

            gulls.forEach((g, i) => {
                g.angle += g.speed * dt
                const wobble = Math.sin(time * 0.3 + g.drift) * 4
                position.set(
                    center.x + Math.cos(g.angle) * (g.radius + wobble),
                    g.height + Math.sin(time * 0.5 + g.drift) * 1.5,
                    center.z + Math.sin(g.angle) * (g.radius + wobble) * 0.7,
                )
                // Nose along the circle, banked into the turn.
                const s = Math.sign(g.speed)
                const vx = -Math.sin(g.angle) * s
                const vz = Math.cos(g.angle) * 0.7 * s
                euler.set(0, Math.atan2(-vx, -vz), 0.35 * s)
                quaternion.setFromEuler(euler)
                scale.setScalar(0.75 * day)
                matrix.compose(position, quaternion, scale)
                mesh.setMatrixAt(i, matrix)
            })
            mesh.instanceMatrix.needsUpdate = true
            mesh.visible = day > 0.02
        },
        dispose: () => {
            geometry.dispose()
            material.dispose()
        },
    }
}
