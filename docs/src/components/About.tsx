import {Award, Users, BookOpen, GraduationCap} from "lucide-react"
import refereeImage from "@/assets/images/referee.png"
import aboutPortraitImage from "@/assets/images/about_portrait.png"

const About = () => {
    return (
        <section className="relative bg-gradient-to-b from-white via-gray-50 to-white py-24">

            <div className="mx-auto max-w-7xl px-8">

                {/* Section Header */}
                <div className="mb-16 text-center">
                    <h2 className="mb-4 text-5xl font-bold text-gray-900 lg:text-6xl">
                        Über mich
                    </h2>
                    <p className="mx-auto max-w-2xl text-xl text-gray-600">
                        Student, Entwickler & Schiedsrichter mit Leidenschaft für Technologie
                    </p>
                </div>

                {/* Free-form Layout */}
                <div className="relative grid grid-cols-12 gap-6">

                    {/* Bildung - Oben Links - BREIT */}
                    <div className="col-span-7 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                        <h3 className="mb-6 text-3xl font-bold text-gray-900">Bildung</h3>

                        <div className="relative space-y-8 border-l-2 border-purple-200 pl-8">

                            {/* Current - B.Sc. */}
                            <div className="relative">
                                <div
                                    className="absolute -left-[41px] top-1 h-4 w-4 rounded-full border-4 border-white bg-purple-500 shadow"/>

                                <span
                                    className="mb-2 inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
          seit 10/2024
        </span>
                                <h4 className="mb-1 text-xl font-semibold text-gray-900">B.Sc. Informatik</h4>
                                <p className="text-gray-600">Friedrich-Schiller-Universität Jena</p>
                            </div>

                            {/* Abitur */}
                            <div className="relative">
                                <div
                                    className="absolute -left-[41px] top-1 h-4 w-4 rounded-full border-4 border-white bg-gray-400 shadow"/>

                                <span
                                    className="mb-2 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
          2024
        </span>
                                <h4 className="mb-1 text-xl font-semibold text-gray-900">Abitur</h4>
                                <p className="text-gray-600">Marie-Curie-Gymnasium Bad Berka</p>
                            </div>
                        </div>
                    </div>

                    {/* Portrait - Oben Rechts */}
                    <div
                        className="col-span-5 flex items-center justify-center overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-blue-50 to-purple-50 shadow-sm">
                        <img
                            src={aboutPortraitImage}
                            alt="Jan Vogt"
                            className="h-full w-full object-contain object-bottom, max-h-85"
                        />
                    </div>

                    {/* Referee - Unten Links - SCHMAL */}
                    <div
                        className="col-span-4 flex items-end justify-center overflow-visible rounded-3xl bg-gradient-to-br from-purple-100 to-pink-100 p-6 pb-0"
                        style={{minHeight: '600px'}}>
                        <img
                            src={refereeImage}
                            alt="Jan Vogt als Schiedsrichter"
                            className="h-full w-full object-contain object-bottom"
                        />
                    </div>

                    {/* Engagement + Awards - Unten Rechts - BREIT */}
                    <div className="col-span-8 space-y-6">

                        {/* Engagement */}
                        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                            <h3 className="mb-6 text-3xl font-bold text-gray-900">Engagement</h3>

                            <div className="space-y-4">
                                <div
                                    className="rounded-2xl border border-gray-200 bg-gray-50 p-5 transition-all hover:bg-gray-100">
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-lg bg-purple-100 p-2">
                                            <Users className="h-5 w-5 text-purple-600"/>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">Elite-Kader Thüringen</h4>
                                            <p className="text-sm text-gray-600">Fußball-Schiedsrichter Thüringenliga &
                                                Junioren-Bundesliga</p>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className="rounded-2xl border border-gray-200 bg-gray-50 p-5 transition-all hover:bg-gray-100">
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
                                </div>

                                <div
                                    className="rounded-2xl border border-gray-200 bg-gray-50 p-5 transition-all hover:bg-gray-100">
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-lg bg-blue-100 p-2">
                                            <GraduationCap className="h-5 w-5 text-blue-600"/>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">Jugendvertretung Bad Berka</h4>
                                            <p className="text-sm text-gray-600">Stadtentwicklung & ISEK-Workshops</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Auszeichnungen */}
                        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                            <h3 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900">
                                <Award className="h-5 w-5 text-yellow-500"/>
                                Auszeichnungen
                            </h3>

                            <div className="grid grid-cols-2 gap-2">
                                <div
                                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                    <span className="text-sm font-semibold text-purple-600">2024</span>
                                    <span className="text-xs text-gray-700">DMV-Abiturpreis Mathematik</span>
                                </div>

                                <div
                                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                    <span className="text-sm font-semibold text-purple-600">2024</span>
                                    <span className="text-xs text-gray-700">DPG-Abiturpreis Physik</span>
                                </div>

                                <div
                                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                    <span className="text-sm font-semibold text-purple-600">2024</span>
                                    <span className="text-xs text-gray-700">Pierre-de-Coubertin-Preis</span>
                                </div>

                                <div
                                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                    <span className="text-sm font-semibold text-purple-600">2022</span>
                                    <span className="text-xs text-gray-700">Marie-Curie-Preis</span>
                                </div>

                                <div
                                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                    <span className="text-sm font-semibold text-purple-600">2022</span>
                                    <span className="text-xs text-gray-700">Schiedsrichter des Jahres</span>
                                </div>

                                <div
                                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                    <span className="text-sm font-semibold text-purple-600">2016-24</span>
                                    <span className="text-xs text-gray-700">Olympia-Preise</span>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>

            </div>

        </section>
    );
};

export default About;