import * as THREE from 'three'
import { rim } from './Toy'

// Everything about the light that changes with the time of day.
export interface Light {
  zenith: THREE.Color
  horizon: THREE.Color
  // The haze round the sun in the sky.
  glow: THREE.Color
  sun: THREE.Color
  sunStrength: number
  // How high the sun stands, from 0 at the horizon to 1 well up.
  sunHeight: number
  sky: THREE.Color
  skyStrength: number
  ground: THREE.Color
  environment: number
  stars: number
  rim: THREE.Color
  rimStrength: number
}

type Palette = { [K in keyof Light]: Light[K] extends THREE.Color ? string : number }

const DAY: Palette = {
  zenith: '#78acdf', horizon: '#fbe6c6', glow: '#ffd7a0',
  sun: '#ffe7c9', sunStrength: 2.4, sunHeight: 1,
  sky: '#dceaff', skyStrength: 0.85, ground: '#8a7650',
  environment: 0.35, stars: 0, rim: '#fff0d4', rimStrength: 0.3,
}
const DUSK: Palette = {
  zenith: '#5d6fb0', horizon: '#f6a479', glow: '#ff8a4a',
  sun: '#ffa66b', sunStrength: 1.7, sunHeight: 0.3,
  sky: '#c9a8c8', skyStrength: 0.6, ground: '#6a4a40',
  environment: 0.22, stars: 0.25, rim: '#ffc8a0', rimStrength: 0.35,
}
// By night the moon stands in for the sun, high and pale blue.
const NIGHT: Palette = {
  zenith: '#0d1433', horizon: '#2a3363', glow: '#000000',
  sun: '#9fb6ff', sunStrength: 0.6, sunHeight: 0.8,
  sky: '#5868a8', skyStrength: 0.45, ground: '#1c2030',
  environment: 0.1, stars: 1, rim: '#8fa6ff', rimStrength: 0.25,
}

function colours(palette: Palette) {
  return Object.fromEntries(
    Object.entries(palette).map(([key, value]) => [key, typeof value === 'string' ? new THREE.Color(value) : value]),
  ) as unknown as Light
}

const day = colours(DAY)
const dusk = colours(DUSK)
const night = colours(NIGHT)
const blend = colours(DAY)

function mix(target: Light, a: Light, b: Light, t: number) {
  for (const key of Object.keys(target) as (keyof Light)[]) {
    const from = a[key]
    const to = b[key]
    if (from instanceof THREE.Color) (target[key] as THREE.Color).lerpColors(from, to as THREE.Color, t)
    else (target[key] as number) = THREE.MathUtils.lerp(from, to as number, t)
  }
}

// A day on the planet, a few minutes long: a long bright day, a warm dusk,
// a blue night under the stars and a dawn. The first visit starts in the
// morning.
export class DayCycle {
  readonly length = 360
  readonly light = colours(DAY)
  // 1 by day, 0 by night.
  daylight = 1
  // Where in the day it is, from 0 at noon round to 1.
  phase = 0.9
  private windows: THREE.MeshStandardMaterial[] = []

  // Has every pane of glass under `root` light up from inside after dark.
  lightWindows(root: THREE.Object3D) {
    root.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      const material = child.material
      if (material instanceof THREE.MeshStandardMaterial && material.name === 'Glass' && !this.windows.includes(material)) {
        material.emissive.set('#ffc979')
        this.windows.push(material)
      }
    })
  }

  update(delta: number) {
    this.phase = (this.phase + delta / this.length) % 1
    // Above zero the sun is up; the offset makes the day the longer half.
    const sun = Math.cos(this.phase * Math.PI * 2) + 0.25
    this.daylight = THREE.MathUtils.smoothstep(sun, -0.3, 0.3)
    const twilight = 1 - THREE.MathUtils.smoothstep(Math.abs(sun), 0, 0.45)
    mix(blend, night, day, this.daylight)
    mix(this.light, blend, dusk, twilight)

    rim.colour.value.copy(this.light.rim)
    rim.strength.value = this.light.rimStrength
    for (const pane of this.windows) pane.emissiveIntensity = 1.4 * (1 - this.daylight)
  }
}
