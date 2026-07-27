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
     * Zu Riptide, weil es der Grenzfall ist: es ist ein Emscripten-Build mit
     * Threads (pthreads) und braucht dafür SharedArrayBuffer, das nur in einem
     * cross-origin isolierten Kontext existiert. In einem Cross-Origin-iframe
     * wird `crossOriginIsolated` nur dann true, wenn DIESE Seite selbst
     * COOP: same-origin und COEP setzt – tut sie nicht. Die Simulation läuft im
     * iframe also ohne Threads.
     *
     * Sie stürzt dabei nicht ab: der Build prüft zur Laufzeit ab
     * (`_emscripten_has_threading_support`) und pthread_create gibt EAGAIN
     * zurück statt zu crashen. Deshalb ist embed hier an.
     *
     * Voller Threading-Support wäre möglich, ist aber ein Eingriff ins Hosting:
     * eine Cloudflare-Transform-Rule, die auf jan-vogt.dev
     * `Cross-Origin-Opener-Policy: same-origin` und
     * `Cross-Origin-Embedder-Policy: credentialless` setzt. Dann greift das
     * `allow="cross-origin-isolated"` am iframe. Achtung: COEP regiert danach
     * auch die anderen drei Vorschauen, und credentialless wird außerhalb von
     * Chromium schlechter unterstützt – es kann sie in Safari und Firefox
     * brechen. Deshalb nicht vorausgeeilt.
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
