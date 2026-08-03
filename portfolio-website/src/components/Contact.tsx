import {Mail, Github, Instagram, MapPin, GitPullRequest, GitMerge, ArrowUpRight} from "lucide-react"
import {motion} from "framer-motion"
import Reveal from "./Reveal"
import {HudPanel, HudLabel, HudSectionHeader} from "./Hud"
import {fadeUp, stagger} from "@/lib/motion"

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
 */

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
        <motion.a
            variants={fadeUp}
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
        </motion.a>
    )
}

const Contact = () => (
    /* min-h statt h: auf kurzen Fenstern waechst die Sektion mit, statt den
       Inhalt abzuschneiden. */
    <section id="contact" className="relative flex min-h-screen items-center py-20 md:py-28">
        <div className="relative mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">

            <Reveal variants={fadeUp} className="mb-10 md:mb-14">
                <HudSectionHeader
                    id="03"
                    command="git request-pull"
                    title="Open a"
                    accent="Pull Request"
                    lead="Interessiert an einer Zusammenarbeit oder einfach nur ein Gespräch über Technologie?"
                />
            </Reveal>

            <HudPanel className="p-5 sm:p-8">
                {/* Statuszeile des Geraets */}
                <Reveal
                    variants={fadeUp}
                    className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-white/[0.07] pb-4 font-mono text-xs"
                >
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
                </Reveal>

                <HudLabel className="mt-6">Kanäle</HudLabel>

                <Reveal variants={stagger(0.08)} className="mt-3 grid gap-3 sm:grid-cols-2">
                    {channels.map((channel) => (
                        <Channel key={channel.label} channel={channel}/>
                    ))}
                </Reveal>

                <Reveal variants={fadeUp} className="mt-8 flex flex-wrap items-center justify-between gap-4">
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
                </Reveal>
            </HudPanel>
        </div>
    </section>
)

export default Contact
