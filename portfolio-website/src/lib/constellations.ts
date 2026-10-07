/**
 * The tools I work with, drawn as constellations in the night sky over the
 * last shot. Each star sits at a point in the frame of that shot, in device
 * coordinates, one layout for a wide screen and one for a tall one; the
 * scene turns them into directions in the sky.
 */
export type Star = {name: string; wide: [number, number]; tall: [number, number]}

export type Constellation = {name: string; stars: Star[]; lines: Array<[number, number]>}

export const constellations: Constellation[] = [
    {
        name: "Sprachen",
        stars: [
            {name: "C", wide: [-0.86, 0.4], tall: [-0.84, 0.6]},
            {name: "C++", wide: [-0.76, 0.56], tall: [-0.68, 0.72]},
            {name: "C#", wide: [-0.65, 0.43], tall: [-0.52, 0.6]},
            {name: "Java", wide: [-0.55, 0.6], tall: [-0.36, 0.72]},
            {name: "Python", wide: [-0.43, 0.46], tall: [-0.2, 0.6]},
            {name: "JavaScript", wide: [-0.32, 0.62], tall: [-0.04, 0.72]},
            {name: "TypeScript", wide: [-0.2, 0.5], tall: [0.14, 0.62]},
        ],
        lines: [
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 4],
            [4, 5],
            [5, 6],
        ],
    },
    {
        name: "Frameworks",
        stars: [
            {name: "Unity", wide: [0.04, 0.72], tall: [-0.56, 0.42]},
            {name: "React", wide: [0.17, 0.6], tall: [-0.32, 0.32]},
            {name: "FastAPI", wide: [0.06, 0.46], tall: [-0.52, 0.18]},
            {name: "Django", wide: [-0.07, 0.58], tall: [-0.78, 0.3]},
        ],
        lines: [
            [0, 1],
            [1, 2],
            [2, 3],
            [3, 0],
        ],
    },
    {
        name: "Werkzeuge",
        stars: [
            {name: "OpenGL", wide: [0.64, 0.42], tall: [0.12, 0.3]},
            {name: "Git", wide: [0.78, 0.5], tall: [0.44, 0.24]},
            {name: "Docker", wide: [0.74, 0.32], tall: [0.2, 0.12]},
        ],
        lines: [
            [0, 1],
            [1, 2],
            [2, 0],
        ],
    },
]

export type SkyMark = {x: number; y: number}

type Listener = (marks: SkyMark[], amount: number) => void

let listener: Listener | null = null

/** Where each star of every constellation lies on screen, in CSS pixels,
 *  handed over by the scene every frame the sky is dark enough to show them. */
export const sky = {
    listen: (next: Listener | null) => {
        listener = next
    },
    emit: (marks: SkyMark[], amount: number) => listener?.(marks, amount),
    listening: () => listener !== null,
}
