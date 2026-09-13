import * as THREE from "three"

const passVertexShader = `
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
    }
`

const thresholdFragmentShader = `
    precision highp float;

    varying vec2 vUv;

    uniform sampler2D uScene;
    uniform float uThreshold;
    uniform float uKnee;

    void main() {
        vec4 scene = texture2D(uScene, vUv);

        float luma = dot(scene.rgb, vec3(0.2126, 0.7152, 0.0722));
        float lift = smoothstep(uThreshold - uKnee, uThreshold + uKnee, luma);

        gl_FragColor = vec4(scene.rgb * lift, 1.0);
    }
`

const blurFragmentShader = `
    precision highp float;

    varying vec2 vUv;

    uniform sampler2D uSource;
    uniform vec2 uDirection;

    void main() {
        vec2 near = uDirection * 1.3846153846;
        vec2 far = uDirection * 3.2307692308;

        vec3 sum = texture2D(uSource, vUv).rgb * 0.2270270270;
        sum += (texture2D(uSource, vUv + near).rgb + texture2D(uSource, vUv - near).rgb) * 0.3162162162;
        sum += (texture2D(uSource, vUv + far).rgb + texture2D(uSource, vUv - far).rgb) * 0.0702702703;

        gl_FragColor = vec4(sum, 1.0);
    }
`

const compositeFragmentShader = `
    precision highp float;

    varying vec2 vUv;

    uniform sampler2D uScene;
    uniform sampler2D uBloom;
    uniform float uStrength;

    void main() {
        vec4 scene = texture2D(uScene, vUv);
        vec3 bloom = texture2D(uBloom, vUv).rgb * uStrength;

        float lift = max(max(bloom.r, bloom.g), bloom.b);

        gl_FragColor = vec4(scene.rgb + bloom, clamp(scene.a + lift, 0.0, 1.0));
    }
`

const BLOOM_DIVISOR = 4

const WIDE_SPREAD = 2.4

export type Post = {
    render: (
        scene: THREE.Scene,
        camera: THREE.Camera,
        background: THREE.Scene,
        backgroundCamera: THREE.Camera,
    ) => void
    setSize: (width: number, height: number, pixelRatio: number) => void
    setStrength: (strength: number) => void
    dispose: () => void
}

export const createPost = (renderer: THREE.WebGLRenderer, samples: number): Post => {
    const quad = new THREE.PlaneGeometry(2, 2)
    const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const sceneTarget = new THREE.WebGLRenderTarget(1, 1, {
        type: THREE.HalfFloatType,
        samples,
    })

    sceneTarget.texture.colorSpace = THREE.SRGBColorSpace

    const bloom = [0, 1].map(() => {
        const target = new THREE.WebGLRenderTarget(1, 1, {type: THREE.HalfFloatType})
        target.texture.minFilter = THREE.LinearFilter
        target.texture.magFilter = THREE.LinearFilter
        return target
    })

    const threshold = new THREE.ShaderMaterial({
        vertexShader: passVertexShader,
        fragmentShader: thresholdFragmentShader,
        uniforms: {
            uScene: {value: sceneTarget.texture},
            uThreshold: {value: 0.52},
            uKnee: {value: 0.28},
        },
        depthTest: false,
        depthWrite: false,
    })

    const blur = new THREE.ShaderMaterial({
        vertexShader: passVertexShader,
        fragmentShader: blurFragmentShader,
        uniforms: {
            uSource: {value: null},
            uDirection: {value: new THREE.Vector2()},
        },
        depthTest: false,
        depthWrite: false,
    })

    const composite = new THREE.ShaderMaterial({
        vertexShader: passVertexShader,
        fragmentShader: compositeFragmentShader,
        uniforms: {
            uScene: {value: sceneTarget.texture},
            uBloom: {value: bloom[0].texture},
            uStrength: {value: 1},
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
    })

    const screen = new THREE.Scene()
    const surface = new THREE.Mesh(quad, threshold)
    surface.frustumCulled = false
    screen.add(surface)

    const texel = new THREE.Vector2()

    const draw = (material: THREE.ShaderMaterial, target: THREE.WebGLRenderTarget | null) => {
        surface.material = material
        renderer.setRenderTarget(target)
        renderer.clear()
        renderer.render(screen, quadCamera)
    }

    const blurInto = (
        source: THREE.Texture,
        target: THREE.WebGLRenderTarget,
        x: number,
        y: number,
    ) => {
        blur.uniforms.uSource.value = source
        blur.uniforms.uDirection.value.set(x, y)
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
        },

        setStrength: (strength) => {
            composite.uniforms.uStrength.value = strength
        },

        render: (scene, camera, background, backgroundCamera) => {
            renderer.setRenderTarget(sceneTarget)
            renderer.clear()
            renderer.render(background, backgroundCamera)
            renderer.clearDepth()
            renderer.render(scene, camera)

            draw(threshold, bloom[0])

            blurInto(bloom[0].texture, bloom[1], texel.x, 0)
            blurInto(bloom[1].texture, bloom[0], 0, texel.y)

            blurInto(bloom[0].texture, bloom[1], texel.x * WIDE_SPREAD, 0)
            blurInto(bloom[1].texture, bloom[0], 0, texel.y * WIDE_SPREAD)

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
