import RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import './style.css'
import { FollowCamera } from './world/FollowCamera'
import { Input } from './world/Input'
import { Lights } from './world/Lights'
import { Physics } from './world/Physics'
import { Planet } from './world/Planet'
import { Props } from './world/Props'
import { Rover } from './world/Rover'
import { Stage } from './world/Stage'

await RAPIER.init()

const stage = new Stage(document.querySelector<HTMLCanvasElement>('#world')!)
const physics = new Physics(25)
const planet = new Planet(stage.scene, physics, 32)
const input = new Input()
const spawn = new THREE.Vector3(0, planet.radius + 0.6, 0)
new Props(stage.scene, physics, planet.radius, spawn)
const rover = new Rover(stage.scene, physics, input, spawn)
const view = new FollowCamera(stage.camera, rover)
const lights = new Lights(stage.scene, view)

function frame(delta: number) {
  physics.update(delta)
  rover.update(delta)
  view.update(delta)
  lights.update()
  stage.render()
}

if (import.meta.env.DEV) Object.assign(window, { planet: { stage, physics, rover, view, input, frame } })

const timer = new THREE.Timer()
stage.renderer.setAnimationLoop((time) => {
  timer.update(time)
  frame(timer.getDelta())
})
