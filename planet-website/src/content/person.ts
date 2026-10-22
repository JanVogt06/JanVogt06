// Who the site is about and where to find him: the one place for the name,
// the addresses and the profiles. Everything else refers to these.
export const person = {
  name: 'Jan Vogt',
  site: 'https://jan-vogt.dev',
  email: 'contact@jan-vogt.dev',
  github: 'JanVogt06',
  instagram: 'jan.vogt06',
  // For search engines' summary of who this is.
  home: 'Bad Berka',
  university: { name: 'Friedrich-Schiller-Universität Jena', url: 'https://www.uni-jena.de' },
  employer: { name: 'Carl Zeiss Meditec AG', url: 'https://www.zeiss.com/meditec' },
}

export const githubUrl = (repo = person.github) => `https://github.com/${repo}`
