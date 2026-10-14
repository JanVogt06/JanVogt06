import RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'

interface Synced {
  body: RAPIER.RigidBody
  object: THREE.Object3D
  previousPosition: THREE.Vector3
  previousQuaternion: THREE.Quaternion
  position: THREE.Vector3
  quaternion: THREE.Quaternion
}

// Runs Rapier at a fixed rate with every dynamic body pulled towards the
// planet's centre, and interpolates the meshes between the last two steps.
export class Physics {
  readonly world = new RAPIER.World({ x: 0, y: 0, z: 0 })
  readonly timestep = 1 / 120

  private accumulator = 0
  private synced: Synced[] = []
  private beforeStep: ((dt: number) => void)[] = []

  constructor(readonly gravity: number) {
    this.world.timestep = this.timestep
  }

  onBeforeStep(callback: (dt: number) => void) {
    this.beforeStep.push(callback)
  }

  sync(body: RAPIER.RigidBody, object: THREE.Object3D) {
    const position = new THREE.Vector3().copy(body.translation())
    const quaternion = new THREE.Quaternion().copy(body.rotation())
    this.synced.push({
      body,
      object,
      previousPosition: position.clone(),
      previousQuaternion: quaternion.clone(),
      position,
      quaternion,
    })
    object.position.copy(position)
    object.quaternion.copy(quaternion)
  }

  update(delta: number) {
    this.accumulator += Math.min(delta, 0.1)
    while (this.accumulator >= this.timestep) {
      for (const s of this.synced) {
        s.previousPosition.copy(s.position)
        s.previousQuaternion.copy(s.quaternion)
      }
      this.pull()
      for (const callback of this.beforeStep) callback(this.timestep)
      this.world.step()
      for (const s of this.synced) {
        s.position.copy(s.body.translation())
        s.quaternion.copy(s.body.rotation())
      }
      this.accumulator -= this.timestep
    }

    const alpha = this.accumulator / this.timestep
    for (const s of this.synced) {
      s.object.position.lerpVectors(s.previousPosition, s.position, alpha)
      s.object.quaternion.slerpQuaternions(s.previousQuaternion, s.quaternion, alpha)
    }
  }

  private pull() {
    this.world.forEachRigidBody((body) => {
      if (!body.isDynamic() || body.isSleeping()) return
      const { x, y, z } = body.translation()
      const scale = (-this.gravity * body.mass()) / Math.hypot(x, y, z)
      body.resetForces(false)
      body.addForce({ x: x * scale, y: y * scale, z: z * scale }, false)
    })
  }
}
