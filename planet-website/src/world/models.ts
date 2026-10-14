import type * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

// Every model exported from art/world.blend, by file name.
const urls = import.meta.glob<string>('../models/*.glb', { query: '?url', import: 'default', eager: true })

export async function loadModels(names: string[]) {
  const loader = new GLTFLoader()
  const scenes = await Promise.all(
    names.map(async (name) => {
      const url = urls[`../models/${name}.glb`]
      if (!url) throw new Error(`No model called ${name}`)
      return [name, (await loader.loadAsync(url)).scene] as const
    }),
  )
  return Object.fromEntries(scenes) as Record<string, THREE.Group>
}
