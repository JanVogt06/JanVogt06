import * as THREE from 'three'

const Y = new THREE.Vector3(0, 1, 0)
const twist = new THREE.Quaternion()

// Orientation that stands an object upright at `up` on the planet, turned by
// `yaw` around the local vertical.
export function uprightAt(up: THREE.Vector3, yaw = 0, target = new THREE.Quaternion()) {
  target.setFromUnitVectors(Y, up)
  twist.setFromAxisAngle(Y, yaw)
  return target.multiply(twist)
}

// Small seeded generator so the scattered props land in the same places on
// every load.
export function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
