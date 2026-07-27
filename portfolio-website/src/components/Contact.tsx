import {Mail, Github, Instagram, MapPin, Send, GitPullRequest, GitMerge} from "lucide-react"
import {motion} from "framer-motion"
import {Button} from "@/components/ui/button"
import Reveal from "./Reveal"
import SectionHeader from "./SectionHeader"
import {fadeUp, stagger} from "@/lib/motion"

const contactMethods = [
    {
        icon: Mail,
        title: "E-Mail",
        value: "contact@jan-vogt.dev",
        href: "mailto:contact@jan-vogt.dev",
    },
    {
        icon: Github,
        title: "GitHub",
        value: "@JanVogt06",
        href: "https://github.com/JanVogt06",
        external: true,
    },
    {
        icon: Instagram,
        title: "Instagram",
        value: "@jan.vogt06",
        href: "https://instagram.com/jan.vogt06",
        external: true,
    },
    {
        icon: MapPin,
        title: "Standort",
        value: "Bad Berka, Thüringen",
        href: "https://www.google.com/maps/search/?api=1&query=Bad+Berka+Thüringen",
        external: true,
    }
];

const ContactMethod = ({method}: { method: typeof contactMethods[0] }) => {
    const Icon = method.icon;
    return (
        <motion.a
            variants={fadeUp}
            whileHover={{y: -3}}
            href={method.href}
            target={method.external ? "_blank" : undefined}
            rel={method.external ? "noopener noreferrer" : undefined}
            className="group flex items-center gap-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors duration-300 hover:border-brand/30 hover:bg-brand/[0.06] sm:rounded-2xl sm:p-5"
        >
            <Icon
                className="h-5 w-5 shrink-0 text-brand transition-transform duration-300 group-hover:scale-110"/>
            <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white sm:text-base">{method.title}</h3>
                <p className="truncate font-mono text-xs text-white/45 transition-colors group-hover:text-white/70">{method.value}</p>
            </div>
        </motion.a>
    );
};

const Contact = () => {
    return (
        <section id="contact" className="relative overflow-hidden py-16 md:py-24">

            {/* Hintergrund-Blobs – Violett wie im Hero: die Seite schließt sich */}
            <div
                className="absolute -left-1/4 top-0 h-[600px] w-[600px] animate-pulse rounded-full bg-glow/20 blur-[150px] md:h-[800px] md:w-[800px]"/>
            <div
                className="absolute -right-1/4 bottom-0 h-[400px] w-[400px] animate-pulse rounded-full bg-brand/10 blur-[150px] md:h-[600px] md:w-[600px]"
                style={{animationDelay: '1s'}}/>

            <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

                <SectionHeader
                    command="git request-pull"
                    title="Open a"
                    accent="Pull Request"
                    lead="Interessiert an einer Zusammenarbeit oder einfach nur ein Gespräch über Technologie?"
                    centered
                />

                {/* PR-Karte – Box statisch (wie das Hero-Terminal), Inhalte animieren
                    über eigenständige Reveals (kein Erben durch eine bewegte Karte).

                    Bewusst ein div und nicht die shadcn-Card: die bringt bg-card
                    mit, und eine Utility schlaegt .surface aus dem
                    Components-Layer – die Karte war deshalb weiss. .surface ist
                    die einzige Quelle fuer Kartenoberflaechen auf der Seite. */}
                <div className="surface overflow-hidden rounded-2xl sm:rounded-3xl">

                    {/* PR-Kopfzeile mit Merge-Indikator */}
                    <Reveal
                        variants={fadeUp}
                        className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-white/[0.06] bg-white/[0.02] px-5 py-3 font-mono text-xs sm:text-sm">
                        <GitPullRequest className="h-4 w-4 text-status"/>
                        <span className="font-semibold text-status">Open</span>
                        <span className="text-white/45">merge</span>
                        <span className="rounded bg-white/[0.07] px-1.5 py-0.5 text-white/70">du:hallo</span>
                        <span className="text-white/35">→</span>
                        <span className="rounded bg-brand/15 px-1.5 py-0.5 text-brand">jan-vogt:main</span>
                    </Reveal>

                    <div className="p-5 sm:p-6 md:p-8">
                        {/* Kontaktwege als "Channels" – eigener Stagger-Container, direkte fadeUp-Kinder */}
                        <Reveal
                            variants={stagger(0.1)}
                            className="mb-6 grid gap-3 sm:grid-cols-2 sm:gap-4 md:mb-8"
                        >
                            {contactMethods.map((method) => (
                                <ContactMethod key={method.title} method={method}/>
                            ))}
                        </Reveal>

                        {/* CTA – wie der grüne "Create pull request"-Button */}
                        <Reveal variants={fadeUp} className="text-center">
                            <Button
                                    size="lg"
                                    className="group rounded-full bg-glow px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:scale-105 hover:bg-glow/90 hover:shadow-[0_0_30px_rgba(139,92,246,0.45)] sm:px-8 sm:py-4 sm:text-lg"
                                    asChild
                                >
                                    <a href="mailto:contact@jan-vogt.dev">
                                        <GitMerge className="mr-2 h-4 w-4 sm:mr-3 sm:h-5 sm:w-5"/>
                                        Merge anfragen
                                        <Send
                                            className="ml-2 h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:ml-3 sm:h-5 sm:w-5"/>
                                    </a>
                                </Button>
                        </Reveal>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Contact;
