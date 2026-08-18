import projectsData from "@/data/projects.json"

export interface Project {
    /** Screenshot file name in src/data/images/screenshots/ */
    slug: string;
    icon: string;
    title: string;
    subtitle: string;
    tagline: string;
    description: string;
    tech: string[];
    /** Size hint on the play button, e.g. "74 MB Unity build" */
    previewNote?: string;
    embed?: boolean;
    /** Why embed is false. */
    embedNote?: string;
    links: {
        github?: string;
        website?: string;
        app?: string;
        play?: string;
    };
}

export const projects = projectsData as Project[]

/** Main link of a project, also the URL of the live preview. */
export const primaryLinkOf = (links: Project["links"]) => {
    if (links.website) return {href: links.website, label: "Website"}
    if (links.app) return {href: links.app, label: "Zur App"}
    if (links.play) return {href: links.play, label: "Play Now"}
    return null
}
