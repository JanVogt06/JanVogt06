import RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import type { Input } from './Input'
import type { Physics } from './Physics'

// The chassis faces +x with +y up, so +z is its right-hand side.
const CHASSIS = { x: 1.1, y: 0.28, z: 0.62 }
const MOUNT_HEIGHT = -0.1
const WHEEL_RADIUS = 0.36
// Six wheels as on Perseverance. The names match the wheel nodes of the
// model; the four behind the front pair drive.
type Axle = 'front' | 'middle' | 'rear'
const WHEELS: { name: string; x: number; z: number; axle: Axle }[] = [
  { name: 'FL', x: 0.85, z: -0.8, axle: 'front' },
  { name: 'FR', x: 0.85, z: 0.8, axle: 'front' },
  { name: 'ML', x: 0, z: -0.8, axle: 'middle' },
  { name: 'MR', x: 0, z: 0.8, axle: 'middle' },
  { name: 'RL', x: -0.85, z: -0.8, axle: 'rear' },
  { name: 'RR', x: -0.85, z: 0.8, axle: 'rear' },
]
// Shares of the braking force per wheel: mostly at the front, as on a car,
// so the tail stays behind instead of swinging round.
const BRAKE_SHARE: Record<Axle, number> = { front: 1.4, middle: 0.4, rear: 0.4 }

export const tuning = {
  mass: 10,
  // Per driven wheel.
  engine: 35,
  boost: 2.2,
  topSpeed: 10,
  boostSpeed: 17,
  reverseSpeed: 6,
  brake: 36,
  coast: 0.04,
  steer: 0.55,
  // The lock halves by this speed, so the rover stays nimble when slow
  // without spinning out when fast.
  steerHalfSpeed: 8.5,
  steerRate: 7,
  // Like Perseverance, the rear wheels steer against the front ones, which
  // tightens the turn that the middle pair would otherwise drag wide.
  rearSteer: 0.25,
  suspensionRest: 0.4,
  suspensionTravel: 0.35,
  // Per wheel, so six of them carry the rover as four did before.
  stiffness: 27,
  compression: 1.75,
  relaxation: 1.35,
  grip: { front: 2.6, middle: 3.4, rear: 4.2 } as Record<Axle, number>,
  jump: 8,
  keepUpright: 18,
  // How far the body leans out of a corner per unit of sideways
  // acceleration, and how springy it is about it.
  lean: 0.0055,
  leanMax: 0.16,
  leanStiffness: 140,
  leanDamping: 7,
}

const v = new THREE.Vector3()
const up = new THREE.Vector3()
const axis = new THREE.Vector3()
const quaternion = new THREE.Quaternion()
const basis = new THREE.Matrix4()

export class Rover {
  readonly object = new THREE.Group()
  readonly body: RAPIER.RigidBody
  readonly forward = new THREE.Vector3(1, 0, 0)
  readonly velocity = new THREE.Vector3()
  // The camera head on the mast, free to turn towards things.
  readonly head: THREE.Object3D
  speed = 0

  private controller: RAPIER.DynamicRayCastVehicleController
  private wheels: { steer: THREE.Group; spin: THREE.Object3D }[] = []
  private steering = 0
  private upsideDown = 0
  private yawRate = 0
  private shell = new THREE.Group()
  private lean = { angle: 0, velocity: 0 }
  private gaze: THREE.Vector3 | null = null
  private idle = 0

  constructor(
    scene: THREE.Scene,
    physics: Physics,
    private input: Input,
    spawn: THREE.Vector3,
    model: THREE.Object3D,
  ) {
    up.copy(spawn).normalize()
    this.body = physics.world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(spawn.x, spawn.y, spawn.z)
        .setCanSleep(false)
        .setCcdEnabled(true)
        .setAngularDamping(0.4),
    )
    physics.world.createCollider(
      RAPIER.ColliderDesc.cuboid(CHASSIS.x, CHASSIS.y, CHASSIS.z)
        .setFriction(0.4)
        // A centre of mass below the floor pan lets the body lean into a
        // corner without tipping over too easily.
        .setMassProperties(tuning.mass, { x: 0, y: -0.2, z: 0 }, { x: 1.6, y: 5.3, z: 4.3 }, { x: 0, y: 0, z: 0, w: 1 }),
      this.body,
    )

    this.controller = physics.world.createVehicleController(this.body)
    this.controller.indexUpAxis = 1
    this.controller.setIndexForwardAxis = 0
    WHEELS.forEach((wheel, i) => {
      this.controller.addWheel(
        { x: wheel.x, y: MOUNT_HEIGHT, z: wheel.z },
        { x: 0, y: -1, z: 0 },
        { x: 0, y: 0, z: 1 },
        tuning.suspensionRest,
        WHEEL_RADIUS,
      )
      this.controller.setWheelMaxSuspensionTravel(i, tuning.suspensionTravel)
      this.controller.setWheelSuspensionStiffness(i, tuning.stiffness)
      this.controller.setWheelSuspensionCompression(i, tuning.compression)
      this.controller.setWheelSuspensionRelaxation(i, tuning.relaxation)
      this.controller.setWheelMaxSuspensionForce(i, 1e5)
      this.controller.setWheelFrictionSlip(i, tuning.grip[wheel.axle])
    })

    this.place(spawn, this.forward)
    this.head = this.build(model)
    scene.add(this.object)
    physics.sync(this.body, this.object)
    physics.onBeforeStep((dt) => this.step(dt))
  }

  get grounded() {
    return WHEELS.some((_, i) => this.controller.wheelIsInContact(i))
  }

  // Puts the rover back on its wheels a little above `position`, facing as
  // close to `heading` as the ground there allows.
  place(position: THREE.Vector3, heading: THREE.Vector3) {
    up.copy(position).normalize()
    const forward = v.copy(heading).addScaledVector(up, -heading.dot(up))
    if (forward.lengthSq() < 1e-6) forward.set(1, 0, 0).addScaledVector(up, -up.x)
    forward.normalize()
    axis.crossVectors(forward, up)
    quaternion.setFromRotationMatrix(basis.makeBasis(forward, up, axis))

    const lifted = position.clone().addScaledVector(up, 1.2)
    this.body.setTranslation(lifted, true)
    this.body.setRotation(quaternion, true)
    this.body.setLinvel({ x: 0, y: 0, z: 0 }, true)
    this.body.setAngvel({ x: 0, y: 0, z: 0 }, true)
  }

  // A point for the camera head to turn to, or null to let it look about.
  lookAt(point: THREE.Vector3 | null) {
    this.gaze = point
  }

  update(delta: number) {
    this.leanIntoCorners(Math.min(delta, 1 / 30))
    this.turnHead(Math.min(delta, 1 / 30))
    WHEELS.forEach((wheel, i) => {
      const { steer, spin } = this.wheels[i]
      const length = this.controller.wheelSuspensionLength(i) ?? tuning.suspensionRest
      steer.position.set(wheel.x, MOUNT_HEIGHT - length, wheel.z)
      steer.rotation.y = this.controller.wheelSteering(i) ?? 0
      spin.rotation.z = -(this.controller.wheelRotation(i) ?? 0)
    })
  }

  private step(dt: number) {
    const rotation = this.body.rotation()
    quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)
    this.forward.set(1, 0, 0).applyQuaternion(quaternion)
    this.velocity.copy(this.body.linvel())
    this.speed = this.velocity.dot(this.forward)
    this.yawRate = v.copy(this.body.angvel()).dot(up.copy(this.body.translation()).normalize())
    up.copy(this.body.translation()).normalize()

    this.drive()
    this.steer(dt)

    if (this.input.consume('jump') && this.grounded) {
      v.copy(up).multiplyScalar(tuning.jump * tuning.mass)
      this.body.applyImpulse(v, true)
    }
    if (this.input.consume('reset')) this.place(this.position(), this.forward)

    this.controller.updateVehicle(dt)
    this.keepUpright(dt)
  }

  private position() {
    return new THREE.Vector3().copy(this.body.translation())
  }

  private drive() {
    const boosting = this.input.isHeld('boost')
    const top = boosting ? tuning.boostSpeed : tuning.topSpeed
    let engine = 0
    let brake = 0
    let coast = 0

    if (this.input.isHeld('forward')) {
      // Full force until the last third of the speed range, then fading out.
      const headroom = THREE.MathUtils.clamp((top - this.speed) / (top * 0.3), 0, 1)
      engine = tuning.engine * (boosting ? tuning.boost : 1) * headroom
    } else if (this.input.isHeld('backward')) {
      // Rapier's wheel brake overshoots into reverse, so braking pushes
      // back with the motor instead.
      if (this.speed > 0.5) brake = tuning.brake
      else {
        const headroom = THREE.MathUtils.clamp((tuning.reverseSpeed + this.speed) / (tuning.reverseSpeed * 0.3), 0, 1)
        engine = -tuning.engine * 0.6 * headroom
      }
    } else coast = tuning.coast

    WHEELS.forEach((wheel, i) => {
      const driven = wheel.axle === 'front' ? 0 : engine
      this.controller.setWheelEngineForce(i, driven - brake * BRAKE_SHARE[wheel.axle])
      this.controller.setWheelBrake(i, coast)
    })
  }

  private steer(dt: number) {
    const direction = Number(this.input.isHeld('left')) - Number(this.input.isHeld('right'))
    const target = (direction * tuning.steer) / (1 + Math.abs(this.speed) / tuning.steerHalfSpeed)
    this.steering += (target - this.steering) * Math.min(1, tuning.steerRate * dt)
    WHEELS.forEach((wheel, i) => {
      if (wheel.axle === 'front') this.controller.setWheelSteering(i, this.steering)
      if (wheel.axle === 'rear') this.controller.setWheelSteering(i, -this.steering * tuning.rearSteer)
    })
  }

  // A soft spring towards the local vertical: enough to land on the wheels
  // after a jump, too weak to stop the body leaning in a corner. If the rover
  // still ends up on its back, it rights itself after a moment.
  private keepUpright(dt: number) {
    const bodyUp = v.set(0, 1, 0).applyQuaternion(quaternion)
    axis.crossVectors(bodyUp, up).multiplyScalar(tuning.keepUpright * dt * tuning.mass * (this.grounded ? 0.3 : 1))
    this.body.applyTorqueImpulse(axis, true)

    this.upsideDown = bodyUp.dot(up) < 0.3 && this.velocity.length() < 2 ? this.upsideDown + dt : 0
    if (this.upsideDown > 1.5) {
      this.upsideDown = 0
      this.place(this.position(), this.forward)
    }
  }

  // Rapier applies the tyres' side forces close to the centre of mass, so the
  // chassis hardly rolls by itself. The body shell leans on a spring instead,
  // outwards from the corner, and wobbles a little as it settles.
  private leanIntoCorners(delta: number) {
    const sideways = this.grounded ? this.speed * this.yawRate : 0
    const target = THREE.MathUtils.clamp(sideways * tuning.lean, -tuning.leanMax, tuning.leanMax)
    const lean = this.lean
    lean.velocity += ((target - lean.angle) * tuning.leanStiffness - lean.velocity * tuning.leanDamping) * delta
    lean.angle += lean.velocity * delta
    this.shell.rotation.x = lean.angle
  }

  // Takes the body and the six wheels out of the model. The body rides on the
  // leaning shell; each wheel turns inside a holder that steers and follows
  // its suspension.
  // The head faces +x and turns about its mast. It follows the gaze point
  // as far as the mast allows, and otherwise glances slowly to and fro.
  private turnHead(delta: number) {
    this.idle += delta
    let yaw = 0.5 * Math.sin(this.idle * 0.45) + 0.2 * Math.sin(this.idle * 1.3)
    if (this.gaze && this.head.parent) {
      const local = this.head.parent.worldToLocal(v.copy(this.gaze)).sub(this.head.position)
      yaw = THREE.MathUtils.clamp(Math.atan2(-local.z, local.x), -1.9, 1.9)
    }
    this.head.rotation.y += (yaw - this.head.rotation.y) * Math.min(1, 4 * delta)
  }

  private build(model: THREE.Object3D) {
    const body = model.getObjectByName('Body')
    if (!body) throw new Error('The rover model has no Body')
    // The shell pivots at the floor pan, so it rolls over on its springs
    // rather than spinning about its middle.
    this.shell.position.y = -CHASSIS.y
    body.position.set(0, CHASSIS.y, 0)
    this.shell.add(body)
    this.object.add(this.shell)

    for (const wheel of WHEELS) {
      const tyre = model.getObjectByName(`Wheel_${wheel.name}`)
      if (!tyre) throw new Error(`The rover model has no Wheel_${wheel.name}`)
      tyre.position.set(0, 0, 0)
      const steer = new THREE.Group()
      steer.add(tyre)
      this.object.add(steer)
      this.wheels.push({ steer, spin: tyre })
    }

    this.object.traverse((child) => {
      if (child instanceof THREE.Mesh) child.castShadow = child.receiveShadow = true
    })
    return body.getObjectByName('Head') ?? body
  }
}
