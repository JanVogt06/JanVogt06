import {MotionConfig} from 'framer-motion'
import RepoBar from './components/RepoBar'
import Hero from './components/Hero'
import About from './components/About'
import Projects from './components/Projects'
import Contact from './components/Contact'

function App() {
    return (
        /* reducedMotion="user": wer im System "Bewegung reduzieren" gesetzt hat,
           bekommt in JEDER motion-Komponente nur noch Ein-/Ausblenden statt
           Transforms – auch in allem, was spaeter dazukommt. */
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
