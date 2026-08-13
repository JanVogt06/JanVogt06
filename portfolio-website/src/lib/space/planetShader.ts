/**
 * Wegpunkte des Werdegangs als Planeten.
 *
 * Sie waren vorher facettierte Steine mit demselben Shader wie die Projekte – und
 * damit war dieselbe Form zweimal fuer zwei verschiedene Dinge im Einsatz. Wer an
 * einem Werdegang-Wegpunkt vorbeifliegt, sieht dasselbe wie an einem Projekt und
 * lernt daraus nichts.
 *
 * Ein Planet ist der klare Gegensatz: rund statt kantig, matt statt glasig, mit
 * einer beleuchteten und einer dunklen Seite. Man erkennt auf einen Blick, dass es
 * etwas anderes ist.
 *
 * Bewusst kein echtes Licht in der Szene: eine feste Lichtrichtung im Shader
 * genuegt fuer den Halbschatten und kostet nichts. Die Szene hat keine
 * Lichtquellen, alles andere ist additiv gemischt – ein Lambert-Term hier waere
 * der einzige Grund, welche einzufuehren.
 */

export const planetVertexShader = `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vLocalPosition;

    void main() {
        vLocalPosition = position;
        vNormal = normalize(normalMatrix * normal);

        vec4 view = viewMatrix * modelMatrix * vec4(position, 1.0);
        vViewPosition = view.xyz;

        gl_Position = projectionMatrix * view;
    }
`

export const planetFragmentShader = `
    precision highp float;

    uniform vec3  uSurface;   // Grundton der beleuchteten Seite
    uniform vec3  uShadow;    // Ton der Nachtseite – nicht schwarz, sondern kuehl
    uniform vec3  uRim;       // Farbe des Streiflichts am Rand
    uniform float uTime;
    uniform float uFade;

    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vLocalPosition;

    /* Feste Lichtrichtung, leicht von links oben. Sie liegt im Blickraum, damit
       der Halbschatten beim Vorbeifliegen stehen bleibt und nicht mitdreht. */
    const vec3 LIGHT = vec3(-0.55, 0.5, 0.67);

    void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(-vViewPosition);

        // Tag- und Nachtseite mit weichem Uebergang (Terminator).
        float lambert = dot(normal, normalize(LIGHT));
        float day = smoothstep(-0.25, 0.55, lambert);

        /* Breitenbaender: ein langsamer Sinus ueber die lokale y-Achse. Genug
           Struktur, dass die Kugel nicht wie eine Billardkugel wirkt, und wenig
           genug, dass es nicht wie ein Muster aussieht. */
        float bands = 0.5 + 0.5 * sin(vLocalPosition.y * 7.0 + uTime * 0.12);
        vec3 surface = mix(uSurface * 0.82, uSurface, bands);

        vec3 col = mix(uShadow, surface, day);

        /* Streiflicht am Rand – bei einem Planeten die Atmosphaere. Nur auf der
           Tagseite, sonst leuchtet die Nachtseite unmotiviert. */
        float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 2.4);
        col += uRim * fresnel * (0.25 + 0.75 * day) * 0.9;

        gl_FragColor = vec4(col, uFade);
    }
`

/**
 * Ring um den Planeten.
 *
 * Eine sehr feine Scheibe, additiv gemischt und zum Rand hin auslaufend. Sie ist
 * das Merkmal, das den Wegpunkt auch als Silhouette von einem Kristall
 * unterscheidet.
 */
export const ringVertexShader = `
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
    }
`

export const ringFragmentShader = `
    precision highp float;

    uniform vec3  uColor;
    uniform float uFade;

    varying vec2 vUv;

    void main() {
        /* Quer zum Ring ausblenden, damit er keine harten Kanten hat. Bei einer
           RingGeometry laeuft uv.y ueber die Breite. */
        float across = abs(vUv.y - 0.5) * 2.0;
        float alpha = 1.0 - across;
        alpha *= alpha;

        // Eine Luecke, wie sie echte Ringsysteme haben.
        float gap = smoothstep(0.32, 0.38, across) * (1.0 - smoothstep(0.44, 0.5, across));
        alpha *= 1.0 - gap * 0.75;

        gl_FragColor = vec4(uColor, alpha * uFade * 0.7);
    }
`
