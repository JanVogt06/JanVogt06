import RepoBar from './components/RepoBar'
import ScrollSpine from './components/ScrollSpine'
import Hero from './components/Hero'
import About from './components/About'
import Projects from './components/Projects'
import Contact from './components/Contact'

function App() {
    return (
        <>
            <RepoBar/>
            {/* Commit-Achse in der linken Rinne – zeichnet sich mit dem Scroll */}
            <ScrollSpine/>
            <Hero/>
            <About/>
            <Projects/>
            <Contact/>
        </>
    )
}

export default App
