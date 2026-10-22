import { copies, type Lang } from './copy'

// The English site lives under /en/, the German one at the root.
export const lang: Lang = location.pathname.startsWith('/en') ? 'en' : 'de'
export const t = copies[lang]

// The same view in the other language.
export function otherLanguage() {
  return (t.other.lang === 'en' ? '/en/' : '/') + location.hash
}
