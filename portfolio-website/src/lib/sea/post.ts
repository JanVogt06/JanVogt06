import * as THREE from "three"
import {passVertex} from "./glsl"

const thresholdFragment = /* glsl */ `
    precision highp float;

    varying vec2 vUv;
    uniform sampler2D uScene;
    uniform float uExposure;

    void main() {
        vec3 c = min(texture2D(uScene, vUv).rgb * uExposure, vec3(12.0));
        float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
        gl_FragColor = vec4(c * smoothstep(0.9, 2.5, luma), 1.0);
    }
`

const blurFragment = /* glsl */ `
    precision highp float;

    varying vec2 vUv;
    uniform sampler2D uSource;
    uniform vec2 uStep;

    void main() {
        vec2 near = uStep * 1.3846153846;
        vec2 far = uStep * 3.2307692308;
        vec3 sum = texture2D(uSource, vUv).rgb * 0.2270270270;
        sum += (texture2D(uSource, vUv + near).rgb + texture2D(uSource, vUv - near).rgb) * 0.3162162162;
        sum += (texture2D(uSource, vUv + far).rgb + texture2D(uSource, vUv - far).rgb) * 0.0702702703;
        gl_FragColor = vec4(sum, 1.0);
    }
`

// Grading lives here so every material can write plain scene radiance: the
// exposure the light asks for, a filmic curve for the sun and the screens, a
// little grain and a quiet vignette.
const compositeFragment = /* glsl */ `
    precision highp float;

    varying vec2 vUv;
    uniform sampler2D uScene;
    uniform sampler2D uBloom;
    uniform float uBloomStrength;
    uniform float uExposure;
    uniform float uTime;
    uniform vec2 uResolution;

    // Narkowicz's fit of the ACES curve, applied to the luminance alone so a
    // red sunset stays red instead of sliding to yellow; only light too bright
    // for any channel to hold fades towards white.
    float curve(float x) {
        return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
    }

    vec3 filmic(vec3 c) {
        float l = max(dot(c, vec3(0.2126, 0.7152, 0.0722)), 1e-6);
        float t = curve(l);
        vec3 mapped = c * (t / l);
        float peak = max(max(mapped.r, mapped.g), mapped.b);
        return mix(mapped / max(peak, 1.0), vec3(t), smoothstep(1.0, 3.0, peak) * 0.6 + smoothstep(0.8, 1.0, t) * 0.4);
    }

    vec3 toSrgb(vec3 c) {
        c = clamp(c, 0.0, 1.0);
        return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
    }

    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
        vec3 c = texture2D(uScene, vUv).rgb * uExposure;
        c += texture2D(uBloom, vUv).rgb * uBloomStrength;

        vec2 q = vUv - 0.5;
        q.x *= uResolution.x / uResolution.y;
        c *= mix(1.0, 0.8, smoothstep(0.4, 1.1, length(q)));

        c = toSrgb(filmic(c * 0.8));

        float grain = hash(vUv * uResolution + fract(uTime * 7.31) * 113.0) - 0.5;
        c += grain * 0.022;

        gl_FragColor = vec4(c, 1.0);
    }
`

export type Post = {
    render: (scene: THREE.Scene, camera: THREE.Camera, time: number, exposure: number) => void
    setSize: (width: number, height: number, pixelRatio: number) => void
    dispose: () => void
}

const BLOOM_DIVISOR = 4

export const createPost = (renderer: THREE.WebGLRenderer, samples: number): Post => {
    const quad = new THREE.PlaneGeometry(2, 2)
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const sceneTarget = new THREE.WebGLRenderTarget(1, 1, {type: THREE.HalfFloatType, samples})
    const bloom = [0, 1].map(
        () =>
            new THREE.WebGLRenderTarget(1, 1, {
                type: THREE.HalfFloatType,
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
            }),
    )

    const pass = (fragmentShader: string, uniforms: Record<string, THREE.IUniform>) =>
        new THREE.ShaderMaterial({
            vertexShader: passVertex,
            fragmentShader,
            uniforms,
            depthTest: false,
            depthWrite: false,
        })

    const exposure = {value: 1}
    const threshold = pass(thresholdFragment, {uScene: {value: sceneTarget.texture}, uExposure: exposure})
    const blur = pass(blurFragment, {uSource: {value: null}, uStep: {value: new THREE.Vector2()}})
    const composite = pass(compositeFragment, {
        uScene: {value: sceneTarget.texture},
        uBloom: {value: bloom[0].texture},
        uBloomStrength: {value: 0.12},
        uExposure: exposure,
        uTime: {value: 0},
        uResolution: {value: new THREE.Vector2(1, 1)},
    })

    const screen = new THREE.Scene()
    const surface = new THREE.Mesh(quad, threshold)
    surface.frustumCulled = false
    screen.add(surface)

    const texel = new THREE.Vector2()

    const draw = (material: THREE.ShaderMaterial, target: THREE.WebGLRenderTarget | null) => {
        surface.material = material
        renderer.setRenderTarget(target)
        renderer.render(screen, camera)
    }

    const blurInto = (source: THREE.Texture, target: THREE.WebGLRenderTarget, x: number, y: number) => {
        blur.uniforms.uSource.value = source
        blur.uniforms.uStep.value.set(x, y)
        draw(blur, target)
    }

    return {
        setSize: (width, height, pixelRatio) => {
            const w = Math.max(1, Math.round(width * pixelRatio))
            const h = Math.max(1, Math.round(height * pixelRatio))
            sceneTarget.setSize(w, h)
            const bw = Math.max(1, Math.round(w / BLOOM_DIVISOR))
            const bh = Math.max(1, Math.round(h / BLOOM_DIVISOR))
            bloom.forEach((target) => target.setSize(bw, bh))
            texel.set(1 / bw, 1 / bh)
            composite.uniforms.uResolution.value.set(w, h)
        },

        render: (scene, view, time, value) => {
            exposure.value = value
            renderer.setRenderTarget(sceneTarget)
            renderer.clear()
            renderer.render(scene, view)

            draw(threshold, bloom[0])
            blurInto(bloom[0].texture, bloom[1], texel.x, 0)
            blurInto(bloom[1].texture, bloom[0], 0, texel.y)
            blurInto(bloom[0].texture, bloom[1], texel.x * 2.5, 0)
            blurInto(bloom[1].texture, bloom[0], 0, texel.y * 2.5)

            composite.uniforms.uTime.value = time
            draw(composite, null)
        },

        dispose: () => {
            quad.dispose()
            sceneTarget.dispose()
            bloom.forEach((target) => target.dispose())
            threshold.dispose()
            blur.dispose()
            composite.dispose()
        },
    }
}
