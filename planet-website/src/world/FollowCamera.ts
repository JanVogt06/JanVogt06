import * as THREE from 'three'
import type { Rover } from './Rover'

const up = new THREE.Vector3()
const along = new THREE.Vector3()
const look = new THREE.Vector3()

// A raised three-quarter view that trails the rover. Its heading is carried
// along the surface and only slowly swings round behind the rover, so a turn
// reads as the rover turning rather than the world spinning.
export class FollowCamera {
  readonly target = new THREE.Vector3()
  readonly heading = new THREE.Vector3()
  readonly up = new THREE.Vector3()

  distance = 13
  height = 7.5
  lookAhead = 3
  follow = 10
  swing = 1.4

  constructor(private camera: THREE.PerspectiveCamera, private rover: Rover) {
    this.target.copy(rover.object.position)
    this.heading.copy(rover.forward)
    this.update(0)
  }

  update(delta: number) {
    this.target.lerp(this.rover.object.position, 1 - Math.exp(-this.follow * delta))
    this.up.copy(this.target).normalize()
    up.copy(this.up)

    this.heading.addScaledVector(up, -this.heading.dot(up)).normalize()
    if (this.rover.speed > 1.5) {
      along.copy(this.rover.forward).addScaledVector(up, -this.rover.forward.dot(up)).normalize()
      const rate = this.swing * Math.min(1, this.rover.speed / 8)
      this.heading.lerp(along, 1 - Math.exp(-rate * delta)).normalize()
    }

    this.camera.position
      .copy(this.target)
      .addScaledVector(up, this.height)
      .addScaledVector(this.heading, -this.distance)
    this.camera.up.copy(up)
    this.camera.lookAt(look.copy(this.target).addScaledVector(this.heading, this.lookAhead))
  }
}
