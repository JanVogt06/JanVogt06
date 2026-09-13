export const QUALITY_STEPS = [0, 0.25, 0.5, 0.75, 1] as const

export const MIN_QUALITY = 0.25

const indexOf = (quality: number) => {
    const exact = QUALITY_STEPS.indexOf(quality as (typeof QUALITY_STEPS)[number])
    return exact === -1 ? QUALITY_STEPS.findIndex((q) => q >= quality) : exact
}

export const stepDown = (quality: number): number | null => {
    const index = indexOf(quality)
    return index > 0 ? QUALITY_STEPS[index - 1] : null
}

export const stepUp = (quality: number): number | null => {
    const index = indexOf(quality)
    return index >= 0 && index < QUALITY_STEPS.length - 1 ? QUALITY_STEPS[index + 1] : null
}

export const detectQuality = (): number => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return 0

    const connection = (navigator as {connection?: {saveData?: boolean}}).connection
    if (connection?.saveData) return MIN_QUALITY

    return 1
}
