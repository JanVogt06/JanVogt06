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

export const createGem = ({
    sides,
    tableRadius,
    crownHeight,
    pavilionDepth,
    girdleHeight,
}: GemCut) => {
    const step = (Math.PI * 2) / sides
    const half = girdleHeight / 2

    const ring = (count: number, radius: number, y: number, offset: number) =>
        Array.from({length: count}, (_, i) => {
            const angle = (i + offset) * step
            return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius)
        })

    const table = ring(sides, tableRadius, half + crownHeight, 0.5)
    const upper = ring(sides, 1, half, 0)
    const lower = ring(sides, 1, -half, 0)
    const mid = ring(sides, 0.52, -half - pavilionDepth * 0.52, 0.5)

    const apex = new THREE.Vector3(0, -half - pavilionDepth, 0)
    const centre = new THREE.Vector3(0, half + crownHeight, 0)
    const positions: number[] = []

    for (let i = 0; i < sides; i++) {
        const next = (i + 1) % sides

        push(positions, centre, table[i], table[next])
        push(positions, table[i], upper[i], upper[next])
        push(positions, table[i], upper[next], table[next])
        push(positions, upper[i], lower[i], lower[next])
        push(positions, upper[i], lower[next], upper[next])
        push(positions, lower[i], mid[i], lower[next])
        push(positions, lower[next], mid[i], mid[next])
        push(positions, mid[i], apex, mid[next])
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
    geometry.computeVertexNormals()
    return geometry
}
