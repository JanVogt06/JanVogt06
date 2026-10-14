import * as THREE from 'three'

const Y = new THREE.Vector3(0, 1, 0)
const twist = new THREE.Quaternion()
const side = new THREE.Vector3()
const ahead = new THREE.Vector3()
const basis = new THREE.Matrix4()

// Unit direction from the planet's centre for a latitude and longitude in
// degrees, with the north pole at +y and longitude 0 along +x.
export function directionAt(lat: number, lon: number, target = new THREE.Vector3()) {
  const phi = THREE.MathUtils.degToRad(lat)
  const lambda = THREE.MathUtils.degToRad(lon)
  return target.set(Math.cos(phi) * Math.cos(lambda), Math.sin(phi), Math.cos(phi) * Math.sin(lambda))
}

// Orientation that stands an object upright at `up` with its local +z
// pointing along `front`, flattened onto the ground there.
export function facing(up: THREE.Vector3, front: THREE.Vector3, target = new THREE.Quaternion()) {
  ahead.copy(front).addScaledVector(up, -front.dot(up))
  if (ahead.lengthSq() < 1e-8) ahead.set(1, 0, 0).addScaledVector(up, -up.x)
  ahead.normalize()
  side.crossVectors(up, ahead)
  return target.setFromRotationMatrix(basis.makeBasis(side, up, ahead))
}

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
