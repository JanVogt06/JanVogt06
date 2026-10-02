const screenshots = import.meta.glob<string>("../data/images/screenshots/*.{png,jpg,jpeg,webp}", {
    eager: true,
    import: "default",
})

export const SCREENSHOT_ASPECT = 1600 / 1000

export const screenshotFor = (slug: string) =>
    Object.entries(screenshots).find(([path]) => path.includes(`/${slug}.`))?.[1]
