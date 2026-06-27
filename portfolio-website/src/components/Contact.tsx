import {Mail, Github, Instagram, MapPin, Send, GitPullRequest, GitMerge} from "lucide-react"
import {motion} from "framer-motion"
import {Card} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import Reveal from "./Reveal"
import {fadeUp, stagger} from "@/lib/motion"

const contactMethods = [
    {
        icon: Mail,
        title: "E-Mail",
        value: "contact@jan-vogt.dev",
        href: "mailto:contact@jan-vogt.dev",
        gradient: "from-pink-500 to-rose-600"
    },
    {
        icon: Github,
        title: "GitHub",
        value: "@JanVogt06",
        href: "https://github.com/JanVogt06",
        external: true,
        gradient: "from-gray-700 to-gray-900"
    },
    {
        icon: Instagram,
        title: "Instagram",
        value: "@jan.vogt06",
        href: "https://instagram.com/jan.vogt06",
        external: true,
        gradient: "from-purple-500 to-pink-500"
    },
    {
        icon: MapPin,
        title: "Standort",
        value: "Bad Berka, Thüringen",
        href: "https://www.google.com/maps/search/?api=1&query=Bad+Berka+Thüringen",
        external: true,
        gradient: "from-cyan-500 to-blue-600"
    }
];

const ContactMethod = ({method}: { method: typeof contactMethods[0] }) => {
    const Icon = method.icon;
    return (
        <motion.a
            variants={fadeUp}
            whileHover={{y: -4}}
            href={method.href}
            target={method.external ? "_blank" : undefined}
            rel={method.external ? "noopener noreferrer" : undefined}
            className="group flex items-center gap-3 rounded-xl border border-purple-500/20 bg-purple-950/30 p-4 backdrop-blur-sm transition-[color,background-color,border-color,box-shadow] duration-300 hover:border-purple-500/40 hover:bg-purple-900/40 hover:shadow-lg hover:shadow-purple-500/10 sm:gap-4 sm:rounded-2xl sm:p-5"
        >
            <div
                className={`rounded-lg bg-linear-to-br ${method.gradient} p-2.5 shadow-lg transition-transform duration-300 group-hover:scale-110 sm:rounded-xl sm:p-3`}>
                <Icon className="h-4 w-4 text-white sm:h-5 sm:w-5"/>
            </div>
            <div>
                <h3 className="text-sm font-semibold text-white sm:text-base">{method.title}</h3>
                <p className="text-xs text-gray-400 transition-colors group-hover:text-gray-300 sm:text-sm">{method.value}</p>
            </div>
        </motion.a>
    );
};

const Contact = () => {
    return (
        <section id="contact" className="relative overflow-hidden bg-[#0c0515] py-16 md:py-24">

            {/* Hintergrund-Blobs */}
            <div
                className="absolute -left-1/4 top-0 h-[600px] w-[600px] animate-pulse rounded-full bg-purple-600/20 blur-[150px] md:h-[800px] md:w-[800px]"/>
            <div
                className="absolute -right-1/4 bottom-0 h-[400px] w-[400px] animate-pulse rounded-full bg-pink-600/20 blur-[150px] md:h-[600px] md:w-[600px]"
                style={{animationDelay: '1s'}}/>

            <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

                {/* Section Header */}
                <Reveal variants={fadeUp} className="mb-8 text-center md:mb-12">
                    <p className="mb-3 font-mono text-sm text-white/40">
                        <span className="text-emerald-400">$</span> git request-pull
                    </p>
                    <h2 className="mb-3 text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
                        Open a <span
                        className="bg-linear-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">Pull Request</span>
                    </h2>
                    <p className="mx-auto max-w-xl text-base text-gray-300 sm:text-lg md:text-xl">
                        Interessiert an einer Zusammenarbeit oder einfach nur ein Gespräch über Technologie?
                    </p>
                </Reveal>

                {/* PR-Karte – Box statisch (wie das Hero-Terminal), Inhalte animieren
                    über eigenständige Reveals (kein Erben durch eine bewegte Karte). */}
                <Card
                    className="overflow-hidden rounded-2xl border-purple-500/20 bg-purple-950/20 p-0 backdrop-blur-sm sm:rounded-3xl">

                    {/* PR-Kopfzeile mit Merge-Indikator */}
                    <Reveal
                        variants={fadeUp}
                        className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-white/10 bg-white/5 px-5 py-3 font-mono text-xs sm:text-sm">
                        <GitPullRequest className="h-4 w-4 text-emerald-400"/>
                        <span className="font-semibold text-emerald-300">Open</span>
                        <span className="text-white/50">merge</span>
                        <span className="rounded bg-white/10 px-1.5 py-0.5 text-white/70">du:hallo</span>
                        <span className="text-white/40">→</span>
                        <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 text-cyan-300">jan-vogt:main</span>
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
                                    className="group rounded-full bg-linear-to-r from-pink-500 to-purple-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:scale-105 hover:from-pink-600 hover:to-purple-700 hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] sm:px-8 sm:py-4 sm:text-lg"
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
                </Card>
            </div>
        </section>
    );
};

export default Contact;
