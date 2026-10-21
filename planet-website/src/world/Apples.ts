import RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import type { Physics } from './Physics'
import type { Rover } from './Rover'
import { random } from './surface'

// Bump an apple tree and an apple drops, as one did for Newton. A few lie
// about at once; the oldest is picked up again for the next to fall.
const APPLES = 24
const RADIUS = 0.14
// How close to the trunk counts as a bump, how hard, and how long a tree
// rests before it drops another.
const REACH = 2.1
const BUMP_SPEED = 2
const REST = 3
// Where in the crown they hang, scaled with the tree.
const CROWN = { height: 2.2, spread: 0.75 }

const up = new THREE.Vector3()
const side = new THREE.Vector3()
const at = new THREE.Vector3()
const scale = new THREE.Vector3()
const turn = new THREE.Quaternion()

interface Tree {
  at: THREE.Vector3
  size: number
  rest: number
}

export class Apples {
  private trees: Tree[]
  private bodies: RAPIER.RigidBody[] = []
  private next = 0
  private rng = random(83)

  constructor(scene: THREE.Scene, physics: Physics, placements: THREE.Matrix4[], material: THREE.Material) {
    this.trees = placements.map((placement) => {
      const tree = { at: new THREE.Vector3(), size: 1, rest: 0 }
      placement.decompose(tree.at, turn, scale)
      tree.size = scale.x
      return tree
    })
    const geometry = new THREE.SphereGeometry(RADIUS, 12, 8)
    for (let i = 0; i < APPLES; i++) {
      // Parked far below the ground until they first fall.
      const body = physics.world.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic().setTranslation(0, -1000 - i, 0).setCanSleep(true).setLinearDamping(0.3),
      )
      physics.world.createCollider(RAPIER.ColliderDesc.ball(RADIUS).setDensity(0.6).setRestitution(0.35).setFriction(0.8), body)
      body.sleep()
      const apple = new THREE.Mesh(geometry, material)
      apple.castShadow = true
      scene.add(apple)
      physics.sync(body, apple)
      this.bodies.push(body)
    }
  }

  update(delta: number, rover: Rover) {
    const position = rover.object.position
    const fast = Math.abs(rover.speed) > BUMP_SPEED
    for (const tree of this.trees) {
      tree.rest -= delta
      if (!fast || tree.rest > 0 || position.distanceTo(tree.at) > REACH * tree.size) continue
      tree.rest = REST
      const count = 1 + Math.floor(this.rng() * 2)
      for (let i = 0; i < count; i++) this.drop(tree)
    }
  }

  private drop(tree: Tree) {
    up.copy(tree.at).normalize()
    side.set(this.rng() - 0.5, this.rng() - 0.5, this.rng() - 0.5)
    side.addScaledVector(up, -side.dot(up)).normalize()
    at.copy(tree.at)
      .addScaledVector(up, CROWN.height * tree.size)
      .addScaledVector(side, CROWN.spread * tree.size * (0.6 + 0.4 * this.rng()))
    const body = this.bodies[this.next]
    this.next = (this.next + 1) % APPLES
    body.setTranslation(at, true)
    body.setLinvel({ x: 0, y: 0, z: 0 }, true)
    body.setAngvel({ x: 0, y: 0, z: 0 }, true)
  }
}
