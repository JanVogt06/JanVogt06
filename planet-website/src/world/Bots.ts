import * as THREE from 'three'
import type { Rover } from './Rover'
import { facing, random } from './surface'
import type { Flat, Terrain } from './Terrain'

const COUNT = 14
const COLOURS = ['#f6ecd8', '#e2b04a', '#7fcfb5', '#ee9a8a', '#9b8fd6']
// How fast they toddle about, run off, and turn.
const WANDER = 0.9
const FLEE = 3.4
const TURN = 3
// Within this distance a slow rover is watched and a fast one fled from.
const NOTICE = 7
const SCARY_SPEED = 3
// Closer than this and the rover bumps them into the air.
const BUMP = 1.5
const GRAVITY = 16

interface Bot {
  object: THREE.Object3D
  eye: THREE.Object3D
  up: THREE.Vector3
  heading: THREE.Vector3
  // Where the wander is drifting, as an angle that wanders itself.
  drift: number
  step: number
  lift: number
  rise: number
  fright: number
}

const here = new THREE.Vector3()
const toRover = new THREE.Vector3()
const wanted = new THREE.Vector3()
const axis = new THREE.Vector3()

// Keeps `v` flat along the ground at `up`, at unit length.
function flatten(v: THREE.Vector3, up: THREE.Vector3) {
  return v.addScaledVector(up, -v.dot(up)).normalize()
}

// Small research bots that toddle about the meadow. They turn to watch the
// rover when it comes slowly, run off when it races up, and hop out of the
// way if it gets too close.
export class Bots {
  private bots: Bot[] = []
  private rng = random(41)
  // The eye's middle, which stays put as the eye widens.
  private eyeCentre = new THREE.Vector3()

  constructor(
    scene: THREE.Scene,
    model: THREE.Object3D,
    private terrain: Terrain,
    private flats: Flat[],
    private rover: Rover,
  ) {
    const template = model.getObjectByName('Bot')
    if (!template) throw new Error('The critters model has no Bot')
    template.position.set(0, 0, 0)
    // Modelled at toy scale; a little larger reads better from the camera.
    template.scale.setScalar(1.4)
    const eye = template.getObjectByName('Bot_Eye') as THREE.Mesh
    eye.geometry.computeBoundingSphere()
    this.eyeCentre.copy(eye.geometry.boundingSphere!.center)
    const shells = COLOURS.map((colour) => {
      const shell = ((template.getObjectByName('Bot_Body') as THREE.Mesh).material as THREE.MeshStandardMaterial).clone()
      shell.color.set(colour)
      return shell
    })

    for (let i = 0; i < COUNT; i++) {
      const object = template.clone(true)
      ;(object.getObjectByName('Bot_Body') as THREE.Mesh).material = shells[i % shells.length]
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) child.castShadow = true
      })
      scene.add(object)
      const up = this.freeSpot()
      this.bots.push({
        object,
        eye: object.getObjectByName('Bot_Eye')!,
        up,
        heading: flatten(new THREE.Vector3(this.rng() - 0.5, this.rng() - 0.5, this.rng() - 0.5), up),
        drift: 0,
        step: this.rng() * 10,
        lift: 0,
        rise: 0,
        fright: 0,
      })
    }
  }

  update(delta: number) {
    const { radius } = this.terrain
    const rover = this.rover.object.position
    for (const bot of this.bots) {
      const { up, heading } = bot
      here.copy(up).multiplyScalar(radius + this.terrain.heightAt(up))
      toRover.subVectors(rover, here)
      const distance = toRover.length()
      flatten(toRover, up)

      let speed = WANDER
      const scared = distance < NOTICE && Math.abs(this.rover.speed) > SCARY_SPEED
      bot.fright += ((scared ? 1 : 0) - bot.fright) * Math.min(1, delta * 4)
      if (scared) {
        wanted.copy(toRover).negate()
        speed = FLEE
      } else if (distance < NOTICE) {
        // Stands and stares, now and then hopping on the spot.
        wanted.copy(toRover)
        speed = 0
        if (bot.lift === 0 && this.rng() < delta * 0.4) bot.rise = 3.2
      } else {
        bot.drift += (this.rng() - 0.5) * delta * 3
        wanted.copy(heading).applyAxisAngle(up, bot.drift * delta * 2)
      }
      // Keep off the stations and sights.
      for (const flat of this.flats) {
        const gap = flat.direction.angleTo(up) * radius - flat.reach - 1
        if (gap < 2) wanted.addScaledVector(flatten(axis.subVectors(up, flat.direction), up), (2 - gap) * 2)
      }
      flatten(wanted, up)
      heading.lerp(wanted, Math.min(1, TURN * delta))
      flatten(heading, up)

      if (distance < BUMP && bot.lift === 0) {
        bot.rise = 6
        heading.copy(toRover).negate()
        speed = FLEE * 2
      }

      // Step forward round the planet.
      axis.crossVectors(up, heading).normalize()
      up.applyAxisAngle(axis, (speed * delta) / radius).normalize()
      flatten(heading, up)

      bot.rise -= GRAVITY * delta
      bot.lift = Math.max(0, bot.lift + bot.rise * delta)
      if (bot.lift === 0) bot.rise = Math.max(bot.rise, 0)

      bot.step += delta * (2 + speed * 4)
      const bounce = speed > 0 ? Math.abs(Math.sin(bot.step)) * 0.08 * Math.min(1, speed) : 0
      bot.object.position.copy(up).multiplyScalar(radius + this.terrain.heightAt(up) + bot.lift + bounce)
      facing(up, heading, bot.object.quaternion)
      // A waddle from side to side as it goes, and wide eyes when scared.
      bot.object.rotateZ(Math.sin(bot.step) * 0.12 * Math.min(1, speed))
      const wide = 1 + 0.35 * bot.fright
      bot.eye.scale.setScalar(wide)
      bot.eye.position.copy(this.eyeCentre).multiplyScalar(1 - wide)
    }
  }

  private freeSpot() {
    const up = new THREE.Vector3()
    for (let attempt = 0; attempt < 100; attempt++) {
      up.set(this.rng() - 0.5, this.rng() - 0.5, this.rng() - 0.5).normalize()
      if (this.flats.every((flat) => flat.direction.angleTo(up) * this.terrain.radius > flat.reach + 3)) break
    }
    return up
  }
}
