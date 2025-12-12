import { Button } from "@/components/ui/button"

const Hero = () => {
    return (
        <section className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-purple-950 via-purple-900 to-pink-900">

            {/* Background Image Container */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/50 to-purple-950" />
                {/* Hier kommt dein Bild */}
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 flex min-h-screen items-center px-8 lg:px-16">
                <div className="max-w-7xl">

                    {/* Main Heading */}
                    <h1 className="mb-6 text-8xl font-bold leading-none tracking-tight text-white lg:text-9xl">
                        Jan<br/>Vogt
                    </h1>

                    {/* Subtitle */}
                    <p className="mb-8 text-2xl font-light text-cyan-300 lg:text-3xl">
                        Informatikstudent & Developer
                    </p>

                    {/* CTA Button */}
                    <Button
                        size="lg"
                        className="rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-8 py-6 text-lg font-semibold hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/50 transition-all"
                    >
                        Let's Connect
                    </Button>

                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
                <div className="flex flex-col items-center gap-2">
                    <span className="text-sm font-light text-white/60">Scroll</span>
                    <div className="h-12 w-6 rounded-full border-2 border-white/40">
                        <div className="mx-auto mt-2 h-2 w-2 animate-bounce rounded-full bg-white/60" />
                    </div>
                </div>
            </div>

        </section>
    );
};

export default Hero;