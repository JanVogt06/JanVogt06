import * as THREE from "three"
import {detectQuality, stepDown} from "@/lib/quality"
import {nebulaVertexShader, nebulaFragmentShader} from "./nebulaShader"
import {crystalVertexShader, crystalFragmentShader} from "./crystalShader"
import {
    planetVertexShader, planetFragmentShader, ringVertexShader, ringFragmentShader,
} from "./planetShader"
import {createGalaxy} from "./galaxy"
import {createStarfield} from "./starfield"
import {createMilkyWay} from "./milkyway"
import type {Galaxy} from "./galaxy"
import type {Starfield} from "./starfield"
import type {MilkyWay} from "./milkyway"
import marsTexture from "../../data/textures/mars.webp"
import jupiterTexture from "../../data/textures/jupiter.webp"
import saturnTexture from "../../data/textures/saturn.webp"
import ringTexture from "../../data/textures/saturn_ring.webp"
import milkyWayTexture from "../../data/textures/milkyway_gal.webp"

const RING_Z = -90

const GALAXY_Z = -54
const GALAXY_X = 9
const GALAXY_RADIUS = 26

const WAYPOINT_VIEW_DISTANCE = 8

/** Portrait sits further back: Saturn's ring has to fit across a narrow screen. */
const WAYPOINT_VIEW_DISTANCE_PORTRAIT = 14

const GALAXY_POINTS = [6000, 12000, 22000, 36000, 55000]

const SKY_STARS = [4000, 9000, 16000, 26000, 38000]
const NEAR_STARS = [400, 800, 1400, 2000, 2800]

/** Fraction of the sky stars in the band; the rest spread over the sphere. */
const BAND_FRACTION = 0.62

const MILKYWAY_MAP_MIN_QUALITY = 0.5

/** How fast the photo fades over the procedural band. */
const MILKYWAY_MAP_FADE = 0.02

/** Radii of the two star shells and of the sky sphere. */
const MILKYWAY_RADIUS = 900
const SKY_RADIUS = 700
const NEAR_RADIUS = 150

const CAMERA_FAR = 1600

/** Middle of the journey; the near field sits here. */
const NEAR_CENTER_Z = -33

/** Number of career waypoints; must match the chapters in About.tsx. */
export const WAYPOINT_COUNT = 3

/** Camera z in the hero: far outside, with the galaxy ahead. */
const CAMERA_Z_HERO = 12

const ABOUT_END_Z = -26

/** Radius of the ring. */
const RING_RADIUS = 5.4

/** Tilt of the ring. */
const RING_TILT = 0.30

const HERO_DISTANCE = 17
const FIELD_DISTANCE = 11
const FOCUS_DISTANCE = 6.4

/**
 * Portrait framing of the crystal field: further back, because a crystal framed for a
 * wide screen fills a tall one, and lifted, because the caption sits underneath.
 */
const PORTRAIT_FIELD_PULLBACK = 1.45
const PORTRAIT_FIELD_LIFT = 0.6

/** Up to this height the screen is too short for the wide framing, however wide it is. */
const SQUAT_HEIGHT = 520

const IDLE_SWAY = 0.12
const IDLE_SWAY_SPEED = 0.1

/** Lateral camera offset in the hero, leaving room for the name. */
const HERO_LATERAL = 2.6

/** Where a planet passes by in landscape: right of the camera axis, at eye level. */
const WAYPOINT_LATERAL = 2.4
const WAYPOINT_RISE = 0.05

/** Portrait: least it passes below the eye line, as a share of the half-view. */
const WAYPOINT_DROP = 0.58

/** Gap kept between the text above and the planet, as a share of the screen height. */
const WAYPOINT_CLEARANCE = 0.03

/** Camera lift above the ring plane, and how far ahead it looks. */
const CAMERA_RISE = 0.55
const LOOK_AHEAD = 10

/** How far a planet may stray from that spot. */
const WAYPOINT_SCATTER = 0.24

const INTERACTIVE_ENTER = 0.75

const NEBULA_MAX = 0.5
const NEBULA_MIN = 0.2

const NEBULA_MAX_QUALITY = 0.5

const SAMPLE_FRAMES = 60
const MIN_ACCEPTABLE_FPS = 45
const SHARD_COUNT = 20

const CRYSTAL_COLORS: ReadonlyArray<{core: string; rim: string}> = [
    {core: "#0b3a5c", rim: "#22d3ee"},
    {core: "#2a1b52", rim: "#a78bfa"},
    {core: "#0a3f4a", rim: "#5eead4"},
    {core: "#301a4d", rim: "#c4a3ff"},
    {core: "#123a5e", rim: "#38bdf8"},
]

type PlanetSpec = {
    name: string
    texture: string
    /** Radius in scene units, compressed. */
    radius: number
    /** Flattening: the polar radius is smaller by this fraction. */
    flattening: number
    /** Axial tilt in radians. */
    tilt: number
    /** Rotation per second in radians. */
    spin: number
    /** Strength of the rim light. */
    atmosphere: number
    /** Base tone until the map is loaded, plus night and rim color. */
    surface: string
    shadow: string
    rim: string
    ring?: {texture: string; inner: number; outer: number}
}

const PLANETS: ReadonlyArray<PlanetSpec> = [
    {
        name: "Mars",
        texture: marsTexture,
        radius: 0.85,
        flattening: 0.006,
        tilt: 0.44,
        spin: 0.05,
        atmosphere: 0.35,
        surface: "#9c5a3c",
        shadow: "#160b08",
        rim: "#e0a884",
    },
    {
        name: "Jupiter",
        texture: jupiterTexture,
        radius: 1.5,
        flattening: 0.065,
        tilt: 0.055,
        spin: 0.12,
        atmosphere: 0.55,
        surface: "#b08155",
        shadow: "#150f0a",
        rim: "#f0d3a8",
    },
    {
        name: "Saturn",
        texture: saturnTexture,
        radius: 1.25,
        flattening: 0.098,
        tilt: 0.47,
        spin: 0.11,
        atmosphere: 0.5,
        surface: "#c2a173",
        shadow: "#17110a",
        rim: "#f5e2bb",
        ring: {texture: ringTexture, inner: 1.18, outer: 2.27},
    },
]

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Smooth fade curve. */
const smooth = (t: number) => {
    const c = clamp01(t)
    return c * c * (3 - 2 * c)
}

const CRYSTAL_REVEAL_START = 0.12
const CRYSTAL_REVEAL_END = 0.85

const hash = (n: number) => {
    const x = Math.sin(n * 127.1) * 43758.5453
    return x - Math.floor(x)
}

export type Anchor = {
    kind: "crystal" | "waypoint"
    /** Index within its kind. */
    index: number
    /** Screen position of its center, in CSS pixels. */
    x: number
    y: number
    /** Half the crystal height in pixels, the anchor for the leader lines. */
    radius: number
    /** 1 when a crystal is exactly in front, 0 in between. */
    strength: number
}

/** What lies under the pointer or was clicked. */
export type Pick = {kind: "crystal" | "waypoint"; index: number}

export type SpaceSceneOptions = {
    container: HTMLElement
    count: number
    onHover: (pick: Pick | null) => void
    onSelect: (pick: Pick) => void
    /** Per frame: where are the front crystal and the next waypoint? */
    onAnchor: (anchor: Anchor) => void
}

export class SpaceScene {
    private readonly container: HTMLElement
    private readonly renderer: THREE.WebGLRenderer
    private readonly onHover: SpaceSceneOptions["onHover"]
    private readonly onSelect: SpaceSceneOptions["onSelect"]
    private readonly onAnchor: SpaceSceneOptions["onAnchor"]

    private readonly bgScene = new THREE.Scene()
    private readonly bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    private readonly bgMaterial: THREE.ShaderMaterial
    private readonly bgGeometry = new THREE.PlaneGeometry(2, 2)

    private readonly scene = new THREE.Scene()
    private readonly camera: THREE.PerspectiveCamera
    private readonly tiltGroup = new THREE.Group()
    private readonly spinGroup = new THREE.Group()

    private readonly crystals: THREE.Mesh[] = []
    private readonly baseScales: THREE.Vector3[] = []
    private readonly materials: THREE.ShaderMaterial[] = []
    private readonly geometry = new THREE.IcosahedronGeometry(1, 0)

    private readonly galaxy: Galaxy
    private readonly skyStars: Starfield
    private readonly nearStars: Starfield
    private readonly milkyWay: MilkyWay
    /** Whether the photo is loaded; it then fades over the procedural band. */
    private milkyWayMapLoaded = false
    private milkyWayMapMix = 0

    private readonly waypoints: THREE.Object3D[] = []
    private readonly waypointPlanets: THREE.Mesh[] = []
    private readonly waypointMaterials: THREE.ShaderMaterial[] = []
    private readonly ringMaterials: THREE.ShaderMaterial[] = []
    private readonly ringMeshes: THREE.Mesh[] = []
    private readonly waypointGeometry = new THREE.SphereGeometry(1, 48, 32)
    /** Loaded textures, for dispose(). */
    private readonly textures: THREE.Texture[] = []

    /** z where the journey through the galaxy ends and the ring takes over. */
    private readonly journeyEnd: number

    private readonly shards: THREE.Mesh[] = []
    private readonly shardGeometry = new THREE.TetrahedronGeometry(1, 0)
    private readonly shardMaterial: THREE.ShaderMaterial

    private readonly raycaster = new THREE.Raycaster()
    private readonly pointer = new THREE.Vector2()
    private readonly lightLocal = new THREE.Vector3()
    private readonly ringQuaternion = new THREE.Quaternion()
    private readonly projected = new THREE.Vector3()
    private pointerInside = false

    private canvasRect: DOMRect

    private readonly clock = new THREE.Clock()
    private quality: number
    private frame = 0
    private running = false
    private disposed = false
    private frames = 0
    private sampleStart = 0

    private pageProgress = 0
    private fieldTarget = 0
    private fieldProgress = 0
    private approachTarget = 0
    private enter = 0
    private aboutTarget = 0
    private aboutProgress = 0
    private aboutActiveTarget = 0
    private aboutActive = 0
    private passageTarget = 0
    private passageProgress = 0
    private textFloor = 0
    private hovered: number | null = null
    private hoveredKind: "crystal" | "waypoint" | null = null
    private selected: number | null = null
    private selectBlend = 0
    private paused = false

    constructor({container, count, onHover, onSelect, onAnchor}: SpaceSceneOptions) {
        this.container = container
        this.onHover = onHover
        this.onSelect = onSelect
        this.onAnchor = onAnchor
        this.quality = detectQuality()

        const width = container.clientWidth
        const height = container.clientHeight

        this.renderer = new THREE.WebGLRenderer({
            antialias: false,
            alpha: true,
            powerPreference: "default",
        })
        this.renderer.setSize(width, height)
        this.renderer.setPixelRatio(this.pixelRatio())
        this.renderer.setClearColor(0x000000, 0)
        this.renderer.autoClear = false
        container.appendChild(this.renderer.domElement)
        this.canvasRect = this.renderer.domElement.getBoundingClientRect()

        // --- Background ---
        this.bgMaterial = new THREE.ShaderMaterial({
            vertexShader: nebulaVertexShader,
            fragmentShader: nebulaFragmentShader,
            uniforms: {
                uTime: {value: 0},
                uResolution: {value: new THREE.Vector2(width, height)},
                uQuality: {value: Math.min(this.quality, NEBULA_MAX_QUALITY)},
                uFade: {value: 1},
            },
            transparent: true,
            depthWrite: false,
            depthTest: false,
        })
        this.bgScene.add(new THREE.Mesh(this.bgGeometry, this.bgMaterial))

        // --- Ring ---
        this.camera = new THREE.PerspectiveCamera(46, width / height, 0.1, CAMERA_FAR)
        this.tiltGroup.rotation.x = RING_TILT
        this.tiltGroup.position.z = RING_Z
        this.tiltGroup.add(this.spinGroup)
        this.scene.add(this.tiltGroup)

        // End of the journey: where the ring camera would sit at enter = 0.
        this.journeyEnd = this.frontPoint().z + HERO_DISTANCE

        // --- Galaxy ---
        this.galaxy = createGalaxy(
            GALAXY_POINTS[Math.round(this.quality * 4)],
            GALAXY_RADIUS,
            this.quality,
        )
        this.galaxy.object.position.set(GALAXY_X, 0, GALAXY_Z)
        this.galaxy.setPixelRatio(this.renderer.getPixelRatio())
        this.scene.add(this.galaxy.object)

        // --- Milky way and star fields ---
        const level = Math.round(this.quality * 4)
        this.milkyWay = createMilkyWay({
            radius: MILKYWAY_RADIUS,
            quality: this.quality,
        })
        this.scene.add(this.milkyWay.object)
        if (this.quality >= MILKYWAY_MAP_MIN_QUALITY) {
            new THREE.TextureLoader().load(milkyWayTexture, (texture) => {
                if (this.disposed) {
                    texture.dispose()
                    return
                }
                texture.wrapS = THREE.RepeatWrapping
                texture.wrapT = THREE.ClampToEdgeWrapping
                texture.generateMipmaps = false
                texture.minFilter = THREE.LinearFilter
                texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy()
                this.milkyWay.setMap(texture)
                this.textures.push(texture)
                this.milkyWayMapLoaded = true
            })
        }
        this.skyStars = createStarfield({
            count: SKY_STARS[level],
            radius: SKY_RADIUS,
            parallax: false,
            bandFraction: BAND_FRACTION,
            seed: 7,
        })
        this.nearStars = createStarfield({
            count: NEAR_STARS[level],
            radius: NEAR_RADIUS,
            parallax: true,
            brightness: 0.85,
            sizeScale: 110,
            nearFade: [14, 45],
            maxSize: 12,
            seed: 131,
        })
        this.nearStars.points.position.z = NEAR_CENTER_Z
        this.skyStars.setPixelRatio(this.renderer.getPixelRatio())
        this.nearStars.setPixelRatio(this.renderer.getPixelRatio())
        this.scene.add(this.skyStars.points)
        this.scene.add(this.nearStars.points)

        for (let i = 0; i < WAYPOINT_COUNT; i++) {
            const spec = PLANETS[i % PLANETS.length]
            const material = new THREE.ShaderMaterial({
                vertexShader: planetVertexShader,
                fragmentShader: planetFragmentShader,
                uniforms: {
                    uMap: {value: null},
                    uHasMap: {value: 0},
                    uSurface: {value: new THREE.Color(spec.surface)},
                    uShadow: {value: new THREE.Color(spec.shadow)},
                    uRim: {value: new THREE.Color(spec.rim)},
                    uAtmosphere: {value: spec.atmosphere},
                    uFade: {value: 0},
                },
                transparent: true,
                depthWrite: true,
            })
            this.waypointMaterials.push(material)
            this.loadTexture(spec.texture, material)

            const planet = new THREE.Mesh(this.waypointGeometry, material)
            planet.scale.y = 1 - spec.flattening

            const group = new THREE.Group()
            group.add(planet)

            if (spec.ring) {
                const ringMaterial = new THREE.ShaderMaterial({
                    vertexShader: ringVertexShader,
                    fragmentShader: ringFragmentShader,
                    uniforms: {
                        uMap: {value: null},
                        uHasMap: {value: 0},
                        uColor: {value: new THREE.Color(spec.rim)},
                        uRadii: {value: new THREE.Vector2(spec.ring.inner, spec.ring.outer)},
                        uPlanetRadius: {value: 1},
                        uLight: {value: new THREE.Vector3(0, 0, 1)},
                        uFade: {value: 0},
                    },
                    transparent: true,
                    depthWrite: false,
                    side: THREE.DoubleSide,
                })
                this.ringMaterials.push(ringMaterial)
                this.loadTexture(spec.ring.texture, ringMaterial, THREE.ClampToEdgeWrapping)

                const ring = new THREE.Mesh(
                    new THREE.RingGeometry(spec.ring.inner, spec.ring.outer, 96),
                    ringMaterial,
                )
                ring.rotation.x = -Math.PI / 2
                ring.userData.ownerIndex = i
                group.add(ring)
                this.ringMeshes.push(ring)
            }

            group.scale.setScalar(spec.radius)
            // Axial tilt: tips planet and ring together.
            group.rotation.z = spec.tilt

            group.userData.index = i
            this.scene.add(group)
            this.waypoints.push(group)
            this.waypointPlanets.push(planet)
        }

        this.placeWaypoints()

        const step = (Math.PI * 2) / Math.max(count, 1)
        for (let i = 0; i < count; i++) {
            const {core, rim} = CRYSTAL_COLORS[i % CRYSTAL_COLORS.length]
            const material = new THREE.ShaderMaterial({
                vertexShader: crystalVertexShader,
                fragmentShader: crystalFragmentShader,
                uniforms: {
                    uCore: {value: new THREE.Color(core)},
                    uRim: {value: new THREE.Color(rim)},
                    uTime: {value: 0},
                    uHighlight: {value: 0},
                    uFade: {value: 1},
                },
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            })
            this.materials.push(material)

            const mesh = new THREE.Mesh(this.geometry, material)
            const angle = i * step
            // theta = 0 is in front (toward the camera, +z).
            mesh.position.set(Math.sin(angle) * RING_RADIUS, 0, Math.cos(angle) * RING_RADIUS)
            const scale = new THREE.Vector3(
                0.62 + hash(i) * 0.12,
                0.9 + hash(i + 5) * 0.3,
                0.62 + hash(i + 2) * 0.1,
            )
            mesh.scale.copy(scale)
            this.baseScales.push(scale)
            mesh.rotation.set(hash(i) * Math.PI, hash(i + 9) * Math.PI, hash(i + 3) * 0.5)
            mesh.userData.index = i

            this.spinGroup.add(mesh)
            this.crystals.push(mesh)
        }

        // --- Shards, depth only ---
        this.shardMaterial = new THREE.ShaderMaterial({
            vertexShader: crystalVertexShader,
            fragmentShader: crystalFragmentShader,
            uniforms: {
                uCore: {value: new THREE.Color("#12314f")},
                uRim: {value: new THREE.Color("#7dd3fc")},
                uTime: {value: 0},
                uHighlight: {value: 0},
                uFade: {value: 0.45},
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        })

        for (let i = 0; i < SHARD_COUNT; i++) {
            const mesh = new THREE.Mesh(this.shardGeometry, this.shardMaterial)
            const angle = hash(i * 1.7) * Math.PI * 2
            const radius = RING_RADIUS * (1.5 + hash(i * 2.9) * 1.4)
            mesh.position.set(
                Math.sin(angle) * radius,
                (hash(i * 3.7) - 0.5) * 9,
                Math.cos(angle) * radius,
            )
            mesh.scale.setScalar(0.12 + hash(i * 7.9) * 0.24)
            mesh.rotation.set(hash(i) * 6.28, hash(i + 4) * 6.28, 0)
            this.spinGroup.add(mesh)
            this.shards.push(mesh)
        }

        window.addEventListener("resize", this.handleResize)
        window.addEventListener("pointermove", this.handlePointerMove, {passive: true})
        window.addEventListener("click", this.handleClick)
        document.addEventListener("visibilitychange", this.sync)

        this.sync()
    }

    // ----------------------------------------------------------------- Controls

    setPageProgress(progress: number) {
        this.pageProgress = progress
        this.sync()
    }

    setFieldProgress(progress: number) {
        this.fieldTarget = progress
        this.sync()
    }

    setAboutProgress(progress: number) {
        this.aboutTarget = progress
        this.sync()
    }

    setAboutActive(active: number) {
        this.aboutActiveTarget = active
        this.sync()
    }

    setPassageProgress(progress: number) {
        this.passageTarget = progress
        this.sync()
    }

    setApproach(approach: number) {
        this.approachTarget = approach
        this.sync()
    }

    /** How far down the screen the section text reaches, 0..1. */
    setTextFloor(floor: number) {
        if (Math.abs(floor - this.textFloor) < 0.005) return
        this.textFloor = floor
        this.placeWaypoints()
    }

    setPaused(paused: boolean) {
        this.paused = paused
        this.sync()
    }

    /** Crystal i is open (HUD open), or none. */
    setSelected(index: number | null) {
        this.selected = index
        this.sync()
    }

    // ---------------------------------------------------------------- Internals

    private loadTexture(
        url: string,
        material: THREE.ShaderMaterial,
        wrapS: THREE.Wrapping = THREE.RepeatWrapping,
    ) {
        new THREE.TextureLoader().load(url, (texture) => {
            if (this.disposed) {
                texture.dispose()
                return
            }
            texture.wrapS = wrapS
            texture.wrapT = THREE.ClampToEdgeWrapping
            texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy()
            material.uniforms.uMap.value = texture
            material.uniforms.uHasMap.value = 1
            this.textures.push(texture)
        })
    }

    /**
     * Landscape puts the planets right of the camera axis at eye level, beside the text.
     * Portrait has the text above them instead, so they pass centred and low - and from
     * further away, or Saturn's ring would run off both edges.
     */
    private placeWaypoints() {
        const front = this.frontPoint()
        const portrait = this.camera.aspect < 1
        const distance = portrait ? WAYPOINT_VIEW_DISTANCE_PORTRAIT : WAYPOINT_VIEW_DISTANCE
        const eyeY = front.y + CAMERA_RISE * (1 - distance / LOOK_AHEAD)
        const halfView = distance * Math.tan((this.camera.fov * Math.PI) / 360)

        for (let i = 0; i < this.waypoints.length; i++) {
            const offsetX = (hash(i * 3.1) - 0.5) * WAYPOINT_SCATTER
            const offsetY = (hash(i * 5.7) - 0.5) * WAYPOINT_SCATTER
            const t = i / Math.max(WAYPOINT_COUNT - 1, 1)

            this.waypoints[i].position.set(
                portrait
                    ? front.x + offsetX
                    : front.x - HERO_LATERAL + WAYPOINT_LATERAL + offsetX,
                portrait
                    ? eyeY - this.dropFor(PLANETS[i % PLANETS.length], halfView) * halfView + offsetY
                    : front.y + WAYPOINT_RISE + offsetY,
                lerp(CAMERA_Z_HERO, ABOUT_END_Z, t) - distance,
            )
        }
    }

    /**
     * Portrait: how far the planet passes below the eye line. Far enough that its top
     * edge clears the text above it, which on a short screen means most of the planet
     * ends up below the fold - and that is the graceful way out, better than a planet
     * sitting behind the timeline.
     */
    private dropFor(spec: PlanetSpec, halfView: number) {
        const radiusShare = spec.radius / halfView
        const needed = 2 * (this.textFloor + WAYPOINT_CLEARANCE - 0.5) + radiusShare
        // Cap: the upper limb stays on screen even when the text leaves no room at all.
        return Math.min(Math.max(WAYPOINT_DROP, needed), 0.84 + radiusShare)
    }

    private pixelRatio() {
        const ratios = [0.75, 1.0, 1.25, 1.75, 2.5]
        return Math.min(window.devicePixelRatio, ratios[Math.round(this.quality * 4)])
    }

    private sync = () => {
        if (this.disposed) return
        const shouldRun = !this.paused && document.visibilityState === "visible"
        if (shouldRun === this.running) return
        this.running = shouldRun
        if (shouldRun) {
            this.frames = 0
            this.frame = requestAnimationFrame(this.loop)
        } else {
            cancelAnimationFrame(this.frame)
            this.frame = 0
        }
    }

    private adapt(now: number) {
        if (this.quality === 0) return
        if (this.frames === 0) this.sampleStart = now
        if (++this.frames < SAMPLE_FRAMES) return
        const fps = (this.frames * 1000) / (now - this.sampleStart)
        this.frames = 0
        if (fps >= MIN_ACCEPTABLE_FPS) return
        const lower = stepDown(this.quality)
        if (lower === null) return
        this.quality = lower
        this.bgMaterial.uniforms.uQuality.value = Math.min(lower, NEBULA_MAX_QUALITY)
        this.milkyWay.setQuality(lower)
        this.galaxy.setQuality(lower)
        this.renderer.setPixelRatio(this.pixelRatio())
        this.galaxy.setPixelRatio(this.renderer.getPixelRatio())
        this.skyStars.setPixelRatio(this.renderer.getPixelRatio())
        this.nearStars.setPixelRatio(this.renderer.getPixelRatio())
    }

    private loop = (now: number) => {
        this.frame = requestAnimationFrame(this.loop)
        this.adapt(now)
        this.update()
        this.render()
    }

    private frontPoint() {
        return new THREE.Vector3(
            0,
            -RING_RADIUS * Math.sin(RING_TILT),
            RING_Z + RING_RADIUS * Math.cos(RING_TILT),
        )
    }

    private update() {
        const time = this.clock.getElapsedTime()
        const count = this.crystals.length


        // --- Nebula: stays over the whole page, only gets quieter ---
        this.bgMaterial.uniforms.uTime.value = time
        this.bgMaterial.uniforms.uFade.value = lerp(
            NEBULA_MAX,
            NEBULA_MIN,
            clamp01(this.pageProgress),
        )

        // --- Trailing values ---
        this.fieldProgress = lerp(this.fieldProgress, this.fieldTarget, 0.1)
        this.enter = lerp(this.enter, this.approachTarget, 0.09)
        this.aboutProgress = lerp(this.aboutProgress, this.aboutTarget, 0.1)
        this.aboutActive = lerp(this.aboutActive, this.aboutActiveTarget, 0.09)
        this.passageProgress = lerp(this.passageProgress, this.passageTarget, 0.1)
        this.selectBlend = lerp(this.selectBlend, this.selected === null ? 0 : 1, 0.09)

        // --- Turn the ring so crystal `station` comes to the front ---
        const step = (Math.PI * 2) / Math.max(count, 1)
        const station = this.fieldProgress * Math.max(count - 1, 1)
        const sway = Math.sin(time * IDLE_SWAY_SPEED) * IDLE_SWAY * (1 - this.enter)
        this.spinGroup.rotation.y = -station * step + sway

        const front = this.frontPoint()
        const nearest = Math.round(station)
        const offCentre = Math.abs(station - nearest)
        const centred = clamp01(1 - offCentre * 2.4)

        const portrait = this.camera.aspect < 1
        // A phone held sideways is wide but just as short on room as a portrait one.
        const tight = portrait || this.container.clientHeight <= SQUAT_HEIGHT
        const pull = tight ? PORTRAIT_FIELD_PULLBACK : 1

        const base = lerp(HERO_DISTANCE, FIELD_DISTANCE * pull, this.enter)
        const distance = lerp(base, FOCUS_DISTANCE * pull, centred * this.enter)
        // A bit closer while the HUD is open.
        const finalDistance = lerp(distance, FOCUS_DISTANCE * pull * 0.82, this.selectBlend)

        // Portrait has no room for a side-by-side composition; stay on the axis.
        const lateral = (portrait ? 0 : HERO_LATERAL) * (1 - this.enter)

        // Dropping the camera lifts the crystal on screen, clear of the caption below it.
        // Only portrait needs the lift; sideways the caption sits beside the crystal.
        const framing = portrait ? -PORTRAIT_FIELD_LIFT * this.enter : 0

        const travelZ = lerp(
            lerp(CAMERA_Z_HERO, ABOUT_END_Z, this.aboutProgress),
            this.journeyEnd,
            this.passageProgress,
        )
        const z = lerp(travelZ, front.z + finalDistance, this.enter)

        this.camera.position.set(front.x - lateral, front.y + CAMERA_RISE + framing, z)
        this.camera.lookAt(front.x - lateral, front.y + framing, z - LOOK_AHEAD)

        const reveal = smooth(
            (this.enter - CRYSTAL_REVEAL_START) / (CRYSTAL_REVEAL_END - CRYSTAL_REVEAL_START),
        )

        // --- Crystals ---
        for (let i = 0; i < count; i++) {
            const mesh = this.crystals[i]
            const material = this.materials[i]

            mesh.rotation.y = hash(i + 9) * Math.PI + station * 2.4 + time * 0.06
            mesh.rotation.x = hash(i) * Math.PI + Math.sin(time * 0.25 + i) * 0.1

            const isNearest = i === nearest
            const hoveredHere = this.hoveredKind === "crystal" && this.hovered === i
            const highlightTarget = hoveredHere || this.selected === i ? 1 : 0
            material.uniforms.uTime.value = time
            material.uniforms.uHighlight.value = lerp(
                material.uniforms.uHighlight.value,
                highlightTarget,
                0.12,
            )
            material.uniforms.uFade.value = lerp(
                material.uniforms.uFade.value,
                (isNearest ? 1 : 0.34) * reveal,
                0.08,
            )

            const grow =
                (isNearest ? 1 + 0.1 * centred * this.enter + 0.06 * this.selectBlend : 1) *
                (0.6 + 0.4 * reveal)
            mesh.scale.copy(this.baseScales[i]).multiplyScalar(grow)
        }

        this.skyStars.points.position.copy(this.camera.position)
        this.milkyWay.object.position.copy(this.camera.position)
        if (this.milkyWayMapLoaded && this.milkyWayMapMix < 1) {
            this.milkyWayMapMix = Math.min(1, this.milkyWayMapMix + MILKYWAY_MAP_FADE)
            this.milkyWay.setMapMix(this.milkyWayMapMix)
        }
        this.skyStars.setTime(time)
        this.nearStars.setTime(time)

        // --- Galaxy ---
        this.galaxy.setTime(time)
        this.galaxy.setProximity(this.camera.position.distanceTo(this.galaxy.object.position))
        this.galaxy.setOpacity(1 - reveal * 0.92)

        const waypointsLive = 1 - this.passageProgress
        const station3 = this.aboutProgress * Math.max(WAYPOINT_COUNT - 1, 1)
        const nearestWaypoint = Math.round(station3)
        const waypointCentred = clamp01(1 - Math.abs(station3 - nearestWaypoint) * 2.4)

        for (let i = 0; i < this.waypoints.length; i++) {
            const material = this.waypointMaterials[i]
            const spec = PLANETS[i % PLANETS.length]
            this.waypointPlanets[i].rotation.y = station3 * 1.2 + time * spec.spin

            const own =
                i === nearestWaypoint
                    ? 1
                    : this.hoveredKind === "waypoint" && this.hovered === i
                      ? 0.7
                      : 0.14
            const fade = lerp(
                material.uniforms.uFade.value,
                own * this.aboutActive * waypointsLive * (1 - this.enter),
                0.08,
            )
            material.uniforms.uFade.value = fade
        }

        for (const ring of this.ringMeshes) {
            const material = ring.material as THREE.ShaderMaterial
            const owner = ring.userData.ownerIndex as number
            material.uniforms.uFade.value = this.waypointMaterials[owner].uniforms.uFade.value

            this.lightLocal
                .set(-0.55, 0.5, 0.67)
                .normalize()
                .applyQuaternion(this.camera.quaternion)
                .applyQuaternion(ring.getWorldQuaternion(this.ringQuaternion).invert())
            material.uniforms.uLight.value.copy(this.lightLocal)
        }

        this.shardMaterial.uniforms.uTime.value = time
        this.shardMaterial.uniforms.uFade.value = 0.45 * reveal

        // --- Anchor point for the DOM labels ---
        this.camera.updateMatrixWorld()
        this.reportAnchor("crystal", this.crystals, nearest, centred * this.enter)
        this.reportAnchor(
            "waypoint",
            this.waypoints,
            nearestWaypoint,
            waypointCentred * this.aboutActive * waypointsLive * (1 - this.enter),
        )

        if (this.pointerInside) this.updateHover()
    }

    private reportAnchor(
        kind: Anchor["kind"],
        meshes: THREE.Object3D[],
        index: number,
        strength: number,
    ) {
        const mesh = meshes[index]
        if (!mesh) return

        const rect = this.canvasRect
        mesh.getWorldPosition(this.projected)
        this.projected.project(this.camera)

        const x = ((this.projected.x + 1) / 2) * rect.width
        const y = ((1 - this.projected.y) / 2) * rect.height

        const top = mesh.getWorldPosition(new THREE.Vector3())
        top.y += mesh.scale.y
        top.project(this.camera)
        const topY = ((1 - top.y) / 2) * rect.height

        this.onAnchor({kind, index, x, y, radius: Math.abs(y - topY), strength})
    }

    private get target(): "crystal" | "waypoint" | null {
        if (this.enter >= INTERACTIVE_ENTER) return "crystal"
        if (this.aboutActive >= INTERACTIVE_ENTER && this.passageProgress < 0.1) return "waypoint"
        return null
    }

    private updateHover() {
        const kind = this.target
        if (!kind) {
            this.clearHover()
            return
        }

        this.raycaster.setFromCamera(this.pointer, this.camera)
        const meshes = kind === "crystal" ? this.crystals : this.waypoints
        const hit = this.raycaster.intersectObjects(meshes, true)[0]
        if (!hit) {
            this.clearHover()
            return
        }

        let node: THREE.Object3D | null = hit.object
        while (node && node.userData.index === undefined) node = node.parent
        const index = node ? (node.userData.index as number) : null

        if (index === this.hovered && kind === this.hoveredKind) return
        this.hovered = index
        this.hoveredKind = index === null ? null : kind
        this.onHover(index === null ? null : {kind, index})
    }

    private clearHover() {
        if (this.hovered === null) return
        this.hovered = null
        this.hoveredKind = null
        this.onHover(null)
    }

    private render() {
        this.renderer.clear()
        this.renderer.render(this.bgScene, this.bgCamera)
        this.renderer.clearDepth()
        this.renderer.render(this.scene, this.camera)
    }

    private aimAt(clientX: number, clientY: number) {
        const rect = this.canvasRect
        this.pointer.set(
            ((clientX - rect.left) / rect.width) * 2 - 1,
            -((clientY - rect.top) / rect.height) * 2 + 1,
        )
    }

    private handlePointerMove = (event: PointerEvent) => {
        // Touch has no hover: a finger dragging the page must not light up what it passes.
        if (event.pointerType !== "mouse") return
        if (this.isOverInteractive(event.target)) {
            this.pointerInside = false
            this.clearHover()
            return
        }
        this.aimAt(event.clientX, event.clientY)
        this.pointerInside = true
        if (!this.running) this.updateHover()
    }

    private handleClick = (event: MouseEvent) => {
        if (this.isOverInteractive(event.target)) return

        // A tap sends no pointermove first, so the hit has to be resolved right here.
        this.aimAt(event.clientX, event.clientY)
        this.camera.updateMatrixWorld()
        this.updateHover()

        if (this.hovered === null || this.hoveredKind === null) return
        const pick = {kind: this.hoveredKind, index: this.hovered}
        // Without a cursor sitting there, the highlight would stay behind.
        if (!this.pointerInside) this.clearHover()
        this.onSelect(pick)
    }

    private isOverInteractive(target: EventTarget | null) {
        return (
            target instanceof Element &&
            !!target.closest("a, button, input, textarea, select, iframe, [role='button']")
        )
    }

    private handleResize = () => {
        const width = this.container.clientWidth
        const height = this.container.clientHeight
        this.renderer.setSize(width, height)
        this.renderer.setPixelRatio(this.pixelRatio())
        this.galaxy.setPixelRatio(this.renderer.getPixelRatio())
        this.skyStars.setPixelRatio(this.renderer.getPixelRatio())
        this.nearStars.setPixelRatio(this.renderer.getPixelRatio())
        this.canvasRect = this.renderer.domElement.getBoundingClientRect()
        this.bgMaterial.uniforms.uResolution.value.set(width, height)
        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix()
        this.placeWaypoints()
        if (!this.running) this.render()
    }

    dispose() {
        this.disposed = true
        cancelAnimationFrame(this.frame)
        window.removeEventListener("resize", this.handleResize)
        window.removeEventListener("pointermove", this.handlePointerMove)
        window.removeEventListener("click", this.handleClick)
        document.removeEventListener("visibilitychange", this.sync)

        this.geometry.dispose()
        this.waypointGeometry.dispose()
        this.ringMeshes.forEach((r) => r.geometry.dispose())
        this.waypointMaterials.forEach((m) => m.dispose())
        this.ringMaterials.forEach((m) => m.dispose())
        this.textures.forEach((t) => t.dispose())
        this.galaxy.dispose()
        this.milkyWay.dispose()
        this.skyStars.dispose()
        this.nearStars.dispose()
        this.shardGeometry.dispose()
        this.bgGeometry.dispose()
        this.bgMaterial.dispose()
        this.shardMaterial.dispose()
        this.materials.forEach((m) => m.dispose())
        this.renderer.dispose()
        if (this.container.contains(this.renderer.domElement)) {
            this.container.removeChild(this.renderer.domElement)
        }
    }
}
