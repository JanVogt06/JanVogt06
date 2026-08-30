let webgl2: boolean | null = null

export const hasWebGL2 = () => {
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
