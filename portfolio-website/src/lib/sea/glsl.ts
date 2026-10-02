import {ATMOSPHERE_GLSL} from "./atmosphere"

// The sky is painted once per change of light into a small lookup, and every
// surface reads its colour from there: the sea, the panels and the haze all
// fade into the sky of their own bearing, so nothing meets with a seam.
export const SKY = /* glsl */ `
    const float PI = 3.14159265;

    uniform sampler2D uSkyLut;
    uniform vec3 uSunDir;
    uniform vec3 uMoonDir;
    uniform vec3 uSunLight;
    uniform vec3 uMoonLight;
    uniform vec3 uAmbient;
    uniform float uFogDensity;
    uniform float uInvExposure;
    uniform float uTime;

    vec3 skyLut(vec3 dir) {
        float e = asin(clamp(dir.y, 0.0, 1.0));
        vec2 uv = vec2(atan(dir.x, -dir.z) / (2.0 * PI) + 0.5, sqrt(e / (0.5 * PI)));
        return texture2D(uSkyLut, uv).rgb;
    }

    vec3 horizonColor(vec3 dir) {
        return skyLut(normalize(vec3(dir.x, 0.0, dir.z) + vec3(0.0, 1e-4, 0.0)));
    }

    float fogAmount(float dist) {
        return 1.0 - exp(-dist * uFogDensity);
    }

    float hash12(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
    }

    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
                   mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
    }
`

export const lutFragment = /* glsl */ `
    precision highp float;

    ${ATMOSPHERE_GLSL}

    uniform vec3 uSun;
    uniform vec3 uMoon;
    uniform vec3 uMoonShare;
    uniform vec3 uZenith;
    uniform float uHaze;

    varying vec2 vUv;

    void main() {
        float phi = (vUv.x - 0.5) * 6.2831853;
        float e = vUv.y * vUv.y * 1.5707963;
        vec3 dir = vec3(sin(phi) * cos(e), sin(e), -cos(phi) * cos(e));
        vec3 col = scatter(dir, uSun, uHaze);
        if (uMoon.y > -0.2) col += scatter(dir, uMoon, uHaze) * uMoonShare;
        // Single scattering alone leaves the horizon yellow; light that
        // scatters again on its way puts the blue of the sky back into it.
        col += uZenith * pow(1.0 - e / 1.5707963, 8.0);
        gl_FragColor = vec4(col, 1.0);
    }
`

export const skyVertex = /* glsl */ `
    varying vec3 vWorld;

    void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
        gl_Position.z = gl_Position.w;
    }
`

// Discs a little larger than the real ones, which would be a dozen pixels
// across; the bloom does the rest.
export const skyFragment = /* glsl */ `
    precision highp float;

    ${SKY}

    uniform float uClouds;

    varying vec3 vWorld;

    float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 5; i++) {
            v += a * noise(p);
            p = mat2(1.6, 1.2, -1.2, 1.6) * p + vec2(17.1, 9.2);
            a *= 0.5;
        }
        return v;
    }

    float henyey(float c, float g) {
        float g2 = g * g;
        return (1.0 - g2) / (4.0 * PI * pow(1.0 + g2 - 2.0 * g * c, 1.5));
    }

    vec3 disc(vec3 dir, vec3 toward, float radius, vec3 radiance) {
        float angle = acos(clamp(dot(dir, toward), -1.0, 1.0));
        if (angle > radius * 1.2) return vec3(0.0);
        float r = clamp(angle / radius, 0.0, 1.0);
        float limb = 1.0 - 0.55 * (1.0 - sqrt(1.0 - r * r));
        return radiance * limb * (1.0 - smoothstep(0.92, 1.08, angle / radius));
    }

    void main() {
        vec3 dir = normalize(vWorld - cameraPosition);
        vec3 col = skyLut(dir);

        // The mirror below the waterline never draws the discs: on moving
        // water they only ever show as glints, which the sea works out itself.
        float above = step(0.0, cameraPosition.y);
        col += above * disc(dir, uSunDir, 0.0075, uSunLight * 700.0);
        col += above * disc(dir, uMoonDir, 0.0095, uMoonLight * 5.0 * (0.86 + 0.14 * noise((dir.xy - uMoonDir.xy) * 900.0)));

        // A deck of cumulus a couple of kilometres up, lit through by the
        // sun from behind and fading into the haze towards the horizon.
        if (dir.y > 0.0 && uClouds > 0.0) {
            float t = 1800.0 / max(dir.y, 0.015);
            vec2 p = (cameraPosition.xz + dir.xz * t) * 0.00024 + vec2(uTime * 0.0035, uTime * 0.0011);
            float n = fbm(p);
            float density = smoothstep(1.0 - uClouds, 1.0 - uClouds + 0.3, n);
            if (density > 0.0) {
                float toward = fbm(p + uSunDir.xz * 0.06);
                float shade = clamp(1.0 - (toward - n) * 3.5, 0.35, 1.25);
                float c = dot(dir, uSunDir);
                vec3 lit = uSunLight * (0.22 + 1.6 * henyey(c, 0.6)) * shade
                    + uMoonLight * (0.22 + 1.6 * henyey(dot(dir, uMoonDir), 0.6)) * shade;
                vec3 cloud = uAmbient * 0.28 + lit * 0.32;
                cloud = mix(cloud, col, 1.0 - exp(-t * 0.00004));
                col = mix(col, cloud, density * 0.92 * smoothstep(0.0, 0.05, dir.y));
            }
        }

        gl_FragColor = vec4(col, 1.0);
    }
`

export const starVertex = /* glsl */ `
    attribute float aSize;
    attribute float aPhase;

    uniform float uTime;
    uniform float uPixelRatio;

    varying float vTwinkle;
    varying float vLift;

    void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vLift = normalize(world.xyz - cameraPosition).y;
        vTwinkle = 0.7 + 0.3 * sin(uTime * (0.6 + aPhase) + aPhase * 40.0);
        gl_PointSize = aSize * uPixelRatio;
        gl_Position = projectionMatrix * viewMatrix * world;
        gl_Position.z = gl_Position.w * 0.99999;
    }
`

export const starFragment = /* glsl */ `
    precision highp float;

    uniform float uAmount;
    uniform float uInvExposure;

    varying float vTwinkle;
    varying float vLift;

    void main() {
        float d = length(gl_PointCoord - 0.5);
        float core = smoothstep(0.5, 0.0, d);
        float fade = smoothstep(0.02, 0.25, abs(vLift));
        float a = core * core * vTwinkle * uAmount * fade;
        gl_FragColor = vec4(vec3(0.82, 0.88, 1.0) * a * 1.6 * uInvExposure, 1.0);
    }
`

/** The long swell, as Gerstner waves the vertices actually ride. */
const SWELL = /* glsl */ `
    const int SWELLS = 4;
    const vec4 SWELL[4] = vec4[4](
        // direction (radians), wavelength (m), amplitude (m), steepness
        vec4(0.30, 34.0, 0.16, 0.45),
        vec4(-0.45, 21.0, 0.09, 0.5),
        vec4(0.85, 13.0, 0.05, 0.55),
        vec4(-0.1, 8.5, 0.03, 0.6)
    );
`

export const waterVertex = /* glsl */ `
    ${SWELL}

    uniform mat4 textureMatrix;
    uniform float uTime;
    uniform float uSwell;

    varying vec4 vMirror;
    varying vec3 vWorld;
    varying vec3 vNormal;
    varying float vCrest;

    void main() {
        vMirror = textureMatrix * vec4(position, 1.0);
        vec4 world = modelMatrix * vec4(position, 1.0);

        // The swell flattens out before the grid gets too coarse to carry it.
        float dist = length(world.xz - cameraPosition.xz);
        float fade = (1.0 - smoothstep(25.0, 90.0, dist)) * uSwell;

        vec3 offset = vec3(0.0);
        vec3 n = vec3(0.0, 1.0, 0.0);
        float crest = 0.0;
        for (int i = 0; i < SWELLS; i++) {
            vec4 s = SWELL[i];
            vec2 d = vec2(cos(s.x), sin(s.x));
            float k = 6.2831853 / s.y;
            float w = sqrt(9.81 * k);
            float phase = k * dot(d, world.xz) - w * uTime + float(i) * 2.1;
            float c = cos(phase);
            float sn = sin(phase);
            offset.xz += s.w * s.z * d * c;
            offset.y += s.z * sn;
            n.xz -= d * k * s.z * c;
            n.y -= s.w * k * s.z * sn;
            crest += sn * s.z;
        }
        world.xyz += offset * fade;
        vNormal = normalize(vec3(n.x * fade, mix(1.0, n.y, fade), n.z * fade));
        vCrest = crest * fade / 0.33;
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
    }
`

export const waterFragment = /* glsl */ `
    precision highp float;

    ${SKY}

    uniform sampler2D tDiffuse;
    uniform vec3 color;
    uniform sampler2D uDetail;
    uniform float uDetailSize;
    uniform float uChop;
    uniform vec3 uSea;
    uniform vec3 uScatter;

    varying vec4 vMirror;
    varying vec3 vWorld;
    varying vec3 vNormal;
    varying float vCrest;

    float ggx(vec3 n, vec3 v, vec3 l, float rough) {
        vec3 h = normalize(l + v);
        float a = rough * rough;
        float a2 = a * a;
        float nh = max(dot(n, h), 0.0);
        float d = a2 / (PI * pow(nh * nh * (a2 - 1.0) + 1.0, 2.0));
        float f = 0.02 + 0.98 * pow(1.0 - max(dot(v, h), 0.0), 5.0);
        return d * f * 0.25 / max(dot(n, v), 0.15) * smoothstep(0.0, 0.1, dot(n, l));
    }

    void main() {
        vec3 toEye = cameraPosition - vWorld;
        float dist = length(toEye);
        vec3 v = toEye / dist;

        // Two scales of the same animated spectrum, one turned against the
        // other, so neither ever shows its tile.
        vec2 p = vWorld.xz / uDetailSize;
        vec2 q = mat2(0.8, 0.6, -0.6, 0.8) * vWorld.xz / (uDetailSize * 0.37);
        vec2 slope = (texture2D(uDetail, p).xy + texture2D(uDetail, q).xy * 0.7) * uChop;

        vec3 s = normalize(vNormal);
        vec2 swell = -s.xz / s.y;
        vec3 n = normalize(vec3(-(swell.x + slope.x), 1.0, -(swell.y + slope.y)));

        float nv = max(dot(n, v), 0.001);
        float fresnel = 0.02 + 0.98 * pow(1.0 - nv, 5.0);

        // Ripples stretch a reflection downwards far more than sideways.
        vec4 mirror = vMirror;
        float reach = min(mirror.w, 6.0);
        mirror.xy += vec2(n.x * 0.014, n.z * 0.05) * reach;
        vec2 smear = vec2(0.0, 0.004 + abs(n.z) * 0.025) * reach;
        vec4 mirrored = texture2DProj(tDiffuse, mirror) * 0.4;
        mirrored += texture2DProj(tDiffuse, mirror + vec4(smear, 0.0, 0.0)) * 0.3;
        mirrored += texture2DProj(tDiffuse, mirror - vec4(smear, 0.0, 0.0)) * 0.3;
        vec3 reflected = mirrored.rgb;
        // Panels write no alpha, so this is how much open sky the water sees.
        float open = clamp(mirrored.a, 0.0, 1.0);

        // The body of the water: dark, lit by the sky, and green-blue where
        // the sun shines through the back of a crest.
        vec3 light = uSunLight * max(uSunDir.y, 0.0) + uMoonLight * max(uMoonDir.y, 0.0);
        vec3 body = uSea * (uAmbient + light * 0.6);
        float through = max(vCrest + 0.35, 0.0) * pow(max(dot(uSunDir, -v), 0.0), 4.0) * pow(0.5 - 0.5 * dot(uSunDir, n), 3.0);
        body += uScatter * uSunLight * (through * 1.4 + pow(nv, 2.0) * 0.05);

        vec3 col = mix(body, reflected, fresnel);

        // The sun and moon break up on capillary ripples far too fine for the
        // reflection, so the glints get a third, much smaller scale of their
        // own. Each is capped a little above white: a field of sparks, not a
        // few pixels so bright the bloom smears them into one blot.
        vec2 r = mat2(-0.6, 0.8, 0.8, 0.6) * vWorld.xz / (uDetailSize * 0.083);
        vec2 ripple = texture2D(uDetail, r).xy * 1.1 * uChop;
        vec3 m = normalize(vec3(-(swell.x + slope.x + ripple.x), 1.0, -(swell.y + slope.y + ripple.y)));
        float rough = mix(0.05, 0.22, smoothstep(40.0, 900.0, dist));
        vec3 glint = uSunLight * ggx(m, v, uSunDir, rough) + uMoonLight * ggx(m, v, uMoonDir, rough) * 1.5;
        col += min(glint, vec3(9.0 * uInvExposure)) * open;

        col = mix(col, horizonColor(-v), fogAmount(dist));
        gl_FragColor = vec4(col, 1.0);
    }
`

export const panelVertex = /* glsl */ `
    varying vec2 vUv;
    varying vec3 vWorld;
    varying vec3 vNormal;

    void main() {
        vUv = uv;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        vNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * world;
    }
`

// A panel is a screen: it keeps its own brightness whatever the light, so it
// is scaled against the exposure and reads the same at noon and at night.
export const panelFragment = /* glsl */ `
    precision highp float;

    ${SKY}

    uniform sampler2D uMap;
    uniform float uHasMap;
    uniform float uFocus;
    uniform float uAspect;
    uniform vec3 uBlank;
    uniform float uVeil;

    varying vec2 vUv;
    varying vec3 vWorld;
    varying vec3 vNormal;

    void main() {
        vec3 c = uHasMap > 0.5 ? texture2D(uMap, vUv).rgb : uBlank;

        float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));
        c = mix(vec3(luma), c, mix(0.1, 1.0, uFocus));
        c *= 0.95 * uInvExposure * mix(0.6, 1.0, uFocus);

        vec2 edge = min(vUv, 1.0 - vUv) * vec2(uAspect, 1.0);
        float rim = 1.0 - smoothstep(0.0, 0.006, min(edge.x, edge.y));
        c = mix(c, vec3(0.7) * uInvExposure, rim * 0.12);

        float dist = length(cameraPosition - vWorld);
        c = mix(c, horizonColor(vWorld - cameraPosition), max(fogAmount(dist), uVeil));
        gl_FragColor = vec4(c, 0.0);
    }
`

export const solidFragment = /* glsl */ `
    precision highp float;

    ${SKY}

    uniform vec3 uColor;
    uniform float uVeil;

    varying vec2 vUv;
    varying vec3 vWorld;
    varying vec3 vNormal;

    void main() {
        vec3 n = normalize(vNormal);
        vec3 light = uAmbient + uSunLight * max(dot(n, uSunDir), 0.0) + uMoonLight * max(dot(n, uMoonDir), 0.0);
        vec3 c = uColor * light / PI;
        float dist = length(cameraPosition - vWorld);
        c = mix(c, horizonColor(vWorld - cameraPosition), max(fogAmount(dist), uVeil));
        gl_FragColor = vec4(c, 0.0);
    }
`

export const passVertex = /* glsl */ `
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
    }
`
