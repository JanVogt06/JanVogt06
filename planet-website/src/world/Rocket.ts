import RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import type { Physics } from './Physics'
import { Puffs } from './Puffs'
import { random } from './surface'

// Drive up to the pad and the rocket rumbles, lifts off on a plume of
// smoke, is gone a while and then settles back down on its pad. It goes
// again once the rover has driven off and come back.
const TRIGGER = 5.5
const REARM = 9
const RUMBLE = 1.8
const CLIMB = 6
const GONE = 60
const AWAY = 9
const LANDING = 5
const SMOKE_RATE = 45

type Stage = 'waiting' | 'rumbling' | 'climbing' | 'away' | 'landing'

const point = new THREE.Vector3()
const push = new THREE.Vector3()
const up = new THREE.Vector3()

export class Rocket {
  private stage: Stage = 'waiting'
  private clock = 0
  private armed = true
  private owed = 0
  private rest: number
  private rng = random(71)
  private smoke: Puffs
  private flame: THREE.Mesh<THREE.ConeGeometry, THREE.MeshBasicMaterial>
  private collider: RAPIER.Collider
  private pad = new THREE.Vector3()

  constructor(
    scene: THREE.Scene,
    physics: Physics,
    renderer: THREE.WebGLRenderer,
    private ship: THREE.Object3D,
  ) {
    this.rest = ship.position.y
    ship.parent!.updateMatrixWorld(true)
    ship.parent!.getWorldPosition(this.pad)
    up.copy(this.pad).normalize()

    this.smoke = new Puffs(scene, renderer, {
      count: 260,
      life: 2.6,
      size: [0.9, 4.5],
      opacity: 0.6,
      drag: 1.4,
      colour: '#f1ece2',
    })
    this.flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.32, 1.4, 16, 1, true).rotateX(Math.PI).translate(0, -0.6, 0),
      new THREE.MeshBasicMaterial({ color: '#ffb347', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }),
    )
    this.flame.visible = false
    ship.add(this.flame)

    // A plain upright cylinder stands in for the ship while it is home.
    const centre = point.copy(this.pad).addScaledVector(up, 2.3)
    const body = physics.world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed()
        .setTranslation(centre.x, centre.y, centre.z)
        .setRotation(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), up)),
    )
    this.collider = physics.world.createCollider(RAPIER.ColliderDesc.cylinder(1.9, 0.62), body)
  }

  update(delta: number, rover: THREE.Vector3, light: number) {
    this.clock += delta
    const distance = rover.distanceTo(this.pad)
    if (distance > REARM) this.armed = true

    switch (this.stage) {
      case 'waiting':
        if (this.armed && distance < TRIGGER) this.go('rumbling')
        break
      case 'rumbling':
        // A shiver, and smoke rolling out round the foot of the pad.
        this.ship.position.set((this.rng() - 0.5) * 0.06, this.rest, (this.rng() - 0.5) * 0.06)
        this.puff(delta, 2.5, 0.4)
        if (this.clock > RUMBLE) {
          this.collider.setEnabled(false)
          this.go('climbing')
        }
        break
      case 'climbing': {
        const height = 0.5 * (2 * GONE / (CLIMB * CLIMB)) * this.clock * this.clock
        this.ship.position.set(0, this.rest + height, 0)
        this.burn(1)
        this.puff(delta, 0.8, 1)
        if (this.clock > CLIMB) {
          this.ship.visible = false
          this.flame.visible = false
          this.go('away')
        }
        break
      }
      case 'away':
        if (this.clock > AWAY) {
          this.ship.visible = true
          this.go('landing')
        }
        break
      case 'landing': {
        // Down gently from on high, braking on its flame at the end.
        const t = Math.min(this.clock / LANDING, 1)
        const height = 30 * Math.pow(1 - t, 3)
        this.ship.position.set(0, this.rest + height, 0)
        this.burn(height < 6 ? 0.6 : 0)
        if (height < 6) this.puff(delta, 0.6, 0.6)
        if (t >= 1) {
          this.flame.visible = false
          this.collider.setEnabled(true)
          this.armed = false
          this.go('waiting')
        }
        break
      }
    }
    this.smoke.update(delta, light)
  }

  private go(stage: Stage) {
    this.stage = stage
    this.clock = 0
  }

  private burn(strength: number) {
    this.flame.visible = strength > 0
    this.flame.scale.set(strength, strength * (0.8 + 0.4 * this.rng()), strength)
  }

  // Smoke from under the nozzle, pushed out sideways by `spread` and down
  // by `down`, at a rate scaled by how hard the engine is going.
  private puff(delta: number, spread: number, down: number) {
    this.owed += delta * SMOKE_RATE
    while (this.owed >= 1) {
      this.owed -= 1
      this.ship.getWorldPosition(point).addScaledVector(up, 0.2)
      push.set(this.rng() - 0.5, this.rng() - 0.5, this.rng() - 0.5).multiplyScalar(spread * 4)
      push.addScaledVector(up, -push.dot(up)).addScaledVector(up, -down * 3 + this.rng())
      this.smoke.emit(point, push)
    }
  }
}
