import {MotionConfig} from 'framer-motion'
import RepoBar from './components/RepoBar'
import Hero from './components/Hero'
import About from './components/About'
import Projects from './components/Projects'
import Contact from './components/Contact'

function App() {
    return (
        /* reducedMotion="user" gilt fuer JEDE motion-Komponente der Seite:
           Wer im Betriebssystem "Bewegung reduzieren" gesetzt hat, bekommt keine
           Transforms mehr, nur noch Ein-/Ausblenden. Das global hier zu setzen
           ist verlaesslicher, als es in zwanzig Komponenten einzeln zu prüfen –
           und es gilt automatisch fuer alles, was noch dazukommt. */
        <MotionConfig reducedMotion="user">
            <RepoBar/>
            <Hero/>
            <About/>
            <Projects/>
            <Contact/>
        </MotionConfig>
    )
}

export default App
