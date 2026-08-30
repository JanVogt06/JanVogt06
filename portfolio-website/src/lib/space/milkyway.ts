import * as THREE from "three"
import {galacticOrientation} from "./galactic"

const vertexShader = `
    varying vec3 vDir;

    void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`

const fragmentShader = `
    precision highp float;

    varying vec3 vDir;

    uniform float uOpacity;
    uniform float uQuality;

    uniform sampler2D uMap;

    uniform float uMapMix;

    uniform float uMapGain;
    uniform float uMapLon;

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
        int octaves = 3 + int(uQuality + 0.5);
        for (int i = 0; i < 4; i++) {
            if (i >= octaves) break;
            v += a * noise(p);
            p *= 2.02;
            a *= 0.5;
        }
        return v;
    }

    void main() {
        vec3 dir = normalize(vDir);

        float lat = asin(clamp(dir.y, -1.0, 1.0));

        float lon = atan(dir.z, dir.x);
        float toCore = cos(lon - 0.6);
        float bulge = smoothstep(0.1, 1.0, toCore);

        float thickness = 0.12 + 0.13 * bulge;
        float band = exp(-pow(abs(lat) / thickness, 1.5));

        float clouds = fbm(vec3(dir.x * 5.5, dir.y * 8.0, dir.z * 5.5));
        clouds = pow(clamp(clouds, 0.0, 1.0), 1.35);
        band *= 0.22 + 1.7 * clouds;

        float dust = fbm(vec3(dir.x * 7.5 + 11.0, dir.y * 19.0, dir.z * 7.5 - 7.0));
        float lane = smoothstep(0.30, 0.56, dust);
        float dustMask = exp(-pow(abs(lat) / (thickness * 1.6), 2.0));
        band *= 1.0 - 0.85 * lane * dustMask;

        vec3 cream = vec3(0.80, 0.76, 0.68);
        vec3 warm = vec3(0.86, 0.66, 0.47);
        vec3 col = mix(cream, warm, bulge * 0.8) * band;

        col += vec3(0.012, 0.014, 0.022) * (0.5 + 0.5 * clouds);

        vec2 mapUv = vec2(
            fract(0.5 - (lon - uMapLon) / 6.2831853),
            clamp(0.5 + lat / 3.14159265, 0.001, 0.999)
        );
        vec3 photo = texture2D(uMap, mapUv).rgb * uMapGain;
        col = mix(col, photo, uMapMix);

        vec3 lit = col * 0.155 * uOpacity;
        float a = clamp(max(max(lit.r, lit.g), lit.b), 0.0, 1.0);
        if (a < 0.002) discard;

        gl_FragColor = vec4(lit / a, a);
    }
`

export type MilkyWay = {
    object: THREE.Mesh
    setOpacity: (opacity: number) => void
    setQuality: (quality: number) => void

    setMap: (texture: THREE.Texture | null) => void

    setMapMix: (mix: number) => void
    dispose: () => void
}

export const createMilkyWay = ({radius = 900, quality = 1} = {}): MilkyWay => {
    const geometry = new THREE.SphereGeometry(radius, 48, 24)

    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
            uOpacity: {value: 1},
            uQuality: {value: quality},
            uMap: {value: null},
            uMapMix: {value: 0},
            uMapGain: {value: 1.35},

            uMapLon: {value: 0.6},
        },
        side: THREE.BackSide,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        transparent: true,
    })

    const object = new THREE.Mesh(geometry, material)

    object.quaternion.copy(galacticOrientation())

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
        setMap: (texture) => {
            material.uniforms.uMap.value = texture
        },
        setMapMix: (mix) => {
            material.uniforms.uMapMix.value = mix
        },
        dispose: () => {
            geometry.dispose()
            material.dispose()
        },
    }
}
