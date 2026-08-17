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

/**
 * Wo der Kristallring im Raum liegt – am Ende der Reise.
 *
 * Er lag bei -70. Dann steht die Ring-Kamera bei -48, also VOR der Galaxie
 * (-54): der Durchflug waere erst mitten in der Projekt-Sektion passiert, und der
 * Werdegang endete bereits in der Scheibe. Bei -90 ist hinter der Galaxie Platz
 * fuer eine eigene Etappe, in der man durch sie hindurchfliegt.
 */
const RING_Z = -90

/**
 * Wo die Galaxie liegt und wie weit ihre Scheibe reicht.
 *
 * Sie stand auf -18. Die Reise geht von +12 bis etwa -48, also war die Scheibe
 * nach knapp der Haelfte des Werdegangs durchflogen – bei Station 3 lag sie
 * hinter der Kamera und war weg. Die Galaxie endete deutlich zu frueh.
 *
 * -54 heisst: sie wird ueber den ganzen Werdegang groesser und fuellt am Ende das
 * Bild. Durchflogen wird sie erst, wenn die Projekte uebernehmen – und dort
 * blendet sie ohnehin aus, damit sie die Kristalle nicht ueberstrahlt.
 */
const GALAXY_Z = -54
/**
 * Seitlicher Versatz der Galaxie.
 *
 * Ohne ihn liegt ihr Kern genau auf der Flugbahn – die Passage fuehrt also mitten
 * durch den Kern, und dort ist alles gleissend weiss. Neun Einheiten sind aus dem
 * Hero (66 Einheiten entfernt) nur acht Grad, also kaum aus der Mitte, bringen die
 * Bahn aber an der Verdickung vorbei durch die Arme. Das ist die schoenere Stelle
 * zum Durchfliegen, und rechts liegt sie auch besser, weil im Hero der Name links
 * steht.
 */
const GALAXY_X = 9
const GALAXY_RADIUS = 26

/**
 * Abstand, in dem ein Wegpunkt vor der Kamera steht, wenn sein Kapitel dran ist.
 *
 * Die z-Werte der Wegpunkte werden daraus GERECHNET und nicht gesetzt: sonst
 * muesste man sie jedes Mal nachziehen, wenn sich die Reiselaenge aendert, und
 * ein Kapitel stuende neben seinem Wegpunkt statt davor.
 */
const WAYPOINT_VIEW_DISTANCE = 8

/**
 * Wie viele Punkte die Galaxie je Qualitaetsstufe bekommt.
 *
 * Stand auf 1800 bis 8000. Im Nahflug verteilen sich 6000 Punkte ueber einen
 * bildschirmfuellenden Durchmesser – das sind ein paar blasse Tupfen, und genau
 * so sah es aus. Punkte sind billig (ein Draw-Call, nur Vertex-Arbeit), also darf
 * die Dichte das Bild tragen.
 */
const GALAXY_POINTS = [6000, 12000, 22000, 36000, 55000]

/**
 * Sterne des Himmels und des Nahfelds je Qualitaetsstufe.
 *
 * Der Himmel traegt zusaetzlich das Band der Milchstrasse, und ein Band lebt von
 * Masse: es besteht aus Sternen, die einzeln kaum sichtbar sind. Deshalb sind es
 * hier deutlich mehr als fuer einen Himmel aus Einzelsternen noetig waere.
 */
const SKY_STARS = [4000, 9000, 16000, 26000, 38000]
const NEAR_STARS = [400, 800, 1400, 2000, 2800]

/** Anteil der Himmelssterne im Band. Der Rest steht ueber die Kugel verteilt. */
const BAND_FRACTION = 0.62

/** Radien der beiden Sternschalen und der Himmelskugel. */
const MILKYWAY_RADIUS = 900
const SKY_RADIUS = 700
const NEAR_RADIUS = 150

/**
 * Sichtweite der Kamera.
 *
 * Stand auf 300 – und damit lag alles, was den Sternenhimmel ausmacht, dahinter:
 * die Himmelskugel bei 900, die Sternschale zwischen 385 und 700. Gemessen waren
 * 0 von 26000 Himmelssternen innerhalb der Ebene und die Milchstrasse vollstaendig
 * weg; sichtbar blieb allein das Nahfeld bei 150. Deshalb war der Himmel auf der
 * Seite fast leer, obwohl die Felder laengst in der Szene lagen. Das Kappen
 * passiert in der Projektion – daran aendert depthTest: false nichts.
 *
 * 1600 laesst Luft hinter der Himmelskugel. Genauigkeit im Tiefenpuffer kostet das
 * praktisch nichts: Tiefe schreiben in dieser Szene nur die Planeten, und die
 * stehen bei 5 bis 25 Einheiten – also dort, wo ein perspektivischer Puffer seine
 * Aufloesung ohnehin hat.
 */
const CAMERA_FAR = 1600

/** Mitte der Reise – dort sitzt das Nahfeld, damit die Kamera darin bleibt. */
const NEAR_CENTER_Z = -33

/** Anzahl der Werdegang-Wegpunkte – muss zu den Kapiteln in About.tsx passen. */
export const WAYPOINT_COUNT = 3

/** Kamera-z im Hero: weit ausserhalb, die Galaxie liegt als Scheibe voraus. */
const CAMERA_Z_HERO = 12

/**
 * Wo der Flug durch den Werdegang endet – deutlich VOR der Galaxie.
 *
 * Vorher endete er bei -48 und damit sechs Einheiten vor der Scheibe: bei Station
 * 03 steckte man schon darin. Bei -26 sind es 28 Einheiten Abstand – die Galaxie
 * naehert sich ueber den ganzen Werdegang (von 66 auf 28) und fuellt das Bild,
 * ohne dass man drin ist.
 *
 * Der Durchflug gehoert danach der Passage.
 */
const ABOUT_END_Z = -26

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
/**
 * Wie viel vom Nebel-Rechteck uebrig bleibt.
 *
 * Deutlich weniger als vorher (1.0 im Hero, 0.35 spaeter). Der Nebel liegt auf
 * einem bildschirmfesten Rechteck – er kann sich nicht mitbewegen und ist damit
 * genau der Teil, der aufgeklebt wirkt. Seit die Himmelskugel (milkyway.ts) die
 * Struktur traegt, ist seine Aufgabe nur noch Farbe: ein Hauch Staubrot und
 * Tuerkis ueber dem Ganzen.
 */
const NEBULA_MAX = 0.5
const NEBULA_MIN = 0.2

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

/**
 * Die drei Wegpunkte als echte Planeten des Sonnensystems.
 *
 * Vorher waren es drei gleich grosse Kugeln mit demselben Sinusmuster in drei
 * Farben, jede mit einem zufaellig gekippten Ring. Das faellt auf: gleiche Form,
 * gleiche Silhouette, und drei beringte Planeten gibt es in keinem Sonnensystem.
 *
 * Jetzt traegt jeder Koerper seine eigenen Messwerte. Was den Unterschied macht,
 * ist nicht die Karte, sondern die FORM:
 *
 *   flattening  Abplattung durch die Rotation. Saturn ist um 9,8 % abgeplattet,
 *               Jupiter um 6,5 %, Mars nur um 0,6 %. Bei Saturn sieht man das mit
 *               dem Auge – er ist sichtbar oval, nicht rund.
 *   tilt        Achsneigung. Mars 25,2 Grad, Saturn 26,7 Grad, Jupiter nur 3,1 –
 *               der Gasriese steht auffaellig gerade.
 *   spin        Rotationsdauer, umgerechnet. Jupiter dreht in 9,9 Stunden, Mars
 *               braucht 24,6 – der grosse ist der schnelle.
 *   radius      Groesse, gestaucht. Echte Verhaeltnisse waeren 1 : 17 : 21, damit
 *               waere Mars ein Punkt und Jupiter aus dem Bild. Die Reihenfolge
 *               bleibt aber erhalten, und das ist, was man sieht.
 *
 * Der Ring gehoert allein zu Saturn und liegt in dessen Aequatorebene – deshalb
 * kippt er mit der Achse mit, statt frei im Raum zu stehen. Innen- und Aussenradius
 * sind die echten: 1,18 bis 2,27 Planetenradien (D-Ring bis Aussenkante A-Ring).
 *
 * Die Reihenfolge folgt den Kapiteln: Station 01 ein Gesteinsplanet, dann der
 * Gasriese, zum Schluss der beringte.
 */
type PlanetSpec = {
    name: string
    texture: string
    /** Radius in Szeneneinheiten – gestaucht, siehe oben. */
    radius: number
    /** Abplattung: der Pol-Radius ist um diesen Anteil kleiner. */
    flattening: number
    /** Achsneigung in Radiant. */
    tilt: number
    /** Drehung pro Sekunde in Radiant. */
    spin: number
    /** Staerke des Randlichts – Gasriesen haben eine deutliche Atmosphaere. */
    atmosphere: number
    /** Grundton, bis die Karte geladen ist, plus Nacht- und Randfarbe. */
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

/** Weiche Ein-/Ausblendkurve – ohne sie setzt eine Ueberblendung hart ein. */
const smooth = (t: number) => {
    const c = clamp01(t)
    return c * c * (3 - 2 * c)
}

/**
 * Ab wann und bis wann die Steine erscheinen, gemessen am Heranziehen der
 * Projekt-Sektion.
 *
 * Sie gehoeren zu den Projekten – vorher stand der vordere Stein aber immer auf
 * voller Deckkraft und die anderen auf 0,5, unabhaengig davon, wo man auf der
 * Seite war. Dadurch lagen sie im Hero und im ganzen Werdegang sichtbar herum und
 * haben sich mit der Galaxie und den Planeten ueberlagert.
 */
const CRYSTAL_REVEAL_START = 0.12
const CRYSTAL_REVEAL_END = 0.85

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

/** Was unter dem Zeiger liegt bzw. angeklickt wurde. */
export type Pick = {kind: "crystal" | "waypoint"; index: number}

export type SpaceSceneOptions = {
    container: HTMLElement
    count: number
    onHover: (pick: Pick | null) => void
    onSelect: (pick: Pick) => void
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
    /* Zwei Sternfelder: der Himmel folgt der Kamera (also praktisch unendlich
       weit weg), das Nahfeld steht fest im Raum und erzeugt damit die Parallaxe.
       Ohne das Nahfeld bewegt sich beim Flug nichts ausser der Galaxie, und alles
       wirkt aufgeklebt. */
    private readonly skyStars: Starfield
    private readonly nearStars: Starfield
    /* Der diffuse Teil der Milchstrasse. Punkte allein koennen ihn nicht malen:
       der auffaelligste Teil des echten Himmels ist nicht punktfoermig, sondern das
       verschmolzene Licht unaufloesbar vieler Sterne. */
    private readonly milkyWay: MilkyWay

    private readonly waypoints: THREE.Object3D[] = []
    /* Die Kugeln getrennt gemerkt: die Eigendrehung gehoert dem Planeten, nicht
       der Gruppe – sonst kippt der Ring mit und verliert seine Neigung. */
    private readonly waypointPlanets: THREE.Mesh[] = []
    private readonly waypointMaterials: THREE.ShaderMaterial[] = []
    /* Nur Saturn hat einen Ring, deshalb sind diese Listen KUERZER als die der
       Wegpunkte. Sie liefen vorher parallel und wurden mit demselben i indiziert –
       das ginge jetzt schief. Der zugehoerige Planet steht in userData.ownerIndex. */
    private readonly ringMaterials: THREE.ShaderMaterial[] = []
    private readonly ringMeshes: THREE.Mesh[] = []
    /* Kugel statt Oktaeder: die Wegpunkte des Werdegangs sind Planeten, nicht
       Kristalle – dieselbe Form fuer zwei verschiedene Dinge wuerde nichts
       unterscheiden. 48x32 statt 24x16: mit einer Fotokarte darauf sieht man die
       Facetten der Silhouette, vorher war die Kugel einfarbig. */
    private readonly waypointGeometry = new THREE.SphereGeometry(1, 48, 32)
    /** Geladene Karten – fuer dispose(). */
    private readonly textures: THREE.Texture[] = []

    /** z, an dem die Reise durch die Galaxie endet und der Ring uebernimmt. */
    private readonly journeyEnd: number

    private readonly shards: THREE.Mesh[] = []
    private readonly shardGeometry = new THREE.TetrahedronGeometry(1, 0)
    private readonly shardMaterial: THREE.ShaderMaterial

    private readonly raycaster = new THREE.Raycaster()
    private readonly pointer = new THREE.Vector2()
    /* Zwischenspeicher fuer die Lichtrichtung der Ringe – jeden Frame gebraucht,
       also nicht jeden Frame neu angelegt. */
    private readonly lightLocal = new THREE.Vector3()
    private readonly ringQuaternion = new THREE.Quaternion()
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
    private passageTarget = 0
    private passageProgress = 0
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
        this.camera = new THREE.PerspectiveCamera(46, width / height, 0.1, CAMERA_FAR)
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
            this.quality,
        )
        this.galaxy.object.position.set(GALAXY_X, 0, GALAXY_Z)
        this.galaxy.setPixelRatio(this.renderer.getPixelRatio())
        this.scene.add(this.galaxy.object)

        // --- Milchstrasse und Sternfelder ---
        const level = Math.round(this.quality * 4)
        this.milkyWay = createMilkyWay({
            radius: MILKYWAY_RADIUS,
            quality: this.quality,
        })
        this.scene.add(this.milkyWay.object)
        this.skyStars = createStarfield({
            count: SKY_STARS[level],
            radius: SKY_RADIUS,
            parallax: false,
            bandFraction: BAND_FRACTION,
            seed: 7,
        })
        /* sizeScale muss zur Entfernung des Feldes passen: mit dem Standardwert 26
           und einer Schale in 80 bis 150 Einheiten blieb jeder Stern unter einem
           Pixel – gemessen 0,6 bis 1,9 px, also ein unsichtbares Feld und damit
           gar keine Parallaxe. 110 bringt es auf dieselbe Groesse wie den Himmel.
           nearFade haelt dafuer die Brocken raus, an denen man dicht vorbeifliegt:
           unter 45 Einheiten blendet ein Stern aus, statt als Flaeche vors Bild zu
           rutschen. */
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

        /* --- Wegpunkte des Werdegangs ---
           Ihr z wird so gerechnet, dass Wegpunkt i genau dann vor der Kamera
           steht, wenn Kapitel i dran ist. */
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
                /* NICHT additiv und MIT Tiefenschreiben, anders als alles andere
                   in der Szene: ein Planet ist ein Koerper. Additiv gemischt
                   wuerde man die Sterne der Galaxie durch ihn hindurch sehen, und
                   dann ist es keine Kugel mehr, sondern ein Schleier. */
                depthWrite: true,
            })
            this.waypointMaterials.push(material)
            this.loadTexture(spec.texture, material)

            const planet = new THREE.Mesh(this.waypointGeometry, material)
            /* Abplattung. Sie steckt im Mesh und nicht in der Gruppe, weil der Ring
               ein Geschwister ist und nicht mit gestaucht werden darf – und weil
               der Anker die Gruppenskalierung liest. */
            planet.scale.y = 1 - spec.flattening

            /* Planet und Ring in einer Gruppe: der Anker projiziert die Gruppe,
               und die Beschriftungslinie soll an der Kugel ansetzen, nicht am
               Ring. Deshalb bleibt der Ring ein Kind und die Gruppenposition ist
               die des Planeten. */
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
                    /* Anders als vorher NICHT additiv: Saturnringe sind Material,
                       das Licht streut UND den Planeten verdeckt. Additiv gemischt
                       konnten sie nur heller machen, also nie vor dem Planeten
                       liegen – und der Schatten des Planeten auf dem Ring waere
                       unmoeglich, weil additiv nichts abdunkeln kann. */
                    depthWrite: false,
                    side: THREE.DoubleSide,
                })
                this.ringMaterials.push(ringMaterial)
                this.loadTexture(spec.ring.texture, ringMaterial, THREE.ClampToEdgeWrapping)

                const ring = new THREE.Mesh(
                    new THREE.RingGeometry(spec.ring.inner, spec.ring.outer, 96),
                    ringMaterial,
                )
                /* Die Ringebene IST die Aequatorebene des Planeten. Eine
                   RingGeometry liegt in der xy-Ebene, der Aequator ist die
                   xz-Ebene – also einmal um 90 Grad kippen. Die Achsneigung kommt
                   danach von der Gruppe, deshalb kippt der Ring mit dem Planeten
                   mit, statt frei im Raum zu haengen. */
                ring.rotation.x = -Math.PI / 2
                ring.userData.ownerIndex = i
                group.add(ring)
                this.ringMeshes.push(ring)
            }

            /* Die GRUPPE wird skaliert, nicht der Planet: der Anker liest
               scale.y, um die halbe Hoehe in Pixeln zu bestimmen. Bei einer
               unskalierten Gruppe waere das 1 und die Beschriftungslinie setzte
               im Nichts an. Der Ring skaliert dabei mit, was richtig ist. */
            group.scale.setScalar(spec.radius)
            // Achsneigung: kippt Planet und Ring gemeinsam.
            group.rotation.z = spec.tilt

            const t = i / (WAYPOINT_COUNT - 1)
            /* x relativ zur Kamera, nicht absolut: die Kamera steht auf der
               Reise um HERO_LATERAL nach links versetzt (damit links der Text
               Platz hat). Absolute x-Werte um +2,5 landeten dadurch am rechten
               Bildrand statt rechts der Mitte. */
            group.position.set(
                -HERO_LATERAL + 1.8 + hash(i * 3.1) * 0.7,
                /* Deutlich unter der Kamerahoehe: der Galaxienkern liegt auf der
                   Blickachse und wird gegen Ende des Werdegangs am hellsten – ein
                   Planet davor war schwer zu erkennen. */
                -2.6 + (hash(i * 5.7) - 0.5) * 1.2,
                lerp(CAMERA_Z_HERO, ABOUT_END_Z, t) - WAYPOINT_VIEW_DISTANCE,
            )
            group.userData.index = i
            this.scene.add(group)
            this.waypoints.push(group)
            this.waypointPlanets.push(planet)
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

    /**
     * Der Durchflug durch die Galaxie, 0 bis 1.
     *
     * Eigene Etappe zwischen Werdegang und Projekten: der Werdegang bringt die
     * Kamera bis vor die Scheibe, hier geht sie hindurch und bis vor den Ring.
     */
    setPassageProgress(progress: number) {
        this.passageTarget = progress
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

    /**
     * Laedt eine Karte und haengt sie an ein Material.
     *
     * Bis sie da ist, steht uHasMap auf 0 und der Koerper zeigt seinen Grundton.
     * Auf einer Scroll-Seite ist das der Unterschied zwischen einem Planeten, der
     * eine Sekunde spaeter scharf wird, und einem schwarzen Loch im Bild.
     *
     * Zwei Einstellungen sind hier wichtiger als sie aussehen:
     *
     * anisotropy – eine Kugel zeigt ihre Karte am Rand extrem schraeg. Ohne
     *   anisotrope Filterung verschmiert genau der Rand, also der Teil, an dem man
     *   die Kugel als Koerper erkennt.
     * wrapS – die Karte ist equirektangular, ihre linke und rechte Kante sind
     *   dieselbe Laengslinie. Ohne Wiederholung entsteht dort eine sichtbare Naht.
     *   Beim Ring dagegen ist u der Radius: dort MUSS geklemmt werden, sonst
     *   erscheint der Aussenrand innen wieder.
     */
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
        this.bgMaterial.uniforms.uFade.value = lerp(
            NEBULA_MAX,
            NEBULA_MIN,
            clamp01(this.pageProgress),
        )

        // --- Nachlaufende Werte ---
        this.fieldProgress = lerp(this.fieldProgress, this.fieldTarget, 0.1)
        this.enter = lerp(this.enter, this.approachTarget, 0.09)
        this.aboutProgress = lerp(this.aboutProgress, this.aboutTarget, 0.1)
        this.aboutActive = lerp(this.aboutActive, this.aboutActiveTarget, 0.09)
        this.passageProgress = lerp(this.passageProgress, this.passageTarget, 0.1)
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

        /* --- Die Reise in drei Etappen ---
           Hero -> Werdegang bis vor die Galaxie -> Passage durch sie hindurch bis
           vor den Ring. Eine geschachtelte Interpolation genuegt dafuer: solange
           die Passage auf 0 steht, gilt das Ende des Werdegang-Flugs, und weil
           journeyEnd genau der Punkt ist, an dem die Ring-Kamera bei enter = 0
           steht, ist auch die Uebergabe an den Ring nahtlos. */
        const travelZ = lerp(
            lerp(CAMERA_Z_HERO, ABOUT_END_Z, this.aboutProgress),
            this.journeyEnd,
            this.passageProgress,
        )
        const z = lerp(travelZ, front.z + finalDistance, this.enter)

        this.camera.position.set(front.x - lateral, front.y + 0.55, z)
        this.camera.lookAt(front.x - lateral, front.y, z - 10)

        /* --- Uebergabe Galaxie -> Steine ---
           Eine Kurve fuer beides: waehrend die Steine ankommen, blendet die
           Galaxie aus. Dadurch loest sich das eine im anderen auf, statt dass
           beides gleichzeitig im Bild liegt. */
        const reveal = smooth(
            (this.enter - CRYSTAL_REVEAL_START) / (CRYSTAL_REVEAL_END - CRYSTAL_REVEAL_START),
        )

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
            const hoveredHere = this.hoveredKind === "crystal" && this.hovered === i
            const highlightTarget = hoveredHere || this.selected === i ? 1 : 0
            material.uniforms.uTime.value = time
            material.uniforms.uHighlight.value = lerp(
                material.uniforms.uHighlight.value,
                highlightTarget,
                0.12,
            )
            /* Der vordere Stein tritt hervor, die anderen bleiben sichtbar – es
               ist ein Ring, kein Karussell mit nur einem Bild. Aber ALLES mal
               `reveal`: ausserhalb der Projekte sind die Steine gar nicht da. */
            material.uniforms.uFade.value = lerp(
                material.uniforms.uFade.value,
                (isNearest ? 1 : 0.34) * reveal,
                0.08,
            )

            /* Sie wachsen beim Erscheinen heran, statt nur aufzublenden – so
               kommen sie an, wie die Planeten vorher vorbeigezogen sind. */
            const grow =
                (isNearest ? 1 + 0.1 * centred * this.enter + 0.06 * this.selectBlend : 1) *
                (0.6 + 0.4 * reveal)
            mesh.scale.copy(this.baseScales[i]).multiplyScalar(grow)
        }

        /* --- Sterne ---
           Der Himmel wird jeden Frame auf die Kamera gesetzt: dadurch liegt er
           immer gleich weit weg und laeuft nie aus dem Bild. Das Nahfeld bleibt,
           wo es ist – an ihm zieht man vorbei, und das ist die Bewegung. */
        this.skyStars.points.position.copy(this.camera.position)
        this.milkyWay.object.position.copy(this.camera.position)
        this.skyStars.setTime(time)
        this.nearStars.setTime(time)

        // --- Galaxie ---
        this.galaxy.setTime(time)
        /* Der Kernschein ist – wie das diffuse Licht der Scheibe – eine Naeherung
           fuer die Ferne. Aus der Naehe muss er den Einzelsternen weichen. */
        this.galaxy.setProximity(this.camera.position.distanceTo(this.galaxy.object.position))
        /* Ausblenden, waehrend die Steine ankommen – dieselbe Kurve. Sonst liegt
           die Scheibe als helles Feld hinter den Steinen und frisst deren
           Kanten. */
        this.galaxy.setOpacity(1 - reveal * 0.92)

        /* --- Wegpunkte des Werdegangs ---
           Sie enden mit dem Beginn der Passage. Ohne das blieben sie sichtbar,
           obwohl die Kamera langst an ihnen vorbei ist: aboutActive bleibt nach
           dem Abschnitt auf 1, und die Beschriftungsebene ist `fixed`, liegt also
           weiter im Bild – die Linie haette waehrend des Durchflugs ins Nichts
           gezeigt. */
        const waypointsLive = 1 - this.passageProgress
        const station3 = this.aboutProgress * Math.max(WAYPOINT_COUNT - 1, 1)
        const nearestWaypoint = Math.round(station3)
        const waypointCentred = clamp01(1 - Math.abs(station3 - nearestWaypoint) * 2.4)

        for (let i = 0; i < this.waypoints.length; i++) {
            const material = this.waypointMaterials[i]
            const spec = PLANETS[i % PLANETS.length]
            /* Nur die Kugel dreht sich – und nur um ihre eigene Achse, wie ein
               Planet. Die Gruppe bleibt stehen, damit die Achsneigung und mit ihr
               der Ring stehen bleiben.

               Die Drehung pro Sekunde steht in PLANETS und kommt aus der echten
               Rotationsdauer: Jupiter dreht in 9,9 Stunden, Mars braucht 24,6. Dazu
               etwas Drehung aus dem Scroll, damit der Planet beim Vorbeiziehen
               nicht wie festgeschraubt wirkt. */
            this.waypointPlanets[i].rotation.y = station3 * 1.2 + time * spec.spin

            /* Nur der Wegpunkt, der gerade dran ist, leuchtet voll – und alles
               blendet aus, sobald der Ring uebernimmt. */
            /* Die nicht aktiven Planeten deutlich schwaecher als vorher (0.25).
               Mit einer Fotokarte sampelt ein weit entfernter Planet die kleinste
               Mipmap-Stufe, also den Mittelwert seiner Karte – er wird zur grauen
               Kugel. Halb durchscheinend fallen die grauen Kugeln nicht mehr auf,
               und die Tiefe bleibt trotzdem lesbar. */
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

        /* Ringe: Deckkraft vom zugehoerigen Planeten, und die Lichtrichtung fuer
           den Schatten im LOKALEN System des Rings.
           Der Weg dahin: die Lichtrichtung ist im Blickraum definiert (damit der
           Halbschatten beim Vorbeifliegen stehen bleibt), also erst mit der
           Kameradrehung in die Welt und dann mit der Umkehrung der Ringdrehung
           hinein. In GLSL waere das nicht zu machen – ES 1.0 hat weder inverse()
           noch transpose(). */
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
        /* Die Splitter haengen am Ring und lagen deshalb genauso im Werdegang
           herum. Ihre Deckkraft stand seit dem Anlegen fest auf 0,45 und wurde
           nie angefasst. */
        this.shardMaterial.uniforms.uFade.value = 0.45 * reveal

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

        /* Halbe Hoehe in Pixeln: denselben Punkt noch einmal um die Steinhoehe
           nach oben versetzt projizieren und den Abstand messen. Rechnet die
           Perspektive automatisch mit. */
        const top = mesh.getWorldPosition(new THREE.Vector3())
        top.y += mesh.scale.y
        top.project(this.camera)
        const topY = ((1 - top.y) / 2) * rect.height

        this.onAnchor({kind, index, x, y, radius: Math.abs(y - topY), strength})
    }

    /**
     * Was ist gerade anfassbar?
     *
     * Beides liegt die ganze Zeit in der Szene und ist nur weit weg – einen
     * Raycast interessiert Entfernung nicht. Ohne diese Unterscheidung waeren
     * Steine im Werdegang und Planeten in den Projekten anklickbar.
     */
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
        /* true = auch Kinder pruefen: ein Planet ist eine Gruppe aus Kugel und
           Ring, der Strahl trifft also nie die Gruppe selbst. */
        const hit = this.raycaster.intersectObjects(meshes, true)[0]
        if (!hit) {
            this.clearHover()
            return
        }

        /* Vom Treffer zurueck zum Objekt, das den Index traegt – beim Planeten ist
           das der Grosselternteil, beim Stein das Mesh selbst. */
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

    /**
     * Die Canvas liegt hinter dem Inhalt (negativer z-index) und kann selbst
     * keine Klicks bekommen. Deshalb haengen die Zeiger-Ereignisse am window –
     * ausser wenn der Zeiger auf etwas Bedienbarem steht, dann gehoert er dem.
     */
    private handlePointerMove = (event: PointerEvent) => {
        if (this.isOverInteractive(event.target)) {
            this.pointerInside = false
            this.clearHover()
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
        if (this.isOverInteractive(event.target)) return
        if (this.hovered === null || this.hoveredKind === null) return
        this.onSelect({kind: this.hoveredKind, index: this.hovered})
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
