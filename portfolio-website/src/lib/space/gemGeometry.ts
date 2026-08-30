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

    const table: THREE.Vector3[] = []
    const upper: THREE.Vector3[] = []
    const lower: THREE.Vector3[] = []

    for (let i = 0; i < sides; i++) {
        const angle = i * step
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        table.push(new THREE.Vector3(cos * tableRadius, half + crownHeight, sin * tableRadius))
        upper.push(new THREE.Vector3(cos, half, sin))
        lower.push(new THREE.Vector3(cos, -half, sin))
    }

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
        push(positions, lower[i], apex, lower[next])
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
    geometry.computeVertexNormals()
    return geometry
}
