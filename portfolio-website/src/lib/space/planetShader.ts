/**
 * Wegpunkte des Werdegangs als Planeten.
 *
 * Sie waren vorher facettierte Steine mit demselben Shader wie die Projekte – und
 * damit war dieselbe Form zweimal fuer zwei verschiedene Dinge im Einsatz. Wer an
 * einem Werdegang-Wegpunkt vorbeifliegt, sieht dasselbe wie an einem Projekt und
 * lernt daraus nichts.
 *
 * Ein Planet ist der klare Gegensatz: rund statt kantig, matt statt glasig, mit
 * einer beleuchteten und einer dunklen Seite.
 *
 * ECHTE KARTEN STATT GRUNDTON
 *
 * Die Oberflaeche kam aus einem Grundton plus einem Sinus ueber die Breite. Drei
 * Kugeln mit demselben Muster in drei Farben – auf den zweiten Blick erkennt man
 * das, und dann sieht es nach Platzhalter aus.
 *
 * Jetzt liegt eine Fotokarte darauf (Solar System Scope, CC BY 4.0). Die
 * UV-Belegung von THREE.SphereGeometry ist genau equirektangular, deshalb passen
 * die Karten ohne Vorbereitung: u ist linear in der Laenge, v linear in der Breite.
 *
 * uHasMap traegt den Ladezustand. Die Karten kommen ueber das Netz, und bis dahin
 * soll der Planet nicht schwarz sein, sondern in seinem Grundton stehen – bei einer
 * Scroll-Seite kann er sonst zwei Sekunden lang wie ein Loch aussehen.
 *
 * KEINE FARBRAUM-UMRECHNUNG
 *
 * Die Karte wird gesampelt, wie sie in der Datei steht, und nicht nach linear
 * umgerechnet. Das ist Absicht: die ganze Szene ist in Anzeigewerten geschrieben
 * (Nebel, Galaxie, Sterne sind alle additiv aus Hand-Werten gemischt), und ein
 * einzelner physikalisch korrekt behandelter Kanal wuerde daneben falsch wirken,
 * nicht richtiger.
 *
 * Bewusst kein echtes Licht in der Szene: eine feste Lichtrichtung im Shader
 * genuegt fuer den Halbschatten und kostet nichts. Alles andere ist additiv
 * gemischt – ein Lambert-Term hier waere der einzige Grund, Lichtquellen
 * einzufuehren.
 */

export const planetVertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);

        vec4 view = viewMatrix * modelMatrix * vec4(position, 1.0);
        vViewPosition = view.xyz;

        gl_Position = projectionMatrix * view;
    }
`

export const planetFragmentShader = `
    precision highp float;

    uniform sampler2D uMap;
    /** 0 = Karte noch nicht geladen, dann traegt uSurface. */
    uniform float uHasMap;

    uniform vec3  uSurface;   // Grundton, bis die Karte da ist
    uniform vec3  uShadow;    // Ton der Nachtseite – nicht schwarz, sondern kuehl
    uniform vec3  uRim;       // Farbe des Streiflichts am Rand
    /** Staerke des Randlichts: bei Gasriesen deutlich, bei Gestein kaum. */
    uniform float uAtmosphere;
    uniform float uFade;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    /* Feste Lichtrichtung, leicht von links oben. Sie liegt im Blickraum, damit
       der Halbschatten beim Vorbeifliegen stehen bleibt und nicht mitdreht. */
    const vec3 LIGHT = vec3(-0.55, 0.5, 0.67);

    void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(-vViewPosition);

        vec3 albedo = mix(uSurface, texture2D(uMap, vUv).rgb, uHasMap);

        // Tag- und Nachtseite mit weichem Uebergang (Terminator).
        float lambert = dot(normal, normalize(LIGHT));
        float day = smoothstep(-0.22, 0.5, lambert);

        /* Randverdunkelung. Am Rand einer Kugel blickt man schraeg durch die
           Oberflaeche, und sie wird dunkler – ohne diesen Term sieht ein
           texturierter Planet aus wie eine bedruckte Scheibe. */
        float limb = pow(max(dot(normal, viewDir), 0.0), 0.35);

        vec3 lit = albedo * (0.35 + 0.65 * limb);
        vec3 col = mix(uShadow * albedo * 1.6, lit, day);

        /* Streiflicht am Rand – bei einem Planeten die Atmosphaere. Nur auf der
           Tagseite, sonst leuchtet die Nachtseite unmotiviert. */
        float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 2.4);
        col += uRim * fresnel * (0.2 + 0.8 * day) * uAtmosphere;

        gl_FragColor = vec4(col, uFade);
    }
`

/**
 * Ring um den Planeten.
 *
 * ZWEI FEHLER, DIE HIER GESTANDEN HABEN
 *
 * 1. Jeder Wegpunkt hatte einen Ring. Von drei Planeten des Sonnensystems hat
 *    genau einer ein sichtbares Ringsystem – drei beringte Planeten sind kein
 *    Sonnensystem, sondern eine Deko-Serie.
 *
 * 2. Die Deckkraft lief ueber `abs(uv.y - 0.5)`. Bei THREE.RingGeometry sind die
 *    UVs aber PLANAR (uv.x aus position.x, uv.y aus position.y), nicht radial –
 *    das three.js-Issue dazu ist als "not planned" geschlossen. uv.y war also
 *    nicht der Abstand zur Mitte, sondern eine Koordinate quer durch die Scheibe:
 *    die "Luecke" lief als gerader Streifen durch den Ring statt als Kreis.
 *
 * Deshalb rechnet dieser Shader den Radius selbst aus der lokalen Position und
 * sampelt damit die Ringkarte, die ein reines Radialprofil ist (2048x125, in
 * y konstant – nachgemessen): innen die Luecke zum Planeten, dann das B-Ring-
 * Maximum, die Cassini-Teilung als Einschnitt, aussen der A-Ring.
 *
 * SCHATTEN DES PLANETEN
 *
 * Der Planet wirft einen Schatten auf den Ring – auf jeder Cassini-Aufnahme das
 * Erste, was man sieht. Die Lichtrichtung kommt dafuer bereits im lokalen System
 * des Rings herein (in JS umgerechnet), weil GLSL ES 1.0 kein transpose() und kein
 * inverse() hat.
 */
export const ringVertexShader = `
    varying vec3 vLocal;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
        vLocal = position;
        vNormal = normalize(normalMatrix * normal);

        vec4 view = viewMatrix * modelMatrix * vec4(position, 1.0);
        vViewPosition = view.xyz;

        gl_Position = projectionMatrix * view;
    }
`

export const ringFragmentShader = `
    precision highp float;

    uniform sampler2D uMap;
    uniform float uHasMap;
    uniform vec3  uColor;
    uniform float uFade;
    /** Innen- und Aussenradius der Geometrie, fuer die Radialkoordinate. */
    uniform vec2  uRadii;
    /** Radius des Planeten in denselben Einheiten – fuer den Schatten. */
    uniform float uPlanetRadius;
    /** Lichtrichtung im lokalen System des Rings. */
    uniform vec3  uLight;

    varying vec3 vLocal;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
        float r = length(vLocal.xy);
        float t = clamp((r - uRadii.x) / max(uRadii.y - uRadii.x, 0.001), 0.0, 1.0);

        vec4 sampled = texture2D(uMap, vec2(t, 0.5));

        /* Ohne Karte ein weicher Verlauf mit einer Luecke – dann aber wenigstens
           als Kreis, weil t der Radius ist. */
        float fallback = (1.0 - abs(t - 0.5) * 2.0);
        fallback *= 1.0 - 0.6 * smoothstep(0.62, 0.68, t) * (1.0 - smoothstep(0.72, 0.78, t));

        vec3 col = mix(uColor, sampled.rgb, uHasMap);
        float alpha = mix(fallback * fallback, sampled.a, uHasMap);

        /* Schatten des Planeten: der Punkt liegt darin, wenn er auf der
           lichtabgewandten Seite steht und sein Abstand zur Lichtachse kleiner ist
           als der Planetenradius. */
        vec3 light = normalize(uLight);
        float along = dot(vLocal, light);
        float perp = length(vLocal - light * along);
        float shadow = smoothstep(uPlanetRadius * 1.08, uPlanetRadius * 0.82, perp)
                     * smoothstep(0.0, -0.15, along);
        col *= 1.0 - 0.82 * shadow;

        /* Von der Kante gesehen ist der Ring dichter – man blickt durch mehr
           Material. Sehr flach betrachtet steigt die Deckkraft deshalb an.
           Die Flaechennormale muss dafuer im Blickraum vorliegen, nicht im lokalen:
           uLight ist lokal (fuer den Schatten), vNormal ist es nicht. abs(), weil
           der Ring von beiden Seiten sichtbar ist. */
        vec3 viewDir = normalize(-vViewPosition);
        float grazing = 1.0 - abs(dot(normalize(vNormal), viewDir));
        alpha *= 0.72 + 0.5 * grazing;

        gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0) * uFade);
    }
`
