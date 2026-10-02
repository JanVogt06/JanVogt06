import {useId, useRef} from "react"
import {X} from "lucide-react"
import Shot from "./Shot"
import Rise from "./type/Rise"
import Cta from "./ui/Cta"
import {stations} from "@/lib/about"
import type {Entry, Station} from "@/lib/about"
import {SHOT} from "@/lib/journey"
import useDialog from "@/lib/useDialog"

const total = stations.length

export const Eyebrow = ({index, label, count}: {index: string; label: string; count?: string}) => (
    <p className="label flex items-baseline gap-3 text-fg-2">
        <span className="text-fg">{index}</span>
        <span>{label}</span>
        {count && (
            <>
                <span aria-hidden="true" className="h-px w-6 translate-y-[-0.25em] bg-fg/30"/>
                <span className="tabular-nums">{count}</span>
            </>
        )}
    </p>
)

const Row = ({entry, order, dense}: {entry: Entry; order: number; dense: boolean}) => (
    <li className={`border-b border-hair ${dense ? "py-2.5 short:py-2" : "py-3.5 short:py-2.5"}`}>
        <Rise
            mode="fade"
            delay={160 + order * 60}
            as="div"
            className={dense ? "flex flex-col gap-1" : "flex items-baseline gap-4"}
        >
            {entry.when && (
                <span className={`shrink-0 font-mono text-data tabular-nums text-fg-3 ${dense ? "" : "w-[5.5rem]"}`}>
                    {entry.when}
                </span>
            )}
            <span className="min-w-0">
                <span className="block text-body text-fg">{entry.what}</span>
                {entry.where && <span className="mt-0.5 block text-sub text-fg-2">{entry.where}</span>}
            </span>
        </Rise>
    </li>
)

const StationCopy = ({station, index, onOpen}: {station: Station; index: number; onOpen?: () => void}) => {
    const dense = station.entries.length > 4
    return (
        <div className="mt-auto w-full max-w-[32rem]">
            <Eyebrow index="01" label="Über mich" count={`${index + 1} / ${total}`}/>

            <h2 className="mt-4 text-heading font-medium text-fg">
                <Rise delay={60}>{station.title}</Rise>
            </h2>

            <ul className={`mt-6 border-t border-hair short:mt-4 ${dense ? "sm:grid sm:grid-cols-2 sm:gap-x-8 sm:border-t-0" : ""}`}>
                {station.entries.map((entry, i) => (
                    <Row key={entry.what} entry={entry} order={i} dense={dense}/>
                ))}
            </ul>

            {onOpen && (
                <Rise mode="fade" delay={420} as="div" className="mt-5 short:mt-3">
                    <Cta onClick={onOpen}>Foto ansehen</Cta>
                </Rise>
            )}
        </div>
    )
}

export const PhotoView = ({station, onClose}: {station: Station; onClose: () => void}) => {
    const rootRef = useRef<HTMLDivElement>(null)
    const closeRef = useRef<HTMLButtonElement>(null)
    const titleId = useId()

    useDialog(rootRef, onClose, closeRef)

    return (
        <div
            ref={rootRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="animate-hud fixed inset-0 z-[60] bg-page/95 backdrop-blur-sm"
        >
            <button aria-hidden="true" tabIndex={-1} onClick={onClose} className="absolute inset-0 cursor-default"/>

            <div className="pointer-events-none relative mx-auto flex h-full w-full max-w-[72rem] flex-col px-[var(--gutter)] pb-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))] pt-[env(safe-area-inset-top)]">
                <div className="pointer-events-auto flex h-16 shrink-0 items-center justify-between gap-6">
                    <p id={titleId} className="label text-fg-2">{station.title}</p>
                    <button
                        ref={closeRef}
                        onClick={onClose}
                        aria-label="Foto schließen"
                        className="label -mr-3 flex h-11 items-center gap-2.5 px-3 text-fg transition-opacity duration-200 hover:opacity-70"
                    >
                        <span className="hidden sm:inline">Schließen</span>
                        <X className="h-4 w-4"/>
                    </button>
                </div>

                <figure className="flex min-h-0 flex-1 items-center justify-center pb-6">
                    <img
                        src={station.image}
                        alt={station.alt}
                        className="pointer-events-auto max-h-full min-h-0 max-w-full object-contain"
                    />
                </figure>
            </div>
        </div>
    )
}

const About = ({flow, onOpen}: {flow: boolean; onOpen: (index: number) => void}) => (
    <>
        {stations.map((station, i) => (
            <Shot
                key={station.id}
                at={SHOT.photos[i]}
                flow={flow}
                media={<img src={station.image} alt={station.alt} loading="lazy" className="w-full object-cover"/>}
            >
                <StationCopy station={station} index={i} onOpen={flow ? undefined : () => onOpen(i)}/>
            </Shot>
        ))}
    </>
)

export default About
