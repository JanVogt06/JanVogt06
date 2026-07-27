import projectsData from "@/data/projects.json"

/**
 * Projekt-Form wie in src/data/projects.json hinterlegt.
 * Projekte dort hinzufügen/ändern – keine Code-Änderung nötig.
 *
 * Typ und Hilfsfunktion liegen hier und nicht in einer Komponente, weil sowohl
 * die Folien als auch das Raster (Mobile, reduced motion) sie brauchen.
 */
export interface Project {
    /** Dateiname des Screenshots in src/data/images/screenshots/ */
    slug: string;
    icon: string;
    type: string;       // Conventional-Commit-Präfix, z.B. "feat" / "feat(game)"
    hash: string;       // kurzer Commit-Hash (Deko)
    title: string;
    subtitle: string;
    description: string;
    tech: string[];
    /** Gewichtshinweis am Play-Button, z.B. "74 MB Unity-Build" */
    previewNote?: string;
    /**
     * Darf die Seite in einem iframe eingebettet werden? Standard ja.
     *
     * Auf false setzen, wenn eine Anwendung im iframe nicht sauber läuft – dann
     * zeigt der Rahmen "in neuem Tab öffnen" statt der Vorschau.
     *
     * Riptide steht auf false, und zwar nicht aus Vorsicht, sondern weil es
     * nachweislich nicht geht. In wasm/tsunami_web.js steht:
     *
     *     wasmMemory = new WebAssembly.Memory({
     *       'initial': INITIAL_MEMORY / 65536,
     *       'maximum': INITIAL_MEMORY / 65536,
     *       'shared': true,
     *     })
     *
     * `shared: true` ist bedingungslos und passiert im Modul-Init. Ohne
     * SharedArrayBuffer wirft das, das Modul wird nie instanziiert und der
     * Loader der Anwendung hängt endlos bei "Modul wird geladen" – genau das
     * war zu sehen. Der Laufzeit-Check `_emscripten_has_threading_support`
     * schützt nur `pthread_create` und wird nie erreicht.
     *
     * SharedArrayBuffer gibt es in einem Cross-Origin-iframe nur, wenn die
     * einbettende Seite cross-origin isoliert ist. Zwei Wege dorthin:
     *
     * 1. Riptide ohne -pthread bauen (einthreadig). Dann braucht es kein SAB
     *    und läuft überall – im Tab, im iframe, auch bei Nutzern, die SAB
     *    blockiert haben. Kostet Rechenleistung im Solver.
     * 2. Auf jan-vogt.dev `Cross-Origin-Opener-Policy: same-origin` und
     *    `Cross-Origin-Embedder-Policy: credentialless` setzen (Cloudflare
     *    Transform Rule). Dann greift das `allow="cross-origin-isolated"` am
     *    iframe. Preis: COEP regiert danach auch die anderen drei Vorschauen,
     *    und credentialless gibt es in Safari nicht – dort bliebe die Seite
     *    nicht isoliert und Riptide hinge wieder.
     */
    embed?: boolean;
    /** Begründung zu embed: false, nur zur Dokumentation in der JSON */
    embedNote?: string;
    links: {
        github?: string;
        website?: string;
        app?: string;
        play?: string;
    };
}

export const projects = projectsData as Project[]

/**
 * Der Haupt-Link eines Projekts – gleichzeitig die URL der Live-Vorschau.
 * Einheitlich in Brand statt fünf verschiedener Projekt-Gradients: Commits sind
 * auch nicht farbcodiert, sie haben einen Hash und einen Typ.
 */
export const primaryLinkOf = (links: Project["links"]) => {
    if (links.website) return {href: links.website, label: "Website"}
    if (links.app) return {href: links.app, label: "Zur App"}
    if (links.play) return {href: links.play, label: "Play Now"}
    return null
}
