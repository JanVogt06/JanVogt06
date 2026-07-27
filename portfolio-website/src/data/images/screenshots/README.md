# Projekt-Screenshots

Hier kommen die Poster-Bilder für die Projekt-Folien hin. Sie werden im
Browser-Rahmen angezeigt, bevor jemand die Live-Vorschau startet.

## Dateinamen

Der Name muss dem `slug` aus `src/data/projects.json` entsprechen. Endung
`.webp`, `.png`, `.jpg` oder `.jpeg` – alle werden gefunden:

| Projekt              | Dateiname                |
|----------------------|--------------------------|
| Riptide              | `riptide.webp`           |
| SatTrak              | `sattrak.webp`           |
| SolarFlow            | `solarflow.webp`         |
| TFV Spesen Generator | `spesen-generator.webp`  |
| Cryptborne           | `cryptborne.webp`        |

Kein Code muss angefasst werden: `ProjectSlide` liest den Ordner über
`import.meta.glob`. Fehlt eine Datei, zeigt der Rahmen automatisch den
Poster-Zustand mit Projekt-Icon und URL – die Seite sieht also auch ohne
Screenshots vollständig aus.

## Format

- **Seitenverhältnis 16:10**, damit nichts beschnitten wird
  (der Rahmen nutzt `object-cover`)
- **Breite 1600 px** reicht: der Rahmen ist maximal ~800 px breit,
  das deckt auch Retina ab
- Als WebP exportieren, Qualität ~82. Aus einem PNG:

```bash
cwebp -q 82 -resize 1600 0 riptide.png -o riptide.webp
```

Aufnehmen am besten im Browser bei 1600×1000 ohne Browser-Chrome (den
Rahmen zeichnet die Seite selbst) – also nur den Seiteninhalt.
