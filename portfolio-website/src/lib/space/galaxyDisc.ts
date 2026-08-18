import * as THREE from "three"

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
    /** Between these distances the glow resolves into single stars. */
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

        float resolve = smoothstep(uResolve.x, uResolve.y, vDist);
        if (resolve <= 0.002) discard;

        float theta = atan(vPos.y, vPos.x) - uTime * (0.10 / (1.0 + r * 0.16));

        float phase = theta - log(1.0 + r) * uWind * 3.2;
        float arm = 0.5 + 0.5 * cos(uArms * phase);

        float sharpness = mix(1.4, 3.4, smoothstep(0.1, 0.75, r / uRadius));
        arm = pow(arm, sharpness);

        float clouds = fbm(vec2(phase * 2.4, r * 0.42));
        arm *= 0.45 + 1.1 * clouds;

        float disc = 0.30 + 0.70 * arm;

        float rr = r / uRadius;
        disc *= exp(-rr * 2.3) * smoothstep(1.42, 0.55, rr);

        float dust = fbm(vec2(phase * 3.1 + 8.0, r * 0.6 - 4.0));
        disc *= 1.0 - 0.5 * smoothstep(0.34, 0.6, dust) * smoothstep(0.08, 0.3, rr);

        float bulge = exp(-pow(rr / 0.24, 1.25));

        vec3 armColor = mix(vec3(0.62, 0.74, 0.92), vec3(0.42, 0.54, 0.76), rr);
        vec3 bulgeColor = vec3(1.0, 0.84, 0.62);
        vec3 col = armColor * disc + bulgeColor * bulge * 0.75;

        vec3 lit = col * uWeight * uOpacity * resolve * 0.8;
        float a = clamp(max(max(lit.r, lit.g), lit.b), 0.0, 1.0);
        if (a < 0.002) discard;

        gl_FragColor = vec4(lit / a, a);
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
    /** Winding of the spiral; must match the point distribution. */
    wind: number
    /** Half thickness of the disc in world units. */
    thickness?: number
    /** Number of stacked layers. Odd, so one lies exactly in the plane. */
    layers?: number
    quality?: number
    /** Distances between which the glow resolves into single stars. */
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
    const geometry = new THREE.CircleGeometry(radius * 1.45, 72)
    const materials: THREE.ShaderMaterial[] = []

    for (let i = 0; i < layers; i++) {
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

    // Normalize the weights once all of them are known.
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
