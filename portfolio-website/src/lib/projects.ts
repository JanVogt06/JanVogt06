import projectsData from "@/data/projects.json"

/**
 * Projekt-Form wie in src/data/projects.json hinterlegt.
 * Projekte dort hinzufügen/ändern – keine Code-Änderung nötig.
 */
export interface Project {
    /** Dateiname des Screenshots in src/data/images/screenshots/ */
    slug: string;
    icon: string;
    hash: string;       // kurzer Commit-Hash (Deko)
    title: string;
    subtitle: string;
    description: string;
    tech: string[];
    /** Gewichtshinweis am Play-Button, z.B. "74 MB Unity-Build" */
    previewNote?: string;
    /**
     * Darf die Seite in einem iframe eingebettet werden? Standard ja. Auf false
     * setzen, wenn eine Anwendung im iframe nicht läuft – dann zeigt der Rahmen
     * "in neuem Tab öffnen" statt der Vorschau. Die Begründung gehört als
     * `embedNote` in die JSON.
     */
    embed?: boolean;
    /** Warum embed: false – steht in der JSON direkt beim Projekt. */
    embedNote?: string;
    links: {
        github?: string;
        website?: string;
        app?: string;
        play?: string;
    };
}

export const projects = projectsData as Project[]

/** Der Haupt-Link eines Projekts – gleichzeitig die URL der Live-Vorschau. */
export const primaryLinkOf = (links: Project["links"]) => {
    if (links.website) return {href: links.website, label: "Website"}
    if (links.app) return {href: links.app, label: "Zur App"}
    if (links.play) return {href: links.play, label: "Play Now"}
    return null
}
