/**
 * Invisible resting points inside a pinned track, one per station. On touch
 * screens the page snaps to them, so a swipe always settles with a station's
 * text fully in frame instead of mid-dissolve. The navigation lands on them
 * too.
 *
 * `at` is the track's pin progress for each stop (0 = pinned at the top,
 * 1 = released) and `travel` is how many screens that progress spans.
 * `entry` marks the stop the navigation should use for the whole chapter.
 */
const Stops = ({at, travel, entry}: {at: number[]; travel: number; entry?: number}) => (
    <>
        {at.map((progress, i) => (
            <span
                key={progress}
                aria-hidden="true"
                data-entry={i === entry ? "" : undefined}
                className="snap-stop pointer-events-none absolute inset-x-0 h-px"
                style={{top: `calc(${progress * travel} * 100svh)`}}
            />
        ))}
    </>
)

/**
 * Where a chapter begins for the top bar: the chapter turns active once this
 * marker passes the middle of the viewport. `at` is in screens from the top
 * of the element it sits in.
 */
export const ChapterCue = ({chapter, at = 0}: {chapter: string; at?: number}) => (
    <span
        aria-hidden="true"
        data-chapter={chapter}
        className="pointer-events-none absolute inset-x-0 h-px"
        style={{top: `calc(${at} * 100svh)`}}
    />
)

export default Stops
