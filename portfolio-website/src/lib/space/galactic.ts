import * as THREE from "three"

export const GALACTIC_POLE = new THREE.Vector3(0.42, 0.9, -0.15).normalize()

export const GALACTIC_SPIN = Math.PI * 0.5

export const galacticOrientation = () =>
    new THREE.Quaternion()
        .setFromAxisAngle(GALACTIC_POLE, GALACTIC_SPIN)
        .multiply(
            new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                GALACTIC_POLE,
            ),
        )
