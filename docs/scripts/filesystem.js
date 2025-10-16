// Filesystem für Terminal
const filesystem = {
    '/': {
        type: 'dir',
        content: {
            'about': {
                type: 'dir',
                content: {
                    'education.txt': {
                        type: 'file',
                        content: `BILDUNG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

seit 10/2024
  B.Sc. Informatik
  Friedrich-Schiller-Universität Jena

2024
  Abitur
  Marie-Curie-Gymnasium Bad Berka
  Valedictorian`
                    },
                    'awards.txt': {
                        type: 'file',
                        content: `AUSZEICHNUNGEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2024  DMV-Abiturpreis Mathematik
2024  DPG-Abiturpreis Physik
2024  Pierre-de-Coubertin-Preis
2022  Marie-Curie-Preis
2022  Schiedsrichter des Jahres
      Kreissportbund Weimarer Land e.V.
2016-2024  Mehrfache Preise bei
           Physik- & Mathematikolympiaden`
                    },
                    'engagement.txt': {
                        type: 'file',
                        content: `ENGAGEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚽ Elite-Kader Thüringen
   Fußball-Schiedsrichter
   Thüringenliga & Junioren-Bundesliga

✍️  Redaktionsmitglied
   "Die Wurzel" - Zeitschrift für Mathematik

🏛️  Jugendvertretung Bad Berka
   Stadtentwicklung & ISEK-Workshops`
                    }
                }
            },
            'projects': {
                type: 'dir',
                content: {
                    'SatTrak': {
                        type: 'dir',
                        content: {
                            'readme.md': {
                                type: 'file',
                                content: `# SatTrak - 3D Satellitenvisualisierung

Interaktive Echtzeit-Verfolgung von über 12.000 Satelliten
auf einem virtuellen Globus.

Features:
  • Heatmap-Darstellung
  • Tag/Nacht-Zyklus
  • Zeitsteuerung für historische Ansichten
  • Interaktive 3D-Navigation

Tech Stack: Unity, C#, Cesium

GitHub: https://github.com/JanVogt06/SatTrak-SatelliteVisualization`
                            },
                            'info.txt': {
                                type: 'file',
                                content: `SatTrak visualisiert Satellitenpositionen in Echtzeit
auf einem interaktiven 3D-Globus. Das Projekt nutzt
TLE-Daten zur präzisen Bahnberechnung.`
                            }
                        }
                    },
                    'SolarFlow': {
                        type: 'dir',
                        content: {
                            'readme.md': {
                                type: 'file',
                                content: `# SolarFlow - Smart Energy Management

Intelligentes Energie-Management-System für
Photovoltaik-Anlagen.

Features:
  • Automatische Verbrauchersteuerung
  • Maximierung des Eigenverbrauchs
  • Fronius Inverter Integration
  • Real-time Monitoring Dashboard

Tech Stack: Python, FastAPI, SQLite, JavaScript

GitHub: https://github.com/JanVogt06/SolarFlow-SmartEnergyManagement
Website: https://janvogt06.github.io/SolarFlow-SmartEnergyManagement/`
                            }
                        }
                    },
                    'Cryptborne': {
                        type: 'dir',
                        content: {
                            'readme.md': {
                                type: 'file',
                                content: `# Cryptborne - 3D Dungeon Crawler

Prozedural generierter Dungeon-Crawler im
mittelalterlichen Fantasy-Setting.

Features:
  • Prozedural generierte Dungeons
  • Variantenreiches Waffensystem
  • Intelligente Enemy-AI
  • Atmosphärisches Gameplay

Tech Stack: Unity, C#, Procedural Generation

GitHub: https://github.com/JY-Studios/cryptborne
Play: https://jy-studios.github.io/cryptborne/`
                            }
                        }
                    }
                }
            },
            'contact': {
                type: 'dir',
                content: {
                    'email.txt': {
                        type: 'file',
                        content: `📧 E-Mail: jan.vogt.portfolio@web.de`
                    },
                    'github.txt': {
                        type: 'file',
                        content: `🐙 GitHub: https://github.com/JanVogt06`
                    },
                    'social.txt': {
                        type: 'file',
                        content: `SOCIAL MEDIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📷 Instagram: @jan.vogt06
   https://instagram.com/jan.vogt06

📍 Standort: Bad Berka, Thüringen`
                    }
                }
            },
            'skills': {
                type: 'dir',
                content: {
                    'languages.txt': {
                        type: 'file',
                        content: `PROGRAMMING LANGUAGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- C / C++ / C#
- Java
- Python
- JavaScript / TypeScript`
                    },
                    'frameworks.txt': {
                        type: 'file',
                        content: `FRAMEWORKS & TOOLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Unity (Game Development)
- React (Frontend)
- FastAPI (Backend)
- OpenGL (Graphics)`
                    }
                }
            },
            'readme.txt': {
                type: 'file',
                content: `Willkommen im Portfolio-Terminal von Jan Vogt!

Nutze 'ls' um Verzeichnisse zu sehen
Nutze 'cd &ltdir&gt' um in ein Verzeichnis zu wechseln
Nutze 'cat &ltfile&gt' um eine Datei zu lesen
Nutze 'help' für alle verfügbaren Commands

Viel Spaß beim Erkunden! 🚀`
            }
        }
    }
};

export default filesystem;