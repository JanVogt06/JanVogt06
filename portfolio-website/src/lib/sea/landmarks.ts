import * as THREE from "three"
import {SKY, panelVertex} from "./glsl"

// A painted surface: matte, lit by the sky like the prints, in bands of
// white and red the way a lighthouse or a buoy is painted.
const paintFragment = /* glsl */ `
    precision highp float;

    ${SKY}

    uniform vec3 uColor;
    uniform vec3 uBand;
    uniform float uBands;
    uniform float uBottom;
    uniform float uHeight;

    varying vec2 vUv;
    varying vec3 vWorld;
    varying vec3 vNormal;

    void main() {
        float y = (vWorld.y - uBottom) / uHeight;
        float band = uBands > 0.0 ? step(0.5, fract(y * uBands)) : 0.0;
        vec3 c = mix(uColor, uBand, band) * lit(normalize(vNormal));
        float dist = length(cameraPosition - vWorld);
        c = mix(c, horizonColor(vWorld - cameraPosition), fogAmount(dist));
        gl_FragColor = vec4(c, 0.0);
    }
`

// A light seen from afar: a hard core and a soft halo, scaled against the
// exposure so it reads the same at dusk as at midnight, and dimmed by the haze.
const lampVertex = /* glsl */ `
    uniform float uSize;
    uniform float uPixelRatio;

    varying float vDist;

    void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vDist = length(cameraPosition - world.xyz);
        vec4 view = viewMatrix * world;
        gl_PointSize = uSize * uPixelRatio * clamp(40.0 / vDist, 0.35, 2.0);
        gl_Position = projectionMatrix * view;
    }
`

const lampFragment = /* glsl */ `
    precision highp float;

    uniform vec3 uColor;
    uniform float uOn;
    uniform float uInvExposure;
    uniform float uFogDensity;

    varying float vDist;

    void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float core = smoothstep(0.18, 0.0, d);
        float halo = exp(-d * 4.0) * 0.35;
        float seen = exp(-vDist * uFogDensity * 0.6);
        gl_FragColor = vec4(uColor * (core * 6.0 + halo) * uOn * seen * uInvExposure, 1.0);
    }
`

// The lighthouse beam: a long cone of lit haze, brightest at the lamp and
// along its axis, so its edges dissolve instead of ending.
const beamVertex = /* glsl */ `
    varying vec3 vWorld;
    varying vec3 vNormal;
    varying float vAlong;

    void main() {
        vAlong = uv.y;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        vNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * world;
    }
`

const beamFragment = /* glsl */ `
    precision highp float;

    uniform float uOn;
    uniform float uInvExposure;
    uniform vec3 uColor;

    varying vec3 vWorld;
    varying vec3 vNormal;
    varying float vAlong;

    void main() {
        vec3 v = normalize(cameraPosition - vWorld);
        float edge = pow(clamp(1.0 - abs(dot(normalize(vNormal), v)), 0.0, 1.0), 2.5);
        float fall = pow(clamp(vAlong, 0.0, 1.0), 1.6);
        gl_FragColor = vec4(uColor * (1.0 - edge) * fall * 0.05 * uOn * uInvExposure, 1.0);
    }
`

const ADD = {
    transparent: true,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.ZeroFactor,
    blendDstAlpha: THREE.OneFactor,
} as const

export type Lamp = {points: THREE.Points; material: THREE.ShaderMaterial}

export type Buoy = {group: THREE.Group; base: THREE.Vector3; phase: number; lamp: Lamp; period: number}

export type Landmarks = {
    group: THREE.Group
    buoys: Buoy[]
    update: (time: number, night: number, pixelRatio: number) => void
    dispose: () => void
}

/**
 * Life on the horizon and around the panels: an island with a lighthouse far
 * off to the right of the row, its beam turning once the sun is down, and a
 * few buoys whose lamps start to blink at dusk.
 */
export const createLandmarks = (
    shared: Record<string, THREE.IUniform>,
    island: THREE.Vector3,
    buoys: Array<{at: THREE.Vector3; color: "red" | "green"}>,
): Landmarks => {
    const group = new THREE.Group()
    const disposables: Array<{dispose: () => void}> = []

    const paint = (color: THREE.Color, band = color, bands = 0, bottom = 0, height = 1) => {
        const material = new THREE.ShaderMaterial({
            vertexShader: panelVertex,
            fragmentShader: paintFragment,
            uniforms: {
                ...shared,
                uColor: {value: color},
                uBand: {value: band},
                uBands: {value: bands},
                uBottom: {value: bottom},
                uHeight: {value: height},
            },
        })
        disposables.push(material)
        return material
    }

    const lamp = (color: THREE.Color, size: number): Lamp => {
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3))
        const material = new THREE.ShaderMaterial({
            vertexShader: lampVertex,
            fragmentShader: lampFragment,
            uniforms: {
                uColor: {value: color},
                uSize: {value: size},
                uPixelRatio: {value: 1},
                uOn: {value: 0},
                uInvExposure: shared.uInvExposure,
                uFogDensity: shared.uFogDensity,
            },
            ...ADD,
        })
        const points = new THREE.Points(geometry, material)
        points.frustumCulled = false
        disposables.push(geometry, material)
        return {points, material}
    }

    const mesh = (geometry: THREE.BufferGeometry, material: THREE.Material) => {
        disposables.push(geometry)
        return new THREE.Mesh(geometry, material)
    }

    // The island: two low humps of dark rock and scrub, half lost in haze.
    const rock = paint(new THREE.Color(0.05, 0.055, 0.045))
    const hump = (x: number, z: number, r: number, h: number) => {
        const m = mesh(new THREE.SphereGeometry(1, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), rock)
        m.scale.set(r, h, r * 0.62)
        m.position.set(island.x + x, -0.5, island.z + z)
        group.add(m)
    }
    hump(0, 0, 70, 15)
    hump(-58, 14, 42, 9)
    hump(46, -10, 30, 6)

    // The lighthouse on its highest point.
    const towerHeight = 22
    const towerBase = 12
    const tower = mesh(
        new THREE.CylinderGeometry(1.7, 2.6, towerHeight, 24),
        paint(new THREE.Color(0.82, 0.8, 0.76), new THREE.Color(0.55, 0.08, 0.07), 4, towerBase, towerHeight),
    )
    tower.position.set(island.x - 6, towerBase + towerHeight / 2, island.z)
    group.add(tower)
    const cap = mesh(new THREE.ConeGeometry(2.4, 3, 24), paint(new THREE.Color(0.1, 0.1, 0.1)))
    const top = towerBase + towerHeight
    cap.position.set(island.x - 6, top + 2.6, island.z)
    group.add(cap)

    const beacon = lamp(new THREE.Color(1, 0.86, 0.6), 46)
    beacon.points.position.set(island.x - 6, top + 0.9, island.z)
    group.add(beacon.points)

    // Two beams back to back, turning about the lamp.
    const beamGeometry = new THREE.CylinderGeometry(0.6, 22, 420, 32, 1, true)
    beamGeometry.translate(0, -210, 0)
    beamGeometry.rotateZ(Math.PI / 2)
    disposables.push(beamGeometry)
    const beamMaterial = new THREE.ShaderMaterial({
        vertexShader: beamVertex,
        fragmentShader: beamFragment,
        uniforms: {
            uOn: {value: 0},
            uInvExposure: shared.uInvExposure,
            uColor: {value: new THREE.Color(1, 0.9, 0.7)},
        },
        side: THREE.DoubleSide,
        ...ADD,
    })
    disposables.push(beamMaterial)
    const beams = new THREE.Group()
    beams.position.copy(beacon.points.position)
    const forward = new THREE.Mesh(beamGeometry, beamMaterial)
    const back = new THREE.Mesh(beamGeometry, beamMaterial)
    back.rotation.y = Math.PI
    forward.frustumCulled = back.frustumCulled = false
    beams.add(forward, back)
    group.add(beams)

    // Buoys: a painted float and a cage with a lamp on top.
    const red = new THREE.Color(0.4, 0.07, 0.06)
    const green = new THREE.Color(0.06, 0.22, 0.12)
    const floatGeometry = new THREE.CylinderGeometry(0.45, 0.6, 1.4, 20)
    const topGeometry = new THREE.ConeGeometry(0.35, 0.9, 16)
    disposables.push(floatGeometry, topGeometry)
    const made: Buoy[] = buoys.map(({at, color}, i) => {
        const paintColor = color === "red" ? red : green
        const body = new THREE.Mesh(floatGeometry, paint(paintColor, new THREE.Color(0.8, 0.78, 0.74), 2, 0, 1.4))
        body.position.y = 0.3
        const head = new THREE.Mesh(topGeometry, paint(paintColor))
        head.position.y = 1.45
        const light = lamp(color === "red" ? new THREE.Color(1, 0.22, 0.15) : new THREE.Color(0.3, 1, 0.45), 26)
        light.points.position.y = 2.05
        const buoy = new THREE.Group()
        buoy.add(body, head, light.points)
        buoy.position.copy(at)
        group.add(buoy)
        return {group: buoy, base: at.clone(), phase: i * 2.3, lamp: light, period: color === "red" ? 4 : 3}
    })

    return {
        group,
        buoys: made,
        update: (time, night, pixelRatio) => {
            beams.rotation.y = time * 0.45
            beamMaterial.uniforms.uOn.value = night
            beacon.material.uniforms.uOn.value = Math.max(night, 0.15)
            beacon.material.uniforms.uPixelRatio.value = pixelRatio
            made.forEach((b) => {
                b.group.position.y = b.base.y + Math.sin(time * 1.1 + b.phase) * 0.12
                b.group.rotation.z = Math.sin(time * 0.9 + b.phase) * 0.06
                b.group.rotation.x = Math.cos(time * 0.7 + b.phase) * 0.05
                // A short flash in every period, as buoys do.
                const t = (time + b.phase) % b.period
                const flash = t < 0.5 ? Math.sin((t / 0.5) * Math.PI) : 0
                b.lamp.material.uniforms.uOn.value = flash * Math.max(night, 0.25)
                b.lamp.material.uniforms.uPixelRatio.value = pixelRatio
            })
        },
        dispose: () => disposables.forEach((d) => d.dispose()),
    }
}
