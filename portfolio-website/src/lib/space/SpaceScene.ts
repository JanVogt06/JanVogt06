import * as THREE from "three"
import {detectQuality, stepDown} from "@/lib/quality"
import {nebulaVertexShader, nebulaFragmentShader} from "./nebulaShader"
import {crystalVertexShader, crystalFragmentShader} from "./crystalShader"
import {createGalaxy} from "./galaxy"
import type {Galaxy} from "./galaxy"

/**
 * Die Weltraum-Szene: Nebel-Hintergrund und ein Ring aus Kristallen, in EINEM
 * WebGL-Kontext.
 *
 * Warum ein Kontext und nicht zwei Canvas: Browser erlauben nur eine Handvoll
 * gleichzeitiger WebGL-Kontexte, und die Live-Vorschauen der Projekte brauchen
 * selbst welche (Riptide WebGL2, Cryptborne als Unity-Build). Zwei Kontexte hier
 * heisst, dass eine Vorschau keinen mehr bekommt.
 *
 * Gerendert wird in zwei Durchgaengen in dieselbe Canvas: erst der Hintergrund
 * mit einer orthografischen Kamera, dann die Kristalle mit einer perspektivischen.
 * Zwischen beiden wird nur der Tiefen-, nicht der Farbpuffer geleert.
 *
 * AUFBAU DES RINGS
 *
 * Zwei verschachtelte Gruppen, und das ist der Trick, auf dem alles beruht:
 *
 *   tiltGroup (rotation.x = RING_TILT, fest)
 *     └ spinGroup (rotation.y = Ringwinkel, vom Scroll)
 *         └ die Steine auf einem Kreis
 *
 * Dadurch ist die Stelle, an der ein Stein "vorne" ankommt, ein FESTER Punkt in
 * der Welt. Die Kamera kann dort stehenbleiben, waehrend der Ring sich unter ihr
 * dreht – genau das gibt das Gefuehl, dass man an einem Stein ankommt, statt ihm
 * nachzufahren. Mit einer einzigen Gruppe muesste die Kamera jeden Frame
 * mitwandern.
 *
 * DIE REISE
 *
 * Der Raum ist EINE Strecke entlang -Z, und alles liegt darauf:
 *
 *   z = +12       die Kamera im Hero, ausserhalb
 *   z = -30       die Galaxie, durch die man hindurchfliegt
 *   z = -16…-42   drei Wegpunkte darin – das ist der Werdegang
 *   z = -70       der Kristallring mit den Projekten
 *
 * Vorher stand die Kamera im Hero-Abstand still, bis die Projekt-Sektion sie
 * heranzog. Zwischen Hero und Projekten passierte im Raum also nichts, waehrend
 * der Werdegang im DOM eine ganze Sektion lang etwas tat. Genau daran merkte man,
 * dass er obendrauf gesetzt war.
 *
 * Jetzt fuehrt der Scroll die Kamera durchgehend: der Werdegang IST der Flug
 * durch die Galaxie, und seine Kapitel haengen an Wegpunkten, die dabei
 * vorbeikommen.
 *
 * Bewusst ohne React: die Klasse laeuft in ihrer eigenen rAF-Schleife und
 * bekommt von aussen nur Zahlen.
 */

/** Wo der Kristallring im Raum liegt – am Ende der Reise. */
const RING_Z = -70

/** Wo die Galaxie liegt und wie weit ihre Scheibe reicht. */
const GALAXY_Z = -18
const GALAXY_RADIUS = 26

/**
 * Abstand, in dem ein Wegpunkt vor der Kamera steht, wenn sein Kapitel dran ist.
 *
 * Die z-Werte der Wegpunkte werden daraus GERECHNET und nicht gesetzt: sonst
 * muesste man sie jedes Mal nachziehen, wenn sich die Reiselaenge aendert, und
 * ein Kapitel stuende neben seinem Wegpunkt statt davor.
 */
const WAYPOINT_VIEW_DISTANCE = 9

/** Wie viele Punkte die Galaxie je Qualitaetsstufe bekommt. */
const GALAXY_POINTS = [1800, 3000, 4500, 6000, 8000]

/** Anzahl der Werdegang-Wegpunkte – muss zu den Kapiteln in About.tsx passen. */
export const WAYPOINT_COUNT = 3

/** Kamera-z im Hero: weit ausserhalb, die Galaxie liegt als Scheibe voraus. */
const CAMERA_Z_HERO = 12

/** Radius des Rings. */
const RING_RADIUS = 5.4

/** Neigung des Rings – ohne sie saehe man einen Strich statt einer Ellipse. */
const RING_TILT = 0.30

/**
 * Kameraabstand zum vorderen Stein: im Hero weit weg, im Feld naeher, beim
 * Heranzoomen am naechsten.
 *
 * FOCUS_DISTANCE stand zuerst auf 4,6 – bei 46 Grad Blickwinkel sind das 3,9
 * Einheiten Sichthoehe, und der Stein war mit ~4 Einheiten hoeher als der
 * Bildschirm. Die Beschriftungsfahnen setzen am Steinrand an und landeten
 * dadurch ausserhalb des Fensters (Titel bei x = 1746 auf 1440 px Breite).
 * Bei 6,4 nimmt der Stein etwa ein Drittel der Bildhoehe ein.
 */
const HERO_DISTANCE = 17
const FIELD_DISTANCE = 11
const FOCUS_DISTANCE = 6.4

/**
 * Eigenbewegung des Rings, wenn nicht gescrollt wird: ein langsames Pendeln um
 * ±0,12 rad, kein Weiterdrehen.
 *
 * Erst driftete der Ring frei weiter. Das bricht aber die Ausrichtung: die
 * Kamera schaut auf einen FESTEN Punkt, an dem die Steine ankommen, und nach
 * zehn Sekunden stand Stein 0 gut 26 Grad daneben. Damit zeigte der Zaehler ein
 * anderes Projekt als der Stein vor der Kamera, und die Beschriftungsfahnen
 * landeten ausserhalb des Bildes.
 *
 * Ein Pendeln ist begrenzt und kehrt immer zurueck. Es wird ausserdem mit
 * (1 - enter) ausgeblendet: in der Projekt-Sektion steht die Drehung damit
 * ausschliesslich am Scroll, und Stein i steht bei Station i exakt vorne.
 */
const IDLE_SWAY = 0.12
const IDLE_SWAY_SPEED = 0.1

/** Seitlicher Kamera-Versatz im Hero, damit links der Name Platz hat. */
const HERO_LATERAL = 2.6

/**
 * Ab welchem Heranziehen die Steine ueberhaupt anfassbar sind.
 *
 * Der Ring liegt die ganze Zeit in der Szene – er ist im Hero und im Werdegang
 * nur weit weg. Ohne diese Schwelle trifft der Raycast ihn trotzdem: ein Klick
 * irgendwo im Hero oeffnete ein Projekt, und der Zeiger wurde dort schon zur
 * Hand. Entfernung interessiert einen Strahl nicht.
 *
 * 0.75 heisst: erst wenn die Projekt-Sektion praktisch steht. Unterhalb davon
 * gehoert die Szene zur Kulisse und nimmt keine Eingaben.
 */
const INTERACTIVE_ENTER = 0.75

/**
 * Der Nebel bleibt ueber die ganze Seite stehen und wird nur leiser.
 *
 * Er war bei 34 % der Seitenlaenge einmal ganz ausgeblendet – dann steht der
 * Kristallring im Nichts. Der Weltraum muss durchgehen.
 *
 * 0.35 statt 0.55: seit es eine Galaxie gibt, ist der Nebel nicht mehr der
 * Hauptdarsteller, sondern Hintergrund. Und er ist der teuerste Teil der Szene –
 * ein bildschirmfuellender FBM-Shader laeuft ueber die ganze Seitenlaenge mit.
 */
const NEBULA_MIN = 0.35

/**
 * Obergrenze der Nebel-Qualitaet.
 *
 * Der Shader rechnet je Stufe mehr FBM-Oktaven; auf einem Retina-Bildschirm sind
 * das bei voller Stufe sechs Oktaven fuer mehrere Millionen Pixel pro Frame –
 * neben der Galaxie zu viel, und genau daran ruckelte das Scrollen. Als
 * Hintergrund braucht er die feinsten Oktaven nicht.
 */
const NEBULA_MAX_QUALITY = 0.5

const SAMPLE_FRAMES = 60
const MIN_ACCEPTABLE_FPS = 45
const SHARD_COUNT = 20

/* Farbpaare der Steine – im Farbraum der Seite (Cyan als Primaerakzent,
   Violett als Gegenpol). Fuenf frei gewaehlte Buntfarben waeren genau der
   Fehler, den die Seite vorher an jeder Karte gemacht hat. */
const CRYSTAL_COLORS: ReadonlyArray<{core: string; rim: string}> = [
    {core: "#0b3a5c", rim: "#22d3ee"},
    {core: "#2a1b52", rim: "#a78bfa"},
    {core: "#0a3f4a", rim: "#5eead4"},
    {core: "#301a4d", rim: "#c4a3ff"},
    {core: "#123a5e", rim: "#38bdf8"},
]

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/* Deterministischer Pseudo-Zufall: die Szene soll bei jedem Laden gleich
   aussehen (Math.random waere jedes Mal eine andere). */
const hash = (n: number) => {
    const x = Math.sin(n * 127.1) * 43758.5453
    return x - Math.floor(x)
}

/**
 * Wo ein Objekt im Bild steht – fuer die Beschriftungen im DOM.
 *
 * Kristalle und Werdegang-Wegpunkte nehmen denselben Weg: die Szene projiziert,
 * das DOM haengt Text daran. Deshalb ein Typ mit `kind` statt zweier Kanaele.
 */
export type Anchor = {
    kind: "crystal" | "waypoint"
    /** Index innerhalb seiner Art. */
    index: number
    /** Bildschirmposition seines Mittelpunkts, in CSS-Pixeln. */
    x: number
    y: number
    /** Halbe Hoehe des Steins in Pixeln – Ansatzpunkt fuer die Pfeile. */
    radius: number
    /** 1 wenn ein Stein genau vorne steht, 0 dazwischen. */
    strength: number
}

export type SpaceSceneOptions = {
    container: HTMLElement
    count: number
    onHover: (index: number | null) => void
    onSelect: (index: number) => void
    /** Jeden Frame: wo stehen der vordere Stein und der naechste Wegpunkt? */
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

    private readonly waypoints: THREE.Mesh[] = []
    private readonly waypointMaterials: THREE.ShaderMaterial[] = []
    private readonly waypointGeometry = new THREE.OctahedronGeometry(1, 0)

    /** z, an dem die Reise durch die Galaxie endet und der Ring uebernimmt. */
    private readonly journeyEnd: number

    private readonly shards: THREE.Mesh[] = []
    private readonly shardGeometry = new THREE.TetrahedronGeometry(1, 0)
    private readonly shardMaterial: THREE.ShaderMaterial

    private readonly raycaster = new THREE.Raycaster()
    private readonly pointer = new THREE.Vector2()
    private readonly projected = new THREE.Vector3()
    private pointerInside = false

    /* Groesse und Lage der Canvas. Sie aendert sich nur bei Resize, wurde aber
       zweimal pro Frame per getBoundingClientRect gelesen – einmal je Anker-Art.
       Zusammen mit den Stil-Schreibvorgaengen im selben Frame erzwingt jedes
       Lesen ein neues Layout. */
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
    private hovered: number | null = null
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

        // --- Hintergrund ---
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
        this.camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 300)
        this.tiltGroup.rotation.x = RING_TILT
        this.tiltGroup.position.z = RING_Z
        this.tiltGroup.add(this.spinGroup)
        this.scene.add(this.tiltGroup)

        // Ende der Reise: dort, wo die Ring-Kamera bei enter = 0 stehen wuerde.
        this.journeyEnd = this.frontPoint().z + HERO_DISTANCE

        // --- Galaxie ---
        this.galaxy = createGalaxy(
            GALAXY_POINTS[Math.round(this.quality * 4)],
            GALAXY_RADIUS,
        )
        this.galaxy.object.position.z = GALAXY_Z
        this.galaxy.setPixelRatio(this.renderer.getPixelRatio())
        this.scene.add(this.galaxy.object)

        /* --- Wegpunkte des Werdegangs ---
           Ihr z wird so gerechnet, dass Wegpunkt i genau dann vor der Kamera
           steht, wenn Kapitel i dran ist. */
        for (let i = 0; i < WAYPOINT_COUNT; i++) {
            const material = new THREE.ShaderMaterial({
                vertexShader: crystalVertexShader,
                fragmentShader: crystalFragmentShader,
                uniforms: {
                    uCore: {value: new THREE.Color("#1b3f63")},
                    uRim: {value: new THREE.Color("#7dd3fc")},
                    uTime: {value: 0},
                    uHighlight: {value: 0},
                    uFade: {value: 0},
                },
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            })
            this.waypointMaterials.push(material)

            const mesh = new THREE.Mesh(this.waypointGeometry, material)
            const t = i / (WAYPOINT_COUNT - 1)
            /* x relativ zur Kamera, nicht absolut: die Kamera steht auf der
               Reise um HERO_LATERAL nach links versetzt (damit links der Text
               Platz hat). Absolute x-Werte um +2,5 landeten dadurch am rechten
               Bildrand statt rechts der Mitte. */
            mesh.position.set(
                -HERO_LATERAL + 1.8 + hash(i * 3.1) * 0.7,
                -1.05 + (hash(i * 5.7) - 0.5) * 1.4,
                lerp(CAMERA_Z_HERO, this.journeyEnd, t) - WAYPOINT_VIEW_DISTANCE,
            )
            mesh.scale.setScalar(0.75 + hash(i) * 0.25)
            this.scene.add(mesh)
            this.waypoints.push(mesh)
        }

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
                /* Additiv und ohne Tiefenschreiben: ueberlappende Steine
                   durchleuchten sich, statt sich zu verdecken. */
                blending: THREE.AdditiveBlending,
                depthWrite: false,
            })
            this.materials.push(material)

            const mesh = new THREE.Mesh(this.geometry, material)
            const angle = i * step
            // theta = 0 liegt vorne (Richtung Kamera, +z).
            mesh.position.set(Math.sin(angle) * RING_RADIUS, 0, Math.cos(angle) * RING_RADIUS)
            /* Ungleichmaessig skaliert: ein Kristall ist kein Ball. Gleiche
               Geometrie, trotzdem sieht jeder Stein anders aus. */
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

        // --- Splitter, nur Tiefenwirkung ---
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

    // ---------------------------------------------------------------- Steuerung

    setPageProgress(progress: number) {
        this.pageProgress = progress
        this.sync()
    }

    setFieldProgress(progress: number) {
        this.fieldTarget = progress
        this.sync()
    }

    /**
     * Wie weit der Ring herangezogen ist: 0 = Hero-Abstand, 1 = Sektion steht.
     *
     * Kommt vom Scroll-Fortschritt der Projekt-Sektion, nicht von einem
     * IntersectionObserver – dessen Rueckruf kann verspaetet kommen, und dann
     * bliebe der Ring im Hero-Abstand stehen und die Beschriftung unsichtbar.
     */
    /**
     * Fortschritt durch den Werdegang, 0 bis 1 – fliegt die Kamera durch die
     * Galaxie. 0 = Hero-Position, 1 = direkt vor dem Kristallring.
     */
    setAboutProgress(progress: number) {
        this.aboutTarget = progress
        this.sync()
    }

    /**
     * Ist der Werdegang ueberhaupt an der Reihe? 0 im Hero, 1 in der Sektion.
     *
     * Ohne dieses Signal galt im Hero Wegpunkt 0 als "genau vorne": der
     * Fortschritt ist dort auf 0 geklemmt, der Abstand zur naechsten Station
     * also exakt 0 und damit die Staerke 1. Die Beschriftungslinie wurde deshalb
     * schon im Hero voll gezeichnet und lief aus dem Bild. Genau derselbe Fehler
     * wie frueher bei den Kristallen – geklemmter Fortschritt sagt nicht, ob man
     * da ist.
     */
    setAboutActive(active: number) {
        this.aboutActiveTarget = active
        this.sync()
    }

    setApproach(approach: number) {
        this.approachTarget = approach
        this.sync()
    }

    setPaused(paused: boolean) {
        this.paused = paused
        this.sync()
    }

    /** Stein i ist geoeffnet (HUD offen), oder keiner. */
    setSelected(index: number | null) {
        this.selected = index
        this.sync()
    }

    // ------------------------------------------------------------------ Innerei

    private pixelRatio() {
        const mobile = this.container.clientWidth < 768
        const ratios = mobile ? [0.5, 0.75, 1.0, 1.5, 2.0] : [0.75, 1.0, 1.25, 1.75, 2.5]
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
        this.renderer.setPixelRatio(this.pixelRatio())
        this.galaxy.setPixelRatio(this.renderer.getPixelRatio())
    }

    private loop = (now: number) => {
        this.frame = requestAnimationFrame(this.loop)
        this.adapt(now)
        this.update()
        this.render()
    }

    /**
     * Fester Weltpunkt, an dem ein Stein "vorne" ankommt.
     *
     * Enthaelt RING_Z: der Ring liegt am Ende der Reise, nicht im Ursprung.
     */
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


        // --- Nebel: bleibt ueber die ganze Seite stehen, wird nur leiser ---
        this.bgMaterial.uniforms.uTime.value = time
        this.bgMaterial.uniforms.uFade.value = lerp(1, NEBULA_MIN, clamp01(this.pageProgress))

        // --- Nachlaufende Werte ---
        this.fieldProgress = lerp(this.fieldProgress, this.fieldTarget, 0.1)
        this.enter = lerp(this.enter, this.approachTarget, 0.09)
        this.aboutProgress = lerp(this.aboutProgress, this.aboutTarget, 0.1)
        this.aboutActive = lerp(this.aboutActive, this.aboutActiveTarget, 0.09)
        this.selectBlend = lerp(this.selectBlend, this.selected === null ? 0 : 1, 0.09)

        // --- Ring drehen: Stein `station` kommt nach vorn ---
        const step = (Math.PI * 2) / Math.max(count, 1)
        const station = this.fieldProgress * Math.max(count - 1, 1)
        const sway = Math.sin(time * IDLE_SWAY_SPEED) * IDLE_SWAY * (1 - this.enter)
        this.spinGroup.rotation.y = -station * step + sway

        /* --- Kamera ---
           Sie bleibt an dem festen Punkt stehen, an dem die Steine vorbeikommen,
           und zieht nur heran: im Hero weit weg (ganzer Ring zu sehen), im Feld
           naeher, und noch einmal deutlich naeher, wenn ein Stein GENAU vorne
           steht. Daraus entsteht das Heranzoomen an jeden Stein. */
        const front = this.frontPoint()
        const nearest = Math.round(station)
        const offCentre = Math.abs(station - nearest)
        const centred = clamp01(1 - offCentre * 2.4)

        const base = lerp(HERO_DISTANCE, FIELD_DISTANCE, this.enter)
        const distance = lerp(base, FOCUS_DISTANCE, centred * this.enter)
        // Bei offenem HUD noch ein Stueck naeher.
        const finalDistance = lerp(distance, FOCUS_DISTANCE * 0.82, this.selectBlend)

        /* Seitlicher Versatz im Hero: die Kamera steht links, blickt aber parallel
           nach vorn – dadurch rueckt der Ring nach rechts im Bild und laesst
           links Platz fuer den Namen. In der Projekt-Sektion faellt der Versatz
           weg, damit die Beschriftungsfahnen nach beiden Seiten Platz haben.
           Das Blickziel muss mitwandern, sonst schwenkt die Kamera ein. */
        const lateral = HERO_LATERAL * (1 - this.enter)

        /* Die Reise: vom Hero durch die Galaxie bis dorthin, wo die Ring-Kamera
           bei enter = 0 stehen wuerde. Weil journeyEnd genau dieser Punkt ist,
           ist die Uebergabe an das Ring-Verhalten nahtlos – es gibt keinen Sprung
           zwischen "durch die Galaxie fliegen" und "am Ring ankommen". */
        const journeyZ = lerp(CAMERA_Z_HERO, this.journeyEnd, this.aboutProgress)
        const z = lerp(journeyZ, front.z + finalDistance, this.enter)

        this.camera.position.set(front.x - lateral, front.y + 0.55, z)
        this.camera.lookAt(front.x - lateral, front.y, z - 10)

        // --- Steine ---
        for (let i = 0; i < count; i++) {
            const mesh = this.crystals[i]
            const material = this.materials[i]

            /* Eigendrehung am Scroll: der Stein, der vorne steht, dreht sich,
               waehrend man scrollt. Dazu eine sehr langsame Grunddrehung, damit
               er auch im Stillstand lebt. */
            mesh.rotation.y = hash(i + 9) * Math.PI + station * 2.4 + time * 0.06
            mesh.rotation.x = hash(i) * Math.PI + Math.sin(time * 0.25 + i) * 0.1

            const isNearest = i === nearest
            const highlightTarget = this.hovered === i || this.selected === i ? 1 : 0
            material.uniforms.uTime.value = time
            material.uniforms.uHighlight.value = lerp(
                material.uniforms.uHighlight.value,
                highlightTarget,
                0.12,
            )
            /* Der vordere Stein tritt hervor, die anderen bleiben sichtbar –
               es ist ein Ring, kein Karussell mit nur einem Bild. */
            material.uniforms.uFade.value = lerp(
                material.uniforms.uFade.value,
                isNearest ? 1 : lerp(0.5, 0.32, this.enter),
                0.08,
            )

            const grow = isNearest ? 1 + 0.1 * centred * this.enter + 0.06 * this.selectBlend : 1
            mesh.scale.copy(this.baseScales[i]).multiplyScalar(grow)
        }

        // --- Galaxie ---
        this.galaxy.setTime(time)
        /* Beim Ankommen am Ring ausblenden: sonst liegt die Scheibe als helles
           Feld hinter den Steinen und frisst deren Kanten. */
        this.galaxy.setOpacity(1 - this.enter * 0.8)

        // --- Wegpunkte des Werdegangs ---
        const station3 = this.aboutProgress * Math.max(WAYPOINT_COUNT - 1, 1)
        const nearestWaypoint = Math.round(station3)
        const waypointCentred = clamp01(1 - Math.abs(station3 - nearestWaypoint) * 2.4)

        for (let i = 0; i < this.waypoints.length; i++) {
            const mesh = this.waypoints[i]
            const material = this.waypointMaterials[i]
            mesh.rotation.y = hash(i * 2.3) * Math.PI + station3 * 1.8 + time * 0.08
            mesh.rotation.x = Math.sin(time * 0.3 + i) * 0.2

            /* Nur der Wegpunkt, der gerade dran ist, leuchtet voll – und alles
               blendet aus, sobald der Ring uebernimmt. */
            const own = i === nearestWaypoint ? 1 : 0.25
            material.uniforms.uTime.value = time
            material.uniforms.uFade.value = lerp(
                material.uniforms.uFade.value,
                own * this.aboutActive * (1 - this.enter),
                0.08,
            )
        }

        this.shardMaterial.uniforms.uTime.value = time

        // --- Ankerpunkt fuer die Beschriftung im DOM ---
        /* strength enthaelt `enter`: ausserhalb der Projekt-Sektion ist der
           Fortschritt auf 0 bzw. 1 geklemmt, damit stuende dort rechnerisch immer
           ein Stein genau vorne – die Beschriftung wuerde schon im Hero
           auftauchen. */
        this.camera.updateMatrixWorld()
        this.reportAnchor("crystal", this.crystals, nearest, centred * this.enter)
        this.reportAnchor(
            "waypoint",
            this.waypoints,
            nearestWaypoint,
            waypointCentred * this.aboutActive * (1 - this.enter),
        )

        if (this.pointerInside) this.updateHover()
    }

    private reportAnchor(
        kind: Anchor["kind"],
        meshes: THREE.Mesh[],
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

        /* Halbe Hoehe in Pixeln: denselben Punkt noch einmal um die Steinhoehe
           nach oben versetzt projizieren und den Abstand messen. Rechnet die
           Perspektive automatisch mit. */
        const top = mesh.getWorldPosition(new THREE.Vector3())
        top.y += mesh.scale.y
        top.project(this.camera)
        const topY = ((1 - top.y) / 2) * rect.height

        this.onAnchor({kind, index, x, y, radius: Math.abs(y - topY), strength})
    }

    /** Sind die Steine gerade anfassbar? Nur in der Projekt-Sektion. */
    private get interactive() {
        return this.enter >= INTERACTIVE_ENTER
    }

    private updateHover() {
        if (!this.interactive) {
            if (this.hovered !== null) {
                this.hovered = null
                this.onHover(null)
            }
            return
        }
        this.raycaster.setFromCamera(this.pointer, this.camera)
        const hit = this.raycaster.intersectObjects(this.crystals, false)[0]
        const index = hit ? (hit.object.userData.index as number) : null
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
        const rect = this.canvasRect
        this.pointer.set(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1,
        )
        this.pointerInside = true
        if (!this.running) this.updateHover()
    }

    private handleClick = (event: MouseEvent) => {
        if (!this.interactive) return
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
        this.galaxy.setPixelRatio(this.renderer.getPixelRatio())
        this.canvasRect = this.renderer.domElement.getBoundingClientRect()
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
        this.waypointGeometry.dispose()
        this.waypointMaterials.forEach((m) => m.dispose())
        this.galaxy.dispose()
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
