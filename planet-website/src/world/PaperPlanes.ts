import * as THREE from 'three'
import { random } from './surface'

const COUNT = 6

interface Flight {
  object: THREE.Object3D
  // Two unit vectors spanning the great circle it glides round.
  u: THREE.Vector3
  v: THREE.Vector3
  height: number
  speed: number
  angle: number
  sway: number
}

const forward = new THREE.Vector3()
const up = new THREE.Vector3()
const side = new THREE.Vector3()
const basis = new THREE.Matrix4()

// Paper planes gliding round the planet a few metres up, each on its own
// circle, rising and dipping and rocking their wings as they go.
export class PaperPlanes {
  private flights: Flight[] = []

  constructor(scene: THREE.Scene, model: THREE.Object3D, private radius: number) {
    const template = model.getObjectByName('PaperPlane')
    if (!template) throw new Error('The critters model has no PaperPlane')
    template.position.set(0, 0, 0)
    template.scale.setScalar(1.3)
    const rng = random(53)
    for (let i = 0; i < COUNT; i++) {
      const object = template.clone(true)
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) child.castShadow = true
      })
      scene.add(object)
      const u = new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize()
      const v = new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).cross(u).normalize()
      this.flights.push({
        object,
        u,
        v,
        height: 5 + rng() * 4,
        speed: (0.1 + rng() * 0.06) * (rng() < 0.5 ? 1 : -1),
        angle: rng() * Math.PI * 2,
        sway: rng() * 10,
      })
    }
    this.update(0)
  }

  update(delta: number) {
    for (const flight of this.flights) {
      flight.angle += flight.speed * delta
      flight.sway += delta
      const { u, v, angle, object } = flight
      up.copy(u).multiplyScalar(Math.cos(angle)).addScaledVector(v, Math.sin(angle))
      forward.copy(u).multiplyScalar(-Math.sin(angle)).addScaledVector(v, Math.cos(angle))
      if (flight.speed < 0) forward.negate()
      const lift = Math.sin(flight.sway * 0.7) * 1.2
      object.position.copy(up).multiplyScalar(this.radius + flight.height + lift)
      side.crossVectors(up, forward)
      object.quaternion.setFromRotationMatrix(basis.makeBasis(side, up, forward))
      // Nose up while climbing, a gentle roll from wing to wing.
      object.rotateX(-Math.cos(flight.sway * 0.7) * 0.15)
      object.rotateZ(Math.sin(flight.sway * 1.1) * 0.25)
    }
  }
}
