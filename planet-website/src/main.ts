import RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import './style.css'
import { stations } from './content/stations'
import roverModel from './models/rover.glb?url'
import { mountUi } from './ui/mount'
import { ui } from './ui/store'
import { FollowCamera } from './world/FollowCamera'
import { Input } from './world/Input'
import { Lights } from './world/Lights'
import { Physics } from './world/Physics'
import { Planet } from './world/Planet'
import { Props } from './world/Props'
import { Rover } from './world/Rover'
import { Stage } from './world/Stage'
import { Stations } from './world/Stations'

const [, rover3d] = await Promise.all([RAPIER.init(), new GLTFLoader().loadAsync(roverModel)])

const stage = new Stage(document.querySelector<HTMLCanvasElement>('#world')!)
const physics = new Physics(25)
const planet = new Planet(stage.scene, physics, 45)
const input = new Input()
const spawn = new THREE.Vector3(0, planet.radius + 0.6, 0)
const sites = new Stations(stage.scene, physics, planet.radius, stations)
new Props(stage.scene, physics, planet.radius, [{ direction: spawn, distance: 6.5 }, ...sites.clearings])
const rover = new Rover(stage.scene, physics, input, spawn, rover3d.scene)
const view = new FollowCamera(stage.camera, rover)
const lights = new Lights(stage.scene, view)

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
  }
  view.update(delta)
  lights.update()
  stage.render()
}

if (import.meta.env.DEV) Object.assign(window, { planet: { stage, physics, rover, view, input, sites, ui, frame } })

const timer = new THREE.Timer()
stage.renderer.setAnimationLoop((time) => {
  timer.update(time)
  frame(timer.getDelta())
})
