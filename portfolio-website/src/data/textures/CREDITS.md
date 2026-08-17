# Herkunft der Texturen

## Planeten und Saturnring

`mars.webp`, `jupiter.webp`, `saturn.webp`, `saturn_ring.webp`

- Quelle: [Solar System Scope – Solar Textures](https://www.solarsystemscope.com/textures/)
- Lizenz: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — „You may use,
  adapt, and share these textures for any purpose, even commercially."
- Bearbeitung: die 2k-JPEGs bzw. das Ring-PNG wurden unverändert in der Auflösung
  nach WebP umgewandelt (Qualität 82 bzw. verlustfrei für den Ring mit Alphakanal).
- Grundlage laut Anbieter: Höhen- und Bilddaten der NASA, farblich an Aufnahmen von
  Messenger, Viking, Cassini und Hubble angepasst.

Die Attribution verlangt eine Namensnennung. Sie steht im Footer der Seite
(`src/components/Contact.tsx`).

## Milchstraße

`milkyway_gal.webp`

- Quelle: [NASA SVS – Deep Star Maps 2020](https://svs.gsfc.nasa.gov/4851/),
  Datei `milkyway_2020_4k_gal.exr` — die Milchstraße in galaktischen Koordinaten,
  ohne die hellen Einzelsterne (Hipparcos/Tycho). Genau richtig hier: die
  Einzelsterne liefert `starfield.ts` als Punkte.
- Visualisierung: Ernie Wright.
- Lizenz: NASA-Material, in den USA nicht urheberrechtlich geschützt. Der Credit ist
  erbeten und nennt auch die Datenquelle:
  **NASA/Goddard Space Flight Center Scientific Visualization Studio. Gaia DR2:
  ESA/Gaia/DPAC.**
- Bearbeitung: das lineare halb-float-EXR wurde mit der sRGB-Kennlinie versehen
  (nötig, weil der Median bei 0,008 liegt — linear in 8 Bit abgelegt läge die Hälfte
  aller Pixel in den unteren zwei Stufen), auf 2048×1024 verkleinert und als WebP
  mit Qualität 82 gespeichert: 34,8 MB → 247 KB.

### Ausrichtung, gemessen statt geraten

Der hellste Fleck abseits des Bandes liegt in der Datei bei galaktisch b = −33,0 und
l = 280,5. Das ist die Große Magellansche Wolke (tatsächlich −32,9 / 280,5). Damit
steht Norden in Zeile 0, also oben, und die galaktische Länge wächst nach links.
Genau so sampelt `milkyway.ts` die Karte.
