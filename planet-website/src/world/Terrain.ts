import * as THREE from 'three'
import { simplex } from './noise'

// A patch of ground kept level: flat within `reach` of `direction`, along
// the surface, easing into the hills over the next few units.
export interface Flat {
  direction: THREE.Vector3
  reach: number
}

// A path along the great circle between two points on the planet.
export interface Path {
  from: THREE.Vector3
  to: THREE.Vector3
  // Normal of the great circle's plane.
  normal: THREE.Vector3
}

const HILL = 1.5
const EASE = 6

const q = new THREE.Vector3()
const turn = new THREE.Vector3()

export function path(from: THREE.Vector3, to: THREE.Vector3): Path {
  return { from: from.clone().normalize(), to: to.clone().normalize(), normal: new THREE.Vector3().crossVectors(from, to).normalize() }
}

// Angle from `p` to the arc of `route`: straight across to the arc if the
// foot of the perpendicular lands on it, else to the nearer end.
function angleToArc(p: THREE.Vector3, route: Path) {
  const s = p.dot(route.normal)
  q.copy(p).addScaledVector(route.normal, -s).normalize()
  const inside =
    turn.crossVectors(route.from, q).dot(route.normal) >= 0 && turn.crossVectors(q, route.to).dot(route.normal) >= 0
  if (inside) return Math.asin(Math.min(1, Math.abs(s)))
  return Math.min(p.angleTo(route.from), p.angleTo(route.to))
}

// The shape of the ground: gentle hills, levelled where the stations stand
// and calmer along the paths that link them.
export class Terrain {
  private noise = simplex(11)

  constructor(
    readonly radius: number,
    readonly flats: Flat[],
    readonly paths: Path[],
  ) {}

  // Height above the base sphere for a unit direction.
  heightAt(direction: THREE.Vector3) {
    const { x, y, z } = direction
    let height = HILL * (0.75 * this.noise(x * 3.4, y * 3.4, z * 3.4) + 0.25 * this.noise(x * 8.1 + 5, y * 8.1, z * 8.1))
    height *= THREE.MathUtils.lerp(0.35, 1, THREE.MathUtils.smoothstep(this.pathDistance(direction), 1.5, 5))
    for (const flat of this.flats) {
      const distance = direction.angleTo(flat.direction) * this.radius
      height *= THREE.MathUtils.smoothstep(distance, flat.reach, flat.reach + EASE)
    }
    return height
  }

  // Distance along the surface to the nearest path.
  pathDistance(direction: THREE.Vector3) {
    let nearest = Infinity
    for (const route of this.paths) nearest = Math.min(nearest, angleToArc(direction, route))
    return nearest * this.radius
  }
}
