import {Award, Users, BookOpen, GraduationCap} from "lucide-react"
import {motion} from "framer-motion"
import {useEffect, useRef, useState} from "react"
import refereeImage from "@/assets/images/referee.png"
import aboutPortraitImage from "@/assets/images/about_portrait.png"

// CSS Animations
const cssAnimations = `
@keyframes slideInFromBottom {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInUp {
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

// Animated Card Component
const AnimatedCard = ({
                          children,
                          className = "",
                          animation = "slideInFromBottom",
                          duration = "0.5s",
                          delay = "0s"
                      }: {
    children: React.ReactNode;
    className?: string;
    animation?: string;
    duration?: string;
    delay?: string;
}) => {
    const {ref, isInView} = useInView<HTMLDivElement>();

    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: 0,
                animation: isInView ? `${animation} ${duration} linear ${delay} forwards` : 'none'
            }}
        >
            {children}
        </div>
    );
};

const About = () => {
    const engagementCardRef = useInView<HTMLDivElement>();
    const awardsCardRef = useInView<HTMLDivElement>();

    return (
        <>
            <style>{cssAnimations}</style>
            <section className="relative bg-linear-to-b from-white via-gray-50 to-white py-16 md:py-24">

                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                    {/* Section Header */}
                    <motion.div
                        className="mb-10 text-center md:mb-16"
                        initial={{opacity: 0, y: 30}}
                        whileInView={{opacity: 1, y: 0}}
                        viewport={{once: true, margin: "-100px"}}
                        transition={{duration: 0.6}}
                    >
                        <h2 className="mb-3 text-4xl font-bold text-gray-900 sm:text-5xl lg:text-6xl">
                            Über mich
                        </h2>
                        <p className="mx-auto max-w-2xl text-lg text-gray-600 sm:text-xl">
                            Student, Entwickler & Schiedsrichter mit Leidenschaft für Technologie
                        </p>
                    </motion.div>

                    {/* Mobile Layout (stacked) */}
                    <div className="space-y-6 lg:hidden">

                        {/* Portrait - Mobile */}
                        <motion.div
                            className="flex items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-linear-to-br from-blue-50 to-purple-50 shadow-sm"
                            initial={{opacity: 0, scale: 0.9}}
                            whileInView={{opacity: 1, scale: 1}}
                            viewport={{once: true, margin: "-50px"}}
                            transition={{duration: 0.6}}
                        >
                            <img
                                src={aboutPortraitImage}
                                alt="Jan Vogt"
                                className="h-64 w-full object-contain object-bottom sm:h-80"
                            />
                        </motion.div>

                        {/* Bildung - Mobile */}
                        <motion.div
                            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                            initial={{opacity: 0, x: -30}}
                            whileInView={{opacity: 1, x: 0}}
                            viewport={{once: true, margin: "-50px"}}
                            transition={{duration: 0.6}}
                        >
                            <h3 className="mb-5 text-2xl font-bold text-gray-900">Bildung</h3>

                            <div className="relative space-y-6 border-l-2 border-purple-200 pl-6">
                                {/* B.Sc. */}
                                <div className="relative">
                                    <div className="absolute -left-8 top-1 h-3 w-3 rounded-full border-4 border-white bg-purple-500 shadow"/>
                                    <span className="mb-1.5 inline-block rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                                        seit 10/2024
                                    </span>
                                    <h4 className="mb-0.5 text-lg font-semibold text-gray-900">B.Sc. Informatik</h4>
                                    <p className="text-sm text-gray-600">Friedrich-Schiller-Universität Jena</p>
                                </div>

                                {/* Abitur */}
                                <div className="relative">
                                    <div className="absolute -left-8 top-1 h-3 w-3 rounded-full border-4 border-white bg-gray-400 shadow"/>
                                    <span className="mb-1.5 inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                                        2024
                                    </span>
                                    <h4 className="mb-0.5 text-lg font-semibold text-gray-900">Abitur</h4>
                                    <p className="text-sm text-gray-600">Marie-Curie-Gymnasium Bad Berka</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Referee Image - Mobile */}
                        <motion.div
                            className="flex items-end justify-center overflow-hidden rounded-2xl bg-linear-to-br from-purple-100 to-pink-100 p-4 pb-0"
                            style={{minHeight: '300px'}}
                            initial={{opacity: 0, y: 30}}
                            whileInView={{opacity: 1, y: 0}}
                            viewport={{once: true, margin: "-50px"}}
                            transition={{duration: 0.6}}
                        >
                            <img
                                src={refereeImage}
                                alt="Jan Vogt als Schiedsrichter"
                                className="h-full max-h-72 w-auto object-contain object-bottom"
                            />
                        </motion.div>

                        {/* Engagement - Mobile */}
                        <div
                            ref={engagementCardRef.ref}
                            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                            style={{
                                opacity: 0,
                                animation: engagementCardRef.isInView ? 'fadeInUp 0.6s linear forwards' : 'none'
                            }}
                        >
                            <h3 className="mb-5 text-2xl font-bold text-gray-900">Engagement</h3>

                            <div className="space-y-3">
                                {[
                                    {icon: Users, color: "bg-purple-100 text-purple-600", title: "Elite-Kader Thüringen", desc: "Fußball-Schiedsrichter Thüringenliga & Junioren-Bundesliga"},
                                    {icon: BookOpen, color: "bg-pink-100 text-pink-600", title: "Redaktionsmitglied", desc: "\"Die Wurzel\" - Zeitschrift für Mathematik"},
                                    {icon: GraduationCap, color: "bg-blue-100 text-blue-600", title: "Jugendvertretung Bad Berka", desc: "Stadtentwicklung & ISEK-Workshops"},
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                                        <div className={`rounded-lg p-2 ${item.color}`}>
                                            <item.icon className="h-4 w-4"/>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{item.title}</h4>
                                            <p className="text-sm text-gray-600">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Awards - Mobile */}
                        <div
                            ref={awardsCardRef.ref}
                            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                            style={{
                                opacity: 0,
                                animation: awardsCardRef.isInView ? 'fadeInUp 0.5s linear forwards' : 'none'
                            }}
                        >
                            <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
                                <Award className="h-5 w-5 text-yellow-500"/>
                                Auszeichnungen
                            </h3>

                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {[
                                    {year: "2024", text: "DMV-Abiturpreis Mathematik"},
                                    {year: "2024", text: "DPG-Abiturpreis Physik"},
                                    {year: "2024", text: "Pierre-de-Coubertin-Preis"},
                                    {year: "2022", text: "Marie-Curie-Preis"},
                                    {year: "2022", text: "Schiedsrichter des Jahres"},
                                    {year: "2016-24", text: "Olympia-Preise"},
                                ].map((award, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                                    >
                                        <span className="text-sm font-semibold text-purple-600">{award.year}</span>
                                        <span className="text-xs text-gray-700">{award.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Desktop Layout (12-column grid) */}
                    <div className="relative hidden grid-cols-12 gap-6 lg:grid">

                        {/* Bildung */}
                        <motion.div
                            className="col-span-7 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm"
                            initial={{opacity: 0, x: -50}}
                            whileInView={{opacity: 1, x: 0}}
                            viewport={{once: true, margin: "-100px"}}
                            transition={{duration: 0.6, delay: 0.1}}
                        >
                            <h3 className="mb-6 text-3xl font-bold text-gray-900">Bildung</h3>

                            <div className="relative space-y-8 border-l-2 border-purple-200 pl-8">

                                {/* Current - B.Sc. */}
                                <motion.div
                                    className="relative"
                                    initial={{opacity: 0, y: 20}}
                                    whileInView={{opacity: 1, y: 0}}
                                    viewport={{once: true}}
                                    transition={{duration: 0.5, delay: 0.3}}
                                >
                                    <div
                                        className="absolute -left-10.25 top-1 h-4 w-4 rounded-full border-4 border-white bg-purple-500 shadow"/>

                                    <span
                                        className="mb-2 inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                                        seit 10/2024
                                    </span>
                                    <h4 className="mb-1 text-xl font-semibold text-gray-900">B.Sc. Informatik</h4>
                                    <p className="text-gray-600">Friedrich-Schiller-Universität Jena</p>
                                </motion.div>

                                {/* Abitur */}
                                <motion.div
                                    className="relative"
                                    initial={{opacity: 0, y: 20}}
                                    whileInView={{opacity: 1, y: 0}}
                                    viewport={{once: true}}
                                    transition={{duration: 0.5, delay: 0.4}}
                                >
                                    <div
                                        className="absolute -left-10.25 top-1 h-4 w-4 rounded-full border-4 border-white bg-gray-400 shadow"/>

                                    <span
                                        className="mb-2 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                        2024
                                    </span>
                                    <h4 className="mb-1 text-xl font-semibold text-gray-900">Abitur</h4>
                                    <p className="text-gray-600">Marie-Curie-Gymnasium Bad Berka</p>
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Portrait */}
                        <motion.div
                            className="col-span-5 flex items-center justify-center overflow-hidden rounded-3xl border border-gray-200 bg-linear-to-br from-blue-50 to-purple-50 shadow-sm"
                            initial={{opacity: 0, scale: 0.9}}
                            whileInView={{opacity: 1, scale: 1}}
                            viewport={{once: true, margin: "-100px"}}
                            transition={{duration: 0.6, delay: 0.2}}
                        >
                            <img
                                src={aboutPortraitImage}
                                alt="Jan Vogt"
                                className="h-full w-full max-h-85 object-contain object-bottom"
                            />
                        </motion.div>

                        {/* Referee */}
                        <motion.div
                            className="col-span-4 flex items-end justify-center overflow-visible rounded-3xl bg-linear-to-br from-purple-100 to-pink-100 p-6 pb-0"
                            style={{minHeight: '600px'}}
                            initial={{opacity: 0, x: -50}}
                            whileInView={{opacity: 1, x: 0}}
                            viewport={{once: true, margin: "-100px"}}
                            transition={{duration: 0.6, delay: 0.3}}
                        >
                            <img
                                src={refereeImage}
                                alt="Jan Vogt als Schiedsrichter"
                                className="h-full w-full object-contain object-bottom"
                            />
                        </motion.div>

                        {/* Engagement + Awards */}
                        <div className="col-span-8 space-y-6">

                            {/* Engagement Card */}
                            <AnimatedCard
                                className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm"
                                animation="slideInFromRight"
                                duration="0.6s"
                            >
                                <h3 className="mb-6 text-3xl font-bold text-gray-900">Engagement</h3>

                                <div className="space-y-4">
                                    {/* Elite-Kader */}
                                    <AnimatedCard
                                        className="rounded-2xl border border-gray-200 bg-gray-50 p-5 transition-[transform,background-color,box-shadow] duration-200 hover:translate-x-1 hover:bg-gray-100 hover:shadow-md"
                                        animation="slideInFromBottom"
                                        duration="0.5s"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="rounded-lg bg-purple-100 p-2">
                                                <Users className="h-5 w-5 text-purple-600"/>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900">Elite-Kader Thüringen</h4>
                                                <p className="text-sm text-gray-600">Fußball-Schiedsrichter
                                                    Thüringenliga & Junioren-Bundesliga</p>
                                            </div>
                                        </div>
                                    </AnimatedCard>

                                    {/* Redaktionsmitglied */}
                                    <AnimatedCard
                                        className="rounded-2xl border border-gray-200 bg-gray-50 p-5 transition-[transform,background-color,box-shadow] duration-200 hover:translate-x-1 hover:bg-gray-100 hover:shadow-md"
                                        animation="slideInFromBottom"
                                        duration="0.5s"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="rounded-lg bg-pink-100 p-2">
                                                <BookOpen className="h-5 w-5 text-pink-600"/>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900">Redaktionsmitglied</h4>
                                                <p className="text-sm text-gray-600">"Die Wurzel" - Zeitschrift für
                                                    Mathematik</p>
                                            </div>
                                        </div>
                                    </AnimatedCard>

                                    {/* Jugendvertretung */}
                                    <AnimatedCard
                                        className="rounded-2xl border border-gray-200 bg-gray-50 p-5 transition-[transform,background-color,box-shadow] duration-200 hover:translate-x-1 hover:bg-gray-100 hover:shadow-md"
                                        animation="slideInFromBottom"
                                        duration="0.5s"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="rounded-lg bg-blue-100 p-2">
                                                <GraduationCap className="h-5 w-5 text-blue-600"/>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900">Jugendvertretung Bad
                                                    Berka</h4>
                                                <p className="text-sm text-gray-600">Stadtentwicklung &
                                                    ISEK-Workshops</p>
                                            </div>
                                        </div>
                                    </AnimatedCard>
                                </div>
                            </AnimatedCard>

                            {/* Auszeichnungen Card */}
                            <AnimatedCard
                                className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm"
                                animation="fadeInUp"
                                duration="0.5s"
                            >
                                <h3 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900">
                                    <Award className="h-5 w-5 text-yellow-500"/>
                                    Auszeichnungen
                                </h3>

                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        {year: "2024", text: "DMV-Abiturpreis Mathematik"},
                                        {year: "2024", text: "DPG-Abiturpreis Physik"},
                                        {year: "2024", text: "Pierre-de-Coubertin-Preis"},
                                        {year: "2022", text: "Marie-Curie-Preis"},
                                        {year: "2022", text: "Schiedsrichter des Jahres"},
                                        {year: "2016-24", text: "Olympia-Preise"},
                                    ].map((award, i) => (
                                        <AnimatedCard
                                            key={i}
                                            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 transition-[transform,background-color,box-shadow] duration-200 hover:scale-105 hover:bg-gray-100 hover:shadow-md"
                                            animation="slideInFromBottom"
                                            duration="0.4s"
                                        >
                                            <span className="text-sm font-semibold text-purple-600">{award.year}</span>
                                            <span className="text-xs text-gray-700">{award.text}</span>
                                        </AnimatedCard>
                                    ))}
                                </div>
                            </AnimatedCard>

                        </div>

                    </div>

                </div>

            </section>
        </>
    );
};

export default About;