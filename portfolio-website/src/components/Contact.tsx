import {useCallback, useRef} from "react"
import {Mail, Github, Instagram, MapPin, Send, ArrowUpRight} from "lucide-react"
import {HudLabel, HudSectionHeader} from "./Hud"
import Lens from "./Lens"
import useScrollProgress from "@/lib/useScrollProgress"

const ARRIVAL = 1

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

const channels = [
    {
        icon: Mail,
        label: "E-Mail",
        value: "contact@jan-vogt.dev",
        href: "mailto:contact@jan-vogt.dev",
    },
    {
        icon: Github,
        label: "GitHub",
        value: "@JanVogt06",
        href: "https://github.com/JanVogt06",
        external: true,
    },
    {
        icon: Instagram,
        label: "Instagram",
        value: "@jan.vogt06",
        href: "https://instagram.com/jan.vogt06",
        external: true,
    },
    {
        icon: MapPin,
        label: "Standort",
        value: "Bad Berka, Thüringen",
        href: "https://www.google.com/maps/search/?api=1&query=Bad+Berka+Thüringen",
        external: true,
    },
]

const Channel = ({channel}: {channel: (typeof channels)[number]}) => {
    const Icon = channel.icon
    return (
        <a
            href={channel.href}
            target={channel.external ? "_blank" : undefined}
            rel={channel.external ? "noopener noreferrer" : undefined}
            className="rim group flex items-center gap-4 rounded-xl bg-white/[0.035] px-4 py-3.5 transition-colors hover:bg-white/[0.075]"
        >
            <Icon className="h-4 w-4 shrink-0 text-white/50 transition-colors group-hover:text-brand"/>
            <div className="min-w-0 flex-1">
                <HudLabel tone="text-white/50">{channel.label}</HudLabel>
                <p className="mt-1 truncate font-mono text-sm text-white/70 transition-colors group-hover:text-white">
                    {channel.value}
                </p>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-white/35 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand"/>
        </a>
    )
}

const Contact = () => {
    const sectionRef = useRef<HTMLElement>(null)
    const headerRef = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const channelsRef = useRef<HTMLDivElement>(null)

    const onProgress = useCallback((raw: number) => {
        const arrival = clamp01((raw + ARRIVAL) / ARRIVAL)

        if (headerRef.current) {
            headerRef.current.style.opacity = String(arrival)
            headerRef.current.style.transform = `translate3d(0, ${((1 - arrival) * 4).toFixed(2)}vh, 0)`
        }

        if (panelRef.current) {
            panelRef.current.style.opacity = String(arrival)
            panelRef.current.style.transform =
                `translate3d(0, ${((1 - arrival) * 7).toFixed(2)}vh, 0) scale(${(0.965 + arrival * 0.035).toFixed(4)})`
        }

        if (channelsRef.current) {
            const kids = channelsRef.current.children
            for (let i = 0; i < kids.length; i++) {
                const own = clamp01((arrival - i * 0.12) / (1 - i * 0.12))
                const el = kids[i] as HTMLElement
                el.style.opacity = String(own)
                el.style.transform = `translate3d(0, ${((1 - own) * 2.5).toFixed(2)}rem, 0)`
            }
        }
    }, [])

    useScrollProgress(sectionRef, onProgress, "exit")

    return (
        <section
            ref={sectionRef}
            id="contact"
            className="stage-min relative flex items-center py-20 md:py-28"
        >
            <div className="relative mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">

                <div ref={headerRef} className="mb-10 will-change-transform md:mb-14">
                    <HudSectionHeader
                        id="03"
                        title="Sag"
                        accent="Hallo"
                        lead="Interessiert an einer Zusammenarbeit oder einfach nur ein Gespräch über Technologie?"
                    />
                </div>

                <div ref={panelRef} className="will-change-transform">
                    <div className="glass rounded-3xl p-5 sm:p-8">
                        <Lens/>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-white/[0.06] pb-4">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status opacity-70"/>
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-status"/>
                            </span>
                            <span className="text-xs font-medium text-status">
                                Offen für Gespräche
                            </span>
                        </div>

                        <HudLabel className="mt-6">Kanäle</HudLabel>

                        <div ref={channelsRef} className="mt-3 grid gap-3 sm:grid-cols-2">
                            {channels.map((channel) => (
                                <Channel key={channel.label} channel={channel}/>
                            ))}
                        </div>

                        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                            <a
                                href="mailto:contact@jan-vogt.dev"
                                className="action group"
                            >
                                <Send className="h-4 w-4"/>
                                Nachricht schreiben
                                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/>
                            </a>

                            <p className="text-xs text-white/50">
                                Antwort meist innerhalb eines Tages
                            </p>
                        </div>
                    </div>
                </div>

                <p className="mt-10 max-w-3xl text-[11px] leading-relaxed text-white/50">
                    Planetenkarten:{" "}
                    <a
                        href="https://www.solarsystemscope.com/textures/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-white/15 underline-offset-2 transition-colors hover:text-white/50"
                    >
                        Solar System Scope
                    </a>{" "}
                    (CC BY 4.0). Milchstraße:{" "}
                    <a
                        href="https://svs.gsfc.nasa.gov/4851/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-white/15 underline-offset-2 transition-colors hover:text-white/50"
                    >
                        NASA/Goddard Space Flight Center Scientific Visualization Studio
                    </a>
                    , Gaia DR2: ESA/Gaia/DPAC.
                </p>
            </div>
        </section>
    )
}

export default Contact
