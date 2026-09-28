export type Channel = {
    kind: "mail" | "social"
    label: string
    value: string
    href: string
    external?: boolean
}

export const EMAIL = "contact@jan-vogt.dev"

export const channels: Channel[] = [
    {
        kind: "mail",
        label: "E-Mail",
        value: EMAIL,
        href: `mailto:${EMAIL}`,
    },
    {
        kind: "social",
        label: "GitHub",
        value: "@JanVogt06",
        href: "https://github.com/JanVogt06",
        external: true,
    },
    {
        kind: "social",
        label: "Instagram",
        value: "@jan.vogt06",
        href: "https://instagram.com/jan.vogt06",
        external: true,
    },
]
