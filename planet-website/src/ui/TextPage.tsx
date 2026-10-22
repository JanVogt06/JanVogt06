import { useEffect, useMemo } from 'react'
import { lang, otherLanguage, t } from '../content/lang'
import { stations } from '../content/stations'
import { textPage } from '../content/textPage'
import rover from '../images/rover.webp'
import { calm } from './motion'
import { go } from './route'

// Everything from the planet as one plain page to read, print or save as a
// PDF, for anyone short of time or without 3D. The markup is shared with
// the copy the build writes into index.html.
export function TextPage() {
  const html = useMemo(
    () =>
      textPage(t, {
        rover,
        images: Object.fromEntries(stations.map((station) => [station.id, station.image?.src])),
        home: lang === 'en' ? '/en/' : '/',
        other: otherLanguage(),
      }),
    [],
  )

  useEffect(() => {
    document.title = t.meta.textTitle
    return () => {
      document.title = t.meta.title
    }
  }, [])

  // The address's hash picks the view, so in-page links scroll instead,
  // and the way back to the planet stays on this page.
  const onClick = (event: React.MouseEvent) => {
    const element = (event.target as HTMLElement).closest<HTMLElement>('[data-jump], [data-go], [data-pdf]')
    if (!element) return
    event.preventDefault()
    if (element.dataset.jump) document.getElementById(element.dataset.jump)?.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'start' })
    else if (element.dataset.go) go('menu')
    // Drawn on demand, so the PDF library only loads for those who ask.
    else import('./cv').then(({ downloadCv }) => downloadCv())
  }

  return <div className="text-page" onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />
}
