import * as THREE from 'three'
import type { Light } from './DayCycle'
import type { Rig } from './Director'
import { random } from './surface'

// The box of air round the rover that the drops fall through.
const BOX = { width: 36, height: 18, depth: 36 }
const DROPS = 1400
const FLAKES = 900
const RAIN = { speed: 24, length: 0.7 }
const SNOW = { speed: 1.6, sway: 0.6 }
// Long dry spells with a shower now and then, which blows in and out.
const DRY = [70, 140]
const SHOWER = [28, 45]
const FADE = 5
const OVERCAST = new THREE.Color('#8f97a6')

type Kind = 'rain' | 'snow'

const right = new THREE.Vector3()
const ahead = new THREE.Vector3()
const point = new THREE.Vector3()

// A soft white dot for the snowflakes.
function flake() {
  const size = 32
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const context = canvas.getContext('2d')!
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgb(255 255 255 / 1)')
  gradient.addColorStop(1, 'rgb(255 255 255 / 0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, size, size)
  return new THREE.CanvasTexture(canvas)
}

// Showers of rain, or of snow more often at night, that fall round the
// rover wherever it goes and grey the sky while they last.
export class Weather {
  // How much it is raining or snowing, from 0 to 1.
  amount = 0
  kind: Kind = 'rain'
  private rng = random(31)
  private clock = 0
  // The first shower waits until the planet has been looked at in the sun.
  private next = 90
  private until = 0
  private drops: Float32Array
  private flakes: Float32Array
  private rain: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>
  private snow: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>

  constructor(scene: THREE.Scene, private view: Rig) {
    // Positions in the box's own frame: across, up, along.
    this.drops = Float32Array.from({ length: DROPS * 3 }, (_, i) => this.inBox(i % 3))
    this.flakes = Float32Array.from({ length: FLAKES * 3 }, (_, i) => this.inBox(i % 3))

    const streaks = new THREE.BufferGeometry()
    streaks.setAttribute('position', new THREE.BufferAttribute(new Float32Array(DROPS * 6), 3))
    this.rain = new THREE.LineSegments(
      streaks,
      new THREE.LineBasicMaterial({ color: '#eef3ff', transparent: true, opacity: 0, depthWrite: false }),
    )
    const dots = new THREE.BufferGeometry()
    dots.setAttribute('position', new THREE.BufferAttribute(new Float32Array(FLAKES * 3), 3))
    this.snow = new THREE.Points(
      dots,
      new THREE.PointsMaterial({ map: flake(), color: '#ffffff', size: 0.2, transparent: true, opacity: 0, depthWrite: false }),
    )
    for (const object of [this.rain, this.snow]) {
      object.frustumCulled = false
      object.visible = false
      scene.add(object)
    }
  }

  // Starts a shower now, for trying the weather out.
  start(kind: Kind) {
    this.kind = kind
    this.next = this.clock
    this.until = this.clock + SHOWER[1]
  }

  update(delta: number, daylight: number) {
    this.clock += delta
    if (this.clock >= this.next && this.until < this.next) {
      this.kind = this.rng() < (daylight < 0.5 ? 0.45 : 0.15) ? 'snow' : 'rain'
      this.until = this.next + THREE.MathUtils.lerp(SHOWER[0], SHOWER[1], this.rng())
    }
    if (this.clock >= this.until && this.until >= this.next) {
      this.next = this.until + THREE.MathUtils.lerp(DRY[0], DRY[1], this.rng())
    }
    const showering = this.clock >= this.next && this.clock < this.until
    const fade = showering ? Math.min(this.clock - this.next, this.until - this.clock) / FADE : 0
    this.amount += (THREE.MathUtils.clamp(fade, 0, 1) - this.amount) * Math.min(1, delta * 2)

    this.rain.visible = this.kind === 'rain' && this.amount > 0.01
    this.snow.visible = this.kind === 'snow' && this.amount > 0.01
    if (this.rain.visible) this.fall(delta, this.drops, RAIN.speed, 0)
    if (this.snow.visible) this.fall(delta, this.flakes, SNOW.speed, SNOW.sway)
    this.rain.material.opacity = 0.7 * this.amount
    this.snow.material.opacity = 0.9 * this.amount
    if (this.rain.visible) this.draw(this.drops, this.rain.geometry, RAIN.length)
    if (this.snow.visible) this.draw(this.flakes, this.snow.geometry, 0)
  }

  // Greys the sky and dims the sun while a shower lasts.
  tint(light: Light) {
    const grey = 0.6 * this.amount
    light.zenith.lerp(OVERCAST, grey)
    light.horizon.lerp(OVERCAST, grey * 0.8)
    light.glow.multiplyScalar(1 - this.amount)
    light.sunStrength *= 1 - 0.45 * this.amount
  }

  private inBox(axis: number) {
    const size = axis === 0 ? BOX.width : axis === 1 ? BOX.height : BOX.depth
    return (this.rng() - (axis === 1 ? 0 : 0.5)) * size
  }

  private fall(delta: number, items: Float32Array, speed: number, sway: number) {
    for (let i = 0; i < items.length; i += 3) {
      items[i + 1] -= speed * delta
      if (sway) items[i] += Math.sin(this.clock * 1.3 + i) * sway * delta
      if (items[i + 1] < 0) items[i + 1] += BOX.height
    }
  }

  // Lays the box over the camera's target, upright on the planet, and
  // writes each drop's world position; rain gets a streak down to it.
  private draw(items: Float32Array, geometry: THREE.BufferGeometry, length: number) {
    const { target, up, heading } = this.view
    ahead.copy(heading)
    right.crossVectors(ahead, up)
    const out = geometry.attributes.position.array as Float32Array
    const stride = length ? 6 : 3
    for (let i = 0, j = 0; i < items.length; i += 3, j += stride) {
      point.copy(target).addScaledVector(right, items[i]).addScaledVector(up, items[i + 1]).addScaledVector(ahead, items[i + 2])
      point.toArray(out, j)
      if (length) point.addScaledVector(up, length).toArray(out, j + 3)
    }
    geometry.attributes.position.needsUpdate = true
  }
}
