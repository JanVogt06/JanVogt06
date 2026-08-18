let webgl2: boolean | null = null

const hasWebGL2 = () => {
    if (webgl2 !== null) return webgl2
    try {
        const canvas = document.createElement("canvas")
        const context = canvas.getContext("webgl2")
        webgl2 = context !== null
        context?.getExtension("WEBGL_lose_context")?.loseContext()
    } catch {
        webgl2 = false
    }
    return webgl2
}

/** From this width on, crystals and text block fit side by side. */
export const CRYSTALS_MIN_WIDTH = 1024

export const sceneSupported = () =>
    hasWebGL2() &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    !window.matchMedia("(pointer: coarse)").matches

/** Whether the clickable crystals are added; only when there is room. */
export const crystalsSupported = () =>
    sceneSupported() && window.innerWidth >= CRYSTALS_MIN_WIDTH
