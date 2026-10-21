import * as THREE from 'three'
import { Puffs } from './Puffs'
import type { Rover } from './Rover'
import { random } from './surface'

// Puffs a second per wheel at top speed, and how many a landing throws up.
const RATE = 14
const LANDING = 18
// Where the rear wheels touch the ground, in the rover's frame.
const WHEELS = [new THREE.Vector3(-0.85, -0.75, -0.8), new THREE.Vector3(-0.85, -0.75, 0.8)]

const point = new THREE.Vector3()
const up = new THREE.Vector3()
const push = new THREE.Vector3()

// Little clouds of sand kicked up behind the rear wheels when the rover
// gets going, and a ring of them when it lands from a jump.
export class Dust {
  private rng = random(17)
  private puffs: Puffs
  private owed = 0
  private wasGrounded = true

  constructor(scene: THREE.Scene, private rover: Rover, renderer: THREE.WebGLRenderer) {
    this.puffs = new Puffs(scene, renderer, {
      count: 160,
      life: 0.9,
      size: [0.45, 1.95],
      opacity: 0.75,
      drag: 2.5,
      colour: '#cdb487',
    })
  }

  // `light` dims the sand towards night, from 0 to 1.
  update(delta: number, light: number) {
    const { rover } = this
    up.copy(rover.object.position).normalize()

    const fast = Math.abs(rover.speed) / 10
    if (rover.grounded && fast > 0.35) {
      this.owed += delta * RATE * Math.min(fast, 1.7)
      while (this.owed >= 1) {
        this.owed -= 1
        for (const wheel of WHEELS) this.emit(point.copy(wheel).applyMatrix4(rover.object.matrixWorld), 0.6)
      }
    }
    if (rover.grounded && !this.wasGrounded) {
      for (let i = 0; i < LANDING; i++) {
        const wheel = WHEELS[i % 2]
        this.emit(point.copy(wheel).setX(this.rng() * 1.8 - 0.9).applyMatrix4(rover.object.matrixWorld), 1.6)
      }
    }
    this.wasGrounded = rover.grounded
    this.puffs.update(delta, light)
  }

  private emit(at: THREE.Vector3, spread: number) {
    // A random push along the ground, and a lift off it.
    push.set(this.rng() - 0.5, this.rng() - 0.5, this.rng() - 0.5).multiplyScalar(spread * 2)
    push.addScaledVector(up, -push.dot(up)).addScaledVector(up, 0.8 + this.rng() * 0.8)
    this.puffs.emit(at, push)
  }
}
