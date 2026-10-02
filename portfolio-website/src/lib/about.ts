import wayImage from "../data/images/station_01_mein_weg.webp"
import sideImage from "../data/images/station_02_neben_dem_studium.webp"
import awardsImage from "../data/images/station_03_meine_auszeichnungen.webp"

export type Entry = {when?: string; what: string; where?: string}

export type Station = {
    id: string
    title: string
    image: string
    aspect: number
    alt: string
    entries: Entry[]
}

export const stations: Station[] = [
    {
        id: "weg",
        title: "Werdegang",
        image: wayImage,
        aspect: 2827 / 1590,
        alt: "Jan Vogt beim Skifahren",
        entries: [
            {when: "seit 02/2026", what: "Werkstudent Softwareentwicklung", where: "Carl Zeiss Meditec AG"},
            {when: "seit 10/2024", what: "B.Sc. Informatik", where: "Friedrich-Schiller-Universität Jena"},
            {when: "2024", what: "Abitur", where: "Marie-Curie-Gymnasium Bad Berka"},
        ],
    },
    {
        id: "engagement",
        title: "Neben dem Studium",
        image: sideImage,
        aspect: 1532 / 862,
        alt: "Jan Vogt als Schiedsrichter",
        entries: [
            {what: "Schiedsrichter NOFV", where: "Oberliga & U19-Bundesliga, Assistent Regionalliga"},
            {what: "Redaktionsmitglied", where: "„Die Wurzel“ – Zeitschrift für Mathematik"},
            {what: "Jugendvertretung Bad Berka", where: "Stadtentwicklung & ISEK-Workshops"},
        ],
    },
    {
        id: "auszeichnungen",
        title: "Auszeichnungen",
        image: awardsImage,
        aspect: 1600 / 900,
        alt: "Jan Vogt mit Urkunden auf der Bühne einer Preisverleihung",
        entries: [
            {when: "2024", what: "DMV-Abiturpreis Mathematik"},
            {when: "2024", what: "DPG-Abiturpreis Physik"},
            {when: "2024", what: "Pierre-de-Coubertin-Preis"},
            {when: "2022", what: "Marie-Curie-Preis"},
            {when: "2022", what: "Schiedsrichter des Jahres"},
            {when: "2016–24", what: "Olympiaden-Preise in Mathematik und Physik"},
        ],
    },
]
