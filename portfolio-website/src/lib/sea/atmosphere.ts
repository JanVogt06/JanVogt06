/**
 * Single scattering in a thin shell of air around a planet the size of the
 * Earth: Rayleigh for the blue, Mie for the haze around the sun, and ozone,
 * which is what keeps the sky blue once the sun has set. The same model runs
 * twice: in GLSL to paint the sky, and here to find the colour of the light
 * and how much to expose for it.
 */

export const EARTH = 6360e3
export const TOP = 6420e3
export const EYE_ALTITUDE = 2

const RAYLEIGH_HEIGHT = 7994
const MIE_HEIGHT = 1200
const RAYLEIGH = [5.802e-6, 13.558e-6, 33.1e-6]
const MIE = 3.996e-6
const MIE_EXTINCTION = 4.44e-6
const OZONE = [0.65e-6, 1.881e-6, 0.085e-6]
const MIE_G = 0.8

const VIEW_STEPS = 24
const LIGHT_STEPS = 8

type Vec3 = [number, number, number]

const ozoneDensity = (h: number) => Math.max(0, 1 - Math.abs(h - 25e3) / 15e3)

/** Distance to where a ray from height `r` (on the axis) at `mu` = cos of
 *  its angle from the zenith leaves the shell, or -1 if it hits the ground. */
const exit = (r: number, mu: number, sphere: number) => {
    const b = r * mu
    const c = r * r - sphere * sphere
    const d = b * b - c
    if (d < 0) return -1
    return -b + Math.sqrt(d)
}

const hitsGround = (r: number, mu: number) => {
    if (mu >= 0) return false
    const b = r * mu
    return b * b - (r * r - EARTH * EARTH) >= 0
}

/** Optical depth (rayleigh, mie, ozone) from height `r` along `mu` to space. */
const depth = (r: number, mu: number): Vec3 | null => {
    if (hitsGround(r, mu)) return null
    const length = exit(r, mu, TOP)
    const step = length / LIGHT_STEPS
    let dr = 0
    let dm = 0
    let dz = 0
    for (let i = 0; i < LIGHT_STEPS; i++) {
        const t = (i + 0.5) * step
        const h = Math.sqrt(r * r + t * t + 2 * r * t * mu) - EARTH
        dr += Math.exp(-h / RAYLEIGH_HEIGHT) * step
        dm += Math.exp(-h / MIE_HEIGHT) * step
        dz += ozoneDensity(h) * step
    }
    return [dr, dm, dz]
}

const extinction = (dr: number, dm: number, dz: number, channel: number) =>
    Math.exp(-(RAYLEIGH[channel] * dr + MIE_EXTINCTION * dm + OZONE[channel] * dz))

/** How much of a light from direction `dir` reaches the eye, per channel. */
export const transmittance = (dir: Vec3): Vec3 => {
    const d = depth(EARTH + EYE_ALTITUDE, dir[1])
    if (!d) return [0, 0, 0]
    return [0, 1, 2].map((c) => extinction(d[0], d[1], d[2], c)) as Vec3
}

/** Sky radiance seen along `dir` for a light of unit strength from `light`. */
export const scatter = (dir: Vec3, light: Vec3, haze = 1): Vec3 => {
    const r0 = EARTH + EYE_ALTITUDE
    const mu = Math.max(dir[1], 0.0)
    const length = exit(r0, mu, TOP)
    const step = length / VIEW_STEPS
    const cosTheta = dir[0] * light[0] + dir[1] * light[1] + dir[2] * light[2]
    const phaseR = (3 / (16 * Math.PI)) * (1 + cosTheta * cosTheta)
    const g2 = MIE_G * MIE_G
    const phaseM =
        ((3 / (8 * Math.PI)) * ((1 - g2) * (1 + cosTheta * cosTheta))) /
        ((2 + g2) * Math.pow(1 + g2 - 2 * MIE_G * cosTheta, 1.5))

    const sumR: Vec3 = [0, 0, 0]
    const sumM: Vec3 = [0, 0, 0]
    let odR = 0
    let odM = 0
    let odZ = 0
    for (let i = 0; i < VIEW_STEPS; i++) {
        const t = (i + 0.5) * step
        const px = dir[0] * t
        const py = r0 + mu * t
        const pz = dir[2] * t
        const r = Math.sqrt(px * px + py * py + pz * pz)
        const h = r - EARTH
        const hr = Math.exp(-h / RAYLEIGH_HEIGHT) * step
        const hm = Math.exp(-h / MIE_HEIGHT) * step * haze
        odR += hr
        odM += hm
        odZ += ozoneDensity(h) * step
        const lightMu = (px * light[0] + py * light[1] + pz * light[2]) / r
        const toLight = depth(r, lightMu)
        if (!toLight) continue
        for (let c = 0; c < 3; c++) {
            const tau = extinction(odR + toLight[0], odM + toLight[1] * haze, odZ + toLight[2], c)
            sumR[c] += tau * hr
            sumM[c] += tau * hm
        }
    }
    return [0, 1, 2].map((c) => sumR[c] * RAYLEIGH[c] * phaseR + sumM[c] * MIE * phaseM) as Vec3
}

export const ATMOSPHERE_GLSL = /* glsl */ `
    const float EARTH = ${EARTH.toFixed(1)};
    const float TOP = ${TOP.toFixed(1)};
    const float EYE_ALTITUDE = ${EYE_ALTITUDE.toFixed(1)};
    const float RAYLEIGH_HEIGHT = ${RAYLEIGH_HEIGHT.toFixed(1)};
    const float MIE_HEIGHT = ${MIE_HEIGHT.toFixed(1)};
    const vec3 RAYLEIGH = vec3(${RAYLEIGH.map((v) => v.toExponential(4)).join(", ")});
    const float MIE = ${MIE.toExponential(4)};
    const float MIE_EXTINCTION = ${MIE_EXTINCTION.toExponential(4)};
    const vec3 OZONE = vec3(${OZONE.map((v) => v.toExponential(4)).join(", ")});
    const float MIE_G = ${MIE_G.toFixed(3)};
    const int VIEW_STEPS = ${VIEW_STEPS};
    const int LIGHT_STEPS = ${LIGHT_STEPS};

    float ozoneDensity(float h) {
        return max(0.0, 1.0 - abs(h - 25e3) / 15e3);
    }

    float shellExit(float r, float mu, float sphere) {
        float b = r * mu;
        float d = b * b - (r * r - sphere * sphere);
        return d < 0.0 ? -1.0 : -b + sqrt(d);
    }

    bool hitsGround(float r, float mu) {
        float b = r * mu;
        return mu < 0.0 && b * b - (r * r - EARTH * EARTH) >= 0.0;
    }

    bool opticalDepth(float r, float mu, out vec3 od) {
        od = vec3(0.0);
        if (hitsGround(r, mu)) return false;
        float step = shellExit(r, mu, TOP) / float(LIGHT_STEPS);
        for (int i = 0; i < LIGHT_STEPS; i++) {
            float t = (float(i) + 0.5) * step;
            float h = sqrt(r * r + t * t + 2.0 * r * t * mu) - EARTH;
            od += vec3(exp(-h / RAYLEIGH_HEIGHT), exp(-h / MIE_HEIGHT), ozoneDensity(h)) * step;
        }
        return true;
    }

    vec3 extinction(vec3 od) {
        return exp(-(RAYLEIGH * od.x + MIE_EXTINCTION * od.y + OZONE * od.z));
    }

    vec3 scatter(vec3 dir, vec3 light, float haze) {
        float r0 = EARTH + EYE_ALTITUDE;
        float mu = max(dir.y, 0.0);
        float step = shellExit(r0, mu, TOP) / float(VIEW_STEPS);
        float cosTheta = dot(dir, light);
        float phaseR = 3.0 / (16.0 * 3.14159265) * (1.0 + cosTheta * cosTheta);
        float g2 = MIE_G * MIE_G;
        float phaseM = 3.0 / (8.0 * 3.14159265) * ((1.0 - g2) * (1.0 + cosTheta * cosTheta))
            / ((2.0 + g2) * pow(1.0 + g2 - 2.0 * MIE_G * cosTheta, 1.5));

        vec3 sumR = vec3(0.0);
        vec3 sumM = vec3(0.0);
        vec3 od = vec3(0.0);
        for (int i = 0; i < VIEW_STEPS; i++) {
            float t = (float(i) + 0.5) * step;
            vec3 p = vec3(dir.x * t, r0 + mu * t, dir.z * t);
            float r = length(p);
            float h = r - EARTH;
            float hr = exp(-h / RAYLEIGH_HEIGHT) * step;
            float hm = exp(-h / MIE_HEIGHT) * step * haze;
            od += vec3(hr, hm, ozoneDensity(h) * step);
            vec3 toLight;
            if (!opticalDepth(r, dot(p, light) / r, toLight)) continue;
            vec3 tau = extinction(od + vec3(toLight.x, toLight.y * haze, toLight.z));
            sumR += tau * hr;
            sumM += tau * hm;
        }
        return sumR * RAYLEIGH * phaseR + sumM * MIE * phaseM;
    }
`
