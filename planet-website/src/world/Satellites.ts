import * as THREE from 'three'

// Altitude above the ground, tilt of the orbit, the longitude where it
// crosses the equator northwards (both in degrees), and angular speed.
const ORBITS = [
  { altitude: 13, inclination: 28, node: 0, speed: 0.13, phase: 0.4 },
  { altitude: 17, inclination: 72, node: 70, speed: 0.1, phase: 2.2 },
  { altitude: 11, inclination: -45, node: 150, speed: 0.16, phase: 4.1 },
  { altitude: 22, inclination: 12, node: 230, speed: 0.07, phase: 5.3 },
]

const toward = new THREE.Vector3()
const along = new THREE.Vector3()
const side = new THREE.Vector3()
const basis = new THREE.Matrix4()

interface Orbit {
  object: THREE.Object3D
  // Two perpendicular unit vectors spanning the orbit's plane.
  u: THREE.Vector3
  v: THREE.Vector3
  distance: number
  speed: number
  angle: number
}

// Toy satellites circling the planet, dish down and wings across the
// direction of flight.
export class Satellites {
  readonly objects: THREE.Object3D[] = []
  private orbits: Orbit[] = []

  constructor(scene: THREE.Scene, model: THREE.Object3D, radius: number) {
    for (const orbit of ORBITS) {
      const tilt = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(THREE.MathUtils.degToRad(orbit.inclination), THREE.MathUtils.degToRad(orbit.node), 0, 'YXZ'),
      )
      const object = model.clone(true)
      scene.add(object)
      this.objects.push(object)
      this.orbits.push({
        object,
        u: new THREE.Vector3(1, 0, 0).applyQuaternion(tilt),
        v: new THREE.Vector3(0, 0, -1).applyQuaternion(tilt),
        distance: radius + orbit.altitude,
        speed: orbit.speed,
        angle: orbit.phase,
      })
    }
    this.update(0)
  }

  update(delta: number) {
    for (const orbit of this.orbits) {
      orbit.angle += orbit.speed * delta
      const { object, u, v } = orbit
      const c = Math.cos(orbit.angle)
      const s = Math.sin(orbit.angle)
      object.position.copy(u).multiplyScalar(c).addScaledVector(v, s).multiplyScalar(orbit.distance)

      toward.copy(object.position).normalize().negate()
      along.copy(u).multiplyScalar(-s).addScaledVector(v, c)
      side.crossVectors(toward, along)
      object.quaternion.setFromRotationMatrix(basis.makeBasis(side, toward, along))
    }
  }
}
