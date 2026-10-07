import * as THREE from "three"
import {constellations} from "@/lib/constellations"

const RADIUS = 650

const starVertex = /* glsl */ `
    attribute float aGroup;

    uniform float uPixelRatio;
    uniform float uTime;
    uniform float uActive;

    varying float vLit;
    varying float vTwinkle;

    void main() {
        vLit = uActive < 0.0 ? 0.0 : 1.0 - step(0.5, abs(aGroup - uActive));
        vTwinkle = 0.85 + 0.15 * sin(uTime * 1.3 + aGroup * 4.0 + position.x * 0.01);
        gl_PointSize = (5.0 + vLit * 2.5) * uPixelRatio;
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
        gl_Position.z = gl_Position.w * 0.99998;
    }
`

const starFragment = /* glsl */ `
    precision highp float;

    uniform float uAmount;
    uniform float uInvExposure;

    varying float vLit;
    varying float vTwinkle;

    void main() {
        // Figures belong to the sky, not to its reflection.
        if (cameraPosition.y < 0.0) discard;
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float core = smoothstep(0.45, 0.0, d);
        float halo = exp(-d * 3.0) * 0.4;
        float a = (core + halo) * vTwinkle * uAmount * (1.4 + vLit * 1.4);
        gl_FragColor = vec4(vec3(0.86, 0.92, 1.0) * a * uInvExposure, 1.0);
    }
`

const lineVertex = /* glsl */ `
    attribute float aGroup;

    uniform float uActive;

    varying float vLit;

    void main() {
        vLit = uActive < 0.0 ? 0.0 : 1.0 - step(0.5, abs(aGroup - uActive));
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
        gl_Position.z = gl_Position.w * 0.99998;
    }
`

const lineFragment = /* glsl */ `
    precision highp float;

    uniform float uAmount;
    uniform float uInvExposure;

    varying float vLit;

    void main() {
        if (cameraPosition.y < 0.0) discard;
        gl_FragColor = vec4(vec3(0.75, 0.84, 1.0) * uAmount * (0.22 + vLit * 0.5) * uInvExposure, 1.0);
    }
`

const ADD = {
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.ZeroFactor,
    blendDstAlpha: THREE.OneFactor,
} as const

export type Figures = {
    group: THREE.Group
    /** World directions of every star, in the order of the constellations. */
    directions: THREE.Vector3[]
    /** Lays the stars out for the frame of the night shot. */
    place: (yaw: number, pitch: number, tanH: number, tanV: number, tall: boolean) => void
    update: (time: number, amount: number, pixelRatio: number) => void
    setActive: (group: number | null) => void
    dispose: () => void
}

export const createFigures = (invExposure: THREE.IUniform): Figures => {
    const stars = constellations.flatMap((c, g) => c.stars.map((s) => ({star: s, group: g})))
    const directions = stars.map(() => new THREE.Vector3())

    const starPositions = new Float32Array(stars.length * 3)
    const starGroups = new Float32Array(stars.map((s) => s.group))
    const starGeometry = new THREE.BufferGeometry()
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3))
    starGeometry.setAttribute("aGroup", new THREE.BufferAttribute(starGroups, 1))

    const offsets: number[] = []
    let offset = 0
    constellations.forEach((c) => {
        offsets.push(offset)
        offset += c.stars.length
    })
    const segments = constellations.flatMap((c, g) => c.lines.map(([a, b]) => ({a: offsets[g] + a, b: offsets[g] + b, group: g})))
    const linePositions = new Float32Array(segments.length * 6)
    const lineGroups = new Float32Array(segments.flatMap((s) => [s.group, s.group]))
    const lineGeometry = new THREE.BufferGeometry()
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3))
    lineGeometry.setAttribute("aGroup", new THREE.BufferAttribute(lineGroups, 1))

    const shared = {
        uAmount: {value: 0},
        uInvExposure: invExposure,
        uActive: {value: -1},
        uTime: {value: 0},
        uPixelRatio: {value: 1},
    }
    const starMaterial = new THREE.ShaderMaterial({vertexShader: starVertex, fragmentShader: starFragment, uniforms: shared, ...ADD})
    const lineMaterial = new THREE.ShaderMaterial({vertexShader: lineVertex, fragmentShader: lineFragment, uniforms: shared, ...ADD})

    const points = new THREE.Points(starGeometry, starMaterial)
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial)
    points.frustumCulled = lines.frustumCulled = false
    points.renderOrder = lines.renderOrder = -1
    const group = new THREE.Group()
    group.add(lines, points)

    const euler = new THREE.Euler(0, 0, 0, "YXZ")

    return {
        group,
        directions,
        place: (yaw, pitch, tanH, tanV, tall) => {
            euler.set(pitch, yaw, 0)
            stars.forEach(({star}, i) => {
                const [x, y] = tall ? star.tall : star.wide
                directions[i].set(x * tanH, y * tanV, -1).normalize().applyEuler(euler)
                starPositions.set([directions[i].x * RADIUS, directions[i].y * RADIUS, directions[i].z * RADIUS], i * 3)
            })
            segments.forEach((s, k) => {
                linePositions.set(starPositions.subarray(s.a * 3, s.a * 3 + 3), k * 6)
                linePositions.set(starPositions.subarray(s.b * 3, s.b * 3 + 3), k * 6 + 3)
            })
            starGeometry.attributes.position.needsUpdate = true
            lineGeometry.attributes.position.needsUpdate = true
        },
        update: (time, amount, pixelRatio) => {
            shared.uTime.value = time
            shared.uAmount.value = amount
            shared.uPixelRatio.value = pixelRatio
            group.visible = amount > 0.01
        },
        setActive: (active) => {
            shared.uActive.value = active ?? -1
        },
        dispose: () => {
            starGeometry.dispose()
            lineGeometry.dispose()
            starMaterial.dispose()
            lineMaterial.dispose()
        },
    }
}
