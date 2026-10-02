import * as THREE from "three"
import {Reflector} from "three/examples/jsm/objects/Reflector.js"
import {
    lutFragment,
    panelFragment,
    passVertex,
    panelVertex,
    skyFragment,
    skyVertex,
    solidFragment,
    starFragment,
    starVertex,
    waterFragment,
    waterVertex,
} from "./glsl"
import {MOON, MOON_TINT, lightAt} from "./light"
import {DETAIL_SIZE, createOcean} from "./ocean"
import type {Ocean} from "./ocean"
import {createPost} from "./post"
import type {Post} from "./post"
import {SHOT, SHOT_COUNT, panelShot, presence} from "@/lib/journey"

/** A photo is a print the daylight falls on; a project is a screen. */
export type PanelSpec = {image: string; aspect: number; kind: "print" | "screen"}

export type SeaSceneOptions = {
    container: HTMLElement
    panels: PanelSpec[]
    onSelect: (panel: number) => void
    onProgress: (fraction: number) => void
    onReady: () => void
}

const FOV = 38
const EYE = 1.55
const PANEL_WIDTH = 3.2
const PANEL_LIFT = -0.03
const FRAME = 0.045

/** Where the horizon sits on a wide screen while a panel is in focus, in
 *  normalised device units above the centre of the frame. */
const HORIZON = 0.42

const SKY_RADIUS = 900
const STAR_COUNT = 2400

const PIXEL_RATIOS = [0.75, 1, 1.25, 1.5, 2]
const REFLECTION_SCALE = 0.5

const LUT_WIDTH = 192
const LUT_HEIGHT = 96

// Sea water seen from above: almost black, a little blue-green, and the
// colour of the light that comes through the back of a wave.
const SEA = new THREE.Color(0.004, 0.012, 0.018)
const SCATTER = new THREE.Color(0.02, 0.11, 0.09)
const FRAME_COLOR = new THREE.Color(0.05, 0.055, 0.06)

// Seconds for the camera to close most of the gap to where the scroll wants
// it; long enough to feel like a boat, short enough to follow a flick.
const CAMERA_LAG = 0.55

const TAU = Math.PI * 2

// Seconds the opening shot takes to drift in out of the fog once the page
// is ready, and how far back and up it starts.
const INTRO = 4.2
const INTRO_BACK = 9
const INTRO_UP = 0.9

const smooth01 = (t: number) => {
    const c = Math.min(Math.max(t, 0), 1)
    return c * c * (3 - 2 * c)
}
const damp = (current: number, target: number, lag: number, dt: number) =>
    current + (target - current) * (1 - Math.exp(-dt / lag))

type Shot = {position: THREE.Vector3; yaw: number; pitch: number}

type Panel = {
    kind: PanelSpec["kind"]
    group: THREE.Group
    image: THREE.Mesh
    material: THREE.ShaderMaterial
    center: THREE.Vector3
    yaw: number
    width: number
    height: number
}

/** A square grid whose cells grow away from the middle: a few centimetres
 *  under the camera, where the swell needs them, and kilometres at the
 *  horizon, where the sea is only a reflection. */
const createSeaGeometry = (segments = 256, radius = 2500, density = 7) => {
    const stretch = (u: number) => (radius * Math.sinh(density * u)) / Math.sinh(density)
    const positions = new Float32Array((segments + 1) * (segments + 1) * 3)
    const indices: number[] = []
    for (let j = 0; j <= segments; j++) {
        for (let i = 0; i <= segments; i++) {
            const k = (j * (segments + 1) + i) * 3
            positions[k] = stretch((i / segments) * 2 - 1)
            positions[k + 1] = stretch((j / segments) * 2 - 1)
        }
    }
    for (let j = 0; j < segments; j++) {
        for (let i = 0; i < segments; i++) {
            const a = j * (segments + 1) + i
            const b = a + 1
            const c = a + segments + 1
            const d = c + 1
            indices.push(a, b, c, b, d, c)
        }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geometry.setIndex(indices)
    return geometry
}

const catmull = (p0: number, p1: number, p2: number, p3: number, t: number) => {
    const t2 = t * t
    const t3 = t2 * t
    return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
}

/** Where panel `i` stands: a loose row receding to the left, so the camera
 *  slips past each panel's left edge on its way to the next and the panel
 *  leaves the frame to the right, behind it rather than through the copy,
 *  with a longer stretch of open water where the photos give way to work. */
const placement = (i: number) => {
    const gap = i >= SHOT.photos.length ? 16 : 0
    return {
        x: 2.4 - i * 6 + Math.sin(i * 1.1) * 0.5 - gap * 0.3,
        z: -34 - i * 14 - gap,
        yaw: 0.1 + Math.sin(i * 1.7) * 0.05,
    }
}

export class SeaScene {
    private readonly container: HTMLElement
    private readonly options: SeaSceneOptions
    private readonly renderer: THREE.WebGLRenderer
    private readonly scene = new THREE.Scene()
    private readonly camera: THREE.PerspectiveCamera
    private readonly post: Post
    private readonly water: Reflector
    private readonly sky: THREE.Mesh
    private readonly stars: THREE.Points
    private readonly panels: Panel[] = []
    private readonly shared: Record<string, THREE.IUniform>
    private readonly clouds = {value: 0.4}
    private readonly ocean: Ocean
    private readonly lut: THREE.WebGLRenderTarget
    private readonly lutMaterial: THREE.ShaderMaterial
    private readonly lutScene = new THREE.Scene()
    private readonly lutCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    private litShot = Number.NaN
    private exposure = 1
    private readonly textures: THREE.Texture[] = []
    private readonly disposables: Array<{dispose: () => void}> = []
    private readonly raycaster = new THREE.Raycaster()
    private readonly pointer = new THREE.Vector2()
    private readonly resizeObserver: ResizeObserver
    private readonly coarse = window.matchMedia("(pointer: coarse)").matches

    private shots: Shot[] = []
    private shotTarget = 0
    private shot = 0
    private parallax = new THREE.Vector2()
    private parallaxTarget = new THREE.Vector2()

    private level = PIXEL_RATIOS.length - 1
    private frame = 0
    private last = 0
    private time = 0
    private running = false
    private paused = false
    private disposed = false
    private pending = 0
    private loaded = 0
    private built = false
    private announced = false
    private hovered = -1
    private introStart = -1

    private samples = 0
    private sampleStart = 0
    private slow = 0

    constructor(options: SeaSceneOptions) {
        this.options = options
        this.container = options.container

        const width = Math.max(this.container.clientWidth, 1)
        const height = Math.max(this.container.clientHeight, 1)

        this.renderer = new THREE.WebGLRenderer({antialias: false, alpha: false, powerPreference: "high-performance"})
        this.renderer.autoClear = false
        this.renderer.setPixelRatio(this.pixelRatio())
        this.renderer.setSize(width, height)
        this.container.appendChild(this.renderer.domElement)

        this.camera = new THREE.PerspectiveCamera(FOV, width / height, 0.1, 2400)
        this.camera.rotation.order = "YXZ"

        this.post = createPost(this.renderer, 4)
        this.post.setSize(width, height, this.renderer.getPixelRatio())

        this.lut = new THREE.WebGLRenderTarget(LUT_WIDTH, LUT_HEIGHT, {
            type: THREE.HalfFloatType,
            wrapS: THREE.RepeatWrapping,
            wrapT: THREE.ClampToEdgeWrapping,
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            depthBuffer: false,
        })
        this.lutMaterial = new THREE.ShaderMaterial({
            vertexShader: passVertex,
            fragmentShader: lutFragment,
            uniforms: {
                uSun: {value: new THREE.Vector3()},
                uMoon: {value: new THREE.Vector3()},
                uMoonShare: {value: new THREE.Vector3(...MOON_TINT).multiplyScalar(MOON)},
                uZenith: {value: new THREE.Vector3()},
                uHaze: {value: 1},
            },
            depthTest: false,
            depthWrite: false,
        })
        const lutQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.lutMaterial)
        lutQuad.frustumCulled = false
        this.lutScene.add(lutQuad)
        this.disposables.push(this.lut, this.lutMaterial, lutQuad.geometry)

        this.ocean = createOcean()
        this.disposables.push(this.ocean)

        this.shared = {
            uSkyLut: {value: this.lut.texture},
            uSunDir: {value: new THREE.Vector3(0, 0.1, -1).normalize()},
            uMoonDir: {value: new THREE.Vector3(0, -1, 0)},
            uSunLight: {value: new THREE.Vector3()},
            uMoonLight: {value: new THREE.Vector3()},
            uAmbient: {value: new THREE.Vector3()},
            uFogDensity: {value: 0.002},
            uInvExposure: {value: 1},
            uTime: {value: 0},
        }

        const skyMaterial = new THREE.ShaderMaterial({
            vertexShader: skyVertex,
            fragmentShader: skyFragment,
            uniforms: {...this.shared, uClouds: this.clouds},
            side: THREE.BackSide,
            depthWrite: false,
        })
        const skyGeometry = new THREE.SphereGeometry(SKY_RADIUS, 48, 24)
        this.sky = new THREE.Mesh(skyGeometry, skyMaterial)
        this.sky.frustumCulled = false
        this.sky.renderOrder = -2
        this.scene.add(this.sky)
        this.disposables.push(skyMaterial, skyGeometry)

        this.stars = this.createStars()
        this.scene.add(this.stars)

        const waterGeometry = createSeaGeometry()
        this.water = new Reflector(waterGeometry, {
            textureWidth: Math.round(width * this.renderer.getPixelRatio() * REFLECTION_SCALE),
            textureHeight: Math.round(height * this.renderer.getPixelRatio() * REFLECTION_SCALE),
            clipBias: 0.002,
            multisample: 0,
            shader: {
                name: "SeaWater",
                uniforms: {
                    color: {value: null},
                    tDiffuse: {value: null},
                    textureMatrix: {value: null},
                    uDetail: {value: null},
                    uDetailSize: {value: DETAIL_SIZE},
                    uChop: {value: 1},
                    uSwell: {value: 1},
                    uSea: {value: SEA},
                    uScatter: {value: SCATTER},
                },
                vertexShader: waterVertex,
                fragmentShader: waterFragment,
            },
        })
        // The reflector clones its uniforms, which drops a render target's
        // texture, so the detail goes in once it exists.
        const waterMaterial = this.water.material as THREE.ShaderMaterial
        Object.assign(waterMaterial.uniforms, this.shared)
        waterMaterial.uniforms.uDetail.value = this.ocean.texture
        this.water.rotation.x = -Math.PI / 2
        this.water.frustumCulled = false
        this.scene.add(this.water)
        this.disposables.push(waterGeometry, this.water)

        options.panels.forEach((spec, i) => this.createPanel(spec, i))

        this.layout()
        this.applyLight()
        this.placeCamera(0)

        window.addEventListener("pointermove", this.handlePointerMove, {passive: true})
        window.addEventListener("click", this.handleClick)
        document.addEventListener("visibilitychange", this.sync)
        this.resizeObserver = new ResizeObserver(this.handleResize)
        this.resizeObserver.observe(this.container)

        this.built = true
        if (this.loaded >= this.pending) this.announce()
        this.sync()
    }

    setShot(shot: number) {
        this.shotTarget = shot
        if (!this.announced) this.shot = shot
        this.sync()
    }

    setPaused(paused: boolean) {
        this.paused = paused
        this.sync()
    }

    dispose() {
        this.disposed = true
        cancelAnimationFrame(this.frame)
        window.removeEventListener("pointermove", this.handlePointerMove)
        window.removeEventListener("click", this.handleClick)
        document.removeEventListener("visibilitychange", this.sync)
        this.resizeObserver.disconnect()
        document.body.style.cursor = ""
        this.disposables.forEach((d) => d.dispose())
        this.textures.forEach((t) => t.dispose())
        this.post.dispose()
        this.renderer.dispose()
        this.renderer.domElement.remove()
    }

    private createStars() {
        const positions = new Float32Array(STAR_COUNT * 3)
        const sizes = new Float32Array(STAR_COUNT)
        const phases = new Float32Array(STAR_COUNT)
        let seed = 17
        const random = () => {
            seed = (seed * 16807) % 2147483647
            return seed / 2147483647
        }
        for (let i = 0; i < STAR_COUNT; i++) {
            const y = Math.pow(random(), 0.8)
            const angle = random() * TAU
            const r = Math.sqrt(1 - y * y)
            positions.set([Math.cos(angle) * r * 800, y * 800, Math.sin(angle) * r * 800], i * 3)
            const bright = random()
            sizes[i] = 1.4 + Math.pow(bright, 6) * 3.2
            phases[i] = random()
        }
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1))
        geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1))
        const material = new THREE.ShaderMaterial({
            vertexShader: starVertex,
            fragmentShader: starFragment,
            uniforms: {
                uTime: this.shared.uTime,
                uPixelRatio: {value: this.renderer.getPixelRatio()},
                uAmount: {value: 0},
                uInvExposure: this.shared.uInvExposure,
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        })
        const points = new THREE.Points(geometry, material)
        points.frustumCulled = false
        points.renderOrder = -1
        this.disposables.push(geometry, material)
        return points
    }

    private createPanel(spec: PanelSpec, i: number) {
        const width = PANEL_WIDTH
        const height = width / spec.aspect
        const {x, z, yaw} = placement(i)

        const material = new THREE.ShaderMaterial({
            vertexShader: panelVertex,
            fragmentShader: panelFragment,
            uniforms: {
                ...this.shared,
                uMap: {value: null},
                uHasMap: {value: 0},
                uFocus: {value: 0},
                uAspect: {value: spec.aspect},
                uBlank: {value: new THREE.Color("#2a3038")},
                uVeil: {value: 1},
            },
        })
        const geometry = new THREE.PlaneGeometry(width, height)
        const image = new THREE.Mesh(geometry, material)
        image.userData.panel = i

        const frameMaterial = new THREE.ShaderMaterial({
            vertexShader: panelVertex,
            fragmentShader: solidFragment,
            uniforms: {...this.shared, uColor: {value: FRAME_COLOR}, uVeil: material.uniforms.uVeil},
        })
        const frameGeometry = new THREE.BoxGeometry(width + FRAME, height + FRAME, 0.05)
        const frame = new THREE.Mesh(frameGeometry, frameMaterial)
        frame.position.z = -0.032

        const group = new THREE.Group()
        group.add(image, frame)
        const center = new THREE.Vector3(x, PANEL_LIFT + height / 2, z)
        group.position.copy(center)
        group.rotation.y = yaw
        this.scene.add(group)

        this.disposables.push(material, geometry, frameMaterial, frameGeometry)
        this.panels.push({kind: spec.kind, group, image, material, center, yaw, width, height})

        this.pending++
        new THREE.TextureLoader().load(
            spec.image,
            (texture) => {
                if (this.disposed) {
                    texture.dispose()
                    return
                }
                texture.colorSpace = THREE.SRGBColorSpace
                texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy())
                material.uniforms.uMap.value = texture
                material.uniforms.uHasMap.value = 1
                this.textures.push(texture)
                this.settle()
            },
            undefined,
            () => this.settle(),
        )
    }

    private settle() {
        this.loaded++
        this.options.onProgress(Math.min(this.loaded / Math.max(this.pending, 1), 1))
        if (this.built && this.loaded >= this.pending) this.announce()
    }

    private announce() {
        if (this.announced || this.disposed) return
        this.announced = true
        this.renderer
            .compileAsync(this.scene, this.camera)
            .catch(() => undefined)
            .then(() => {
                if (this.disposed) return
                this.introStart = this.time
                this.render()
                this.options.onReady()
            })
    }

    /** Camera rests for every shot, framed for the current aspect: the panel
     *  sits right of the copy on a wide screen and above it on a tall one. */
    private layout() {
        const aspect = this.camera.aspect
        const tanV = Math.tan(THREE.MathUtils.degToRad(FOV / 2))
        const tanH = tanV * aspect
        const portrait = aspect < 0.9

        const shots: Shot[] = []
        shots.push({
            position: new THREE.Vector3(portrait ? 0.6 : 0, EYE + 0.15, 24),
            yaw: portrait ? 0.22 : 0,
            pitch: -0.025,
        })

        this.panels.forEach((panel, i) => {
            if (i === SHOT.photos.length) shots.push(this.overlook(portrait))

            // A photo stands beside its copy; a screen is the subject, so it
            // takes the middle of the frame and the copy goes underneath.
            const screen = panel.kind === "screen"
            const share = portrait ? 0.8 : screen ? (aspect < 1.3 ? 0.56 : 0.44) : aspect < 1.3 ? 0.5 : 0.42
            const across = portrait || screen ? 0 : 0.34
            const up = portrait ? 0.5 : screen ? 0.17 : 0.04

            const fitWidth = panel.width / (2 * tanH * share)
            const fitHeight = panel.height / (2 * tanV * (portrait ? 0.24 : screen ? 0.46 : 0.6))
            const distance = Math.max(fitWidth, fitHeight)

            const normal = new THREE.Vector3(Math.sin(panel.yaw), 0, Math.cos(panel.yaw))
            const right = new THREE.Vector3(Math.cos(panel.yaw), 0, -Math.sin(panel.yaw))

            const position = panel.center
                .clone()
                .addScaledVector(normal, distance)
                .addScaledVector(right, -across * distance * tanH)
            // Looking down on the panel a little puts the horizon above the
            // copy, at the same height on every wide screen, so every line of
            // it sits on dark water.
            // A tall frame stands too far back to look down that steeply, so
            // there the eye stops above the water and the pitch follows it.
            const lift = Math.atan(up * tanV)
            let pitch = -Math.atan((portrait ? 0.1 : HORIZON) * tanV)
            position.y = panel.center.y - distance * Math.tan(pitch + lift)
            if (position.y < 1.05) {
                position.y = 1.05
                pitch = Math.atan2(panel.center.y - position.y, distance) - lift
            }

            shots.push({position, yaw: panel.yaw, pitch})
        })

        const lastPanel = this.panels[this.panels.length - 1]
        const end = lastPanel ? lastPanel.center.z : -100
        shots.push({
            position: new THREE.Vector3(portrait ? 1.2 : -1, 2.4, end - 34),
            yaw: portrait ? -0.24 : -0.04,
            pitch: portrait ? 0.1 : 0.06,
        })

        while (shots.length < SHOT_COUNT) shots.push(shots[shots.length - 1])
        this.shots = shots
    }

    /** The shot that opens the work: from in front of the row and off to
     *  its side, the camera sees every screen at once, the first close on the
     *  right and the rest staggering away into the haze. */
    private overlook(portrait: boolean): Shot {
        const first = this.panels[SHOT.photos.length]
        const last = this.panels[this.panels.length - 1]
        const third = this.panels[Math.min(SHOT.photos.length + 2, this.panels.length - 1)]
        if (!first || !last || !third) return {position: new THREE.Vector3(0, EYE, 0), yaw: 0, pitch: 0}
        const along = new THREE.Vector3(last.center.x - first.center.x, 0, last.center.z - first.center.z).normalize()
        const front = new THREE.Vector3(along.z, 0, -along.x)
        const position = first.center
            .clone()
            .addScaledVector(along, portrait ? -20 : -12)
            .addScaledVector(front, portrait ? 6 : 8)
        position.y = 2.2
        const target = first.center.clone().lerp(third.center, 0.5)
        const yaw = Math.atan2(-(target.x - position.x), -(target.z - position.z))
        return {position, yaw, pitch: -0.05}
    }

    private placeCamera(shot: number) {
        const s = Math.min(Math.max(shot, 0), this.shots.length - 1)
        const i = Math.min(Math.floor(s), this.shots.length - 2)
        const t = s - i
        const at = (k: number) => this.shots[Math.min(Math.max(k, 0), this.shots.length - 1)]
        const [a, b, c, d] = [at(i - 1), at(i), at(i + 1), at(i + 2)]

        const p = this.camera.position
        p.set(
            catmull(a.position.x, b.position.x, c.position.x, d.position.x, t),
            catmull(a.position.y, b.position.y, c.position.y, d.position.y, t),
            catmull(a.position.z, b.position.z, c.position.z, d.position.z, t),
        )
        let yaw = catmull(a.yaw, b.yaw, c.yaw, d.yaw, t)
        let pitch = catmull(a.pitch, b.pitch, c.pitch, d.pitch, t)

        const intro = this.introStart < 0 ? 0 : Math.min((this.time - this.introStart) / INTRO, 1)
        const away = 1 - intro * intro * (3 - 2 * intro)
        const back = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).multiplyScalar(INTRO_BACK * away)
        p.add(back)
        p.y += INTRO_UP * away
        pitch -= 0.03 * away

        // A slow swell under the camera and a hand on the mouse.
        const bob = Math.sin(this.time * 0.55) * 0.035 + Math.sin(this.time * 0.31 + 1.3) * 0.02
        p.y += bob
        const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw))
        p.addScaledVector(right, this.parallax.x * 0.22)
        p.y += this.parallax.y * 0.1
        yaw -= this.parallax.x * 0.012
        pitch += this.parallax.y * 0.006

        this.camera.rotation.set(pitch, yaw, Math.sin(this.time * 0.37) * 0.0035)
    }

    private applyLight() {
        // The atmosphere is only worked out again once the light has moved.
        if (!(Math.abs(this.shot - this.litShot) <= 0.0005)) {
            this.litShot = this.shot
            const l = lightAt(this.shot)
            const u = this.shared
            ;(u.uSunDir.value as THREE.Vector3).set(...l.sun)
            ;(u.uMoonDir.value as THREE.Vector3).set(...l.moon)
            ;(u.uSunLight.value as THREE.Vector3).set(...l.sunLight)
            ;(u.uMoonLight.value as THREE.Vector3).set(...l.moonLight)
            ;(u.uAmbient.value as THREE.Vector3).set(...l.ambient)
            u.uFogDensity.value = l.fog
            u.uInvExposure.value = 1 / l.exposure
            this.exposure = l.exposure
            this.clouds.value = l.clouds
            ;(this.stars.material as THREE.ShaderMaterial).uniforms.uAmount.value = l.stars

            const lut = this.lutMaterial.uniforms
            ;(lut.uSun.value as THREE.Vector3).set(...l.sun)
            ;(lut.uMoon.value as THREE.Vector3).set(...l.moon)
            lut.uHaze.value = l.haze
            ;(lut.uZenith.value as THREE.Vector3).set(...l.zenith)
            const previous = this.renderer.getRenderTarget()
            this.renderer.setRenderTarget(this.lut)
            this.renderer.render(this.lutScene, this.lutCamera)
            this.renderer.setRenderTarget(previous)
        }

        // A panel stays in the fog until the camera is nearly on it, so the
        // next one never stands behind the one in focus, and goes back into
        // it once passed, so a tall frame never looks past it at an edge.
        // From the overlook every screen is meant to be seen, if dimly.
        const overlook = smooth01(1 - Math.abs(this.shot - SHOT.work) / 0.9)
        this.panels.forEach((panel, i) => {
            const ahead = panelShot(i) - this.shot
            let veil = ahead >= 0 ? smooth01((ahead - 0.3) / 0.7) : smooth01((-ahead - 0.04) / 0.26)
            if (panel.kind === "screen") veil = Math.min(veil, 1 - 0.9 * overlook)
            panel.material.uniforms.uFocus.value = presence(this.shot, panelShot(i))
            panel.material.uniforms.uVeil.value = veil
            panel.group.visible = veil < 0.995
        })
    }

    private pixelRatio() {
        return Math.min(window.devicePixelRatio || 1, PIXEL_RATIOS[this.level])
    }

    private sync = () => {
        if (this.disposed) return
        const run = !this.paused && document.visibilityState === "visible"
        if (run && !this.running) {
            this.running = true
            this.last = 0
            this.frame = requestAnimationFrame(this.loop)
        } else if (!run && this.running) {
            this.running = false
            cancelAnimationFrame(this.frame)
        }
    }

    private loop = (now: number) => {
        this.frame = requestAnimationFrame(this.loop)
        const dt = this.last ? Math.min((now - this.last) / 1000, 0.1) : 1 / 60
        this.last = now
        this.time += dt

        this.shot = damp(this.shot, this.shotTarget, CAMERA_LAG, dt)
        this.parallax.x = damp(this.parallax.x, this.parallaxTarget.x, 0.9, dt)
        this.parallax.y = damp(this.parallax.y, this.parallaxTarget.y, 0.9, dt)

        this.applyLight()
        this.placeCamera(this.shot)

        this.panels.forEach((panel, i) => {
            panel.group.position.y = panel.center.y + Math.sin(this.time * 0.6 + i * 1.7) * 0.025
            panel.group.rotation.z = Math.sin(this.time * 0.42 + i) * 0.004
        })

        this.render()
        this.adapt(now)
    }

    private render() {
        this.shared.uTime.value = this.time
        this.sky.position.copy(this.camera.position)
        this.stars.position.copy(this.camera.position)
        // The grid follows the camera in whole cells of its finest spacing,
        // so the vertices under the eye never swim through the swell.
        this.water.position.x = Math.round(this.camera.position.x / 0.5) * 0.5
        this.water.position.z = Math.round(this.camera.position.z / 0.5) * 0.5
        this.ocean.update(this.renderer, this.time)
        this.post.render(this.scene, this.camera, this.time, this.exposure)
    }

    /** Steps the resolution down while frames run long on a desktop, and
     *  never back up. A phone keeps its full resolution: its screen is small
     *  enough that every lost pixel shows. */
    private adapt(now: number) {
        if (this.coarse) return
        if (this.samples === 0) this.sampleStart = now
        this.samples++
        if (this.samples < 90) return
        const fps = (this.samples - 1) / ((now - this.sampleStart) / 1000)
        this.samples = 0
        if (fps >= 48 || this.level === 0) {
            this.slow = 0
            return
        }
        if (++this.slow < 2) return
        this.slow = 0
        this.level--
        this.handleResize()
    }

    private handleResize = () => {
        const width = Math.max(this.container.clientWidth, 1)
        const height = Math.max(this.container.clientHeight, 1)
        this.renderer.setPixelRatio(this.pixelRatio())
        this.renderer.setSize(width, height)
        const ratio = this.renderer.getPixelRatio()
        this.post.setSize(width, height, ratio)
        this.water
            .getRenderTarget()
            .setSize(Math.round(width * ratio * REFLECTION_SCALE), Math.round(height * ratio * REFLECTION_SCALE))
        ;(this.stars.material as THREE.ShaderMaterial).uniforms.uPixelRatio.value = ratio
        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix()
        this.layout()
        if (!this.running) {
            this.placeCamera(this.shot)
            this.render()
        }
    }

    private pick(clientX: number, clientY: number) {
        const rect = this.renderer.domElement.getBoundingClientRect()
        this.pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1)
        this.raycaster.setFromCamera(this.pointer, this.camera)
        const hit = this.raycaster.intersectObjects(this.panels.map((p) => p.image), false)[0]
        if (!hit) return -1
        const index = hit.object.userData.panel as number
        return presence(this.shot, panelShot(index)) > 0.6 ? index : -1
    }

    // Only the panel the camera rests on answers, and never through the copy
    // or the chrome laid over the canvas.
    private overCanvas(target: EventTarget | null) {
        return target instanceof Element && !target.closest("a, button, [data-overlay], [role=dialog]")
    }

    private handlePointerMove = (event: PointerEvent) => {
        if (!this.coarse) {
            this.parallaxTarget.set(
                (event.clientX / window.innerWidth) * 2 - 1,
                -((event.clientY / window.innerHeight) * 2 - 1),
            )
        }
        const index = this.overCanvas(event.target) ? this.pick(event.clientX, event.clientY) : -1
        if (index === this.hovered) return
        this.hovered = index
        document.body.style.cursor = index >= 0 ? "pointer" : ""
    }

    private handleClick = (event: MouseEvent) => {
        if (this.paused || !this.overCanvas(event.target)) return
        const index = this.pick(event.clientX, event.clientY)
        if (index >= 0) this.options.onSelect(index)
    }
}
