import * as THREE from "three"
import {detectQuality, stepDown} from "@/lib/quality"
import {nebulaVertexShader, nebulaFragmentShader} from "./nebulaShader"
import {crystalVertexShader, crystalFragmentShader} from "./crystalShader"

/**
 * Die Weltraum-Szene: Nebel-Hintergrund und schwebende Kristalle in EINEM
 * WebGL-Kontext.
 *
 * Warum ein Kontext und nicht zwei Canvas: Browser erlauben nur eine Handvoll
 * gleichzeitiger WebGL-Kontexte, und die Live-Vorschauen der Projekte brauchen
 * selbst welche (Riptide WebGL2, Cryptborne als Unity-Build). Zwei Kontexte hier
 * heisst, dass eine Vorschau keinen mehr bekommt.
 *
 * Gerendert wird in zwei Durchgaengen in dieselbe Canvas: erst der Hintergrund
 * mit einer orthografischen Kamera (bildschirmfuellendes Rechteck), dann die
 * Kristalle mit einer perspektivischen. Zwischen beiden wird nur der Tiefen-,
 * nicht der Farbpuffer geleert – so liegt der Nebel hinter den Steinen.
 *
 * Bewusst ohne React: die Klasse laeuft in ihrer eigenen rAF-Schleife und
 * bekommt von aussen nur Zahlen. Sechzig Zustandsaenderungen pro Sekunde durch
 * einen Komponentenbaum zu schicken waere Unsinn.
 */

/** Abstand der Steine auf der z-Achse; auch die Strecke pro Projekt. */
const SPACING = 9

/** Wie weit die Kamera vor dem jeweils aktuellen Stein steht. */
const CAMERA_DISTANCE = 6

/** Ruheposition der Steine: rechts der Mitte, damit links der Text Platz hat. */
const CRYSTAL_X = 2.15

/** Ab wann der Nebel ganz ausgeblendet ist, als Anteil der Seitenlaenge. */
const NEBULA_END = 0.34

/* Farbpaare der fuenf Steine. Sie bleiben im Farbraum der Seite – Cyan als
   Primaerakzent, Violett als Gegenpol – und variieren nur innerhalb dessen.
   Fuenf frei gewaehlte Buntfarben waeren genau der Fehler, den die Seite
   vorher an jeder Karte gemacht hat. */
const CRYSTAL_COLORS: ReadonlyArray<{core: string; rim: string}> = [
    {core: "#0b3a5c", rim: "#22d3ee"},
    {core: "#2a1b52", rim: "#a78bfa"},
    {core: "#0a3f4a", rim: "#5eead4"},
    {core: "#301a4d", rim: "#c4a3ff"},
    {core: "#123a5e", rim: "#38bdf8"},
]

/** Kleine Splitter im Hintergrund – reine Tiefenwirkung, nicht anklickbar. */
const SHARD_COUNT = 16

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/* Deterministischer Pseudo-Zufall: die Splitter sollen bei jedem Laden gleich
   liegen (Math.random waere bei jedem Reload eine andere Szene). */
const hash = (n: number) => {
    const x = Math.sin(n * 127.1) * 43758.5453
    return x - Math.floor(x)
}

const SAMPLE_FRAMES = 60
const MIN_ACCEPTABLE_FPS = 45

export type SpaceSceneOptions = {
    container: HTMLElement
    /** Anzahl anklickbarer Steine – ein Stein pro Projekt. */
    count: number
    /** Zeiger steht auf Stein i, oder auf keinem. */
    onHover: (index: number | null) => void
    /** Stein i wurde angeklickt. */
    onSelect: (index: number) => void
}

export class SpaceScene {
    private readonly container: HTMLElement
    private readonly renderer: THREE.WebGLRenderer
    private readonly onHover: SpaceSceneOptions["onHover"]
    private readonly onSelect: SpaceSceneOptions["onSelect"]

    private readonly bgScene = new THREE.Scene()
    private readonly bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    private readonly bgMaterial: THREE.ShaderMaterial

    private readonly scene = new THREE.Scene()
    private readonly camera: THREE.PerspectiveCamera
    private readonly crystals: THREE.Mesh[] = []
    private readonly shards: THREE.Mesh[] = []
    private readonly geometry = new THREE.IcosahedronGeometry(1, 0)
    private readonly shardGeometry = new THREE.TetrahedronGeometry(1, 0)
    private readonly materials: THREE.ShaderMaterial[] = []
    private readonly shardMaterial: THREE.ShaderMaterial

    private readonly raycaster = new THREE.Raycaster()
    private readonly pointer = new THREE.Vector2()
    private pointerInside = false

    private readonly clock = new THREE.Clock()
    private quality: number
    private frame = 0
    private running = false
    private disposed = false

    private frames = 0
    private sampleStart = 0

    /* Zielwerte von aussen und die nachlaufenden Istwerte. Das Nachlaufen ist
       derselbe Griff wie beim traegen Scrollen: nichts springt. */
    private pageProgress = 0
    private fieldProgress = 0
    private fieldTarget = 0
    private fieldVisible = false
    private fadeCurrent = 0
    private focusIndex: number | null = null
    private focusBlend = 0
    private hovered: number | null = null
    private paused = false

    constructor({container, count, onHover, onSelect}: SpaceSceneOptions) {
        this.container = container
        this.onHover = onHover
        this.onSelect = onSelect
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
        /* Wir leeren selbst: erst alles, dann zwischen den Durchgaengen nur die
           Tiefe, damit der zweite Durchgang auf dem ersten liegt. */
        this.renderer.autoClear = false
        container.appendChild(this.renderer.domElement)

        // --- Hintergrund ---
        this.bgMaterial = new THREE.ShaderMaterial({
            vertexShader: nebulaVertexShader,
            fragmentShader: nebulaFragmentShader,
            uniforms: {
                uTime: {value: 0},
                uResolution: {value: new THREE.Vector2(width, height)},
                uQuality: {value: this.quality},
                uFade: {value: 1},
            },
            transparent: true,
            depthWrite: false,
            depthTest: false,
        })
        this.bgScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.bgMaterial))

        // --- Kristalle ---
        this.camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 200)

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
                    uFade: {value: 0},
                },
                transparent: true,
                /* Additiv und ohne Tiefenschreiben: ueberlappende Steine
                   durchleuchten sich, statt sich zu verdecken. */
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            })
            this.materials.push(material)

            const mesh = new THREE.Mesh(this.geometry, material)
            mesh.position.set(
                CRYSTAL_X + Math.sin(i * 1.3) * 0.3,
                Math.sin(i * 1.9) * 0.5,
                -i * SPACING,
            )
            /* Ungleichmaessig skaliert: ein Kristall ist kein Ball. Die
               Grundform bleibt dieselbe Geometrie, jeder Stein sieht trotzdem
               anders aus. */
            mesh.scale.set(1.25, 1.6 + hash(i) * 0.5, 1.25)
            mesh.rotation.set(hash(i) * Math.PI, hash(i + 9) * Math.PI, hash(i + 3) * 0.6)
            mesh.userData.index = i
            this.scene.add(mesh)
            this.crystals.push(mesh)
        }

        // --- Splitter im Hintergrund ---
        this.shardMaterial = new THREE.ShaderMaterial({
            vertexShader: crystalVertexShader,
            fragmentShader: crystalFragmentShader,
            uniforms: {
                uCore: {value: new THREE.Color("#12314f")},
                uRim: {value: new THREE.Color("#7dd3fc")},
                uTime: {value: 0},
                uHighlight: {value: 0},
                uFade: {value: 0},
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        })

        for (let i = 0; i < SHARD_COUNT; i++) {
            const mesh = new THREE.Mesh(this.shardGeometry, this.shardMaterial)
            mesh.position.set(
                (hash(i * 2.1) - 0.5) * 16,
                (hash(i * 3.7) - 0.5) * 10,
                -hash(i * 5.3) * (count * SPACING),
            )
            const s = 0.15 + hash(i * 7.9) * 0.28
            mesh.scale.setScalar(s)
            mesh.rotation.set(hash(i) * 6.28, hash(i + 4) * 6.28, 0)
            this.scene.add(mesh)
            this.shards.push(mesh)
        }

        window.addEventListener("resize", this.handleResize)
        window.addEventListener("pointermove", this.handlePointerMove, {passive: true})
        window.addEventListener("click", this.handleClick)
        document.addEventListener("visibilitychange", this.sync)

        this.sync()
    }

    // ---------------------------------------------------------------- Steuerung

    /** Fortschritt der ganzen Seite, 0 bis 1 – steuert den Nebel. */
    setPageProgress(progress: number) {
        this.pageProgress = progress
        this.sync()
    }

    /** Fortschritt der Projekt-Sektion, 0 bis 1 – fliegt durch das Feld. */
    setFieldProgress(progress: number) {
        this.fieldTarget = progress
        this.sync()
    }

    /** Ist das Kristallfeld ueberhaupt in der Naehe des Fensters? */
    setFieldVisible(visible: boolean) {
        this.fieldVisible = visible
        this.sync()
    }

    /** Von aussen anhalten – z.B. solange eine Live-Vorschau laeuft. */
    setPaused(paused: boolean) {
        this.paused = paused
        this.sync()
    }

    /** Stein i in den Blick nehmen, oder zurueck zum Scroll-Verlauf. */
    setFocus(index: number | null) {
        this.focusIndex = index
        this.sync()
    }

    // ------------------------------------------------------------------ Innerei

    private pixelRatio() {
        const mobile = this.container.clientWidth < 768
        const ratios = mobile
            ? [0.5, 0.75, 1.0, 1.5, 2.0]
            : [0.75, 1.0, 1.25, 1.75, 2.5]
        return Math.min(window.devicePixelRatio, ratios[Math.round(this.quality * 4)])
    }

    private nebulaFade() {
        return clamp01(1 - this.pageProgress / NEBULA_END)
    }

    /** Laeuft ueberhaupt noch etwas Sichtbares? */
    private hasVisibleWork() {
        return this.nebulaFade() > 0.01 || this.fadeCurrent > 0.01 || this.fieldVisible
    }

    private sync = () => {
        if (this.disposed) return
        const shouldRun =
            !this.paused && document.visibilityState === "visible" && this.hasVisibleWork()
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
        this.bgMaterial.uniforms.uQuality.value = lower
        this.renderer.setPixelRatio(this.pixelRatio())
    }

    private loop = (now: number) => {
        this.frame = requestAnimationFrame(this.loop)
        this.adapt(now)
        this.update()
        this.render()

        /* Wenn nichts mehr zu sehen ist, haelt die Schleife sich selbst an –
           z.B. wenn der Nebel ausgeblendet ist und das Feld ausser Sicht. */
        if (!this.hasVisibleWork()) {
            this.running = false
            cancelAnimationFrame(this.frame)
            this.frame = 0
        }
    }

    private update() {
        const time = this.clock.getElapsedTime()

        // Nebel
        this.bgMaterial.uniforms.uTime.value = time
        this.bgMaterial.uniforms.uFade.value = this.nebulaFade()

        // Nachlaufende Werte
        this.fieldProgress = lerp(this.fieldProgress, this.fieldTarget, 0.12)
        this.fadeCurrent = lerp(this.fadeCurrent, this.fieldVisible ? 1 : 0, 0.08)
        this.focusBlend = lerp(this.focusBlend, this.focusIndex === null ? 0 : 1, 0.09)

        const count = this.crystals.length
        const scrollZ = CAMERA_DISTANCE - this.fieldProgress * (count - 1) * SPACING

        /* Beim Fokussieren wandert die Kamera vor den gewaehlten Stein und
           etwas naeher heran; ausserhalb des Fokus folgt sie dem Scroll. */
        let targetZ = scrollZ
        let targetX = 0
        if (this.focusIndex !== null) {
            const focused = this.crystals[this.focusIndex]
            targetZ = lerp(scrollZ, focused.position.z + CAMERA_DISTANCE * 0.62, this.focusBlend)
            targetX = lerp(0, focused.position.x * 0.45, this.focusBlend)
        }
        this.camera.position.set(targetX, 0, targetZ)
        this.camera.lookAt(targetX * 0.4, 0, targetZ - CAMERA_DISTANCE)

        // Steine: drehen, atmen, ein- und ausblenden
        for (let i = 0; i < count; i++) {
            const mesh = this.crystals[i]
            const material = this.materials[i]

            mesh.rotation.y += 0.0022 + i * 0.0003
            mesh.rotation.x = Math.sin(time * 0.25 + i) * 0.14
            mesh.position.y = Math.sin(i * 1.9) * 0.5 + Math.sin(time * 0.5 + i * 1.4) * 0.16

            /* Nur Steine in der Naehe der Kamera sind voll da. Ohne das wuerden
               alle fuenf gleichzeitig leuchten und die Tiefe waere weg. */
            const distance = Math.abs(mesh.position.z + CAMERA_DISTANCE - this.camera.position.z)
            const near = clamp01(1 - distance / (SPACING * 1.15))

            material.uniforms.uTime.value = time
            material.uniforms.uFade.value = this.fadeCurrent * near
            material.uniforms.uHighlight.value = lerp(
                material.uniforms.uHighlight.value,
                this.hovered === i || this.focusIndex === i ? 1 : 0,
                0.12,
            )

            const focusScale = this.focusIndex === i ? 1 + 0.12 * this.focusBlend : 1
            mesh.scale.set(1.25 * focusScale, (1.6 + hash(i) * 0.5) * focusScale, 1.25 * focusScale)
        }

        // Splitter
        this.shardMaterial.uniforms.uTime.value = time
        this.shardMaterial.uniforms.uFade.value = this.fadeCurrent * 0.5
        for (let i = 0; i < this.shards.length; i++) {
            this.shards[i].rotation.y += 0.0009 + hash(i) * 0.001
        }

        if (this.pointerInside) this.updateHover()
    }

    private updateHover() {
        this.raycaster.setFromCamera(this.pointer, this.camera)
        const hit = this.raycaster.intersectObjects(this.crystals, false)[0]
        const index = hit ? (hit.object.userData.index as number) : null
        // Nur melden, wenn sich etwas geaendert hat – sonst rendert React dauernd.
        if (index === this.hovered) return
        this.hovered = index
        this.onHover(index)
    }

    private render() {
        this.renderer.clear()
        this.renderer.render(this.bgScene, this.bgCamera)
        this.renderer.clearDepth()
        this.renderer.render(this.scene, this.camera)
    }

    /**
     * Zeigerposition merken.
     *
     * Die Canvas liegt hinter dem Inhalt (negativer z-index) und kann selbst
     * keine Klicks bekommen. Deshalb haengen die Zeiger-Ereignisse am window –
     * ausser wenn der Zeiger auf etwas Bedienbarem steht, dann gehoert er dem.
     */
    private handlePointerMove = (event: PointerEvent) => {
        if (this.isOverInteractive(event.target)) {
            this.pointerInside = false
            if (this.hovered !== null) {
                this.hovered = null
                this.onHover(null)
            }
            return
        }
        const rect = this.renderer.domElement.getBoundingClientRect()
        this.pointer.set(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1,
        )
        this.pointerInside = true
        // Bei angehaltener Schleife trotzdem einmal pruefen.
        if (!this.running) this.updateHover()
    }

    private handleClick = (event: MouseEvent) => {
        if (this.isOverInteractive(event.target)) return
        if (this.hovered === null) return
        this.onSelect(this.hovered)
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
        this.bgMaterial.uniforms.uResolution.value.set(width, height)
        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix()
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
        this.shardGeometry.dispose()
        this.bgMaterial.dispose()
        this.shardMaterial.dispose()
        this.materials.forEach((m) => m.dispose())
        this.bgScene.traverse((o) => {
            if (o instanceof THREE.Mesh) o.geometry.dispose()
        })
        this.renderer.dispose()
        if (this.container.contains(this.renderer.domElement)) {
            this.container.removeChild(this.renderer.domElement)
        }
    }
}
