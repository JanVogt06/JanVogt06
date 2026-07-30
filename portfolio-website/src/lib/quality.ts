/**
 * Qualitaetsstufe fuer den Nebula-Shader bestimmen.
 *
 * Vorher hing das an einem Slider im Hero – einem Debug-Regler, der im
 * Produktivstand gelandet ist. Niemand, der ein Portfolio ansieht, will die
 * FBM-Oktavenzahl eines Fragment-Shaders einstellen; und wer ein schwaches
 * Geraet hat, merkt es an den Bildern, nicht am Regler.
 *
 * Die Schaetzung hier ist nur der Startwert. Verlassen kann man sich darauf
 * nicht: `deviceMemory` gibt es nur in Chromium, `hardwareConcurrency` sagt
 * nichts ueber die GPU, und genau die entscheidet bei einem Fragment-Shader.
 * Deshalb korrigiert NebulaWebGL sich zusaetzlich an der gemessenen Bildrate
 * nach unten.
 */

/** Die fuenf Stufen, die der Shader kennt: 0 = Eco … 1 = Ultra. */
export const QUALITY_STEPS = [0, 0.25, 0.5, 0.75, 1] as const

/** Ein Schritt nach unten, oder null wenn schon auf der niedrigsten Stufe. */
export const stepDown = (quality: number): number | null => {
    const i = QUALITY_STEPS.indexOf(quality as (typeof QUALITY_STEPS)[number])
    const index = i === -1 ? QUALITY_STEPS.findIndex((q) => q >= quality) : i
    return index > 0 ? QUALITY_STEPS[index - 1] : null
}

export const detectQuality = (): number => {
    // Wer Bewegung reduziert haben will, bekommt das billigste Standbild.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return 0

    // Datensparmodus ist eine ausdrueckliche Bitte, nicht zu protzen.
    const connection = (navigator as {connection?: {saveData?: boolean}}).connection
    if (connection?.saveData) return 0

    const cores = navigator.hardwareConcurrency ?? 4
    // Nicht im Standard, nur Chromium – daher optional.
    const memory = (navigator as {deviceMemory?: number}).deviceMemory ?? 4
    const coarse = window.matchMedia("(pointer: coarse)").matches

    if (cores <= 2 || memory <= 2) return 0.25
    // Touch-Geraete: fast immer mobile GPU, unabhaengig von der Kernzahl.
    if (coarse) return cores >= 8 && memory >= 6 ? 0.5 : 0.25
    if (cores >= 8 && memory >= 8) return 0.75
    return 0.5
}
