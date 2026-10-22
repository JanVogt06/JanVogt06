import { jsPDF } from 'jspdf'
import { catalogue, linkLabel } from '../content/catalogue'
import { lang, t } from '../content/lang'
import rover from '../images/rover.webp'

// A4 in millimetres, with the colours of the site.
const PAGE = { width: 210, height: 297, margin: 18 }
const INK: [number, number, number] = [39, 48, 74]
const SOFT: [number, number, number] = [91, 96, 120]
const BRICK: [number, number, number] = [200, 85, 61]
const BRASS: [number, number, number] = [201, 154, 60]

// The rover as a JPEG on white, which jsPDF can embed and keeps the file
// small; the site has it as WebP.
async function roverImage() {
  const image = new Image()
  await new Promise((resolve, reject) => {
    image.onload = resolve
    image.onerror = reject
    image.src = rover
  })
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const context = canvas.getContext('2d')!
  context.fillStyle = '#fff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 0, 0)
  return { data: canvas.toDataURL('image/jpeg', 0.88), ratio: image.naturalHeight / image.naturalWidth }
}

// Writes the CV from the same words as the page, in its language. The
// rover's picture can be handed in, else it is drawn from the page's.
export async function writeCv(picture?: { data: string; ratio: number }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  const width = PAGE.width - 2 * PAGE.margin
  let y = PAGE.margin

  const room = (needed: number) => {
    if (y + needed <= PAGE.height - PAGE.margin) return
    doc.addPage()
    y = PAGE.margin
  }
  const write = (text: string, size: number, colour = INK, style = 'normal', indent = 0) => {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
    doc.setTextColor(...colour)
    const lines: string[] = doc.splitTextToSize(text, width - indent)
    const height = size * 0.42
    for (const line of lines) {
      room(height)
      doc.text(line, PAGE.margin + indent, y + height * 0.8)
      y += height
    }
  }
  // A row of links, each one clickable, wrapping when the line is full.
  const linkRow = (links: { text: string; url: string }[], size: number, style = 'normal') => {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
    doc.setTextColor(...BRICK)
    const height = size * 0.42
    const space = doc.getTextWidth('   ')
    let x = PAGE.margin
    room(height)
    for (const link of links) {
      const wide = doc.getTextWidth(link.text)
      if (x > PAGE.margin && x + wide > PAGE.margin + width) {
        x = PAGE.margin
        y += height
        room(height)
      }
      doc.textWithLink(link.text, x, y + height * 0.8, { url: link.url })
      x += wide + space
    }
    y += height
  }
  const gap = (size: number) => (y += size)
  const heading = (text: string) => {
    gap(5)
    room(14)
    write(text.toUpperCase(), 10.5, BRASS, 'bold')
    doc.setDrawColor(...BRASS)
    doc.setLineWidth(0.5)
    doc.line(PAGE.margin, y + 1, PAGE.margin + 18, y + 1)
    gap(4)
  }
  const bullets = (items?: string[]) => {
    for (const item of items ?? []) {
      room(5)
      doc.setFillColor(...BRICK)
      doc.circle(PAGE.margin + 1.2, y + 2.1, 0.7, 'F')
      write(item, 10, INK, 'normal', 5)
      gap(0.6)
    }
  }

  // Name, line and contact, with the rover beside them.
  const { data, ratio } = picture ?? (await roverImage())
  doc.addImage(data, 'JPEG', PAGE.width - PAGE.margin - 34, y - 2, 34, 34 * ratio)
  write('Jan Vogt', 26, INK, 'bold')
  gap(1)
  write(t.stations.about.tagline, 12, SOFT)
  gap(2)
  const mail = catalogue.find((entry) => entry.id === 'contact')!.links!.find((link) => link.kind === 'mail')!
  linkRow(
    [
      { text: linkLabel(mail, t.links), url: mail.href },
      { text: 'jan-vogt.dev', url: 'https://jan-vogt.dev' + (lang === 'en' ? '/en/' : '/') },
      { text: 'github.com/JanVogt06', url: 'https://github.com/JanVogt06' },
    ],
    9.5,
    'bold',
  )
  y = Math.max(y, PAGE.margin + 34 * ratio)

  heading(t.text.sections.about)
  for (const paragraph of t.stations.about.body) {
    write(paragraph, 10.5)
    gap(2)
  }
  bullets(t.stations.about.facts)

  heading(t.text.sections.projects)
  for (const entry of catalogue.filter((item) => item.kind === 'project')) {
    const words = t.stations[entry.id]
    room(22)
    write(`${words.title}  –  ${words.tagline}`, 11.5, INK, 'bold')
    gap(0.8)
    write(words.body.join(' '), 10, INK)
    if (entry.tech) {
      gap(0.8)
      write(entry.tech.join(' · '), 9, SOFT)
    }
    if (entry.links?.length) {
      gap(0.4)
      linkRow(entry.links.map((link) => ({ text: link.href.replace(/^https?:\/\//, '').replace(/\/$/, ''), url: link.href })), 9)
    }
    gap(4)
  }

  for (const id of ['engagement', 'awards'] as const) {
    heading(t.stations[id].title)
    bullets(t.stations[id].facts)
  }

  heading(t.text.tech)
  write(catalogue.find((entry) => entry.id === 'about')!.tech!.join(' · '), 10)

  return doc
}

export async function downloadCv() {
  const doc = await writeCv()
  doc.save(lang === 'en' ? 'Jan_Vogt_CV.pdf' : 'Jan_Vogt_Lebenslauf.pdf')
}
