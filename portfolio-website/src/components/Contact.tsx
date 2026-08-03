import {useCallback, useRef} from "react"
import {Mail, Github, Instagram, MapPin, GitPullRequest, GitMerge, ArrowUpRight} from "lucide-react"
import {HudPanel, HudLabel, HudSectionHeader} from "./Hud"
import useScrollProgress from "@/lib/useScrollProgress"

/**
 * Kontakt als Funkstrecke.
 *
 * Der Abschnitt war eine abgerundete Karte mit Pillen und einem grossen violetten
 * Knopf – die weichste Flaeche der Seite, direkt hinter dem Kristallring. Jetzt
 * dieselbe Instrumentensprache wie die Projekt-Tafel.
 *
 * Die Pull-Request-Metapher bleibt, weil sie zum Git-Leitmotiv gehoert und weil
 * sie stimmt: man traegt etwas an, das zusammengefuehrt werden kann. Sie ist nur
 * nicht mehr als GitHub-Nachbau gezeichnet, sondern als Statuszeile eines
 * Geraets.
 *
 * ANKUNFT AM SCROLL
 *
 * Als einzelne Tafel braucht der Abschnitt keine gepinnten Kapitel wie der
 * Werdegang – aber er darf auch nicht einfach vorbeiscrollen. Deshalb kommt er
 * am Scroll AN: die Tafel faehrt aus der Tiefe heran, die Kanaele folgen
 * versetzt, alles an den Fortschritt gekoppelt statt an eine Zeitachse.
 *
 * Der Unterschied zu einem einmaligen Einblenden ist, dass es umkehrbar ist: wer
 * zurueckscrollt, sieht die Tafel wieder wegfahren. Genau das macht den
 * Kristallring und die Kapitel stimmig, und hier gilt es genauso.
 */

/**
 * Ueber welchen Anteil der eigenen Hoehe die Tafel heranfaehrt, bevor die Sektion
 * oben ankommt.
 *
 * 1.0 heisst: der Anlauf beginnt eine ganze Sektionshoehe vorher. Mit 0.55
 * gemessen war die Ankunft viel zu spaet gewichtet – eine halbe Bildschirmhoehe
 * davor stand sie erst bei 9 %, also passierte fast alles auf den letzten
 * Pixeln und wirkte wie ein Aufblitzen statt wie ein Heranfahren.
 */
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
            className="group flex items-center gap-4 border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 transition-colors hover:border-brand/30 hover:bg-brand/[0.06]"
        >
            <Icon className="h-4 w-4 shrink-0 text-brand"/>
            <div className="min-w-0 flex-1">
                <HudLabel tone="text-white/30">{channel.label}</HudLabel>
                <p className="mt-1 truncate font-mono text-sm text-white/70 transition-colors group-hover:text-white">
                    {channel.value}
                </p>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-white/20 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand"/>
        </a>
    )
}

const Contact = () => {
    const sectionRef = useRef<HTMLElement>(null)
    const headerRef = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const channelsRef = useRef<HTMLDivElement>(null)

    /**
     * `raw` ist nicht begrenzt: oberhalb der Sektion negativ. Daraus wird die
     * Ankunft – sie ist also schon im Gange, bevor die Sektion oben steht, und
     * laeuft rueckwaerts wieder ab.
     */
    const onProgress = useCallback((raw: number) => {
        const arrival = clamp01((raw + ARRIVAL) / ARRIVAL)

        if (headerRef.current) {
            headerRef.current.style.opacity = String(arrival)
            headerRef.current.style.transform = `translate3d(0, ${((1 - arrival) * 4).toFixed(2)}vh, 0)`
        }

        if (panelRef.current) {
            /* Die Tafel faehrt aus der Tiefe heran: etwas kleiner und tiefer,
               bis sie steht. Derselbe Griff wie bei den Werdegang-Kapiteln. */
            panelRef.current.style.opacity = String(arrival)
            panelRef.current.style.transform =
                `translate3d(0, ${((1 - arrival) * 7).toFixed(2)}vh, 0) scale(${(0.965 + arrival * 0.035).toFixed(4)})`
        }

        if (channelsRef.current) {
            /* Die Kanaele folgen versetzt. Der Versatz haengt am Fortschritt,
               nicht an einer Verzoegerung – dadurch laeuft es beim
               Zurueckscrollen sauber rueckwaerts. */
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
        /* min-h statt h: auf kurzen Fenstern waechst die Sektion mit, statt den
           Inhalt abzuschneiden. */
        <section
            ref={sectionRef}
            id="contact"
            className="relative flex min-h-screen items-center py-20 md:py-28"
        >
            <div className="relative mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">

                <div ref={headerRef} className="mb-10 will-change-transform md:mb-14">
                    <HudSectionHeader
                        id="03"
                        command="git request-pull"
                        title="Open a"
                        accent="Pull Request"
                        lead="Interessiert an einer Zusammenarbeit oder einfach nur ein Gespräch über Technologie?"
                    />
                </div>

                <div ref={panelRef} className="will-change-transform">
                    <HudPanel className="p-5 sm:p-8">
                        {/* Statuszeile des Geraets */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-white/[0.07] pb-4 font-mono text-xs">
                            <GitPullRequest className="h-4 w-4 text-status"/>
                            <span className="font-semibold uppercase tracking-[0.2em] text-status">Open</span>
                            <span aria-hidden="true" className="h-px w-6 bg-white/15"/>
                            <span className="border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-white/70">
                                du:hallo
                            </span>
                            <span aria-hidden="true" className="text-white/30">→</span>
                            <span className="border border-brand/25 bg-brand/10 px-2 py-0.5 text-brand">
                                jan-vogt:main
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
                                className="group inline-flex items-center gap-3 border border-brand/30 bg-brand/10 px-6 py-3 font-mono text-xs uppercase tracking-[0.22em] text-brand transition-colors hover:bg-brand/20 hover:text-white"
                            >
                                <GitMerge className="h-4 w-4"/>
                                Merge anfragen
                                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/>
                            </a>

                            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/20">
                                Antwort meist innerhalb eines Tages
                            </p>
                        </div>
                    </HudPanel>
                </div>
            </div>
        </section>
    )
}

export default Contact
