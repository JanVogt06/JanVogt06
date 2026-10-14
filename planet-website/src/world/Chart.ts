import * as THREE from 'three'
import { minimap, type MapPoint } from '../ui/store'
import type { FollowCamera } from './FollowCamera'
import type { Stations } from './Stations'

const right = new THREE.Vector3()
const across = new THREE.Vector3()

// Projects the stations onto the minimap: an azimuthal map of the whole
// planet centred on the rover, turned so the camera's heading points up.
// A station's distance from the centre is its distance along the surface,
// so the far side of the planet lies round the rim.
export class Chart {
  private points: MapPoint[]

  constructor(
    private stations: Stations,
    private view: FollowCamera,
  ) {
    this.points = stations.sites.map(({ station }) => ({
      id: station.id,
      title: station.title,
      colour: station.colour,
      x: 0,
      y: 0,
      visited: false,
    }))
    minimap.points = this.points
  }

  update() {
    const { up, heading } = this.view
    right.crossVectors(heading, up)
    this.stations.sites.forEach((site, i) => {
      const point = this.points[i]
      const cos = THREE.MathUtils.clamp(site.direction.dot(up), -1, 1)
      const reach = Math.acos(cos) / Math.PI
      across.copy(site.direction).addScaledVector(up, -cos)
      const length = across.length()
      point.x = length > 1e-6 ? (across.dot(right) / length) * reach : 0
      point.y = length > 1e-6 ? (-across.dot(heading) / length) * reach : 0
      point.visited = site.visited
    })
    minimap.nearest = this.stations.nearest?.station.id ?? null
  }
}
