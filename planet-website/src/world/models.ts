import type * as THREE from 'three'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

// Every model exported from art/world.blend, by file name.
const urls = import.meta.glob<string>('../models/*.glb', { query: '?url', import: 'default', eager: true })

// Loads the named models, reporting the share of their bytes that has
// arrived so far.
export async function loadModels(names: string[], onProgress?: (fraction: number) => void) {
  // The meshes are Draco-compressed; the decoder in public/draco is the one
  // that ships with three (examples/jsm/libs/draco/gltf).
  const draco = new DRACOLoader().setDecoderPath(`${import.meta.env.BASE_URL}draco/`)
  const loader = new GLTFLoader().setDRACOLoader(draco)
  const received: Record<string, { loaded: number; total: number }> = {}
  const report = () => {
    const parts = Object.values(received)
    const total = parts.reduce((sum, part) => sum + part.total, 0)
    // Until every download has announced its size, count the missing ones
    // as not started.
    if (total > 0) onProgress?.((parts.reduce((sum, part) => sum + part.loaded, 0) / total) * (parts.length / names.length))
  }
  const scenes = await Promise.all(
    names.map(async (name) => {
      const url = urls[`../models/${name}.glb`]
      if (!url) throw new Error(`No model called ${name}`)
      const gltf = await loader.loadAsync(url, (event) => {
        received[name] = { loaded: event.loaded, total: event.total || event.loaded }
        report()
      })
      return [name, gltf.scene] as const
    }),
  )
  draco.dispose()
  return Object.fromEntries(scenes) as Record<string, THREE.Group>
}
