import {useEffect, useSyncExternalStore} from "react"
import {projects} from "./projects"
import type {Project} from "./projects"

const API = "https://api.github.com/repos/"

/** Descriptions live for one tab session; a reload picks up GitHub edits. */
const CACHE_KEY = "github-descriptions"

const descriptions = new Map<string, string>()
const listeners = new Set<() => void>()
let started = false

const repoOf = (url?: string) => {
    if (!url) return null
    const [owner, repo] = url
        .replace(/^https:\/\/(www\.)?github\.com\//, "")
        .replace(/\.git$/, "")
        .replace(/\/+$/, "")
        .split("/")
    return owner && repo ? `${owner}/${repo}` : null
}

/** Description of the repo behind a project; the tagline until it is loaded. */
export const taglineOf = (project: Project) =>
    descriptions.get(project.slug) ?? project.tagline

export const subscribeDescriptions = (listener: () => void) => {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}

const notify = () => listeners.forEach((listener) => listener())

const restore = () => {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY)
        if (!raw) return false
        const stored = JSON.parse(raw) as Record<string, unknown>
        Object.entries(stored).forEach(([slug, text]) => {
            if (typeof text === "string") descriptions.set(slug, text)
        })
        return descriptions.size > 0
    } catch {
        return false
    }
}

const persist = () => {
    try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(descriptions)))
    } catch {
        // Storage blocked: the next load fetches again.
    }
}

const fetchDescription = async (project: Project) => {
    const repo = repoOf(project.links.github)
    if (!repo) return
    try {
        const response = await fetch(API + repo, {
            headers: {Accept: "application/vnd.github+json"},
        })
        if (!response.ok) return
        const {description} = (await response.json()) as {description?: string | null}
        const text = description?.trim()
        if (text) descriptions.set(project.slug, text)
    } catch {
        // Offline or rate limited: the tagline from the JSON stays.
    }
}

/** Fetches every repo description once, then notifies the subscribers. */
export const loadDescriptions = () => {
    if (started) return
    started = true

    if (restore()) {
        notify()
        return
    }

    void Promise.all(projects.map(fetchDescription)).then(() => {
        persist()
        notify()
    })
}

/** Tagline of a project, re-rendering once the descriptions arrive. */
export const useTagline = (project: Project) => {
    useEffect(loadDescriptions, [])
    return useSyncExternalStore(subscribeDescriptions, () => taglineOf(project))
}
