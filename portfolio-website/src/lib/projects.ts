import projectsData from "@/data/projects.json"

export interface Project {
    slug: string;
    icon: string;
    title: string;
    subtitle: string;
    tagline: string;
    description: string;
    tech: string[];

    previewNote?: string;
    embed?: boolean;

    embedNote?: string;
    links: {
        github?: string;
        website?: string;
        app?: string;
        play?: string;
    };
}

export const projects = projectsData as Project[]

export const primaryLinkOf = (links: Project["links"]) => {
    if (links.website) return {href: links.website, label: "Website"}
    if (links.app) return {href: links.app, label: "Zur App"}
    if (links.play) return {href: links.play, label: "Play Now"}
    return null
}
