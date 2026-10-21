import RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import type { Station } from '../content/stations'
import { tag, ui } from '../ui/store'
import type { Physics } from './Physics'
import type { Clearing } from './Props'
import type { Rover } from './Rover'
import { directionAt, facing } from './surface'

// The parking bay lies in front of the building, along its local +z.
const BAY = { width: 3.6, depth: 4.6, offset: 6.2, wall: 1.8 }
// How far inside the bay's edges the rover's centre has to be.
const BAY_MARGIN = { x: 0.5, z: 0.7 }
const NEAR = 15
// Every bay glows in the same warm brass, so it reads as the place to stop.
const BAY_COLOUR = '#ffc84a'
const PARK_TIME = 0.8
const PARKED_SPEED = 0.8

const NORTH = new THREE.Vector3(0, 1, 0)
const local = new THREE.Vector3()
const screen = new THREE.Vector3()
const size = new THREE.Vector3()
const middle = new THREE.Vector3()

// The bounds of a station model in its own frame: the plinth it stands on,
// which is the root's own mesh, each part built on top of it, and all of
// those parts together.
function outline(model: THREE.Object3D) {
  model.updateMatrixWorld(true)
  const root = model.children[0]
  const plinth = new THREE.Box3()
  if (root instanceof THREE.Mesh) {
    root.geometry.computeBoundingBox()
    plinth.copy(root.geometry.boundingBox!).applyMatrix4(root.matrixWorld)
  }
  const parts = root.children.map((child) => new THREE.Box3().setFromObject(child))
  const building = parts.reduce((all, part) => all.union(part), new THREE.Box3())
  return { plinth, parts, building }
}

// A point `height` above the ground, `x` across and `z` ahead of a station's
// foot, in the station's own frame. The ground there is the planet's curve,
// not the flat plane the station stands on.
function aboveGround(radius: number, x: number, z: number, height: number) {
  const point = new THREE.Vector3(x, radius, z).normalize().multiplyScalar(radius + height)
  point.y -= radius
  return point
}

// The bay's floor and walls, bent to follow the planet so they hug the
// ground instead of lifting off it towards their ends.
function curvedBay(radius: number) {
  const floor = new THREE.PlaneGeometry(BAY.width, BAY.depth, 8, 10).rotateX(-Math.PI / 2)
  const position = floor.attributes.position
  for (let i = 0; i < position.count; i++) {
    const point = aboveGround(radius, position.getX(i), position.getZ(i) + BAY.offset, 0.05)
    position.setXYZ(i, point.x, point.y, point.z)
  }
  floor.computeVertexNormals()

  const corners = [
    [-BAY.width / 2, -BAY.depth / 2],
    [BAY.width / 2, -BAY.depth / 2],
    [BAY.width / 2, BAY.depth / 2],
    [-BAY.width / 2, BAY.depth / 2],
  ]
  const segments = 8
  const vertices: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  corners.forEach(([ax, az], side) => {
    const [bx, bz] = corners[(side + 1) % 4]
    const first = vertices.length / 3
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const x = ax + (bx - ax) * t
      const z = az + (bz - az) * t + BAY.offset
      vertices.push(...aboveGround(radius, x, z, 0.02).toArray(), ...aboveGround(radius, x, z, BAY.wall).toArray())
      uvs.push(t, 0, t, 1)
      if (i < segments) {
        const a = first + i * 2
        indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3)
      }
    }
  })
  const walls = new THREE.BufferGeometry()
  walls.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  walls.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  walls.setIndex(indices)
  return { floor, walls }
}

const bayVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// The floor glows at its rim and fills in as the rover settles; the walls
// fade out upwards like a beam of light.
const floorFragment = /* glsl */ `
  uniform vec3 uColour;
  uniform float uTime;
  uniform float uProgress;
  uniform vec2 uSize;
  varying vec2 vUv;
  void main() {
    vec2 fromEdge = min(vUv, 1.0 - vUv) * uSize;
    float edge = min(fromEdge.x, fromEdge.y);
    float rim = 1.0 - smoothstep(0.0, 0.12, edge);
    float pulse = 0.5 + 0.5 * sin(uTime * 3.0);
    float fill = 0.16 + 0.08 * pulse + 0.45 * uProgress;
    gl_FragColor = vec4(uColour, max(rim * (0.85 + 0.15 * uProgress), fill));
  }
`

const wallFragment = /* glsl */ `
  uniform vec3 uColour;
  uniform float uTime;
  uniform float uProgress;
  varying vec2 vUv;
  void main() {
    float pulse = 0.5 + 0.5 * sin(uTime * 3.0);
    float fade = pow(1.0 - vUv.y, 1.6);
    gl_FragColor = vec4(uColour, fade * (0.5 + 0.15 * pulse + 0.35 * uProgress));
  }
`

export interface Site {
  station: Station
  // Unit vector from the planet's centre to the station.
  direction: THREE.Vector3
  // Where the rover's camera head looks when it is close.
  gazePoint: THREE.Vector3
  orientation: THREE.Quaternion
  inverse: THREE.Quaternion
  tagPoint: THREE.Vector3
  bayCentre: THREE.Vector3
  uniforms: { uColour: { value: THREE.Color }; uTime: { value: number }; uProgress: { value: number } }
  progress: number
  // A bay only opens again once the rover has driven out of it.
  armed: boolean
  visited: boolean
}

// Places every station on the planet: its model, named after the station,
// and a glowing bay in front of it. Parking in the bay opens the panel.
export class Stations {
  readonly clearings: Clearing[] = []
  readonly sites: Site[] = []
  // The station the rover is closest to, if it is near any.
  nearest: Site | null = null
  private time = 0

  constructor(
    scene: THREE.Scene,
    physics: Physics,
    private radius: number,
    stations: Station[],
    models: Record<string, THREE.Object3D>,
  ) {
    const bay = curvedBay(radius)

    for (const station of stations) {
      const up = directionAt(station.place.lat, station.place.lon)
      const orientation = facing(up, NORTH)
      if (station.place.turn) {
        orientation.multiply(new THREE.Quaternion().setFromAxisAngle(NORTH, THREE.MathUtils.degToRad(station.place.turn)))
      }
      const at = (x: number, y: number, z: number) => new THREE.Vector3(x, radius + y, z).applyQuaternion(orientation)

      const group = new THREE.Group()
      group.position.copy(at(0, 0, 0))
      group.quaternion.copy(orientation)
      scene.add(group)

      const model = models[station.id]
      const { plinth, parts, building } = outline(model)
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) child.castShadow = child.receiveShadow = true
      })
      group.add(model)

      // A box round the plinth and one round each part on it, so the rover
      // bumps into what it sees rather than into one big block.
      const body = physics.world.createRigidBody(
        RAPIER.RigidBodyDesc.fixed().setTranslation(group.position.x, group.position.y, group.position.z).setRotation(orientation),
      )
      for (const box of [plinth, ...parts]) {
        if (box.isEmpty()) continue
        box.getSize(size).multiplyScalar(0.5)
        box.getCenter(middle)
        physics.world.createCollider(
          RAPIER.ColliderDesc.cuboid(size.x, size.y, size.z).setTranslation(middle.x, middle.y, middle.z),
          body,
        )
      }

      const uniforms = {
        uColour: { value: new THREE.Color(BAY_COLOUR) },
        uTime: { value: 0 },
        uProgress: { value: 0 },
      }
      const glow = { transparent: true, depthWrite: false }
      const floor = new THREE.Mesh(
        bay.floor,
        new THREE.ShaderMaterial({
          ...glow,
          uniforms: { ...uniforms, uSize: { value: new THREE.Vector2(BAY.width, BAY.depth) } },
          vertexShader: bayVertex,
          fragmentShader: floorFragment,
        }),
      )
      const wall = new THREE.ShaderMaterial({
        ...glow,
        side: THREE.DoubleSide,
        uniforms,
        vertexShader: bayVertex,
        fragmentShader: wallFragment,
      })
      group.add(floor, new THREE.Mesh(bay.walls, wall))

      this.sites.push({
        station,
        direction: up.clone(),
        gazePoint: at(0, 1.6, 0),
        orientation,
        inverse: orientation.clone().invert(),
        tagPoint: at(0, building.max.y + 1.2, 0),
        bayCentre: at(0, 0, BAY.offset),
        uniforms,
        progress: 0,
        armed: true,
        visited: false,
      })
      this.clearings.push({ direction: at(0, 0, BAY.offset / 2).normalize(), distance: 10 })
    }
  }

  update(delta: number, rover: Rover, camera: THREE.Camera) {
    this.time += delta
    const position = rover.object.position
    let nearest: Site | null = null
    let nearestDistance = NEAR

    for (const site of this.sites) {
      site.uniforms.uTime.value = this.time

      const distance = position.distanceTo(site.bayCentre)
      if (distance < nearestDistance) {
        nearest = site
        nearestDistance = distance
      }

      local.copy(position).applyQuaternion(site.inverse)
      const inside =
        Math.abs(local.x) < BAY.width / 2 - BAY_MARGIN.x &&
        Math.abs(local.z - BAY.offset) < BAY.depth / 2 - BAY_MARGIN.z &&
        local.y < this.radius + 2
      if (!inside) site.armed = true

      const parking = inside && site.armed && Math.abs(rover.speed) < PARKED_SPEED && rover.grounded
      site.progress = parking ? site.progress + delta / PARK_TIME : Math.max(0, site.progress - delta * 3)
      site.uniforms.uProgress.value = Math.min(site.progress, 1)

      if (site.progress >= 1) {
        site.progress = 0
        site.armed = false
        site.visited = true
        ui.set({ open: site.station })
      }
    }

    this.nearest = nearest
    ui.set({ nearby: nearest?.station ?? null })
    if (nearest) {
      screen.copy(nearest.tagPoint).project(camera)
      tag.onScreen = screen.z < 1 && Math.abs(screen.x) < 1.1 && Math.abs(screen.y) < 1.1
      tag.x = ((screen.x + 1) / 2) * window.innerWidth
      tag.y = ((1 - screen.y) / 2) * window.innerHeight
      tag.progress = Math.min(nearest.progress, 1)
    }
  }
}
