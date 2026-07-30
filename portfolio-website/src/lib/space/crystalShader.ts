/**
 * Kristall-Shader – facettiert, mit leuchtender Kante und farbigem Kern.
 *
 * Bewusst KEINE echte Refraktion (transmission/ior wie bei igloo.inc). Die
 * braeuchte eine Environment-Map, Render-Targets pro Stein und Bloom als
 * Nachbearbeitung; das ist der Teil, der dort 1,5 MB JavaScript kostet und auf
 * Mittelklasse-Handys einbricht.
 *
 * Der Eindruck "Kristall" entsteht auch ohne das, aus drei Dingen:
 *
 * 1. Facetten. Die Normale wird pro Dreieck aus der Ableitung der Weltposition
 *    berechnet statt interpoliert. Dadurch hat jede Flaeche EINE Helligkeit –
 *    das ist der Schliff. (Kostet nichts und braucht keine doppelten Vertices,
 *    wie flatShading sie verlangen wuerde.)
 * 2. Fresnel. Zur Silhouette hin wird der Stein heller, weil man dort streifend
 *    auf die Flaeche sieht. Das liest das Auge als Glas.
 * 3. Ein Kern, der durchscheint: je senkrechter man auf eine Flaeche sieht,
 *    desto mehr Kernfarbe kommt durch.
 *
 * Additiv gemischt und ohne Tiefenschreiben, damit sich ueberlappende Steine
 * gegenseitig durchleuchten statt sich zu verdecken.
 */

export const crystalVertexShader = `
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;

    void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorldPosition = world.xyz;

        vec4 view = viewMatrix * world;
        vViewPosition = view.xyz;

        gl_Position = projectionMatrix * view;
    }
`

export const crystalFragmentShader = `
    precision highp float;

    uniform vec3  uCore;      // Kernfarbe des Steins
    uniform vec3  uRim;       // Farbe der leuchtenden Kante
    uniform float uTime;
    uniform float uHighlight; // 0 = ruhig, 1 = angefasst (Hover/Fokus)
    uniform float uFade;      // Gesamtdeckkraft, vom Scroll gesteuert

    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;

    void main() {
        /* Facetten-Normale aus der Ableitung: innerhalb eines Dreiecks ist sie
           konstant, also bekommt jede Flaeche genau einen Ton. */
        vec3 normal = normalize(cross(dFdx(vViewPosition), dFdy(vViewPosition)));
        vec3 viewDir = normalize(-vViewPosition);

        float facing = abs(dot(normal, viewDir));

        // Kante: streifender Blick leuchtet.
        float fresnel = pow(1.0 - facing, 2.6);

        // Kern: scheint durch, wo man senkrecht auf die Flaeche sieht.
        float core = pow(facing, 1.7);

        /* Ein sehr langsames Schweben in der Helligkeit, damit der Stein lebt,
           ohne zu blinken. Die Phase haengt an der Weltposition, damit nicht
           alle Steine im Gleichschritt pulsieren. */
        float breathe = 0.9 + 0.1 * sin(uTime * 0.7 + vWorldPosition.z * 0.6);

        vec3 col = uCore * core * 0.55 + uRim * fresnel * 1.5;

        // Angefasst: Kante deutlich heller, Kern etwas waermer.
        col += uRim * fresnel * uHighlight * 1.3;
        col += uCore * core * uHighlight * 0.35;

        col *= breathe;

        /* Deckkraft folgt der Helligkeit: dunkle Flaechen werden durchsichtig,
           dadurch sieht man Sterne durch den Stein. */
        float alpha = clamp(fresnel * 0.9 + core * 0.35, 0.0, 1.0);

        gl_FragColor = vec4(col, alpha * uFade);
    }
`
