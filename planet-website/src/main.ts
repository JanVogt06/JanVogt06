import RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import './style.css'
import { stations } from './content/stations'
import { mountUi } from './ui/mount'
import { ui } from './ui/store'
import { Ambience } from './world/Ambience'
import { Chart } from './world/Chart'
import { FollowCamera } from './world/FollowCamera'
import { Input } from './world/Input'
import { Lights } from './world/Lights'
import { Nature } from './world/Nature'
import { loadModels } from './world/models'
import { Physics } from './world/Physics'
import { Planet } from './world/Planet'
import { Props } from './world/Props'
import { Rover } from './world/Rover'
import { Satellites } from './world/Satellites'
import { Sky } from './world/Sky'
import { Stage } from './world/Stage'
import { Stations } from './world/Stations'
import { path, Terrain } from './world/Terrain'

const [, models] = await Promise.all([RAPIER.init(), loadModels(['rover', 'satellite', 'nature', 'ramp', ...stations.map((station) => station.id)])])

const stage = new Stage(document.querySelector<HTMLCanvasElement>('#world')!)
const physics = new Physics(25)
const RADIUS = 45
// Paths from the landing spot to the first station, round each ring of
// stations, and across between the rings.
const ROUTES = [
  ['start', 'about'], ['about', 'riptide'], ['about', 'spesen'],
  ['riptide', 'sattrak'], ['sattrak', 'solarflow'], ['solarflow', 'spesen'], ['spesen', 'riptide'],
  ['contact', 'engagement'], ['engagement', 'awards'], ['awards', 'pichunter'], ['pichunter', 'cryptborne'], ['cryptborne', 'contact'],
  ['riptide', 'contact'], ['sattrak', 'engagement'], ['solarflow', 'awards'], ['spesen', 'cryptborne'],
]
const sites = new Stations(stage.scene, physics, RADIUS, stations, models)
// Paths run into each bay; the landing spot is the north pole.
const pointOf = (id: string) =>
  id === 'start' ? new THREE.Vector3(0, 1, 0) : sites.sites.find((site) => site.station.id === id)!.bayCentre
const terrain = new Terrain(
  RADIUS,
  [
    { direction: new THREE.Vector3(0, 1, 0), reach: 4 },
    ...sites.sites.flatMap((site) => [
      { direction: site.direction, reach: 6.5 },
      { direction: site.bayCentre.clone().normalize(), reach: 4 },
    ]),
  ],
  ROUTES.map(([from, to]) => path(pointOf(from), pointOf(to))),
)
const planet = new Planet(stage.scene, physics, terrain)
const input = new Input()
const spawn = new THREE.Vector3(0, planet.radius + 0.6, 0)
const clearings = [{ direction: spawn, distance: 6.5 }, ...sites.clearings]
new Props(stage.scene, physics, terrain, clearings, models.ramp)
new Nature(stage.scene, physics, terrain, models.nature, clearings)
const sky = new Sky(stage.scene, models.nature, planet.radius)
const rover = new Rover(stage.scene, physics, input, spawn, models.rover)
const view = new FollowCamera(stage.camera, rover)
const lights = new Lights(stage.scene, view)
const satellites = new Satellites(stage.scene, models.satellite, planet.radius)
const ambience = new Ambience(models, satellites, lights)
const chart = new Chart(sites, view)

mountUi(document.querySelector<HTMLElement>('#ui')!)
let paused = false
ui.subscribe(() => {
  if (Boolean(ui.get().open) === paused) return
  paused = !paused
  input.enabled = !paused
})

// While a station's panel is open the world holds still behind it.
function frame(delta: number) {
  if (!ui.get().open) {
    physics.update(delta)
    rover.update(delta)
    sites.update(delta, rover, stage.camera)
    rover.lookAt(sites.nearest?.gazePoint ?? null)
    satellites.update(delta)
    ambience.update(delta)
    sky.update(delta)
  }
  view.update(delta)
  lights.update()
  chart.update()
  stage.render()
}

if (import.meta.env.DEV) Object.assign(window, { planet: { stage, physics, rover, view, lights, input, sites, satellites, ui, frame } })

const timer = new THREE.Timer()
stage.renderer.setAnimationLoop((time) => {
  timer.update(time)
  frame(timer.getDelta())
})
