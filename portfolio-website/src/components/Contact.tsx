import {useCallback, useRef} from "react"
import type {CSSProperties} from "react"
import {ArrowUpRight} from "lucide-react"
import Band from "./band/Band"
import type {BandHandle} from "./band/Band"
import {ActionLink} from "./band/Action"
import Slate from "./band/Slate"
import useScrollProgress from "@/lib/useScrollProgress"
import {space} from "@/lib/space/controller"

const SCREENS = 3

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

const channels = [
    {
        label: "E-Mail",
        value: "contact@jan-vogt.dev",
        href: "mailto:contact@jan-vogt.dev",
    },
    {
        label: "GitHub",
        value: "@JanVogt06",
        href: "https://github.com/JanVogt06",
        external: true,
    },
    {
        label: "Instagram",
        value: "@jan.vogt06",
        href: "https://instagram.com/jan.vogt06",
        external: true,
    },
    {
        label: "Standort",
        value: "Bad Berka, Thüringen",
        href: "https://www.google.com/maps/search/?api=1&query=Bad+Berka+Thüringen",
        external: true,
    },
]

const Channel = ({channel}: {channel: (typeof channels)[number]}) => (
    <a
        href={channel.href}
        target={channel.external ? "_blank" : undefined}
        rel={channel.external ? "noopener noreferrer" : undefined}
        className="group grid min-h-11 grid-cols-[1fr_auto] items-baseline gap-x-4 py-2.5 sm:grid-cols-[5.5rem_1fr_auto]"
    >
        <span className="col-start-1 text-label uppercase tracking-[0.14em] text-fg-3">
            {channel.label}
        </span>
        <span className="col-start-1 truncate text-data text-fg-2 transition-colors duration-200 group-hover:text-fg sm:col-start-2">
            {channel.value}
        </span>
        <ArrowUpRight className="col-start-2 row-start-1 h-3 w-3 shrink-0 self-center text-fg-3/70 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-signal sm:col-start-3"/>
    </a>
)

const Contact = () => {
    const sectionRef = useRef<HTMLDivElement>(null)
    const bandRef = useRef<BandHandle>(null)
    const channelsRef = useRef<HTMLDivElement>(null)

    const onProgress = useCallback((raw: number) => {
        const progress = clamp01(raw)
        space.setArrivalProgress(progress)

        const arrived = clamp01(progress / 0.26)
        bandRef.current?.setWeight(arrived, (1 - arrived) * 16)

        if (channelsRef.current) {
            const rows = channelsRef.current.children
            const reveal = clamp01((progress - 0.22) / 0.42)
            for (let i = 0; i < rows.length; i++) {
                const stagger = i * 0.12
                const own = clamp01((reveal - stagger) / (1 - stagger))
                const row = rows[i] as HTMLElement
                row.style.opacity = String(own)
                row.style.transform = `translate3d(0, ${((1 - own) * 1).toFixed(2)}rem, 0)`
            }
        }
    }, [])

    useScrollProgress(sectionRef, onProgress)

    return (
        <section id="contact" className="anchor-end relative">
            <div
                ref={sectionRef}
                className="track"
                style={{"--screens": SCREENS} as CSSProperties}
            >
                <div className="stage sticky top-0"/>
            </div>

            <Band ref={bandRef} className="md:max-w-[52rem]">
                <div className="md:grid md:grid-cols-2 md:gap-x-10">
                    <div>
                        <Slate>
                            <h2 className="text-label uppercase tracking-[0.14em] text-fg-3">
                                <span className="mr-3 text-data">03</span>
                                <span className="text-fg-2">Sag </span>
                                <span className="text-fg">Hallo</span>
                            </h2>
                        </Slate>

                        <p className="mt-4 max-w-[38ch] text-lead text-fg-2">
                            Interessiert an einer Zusammenarbeit oder einfach nur ein
                            Gespräch über Technologie?
                        </p>

                        <p className="mt-7 flex items-center gap-2.5 text-label uppercase tracking-[0.14em] text-status">
                            <span
                                aria-hidden="true"
                                className="h-1 w-1 shrink-0 bg-status animate-pulse-soft"
                            />
                            Offen für Gespräche
                        </p>

                        <div className="mt-8">
                            <ActionLink
                                href="mailto:contact@jan-vogt.dev"
                                icon={<ArrowUpRight className="h-3 w-3"/>}
                            >
                                Nachricht schreiben
                            </ActionLink>
                        </div>

                        <p className="mt-2 text-fine text-fg-3">
                            Antwort meist innerhalb eines Tages
                        </p>
                    </div>

                    <div className="mt-9 md:mt-0">
                        <Slate>
                            <span className="text-label uppercase tracking-[0.14em] text-fg-3">
                                Kanäle
                            </span>
                        </Slate>

                        <div ref={channelsRef} className="mt-1">
                            {channels.map((channel) => (
                                <Channel key={channel.label} channel={channel}/>
                            ))}
                        </div>
                    </div>
                </div>

                <p className="mt-9 max-w-[44rem] text-fine text-fg-3">
                    Planetenkarten:{" "}
                    <a
                        href="https://www.solarsystemscope.com/textures/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-white/20 underline-offset-[3px] transition-colors duration-200 hover:text-fg-2 hover:decoration-signal"
                    >
                        Solar System Scope
                    </a>{" "}
                    (CC BY 4.0). Milchstraße:{" "}
                    <a
                        href="https://svs.gsfc.nasa.gov/4851/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-white/20 underline-offset-[3px] transition-colors duration-200 hover:text-fg-2 hover:decoration-signal"
                    >
                        NASA/Goddard Space Flight Center Scientific Visualization Studio
                    </a>
                    , Gaia DR2: ESA/Gaia/DPAC.
                </p>
            </Band>
        </section>
    )
}

export default Contact
