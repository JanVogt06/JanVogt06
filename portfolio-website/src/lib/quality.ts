/** The five levels the shader knows: 0 = Eco ... 1 = Ultra. */
export const QUALITY_STEPS = [0, 0.25, 0.5, 0.75, 1] as const

/** One step down, or null when already at the lowest level. */
export const stepDown = (quality: number): number | null => {
    const i = QUALITY_STEPS.indexOf(quality as (typeof QUALITY_STEPS)[number])
    const index = i === -1 ? QUALITY_STEPS.findIndex((q) => q >= quality) : i
    return index > 0 ? QUALITY_STEPS[index - 1] : null
}

export const detectQuality = (): number => {
    // Reduced motion gets the cheapest still image.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return 0

    // Data saver mode is an explicit request to keep it cheap.
    const connection = (navigator as {connection?: {saveData?: boolean}}).connection
    if (connection?.saveData) return 0

    const cores = navigator.hardwareConcurrency ?? 4
    // Not standardised, Chromium only, hence optional.
    const memory = (navigator as {deviceMemory?: number}).deviceMemory ?? 4

    if (cores <= 2 || memory <= 2) return 0.25
    if (cores >= 8 && memory >= 8) return 0.75
    return 0.5
}
