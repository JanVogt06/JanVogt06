import RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import type { Input } from './Input'
import type { Physics } from './Physics'

// The chassis faces +x with +y up, so +z is its right-hand side.
const CHASSIS = { x: 1.1, y: 0.28, z: 0.62 }
const MOUNT_HEIGHT = -0.1
const WHEEL_RADIUS = 0.36
const WHEELS = [
  { x: 0.78, z: -0.72, front: true },
  { x: 0.78, z: 0.72, front: true },
  { x: -0.78, z: -0.72, front: false },
  { x: -0.78, z: 0.72, front: false },
]

export const tuning = {
  mass: 10,
  engine: 70,
  boost: 1.7,
  topSpeed: 14,
  boostSpeed: 20,
  reverseSpeed: 6,
  brake: 40,
  coast: 0.04,
  steer: 0.55,
  // The lock halves by this speed, so the rover stays nimble when slow
  // without spinning out when fast.
  steerHalfSpeed: 8.5,
  steerRate: 7,
  suspensionRest: 0.4,
  suspensionTravel: 0.35,
  stiffness: 40,
  compression: 2.6,
  relaxation: 2.0,
  frontGrip: 2.6,
  rearGrip: 4.2,
  jump: 8,
  keepUpright: 18,
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
  speed = 0

  private controller: RAPIER.DynamicRayCastVehicleController
  private wheels: { steer: THREE.Group; spin: THREE.Object3D }[] = []
  private steering = 0
  private upsideDown = 0

  constructor(scene: THREE.Scene, physics: Physics, private input: Input, spawn: THREE.Vector3) {
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
      this.controller.setWheelFrictionSlip(i, wheel.front ? tuning.frontGrip : tuning.rearGrip)
    })

    this.place(spawn, this.forward)
    this.build()
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

  update() {
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
      // Most of the braking goes through the front wheels, as on a real car,
      // so the tail stays behind instead of swinging round.
      this.controller.setWheelEngineForce(i, wheel.front ? -brake * 1.4 : engine - brake * 0.6)
      this.controller.setWheelBrake(i, coast)
    })
  }

  private steer(dt: number) {
    const direction = Number(this.input.isHeld('left')) - Number(this.input.isHeld('right'))
    const target = (direction * tuning.steer) / (1 + Math.abs(this.speed) / tuning.steerHalfSpeed)
    this.steering += (target - this.steering) * Math.min(1, tuning.steerRate * dt)
    WHEELS.forEach((wheel, i) => {
      if (wheel.front) this.controller.setWheelSteering(i, this.steering)
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

  private build() {
    const paint = new THREE.MeshStandardMaterial({ color: '#e8743b', roughness: 0.6 })
    const trim = new THREE.MeshStandardMaterial({ color: '#2b2f3a', roughness: 0.8 })
    const rubber = new THREE.MeshStandardMaterial({ color: '#1d1f24', roughness: 0.9 })
    const hub = new THREE.MeshStandardMaterial({ color: '#d9d4c7', roughness: 0.5 })

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(CHASSIS.x * 2, CHASSIS.y * 2, CHASSIS.z * 2), paint)
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.42, 1.0), trim)
    cabin.position.set(-0.2, CHASSIS.y + 0.21, 0)
    this.object.add(chassis, cabin)

    const tyre = new THREE.CylinderGeometry(WHEEL_RADIUS, WHEEL_RADIUS, 0.3, 24).rotateX(Math.PI / 2)
    const cap = new THREE.BoxGeometry(0.42, 0.1, 0.32)
    for (const _ of WHEELS) {
      const steer = new THREE.Group()
      const spin = new THREE.Group()
      spin.add(new THREE.Mesh(tyre, rubber), new THREE.Mesh(cap, hub))
      steer.add(spin)
      this.object.add(steer)
      this.wheels.push({ steer, spin })
    }

    this.object.traverse((child) => {
      if (child instanceof THREE.Mesh) child.castShadow = child.receiveShadow = true
    })
  }
}
