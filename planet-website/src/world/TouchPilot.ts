import * as THREE from 'three'
import { drag, touch } from '../ui/store'
import type { FollowCamera } from './FollowCamera'
import type { Rover } from './Rover'

// Steering lock is reached when the goal lies this far off the nose.
const FULL_LOCK = 0.7
const BOOST_DRAG = 1.3
// A drag counts as moved, and the goal is taken anew, past this change.
const NUDGE = 0.04
// After this long pressing on without getting anywhere, the rover backs off.
const STUCK_TIME = 0.8
const BACK_OFF = 0.9
// Beyond this the goal is roughly behind, and the rover keeps turning the
// way it started rather than dithering between left and right.
const BEHIND = 2.4

const up = new THREE.Vector3()
const right = new THREE.Vector3()
const nose = new THREE.Vector3()
const across = new THREE.Vector3()
const carry = new THREE.Quaternion()

// Turns a thumb pointing across the screen into throttle and steering, as
// if the stick were held: the rover heads where the thumb points and keeps
// that heading while the thumb is still, even as the camera swings round
// behind it. Letting go brakes to a stop.
export class TouchPilot {
  private goal = new THREE.Vector3()
  private lastUp = new THREE.Vector3()
  private aimed = { x: 0, y: 0 }
  private holding = false
  private stuck = 0
  private reversing = 0
  private turning = 0

  constructor(
    private rover: Rover,
    private view: FollowCamera,
  ) {}

  update(delta: number) {
    if (!drag.used) return
    const { rover } = this
    up.copy(rover.object.position).normalize()

    if (!drag.active) {
      this.holding = false
      this.reversing = this.stuck = this.turning = 0
      touch.x = 0
      touch.boost = false
      touch.y = rover.speed > 0.6 ? -1 : 0
      return
    }

    // Up the screen is into the scene along the camera's heading.
    if (!this.holding || Math.hypot(drag.x - this.aimed.x, drag.y - this.aimed.y) > NUDGE) {
      right.crossVectors(this.view.heading, this.view.up)
      this.goal.copy(right).multiplyScalar(drag.x).addScaledVector(this.view.heading, drag.y)
      this.aimed = { x: drag.x, y: drag.y }
      this.holding = true
    } else {
      // Turned with the rover's travel round the planet, so a still thumb
      // keeps it on a great circle, the straightest line there is.
      this.goal.applyQuaternion(carry.setFromUnitVectors(this.lastUp, up))
    }
    this.lastUp.copy(up)
    this.goal.addScaledVector(up, -this.goal.dot(up))
    if (this.goal.lengthSq() < 1e-8) return
    this.goal.normalize()

    nose.copy(rover.forward).addScaledVector(up, -rover.forward.dot(up)).normalize()
    let angle = Math.atan2(up.dot(across.crossVectors(nose, this.goal)), nose.dot(this.goal))
    if (Math.abs(angle) > BEHIND) {
      if (this.turning === 0) this.turning = Math.sign(angle) || 1
      angle = this.turning * Math.abs(angle)
    } else this.turning = 0
    const reach = Math.hypot(drag.x, drag.y)
    const strength = Math.min(1, reach)
    let steer = THREE.MathUtils.clamp(angle / FULL_LOCK, -1, 1)
    let throttle = strength * THREE.MathUtils.lerp(1, 0.5, Math.abs(angle) / Math.PI)

    // Nosed into a tree or a wall: back away turning the other way, then
    // try again.
    this.stuck = throttle > 0.3 && Math.abs(rover.speed) < 0.5 ? this.stuck + delta : 0
    if (this.stuck > STUCK_TIME) {
      this.reversing = BACK_OFF
      this.stuck = 0
    }
    if (this.reversing > 0) {
      this.reversing -= delta
      throttle = -0.7
      steer = -steer
    }

    // The input reads a stick held to the right as steering to the right.
    touch.x = -steer
    touch.y = throttle
    touch.boost = reach > BOOST_DRAG && this.reversing <= 0
  }
}
