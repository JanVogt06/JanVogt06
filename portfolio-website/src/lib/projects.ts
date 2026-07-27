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
     * Auf false setzen, wenn die Anwendung im iframe nicht sauber läuft – dann
     * zeigt der Rahmen einen "In neuem Tab öffnen"-Knopf statt der Vorschau.
     * Riptide steht auf false, weil es coi-serviceworker für SharedArrayBuffer
     * lädt: die Library registriert einen Service Worker und lädt die Seite neu,
     * was in einem Cross-Origin-iframe eine Reload-Schleife auslösen kann.
     * Ungetestet, deshalb bewusst aus – nach einem Test einfach umstellen.
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
