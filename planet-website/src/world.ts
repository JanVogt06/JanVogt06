import RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import { stations } from './content/stations'
import { labels, ui, type Mode } from './ui/store'
import { Ambience } from './world/Ambience'
import { Apples } from './world/Apples'
import { Bots } from './world/Bots'
import { Chart } from './world/Chart'
import { DayCycle } from './world/DayCycle'
import { Director, type Rig } from './world/Director'
import { Dust } from './world/Dust'
import { Fireflies } from './world/Fireflies'
import { FollowCamera } from './world/FollowCamera'
import { Input } from './world/Input'
import { Landmarks } from './world/Landmarks'
import { Lanterns } from './world/Lanterns'
import { Lights } from './world/Lights'
import { MenuCamera } from './world/MenuCamera'
import { Nature } from './world/Nature'
import { loadModels } from './world/models'
import { Pendulum } from './world/Pendulum'
import { Physics } from './world/Physics'
import { PaperPlanes } from './world/PaperPlanes'
import { Planet } from './world/Planet'
import { PlanetCamera } from './world/PlanetCamera'
import { Props } from './world/Props'
import { Rocket } from './world/Rocket'
import { Rover } from './world/Rover'
import { Satellites } from './world/Satellites'
import { Sky } from './world/Sky'
import { Stage } from './world/Stage'
import { Stations } from './world/Stations'
import { clear, soften } from './world/Toy'
import { TouchPilot } from './world/TouchPilot'
import { TourCamera } from './world/TourCamera'
import { Weather } from './world/Weather'
import { path, Terrain } from './world/Terrain'

const RADIUS = 45
// Paths from the landing spot to the first station, round each ring of
// stations, across between the rings, and on down to the sights of the
// southern half.
const ROUTES = [
  ['start', 'about'], ['about', 'riptide'], ['about', 'spesen'],
  ['riptide', 'sattrak'], ['sattrak', 'solarflow'], ['solarflow', 'spesen'], ['spesen', 'riptide'],
  ['contact', 'engagement'], ['engagement', 'awards'], ['awards', 'pichunter'], ['pichunter', 'cryptborne'], ['cryptborne', 'contact'],
  ['riptide', 'contact'], ['sattrak', 'engagement'], ['solarflow', 'awards'], ['spesen', 'cryptborne'],
  ['engagement', 'pendulum'], ['awards', 'pendulum'], ['pichunter', 'rocket'], ['cryptborne', 'rocket'],
  ['contact', 'weather'], ['weather', 'observatory'], ['pendulum', 'observatory'], ['rocket', 'observatory'],
]
// A press and release closer together than this, in pixels, is a tap.
const TAP = 6

const screen = new THREE.Vector3()
const above = new THREE.Vector3()
const toCamera = new THREE.Vector3()

// Lets the browser paint before a long stretch of work. A tab in the
// background gets no animation frames, so a timer stands in for them.
function breathe() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve))
    window.setTimeout(resolve, 100)
  })
}

// Loads the models and builds the planet, reporting how far it has got,
// then runs it in whichever mode the page is in.
export async function createWorld(report: (fraction: number) => void) {
  report(0.05)
  const [, models] = await Promise.all([
    RAPIER.init(),
    loadModels(['rover', 'satellite', 'nature', 'ramp', 'landmarks', 'critters', ...stations.map((station) => station.id)], (fraction) =>
      report(0.05 + 0.85 * fraction),
    ),
  ])
  report(0.92)
  await breathe()

  const canvas = document.querySelector<HTMLCanvasElement>('#world')!
  const stage = new Stage(canvas)
  const physics = new Physics(25)
  const sites = new Stations(stage.scene, physics, RADIUS, stations, models)
  const sights = new Landmarks(stage.scene, physics, RADIUS, models.landmarks)
  // Paths run into each bay; the landing spot is the north pole.
  const pointOf = (id: string) =>
    id === 'start'
      ? new THREE.Vector3(0, 1, 0)
      : (sites.sites.find((site) => site.station.id === id)?.bayCentre ?? sights.pointOf(id)!)
  const terrain = new Terrain(
    RADIUS,
    [
      { direction: new THREE.Vector3(0, 1, 0), reach: 4 },
      ...sites.sites.flatMap((site) => [
        { direction: site.direction, reach: 6.5 },
        { direction: site.bayCentre.clone().normalize(), reach: 4 },
      ]),
      ...sights.flats,
    ],
    ROUTES.map(([from, to]) => path(pointOf(from), pointOf(to))),
  )
  const planet = new Planet(stage.scene, physics, terrain)
  const lanterns = new Lanterns(stage.scene, physics, terrain, models.landmarks, terrain.flats)
  const input = new Input()
  const spawn = new THREE.Vector3(0, planet.radius + 0.6, 0)
  const clearings = [{ direction: spawn, distance: 6.5 }, ...sites.clearings, ...sights.clearings, ...lanterns.clearings]
  new Props(stage.scene, physics, terrain, clearings, models.ramp)
  const nature = new Nature(stage.scene, physics, terrain, models.nature, clearings)
  const sky = new Sky(stage.scene, models.nature, planet.radius)
  const rover = new Rover(stage.scene, physics, input, spawn, models.rover)
  const view = new FollowCamera(stage.camera, rover)
  const director = new Director(stage.camera, planet.radius)
  const planetView = new PlanetCamera(stage.camera, canvas, planet.radius)
  const rigs: Record<Exclude<Mode, 'text'>, Rig> = {
    menu: new MenuCamera(stage.camera, rover),
    drive: view,
    tour: new TourCamera(stage.camera, sites.sites, rover, planet.radius),
    planet: planetView,
  }
  const lights = new Lights(stage.scene, director)
  const satellites = new Satellites(stage.scene, models.satellite, planet.radius)
  const ambience = new Ambience(models, satellites, lights)
  const chart = new Chart(sites, view)
  const pilot = new TouchPilot(rover, view)
  const bots = new Bots(stage.scene, models.critters, terrain, terrain.flats, rover)
  const planes = new PaperPlanes(stage.scene, models.critters, planet.radius)
  const fireflies = new Fireflies(stage.scene, terrain, stage.renderer)
  const apples = new Apples(
    stage.scene,
    physics,
    nature.placements.get('Tree_Apple')!,
    (models.nature.getObjectByName('Tree_Apple_Apples') as THREE.Mesh).material as THREE.Material,
  )
  const rocket = new Rocket(stage.scene, physics, stage.renderer, sights.part('Rocket_Ship'))
  const pendulum = new Pendulum(
    stage.scene,
    physics,
    sights.part('Pendulum_Arm'),
    sights.part('Pendulum_Pegs') as THREE.Mesh,
    sights.part('Pendulum_PegCaps') as THREE.Mesh,
  )
  // The meadow has its own shader; everything standing on it is a toy.
  soften(stage.scene, [planet.mesh])
  const day = new DayCycle()
  day.lightWindows(stage.scene)
  const weather = new Weather(stage.scene, director)
  const dust = new Dust(stage.scene, rover, stage.renderer)

  // Colours the whole scene for the hour and the weather.
  function paint(delta: number) {
    day.update(delta)
    weather.update(delta, day.daylight)
    weather.tint(day.light)
    sky.paint(day.light)
    lights.paint(day.light)
    stage.paint(day.light)
    rover.headlights(1 - day.daylight)
    lanterns.glow(1 - day.daylight)
  }
  paint(0)

  // Only driving takes the keys; the planet view takes the pointer.
  function apply() {
    const { mode, open, focus } = ui.get()
    const focused = sites.sites.find((site) => site.station.id === focus)
    if (mode === 'planet' && focused && rigs.planet !== lastRig) planetView.face(focused.direction)
    if (mode !== 'text') {
      lastRig = rigs[mode]
      director.use(rigs[mode])
    }
    input.enabled = mode === 'drive' && !open
    planetView.enabled = mode === 'planet' && !open
    if (mode !== 'drive') ui.set({ nearby: null })
  }
  let lastRig: Rig | null = null
  ui.subscribe(apply)
  apply()

  // A tap on a station in the planet view opens its panel.
  const raycaster = new THREE.Raycaster()
  let pressed: { x: number; y: number } | null = null
  canvas.addEventListener('pointerdown', (event) => (pressed = { x: event.clientX, y: event.clientY }))
  canvas.addEventListener('pointerup', (event) => {
    if (ui.get().mode !== 'planet' || !pressed) return
    const moved = Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y)
    pressed = null
    if (moved > TAP) return
    raycaster.setFromCamera(
      new THREE.Vector2((event.clientX / innerWidth) * 2 - 1, -(event.clientY / innerHeight) * 2 + 1),
      stage.camera,
    )
    const hit = raycaster.intersectObjects(sites.sites.map((site) => site.group), true)[0]
    const site = hit && sites.sites.find((site) => site.group.getObjectById(hit.object.id))
    if (site) ui.set({ open: site.station })
  })
  labels.points = sites.sites.map((site) => ({ id: site.station.id, x: 0, y: 0, shown: false }))

  // Writes where each station's label goes in the planet view: over the
  // station, and only while it faces the camera.
  function placeLabels() {
    sites.sites.forEach((site, i) => {
      const label = labels.points[i]
      toCamera.copy(stage.camera.position).normalize()
      screen.copy(site.tagPoint).project(stage.camera)
      label.shown = site.direction.dot(toCamera) > 0.25 && Math.abs(screen.x) < 1 && Math.abs(screen.y) < 1
      label.x = ((screen.x + 1) / 2) * innerWidth
      label.y = ((1 - screen.y) / 2) * innerHeight
    })
  }

  // While a station's panel is open the world holds still behind it, and
  // with only text on show nothing is drawn at all.
  function frame(delta: number) {
    const { mode, open } = ui.get()
    if (mode === 'text') return
    const driving = mode === 'drive'
    if (!open) {
      if (driving) pilot.update(delta)
      physics.update(delta)
      rover.update(delta)
      if (driving) {
        sites.update(delta, rover, stage.camera)
        rover.lookAt(sites.nearest?.gazePoint ?? null)
      } else {
        // In the menu the rover looks at whoever is looking at it.
        rover.lookAt(mode === 'menu' ? stage.camera.position : null)
      }
      satellites.update(delta)
      ambience.update(delta)
      sights.update(delta, rover.object.position)
      rocket.update(delta, rover.object.position, day.daylight)
      pendulum.update(delta)
      apples.update(delta, rover)
      dust.update(delta, day.daylight)
      bots.update(delta)
      planes.update(delta)
      fireflies.update(delta, 1 - day.daylight)
      paint(delta)
      sky.update(delta, lights.sunDirection)
    }
    director.update(delta)
    // Trees between the camera and the rover thin out, while the rover is
    // what the camera is looking at.
    above.copy(rover.object.position).normalize()
    clear.focus.value.copy(rover.object.position).addScaledVector(above, 0.6)
    clear.radius.value = driving || mode === 'menu' ? 2.4 : 0
    sky.reach(stage.camera.position.length() - planet.radius)
    lights.update()
    if (driving) chart.update()
    if (mode === 'planet') placeLabels()
    stage.render()
  }

  if (import.meta.env.DEV) {
    Object.assign(window, { planet: { stage, physics, rover, view, lights, input, sites, satellites, ui, frame, day, weather, director } })
  }

  const timer = new THREE.Timer()
  stage.renderer.setAnimationLoop((time) => {
    timer.update(time)
    frame(timer.getDelta())
  })
}
