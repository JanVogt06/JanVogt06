import {SHOT, STOP_SCREENS, TOTAL_SCREENS} from "@/lib/journey"

const ANCHORS: Record<number, string> = {
    [SHOT.hero]: "top",
    [SHOT.photos[0]]: "about",
    [SHOT.projects[0]]: "projects",
    [SHOT.contact]: "contact",
}

/**
 * What the reader scrolls when the scene is up: an empty column as tall as
 * the camera move, with a resting point for every shot. Touch screens snap to
 * them, and the navigation lands on them.
 */
const Track = () => (
    <div aria-hidden="true" className="relative" style={{height: `calc(${TOTAL_SCREENS} * 100svh)`}}>
        {STOP_SCREENS.map((screens, shot) => (
            <span
                key={shot}
                id={ANCHORS[shot]}
                className="snap-stop pointer-events-none absolute inset-x-0 h-px"
                style={{top: `calc(${screens} * 100svh)`}}
            />
        ))}
    </div>
)

export default Track
