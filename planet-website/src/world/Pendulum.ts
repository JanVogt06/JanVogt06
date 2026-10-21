import RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import type { Physics } from './Physics'

// A pendulum this long swings with a period of about five seconds; its
// plane of swing turns slowly round, as Foucault's did in Paris, so the bob
// knocks down the ring of pegs one after another.
const SWING = 0.235
const RATE = Math.sqrt(9.81 / 6.6)
const PRECESSION = 0.05
// The bob's middle below the arm's pivot, and its size, as modelled.
const BOB = { drop: 6.65, radius: 0.36 }
const PEGS = { count: 18, ring: 1.75, radius: 0.055, height: 0.32, floor: 0.3 }
// Once this many are down, or this long after the first fell, they all
// stand up again.
const RESET_DOWN = 15
const RESET_AFTER = 45

const axis = new THREE.Vector3()
const bob = new THREE.Vector3()
const upright = new THREE.Vector3()
const tilt = new THREE.Vector3()
const spin = new THREE.Quaternion()

interface Peg {
  body: RAPIER.RigidBody
  home: THREE.Vector3
}

export class Pendulum {
  private time = 0
  private pegs: Peg[] = []
  private bob: RAPIER.RigidBody
  private firstFall = -1
  private turn: THREE.Quaternion

  constructor(
    scene: THREE.Scene,
    physics: Physics,
    private arm: THREE.Object3D,
    pegs: THREE.Mesh,
    caps: THREE.Mesh,
  ) {
    const base = arm.parent!
    base.updateMatrixWorld(true)
    this.turn = base.getWorldQuaternion(new THREE.Quaternion())
    upright.set(0, 1, 0).applyQuaternion(this.turn)

    // The modelled ring stays in the file for Blender's sake; loose pegs
    // that can fall take its place.
    pegs.visible = caps.visible = false
    const pegGeometry = new THREE.CylinderGeometry(PEGS.radius, PEGS.radius, PEGS.height, 10)
    const capGeometry = new THREE.SphereGeometry(0.06, 10, 5).translate(0, PEGS.height / 2 + 0.01, 0)
    for (let i = 0; i < PEGS.count; i++) {
      const angle = (i / PEGS.count) * Math.PI * 2
      const home = new THREE.Vector3(PEGS.ring * Math.cos(angle), PEGS.floor + PEGS.height / 2 + 0.005, PEGS.ring * Math.sin(angle))
      base.localToWorld(home)
      const body = physics.world.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic().setTranslation(home.x, home.y, home.z).setRotation(this.turn).setCanSleep(true),
      )
      physics.world.createCollider(
        RAPIER.ColliderDesc.cylinder(PEGS.height / 2, PEGS.radius).setDensity(0.8).setFriction(0.6),
        body,
      )
      const peg = new THREE.Group()
      const stick = new THREE.Mesh(pegGeometry, pegs.material)
      const cap = new THREE.Mesh(capGeometry, caps.material)
      stick.castShadow = cap.castShadow = true
      peg.add(stick, cap)
      scene.add(peg)
      physics.sync(body, peg)
      this.pegs.push({ body, home })
    }

    this.bob = physics.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased())
    physics.world.createCollider(RAPIER.ColliderDesc.ball(BOB.radius), this.bob)
    this.update(0)
  }

  update(delta: number) {
    const t = (this.time += delta)
    const plane = t * PRECESSION
    axis.set(Math.cos(plane), 0, Math.sin(plane))
    this.arm.quaternion.setFromAxisAngle(axis, SWING * Math.sin(t * RATE))
    this.arm.updateMatrixWorld(true)
    this.arm.localToWorld(bob.set(0, -BOB.drop, 0))
    this.bob.setNextKinematicTranslation(bob)

    let down = 0
    for (const peg of this.pegs) {
      const { x, y, z, w } = peg.body.rotation()
      tilt.set(0, 1, 0).applyQuaternion(spin.set(x, y, z, w))
      if (tilt.dot(upright) < 0.7) down++
    }
    if (down > 0 && this.firstFall < 0) this.firstFall = t
    if (down >= RESET_DOWN || (this.firstFall >= 0 && t - this.firstFall > RESET_AFTER)) this.reset()
  }

  private reset() {
    this.firstFall = -1
    for (const { body, home } of this.pegs) {
      body.setTranslation(home, true)
      body.setRotation(this.turn, true)
      body.setLinvel({ x: 0, y: 0, z: 0 }, true)
      body.setAngvel({ x: 0, y: 0, z: 0 }, true)
    }
  }
}
