import {Mail, Github, Instagram, MapPin, Send} from "lucide-react"
import {motion} from "framer-motion"
import {useEffect, useRef, useState} from "react"

// CSS Animations
const cssAnimations = `
@keyframes slideInFromBottom {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

// Hook for intersection observer
const useInView = <T extends HTMLElement = HTMLElement>(options = {}) => {
    const ref = useRef<T>(null);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsInView(true);
                observer.disconnect();
            }
        }, {threshold: 0.1, ...options});

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    return {ref, isInView};
};

// Contact methods data
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

// Contact Method Card Component
const ContactMethod = ({method, index}: {method: typeof contactMethods[0], index: number}) => {
    const {ref, isInView} = useInView<HTMLAnchorElement>();
    const Icon = method.icon;

    return (
        <a
            ref={ref}
            href={method.href}
            target={method.external ? "_blank" : undefined}
            rel={method.external ? "noopener noreferrer" : undefined}
            className="group flex items-center gap-4 rounded-2xl border border-purple-500/20 bg-purple-950/30 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/40 hover:bg-purple-900/40 hover:shadow-lg hover:shadow-purple-500/10"
            style={{
                opacity: 0,
                animation: isInView ? `slideInFromBottom 0.5s linear ${index * 0.1}s forwards` : 'none'
            }}
        >
            <div className={`rounded-xl bg-linear-to-br ${method.gradient} p-3 shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                <Icon className="h-5 w-5 text-white"/>
            </div>
            <div>
                <h3 className="font-semibold text-white">{method.title}</h3>
                <p className="text-sm text-gray-400 transition-colors group-hover:text-gray-300">{method.value}</p>
            </div>
        </a>
    );
};

const Contact = () => {
    const ctaRef = useInView<HTMLDivElement>();

    return (
        <>
            <style>{cssAnimations}</style>
            <section className="relative overflow-hidden bg-linear-to-br from-[#1a0b2e] via-[#2d1b4e] to-[#1a0b2e] py-24">

                {/* Background Blobs */}
                <div className="absolute -left-40 top-20 h-96 w-96 animate-pulse rounded-full bg-purple-600/20 blur-3xl"/>
                <div className="absolute -right-40 bottom-20 h-96 w-96 animate-pulse rounded-full bg-pink-600/20 blur-3xl" style={{animationDelay: '1s'}}/>

                <div className="relative mx-auto max-w-4xl px-8">

                    {/* Section Header */}
                    <motion.div
                        className="mb-12 text-center"
                        initial={{opacity: 0, y: 30}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true, margin: "-100px"}}
                        transition={{duration: 0.6}}
                    >
                        <h2 className="mb-4 text-5xl font-bold text-white lg:text-6xl">
                            Kontakt
                        </h2>
                        <p className="mx-auto max-w-xl text-xl text-gray-300">
                            Interessiert an einer Zusammenarbeit oder einfach nur ein Gespräch über Technologie?
                        </p>
                    </motion.div>

                    {/* Contact Card */}
                    <div className="rounded-3xl border border-purple-500/20 bg-purple-950/20 p-8 backdrop-blur-sm">

                        {/* Contact Methods Grid */}
                        <div className="mb-8 grid gap-4 sm:grid-cols-2">
                            {contactMethods.map((method, index) => (
                                <ContactMethod key={method.title} method={method} index={index}/>
                            ))}
                        </div>

                        {/* CTA Button */}
                        <div
                            ref={ctaRef.ref}
                            className="text-center"
                            style={{
                                opacity: 0,
                                animation: ctaRef.isInView ? 'slideInFromBottom 0.5s linear 0.5s forwards' : 'none'
                            }}
                        >
                            <a
                                href="mailto:jan@jan-vogt.dev"
                                className="group inline-flex items-center gap-3 rounded-full bg-linear-to-r from-pink-500 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:from-pink-600 hover:to-purple-700 hover:shadow-[0_0_30px_rgba(236,72,153,0.5)]"
                            >
                                <Send className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"/>
                                Nachricht senden
                            </a>
                        </div>

                    </div>

                </div>

            </section>
        </>
    );
};

export default Contact;