// 3D simplex noise after Stefan Gustavson, returning values in about [-1, 1].
// Seeded so the planet's hills are the same on every load.

const GRAD = [
  [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
  [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
]

export function simplex(seed: number) {
  const perm = new Uint8Array(512)
  const p = Array.from({ length: 256 }, (_, i) => i)
  let s = seed
  for (let i = 255; i > 0; i--) {
    s = (s * 16807) % 2147483647
    const j = s % (i + 1)
    ;[p[i], p[j]] = [p[j], p[i]]
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255]

  const F3 = 1 / 3
  const G3 = 1 / 6

  return (x: number, y: number, z: number) => {
    const t = (x + y + z) * F3
    const i = Math.floor(x + t)
    const j = Math.floor(y + t)
    const k = Math.floor(z + t)
    const u = (i + j + k) * G3
    const x0 = x - (i - u)
    const y0 = y - (j - u)
    const z0 = z - (k - u)

    let i1, j1, k1, i2, j2, k2
    if (x0 >= y0) {
      if (y0 >= z0) [i1, j1, k1, i2, j2, k2] = [1, 0, 0, 1, 1, 0]
      else if (x0 >= z0) [i1, j1, k1, i2, j2, k2] = [1, 0, 0, 1, 0, 1]
      else [i1, j1, k1, i2, j2, k2] = [0, 0, 1, 1, 0, 1]
    } else if (y0 < z0) [i1, j1, k1, i2, j2, k2] = [0, 0, 1, 0, 1, 1]
    else if (x0 < z0) [i1, j1, k1, i2, j2, k2] = [0, 1, 0, 0, 1, 1]
    else [i1, j1, k1, i2, j2, k2] = [0, 1, 0, 1, 1, 0]

    const corners = [
      [x0, y0, z0, 0, 0, 0],
      [x0 - i1 + G3, y0 - j1 + G3, z0 - k1 + G3, i1, j1, k1],
      [x0 - i2 + 2 * G3, y0 - j2 + 2 * G3, z0 - k2 + 2 * G3, i2, j2, k2],
      [x0 - 1 + 3 * G3, y0 - 1 + 3 * G3, z0 - 1 + 3 * G3, 1, 1, 1],
    ]
    const ii = i & 255
    const jj = j & 255
    const kk = k & 255
    let total = 0
    for (const [cx, cy, cz, di, dj, dk] of corners) {
      let falloff = 0.6 - cx * cx - cy * cy - cz * cz
      if (falloff <= 0) continue
      const g = GRAD[perm[ii + di + perm[jj + dj + perm[kk + dk]]] % 12]
      falloff *= falloff
      total += falloff * falloff * (g[0] * cx + g[1] * cy + g[2] * cz)
    }
    return 32 * total
  }
}
