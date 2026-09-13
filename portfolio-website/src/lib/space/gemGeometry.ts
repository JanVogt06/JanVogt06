import * as THREE from "three"

export type GemCut = {
    sides: number
    tableRadius: number
    crownHeight: number
    pavilionDepth: number
    girdleHeight: number
}

const push = (target: number[], ...points: THREE.Vector3[]) => {
    for (const point of points) target.push(point.x, point.y, point.z)
}

const jitter = (n: number) => {
    const x = Math.sin(n * 91.7) * 21237.19
    return 1 + (x - Math.floor(x) - 0.5) * 0.05
}

export const createGem = ({
    sides,
    tableRadius,
    crownHeight,
    pavilionDepth,
    girdleHeight,
}: GemCut) => {
    const step = (Math.PI * 2) / sides
    const half = girdleHeight / 2
    const crownTop = half + crownHeight

    const ring = (radius: number, y: number, offset: number, seed: number) =>
        Array.from({length: sides}, (_, i) => {
            const angle = (i + offset) * step
            const r = radius * jitter(seed + i)
            return new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r)
        })

    const table = ring(tableRadius, crownTop, 0.5, 1)
    const star = ring(tableRadius * 1.45, crownTop - crownHeight * 0.42, 0, 2)
    const crown = ring(0.93, half + crownHeight * 0.16, 0.5, 3)
    const upper = ring(1, half, 0, 4)
    const lower = ring(1, -half, 0, 4)
    const pavilion = ring(0.88, -half - pavilionDepth * 0.24, 0.5, 5)
    const belly = ring(0.5, -half - pavilionDepth * 0.62, 0, 6)

    const apex = new THREE.Vector3(0, -half - pavilionDepth, 0)
    const centre = new THREE.Vector3(0, crownTop, 0)
    const positions: number[] = []

    for (let i = 0; i < sides; i++) {
        const next = (i + 1) % sides

        // A band whose upper ring sits half a step ahead of its lower ring.
        const over = (a: THREE.Vector3[], b: THREE.Vector3[]) => {
            push(positions, a[i], b[i], b[next])
            push(positions, a[i], b[next], a[next])
        }

        // The same band the other way round, when the lower ring leads.
        const under = (a: THREE.Vector3[], b: THREE.Vector3[]) => {
            push(positions, a[i], b[i], a[next])
            push(positions, a[next], b[i], b[next])
        }

        push(positions, centre, table[i], table[next])

        over(table, star)
        under(star, crown)
        over(crown, upper)
        over(upper, lower)
        under(lower, pavilion)
        over(pavilion, belly)

        push(positions, belly[i], apex, belly[next])
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
    geometry.computeVertexNormals()
    return geometry
}
