import { useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Nav from './components/Nav.jsx'
import CinematicConstruction from './components/CinematicConstruction.jsx'
import About from './components/sections/About.jsx'
import Projects from './components/sections/Projects.jsx'
import Process from './components/sections/Process.jsx'
import Values from './components/sections/Values.jsx'
import Contact from './components/sections/Contact.jsx'
import { initReveals } from './lib/reveals.js'

export default function App() {
  // Runs after the film's own effect (parent effects run after children), so
  // the pin already exists and every trigger below measures the final layout.
  useLayoutEffect(() => {
    const nav = document.querySelector('.nav')
    const offset = () => nav.offsetHeight

    const ctx = gsap.context(() => {
      // Nav theme follows whichever section is under it: transparent over the
      // film and hero, cream over light sections, black over dark ones.
      let film = null
      let sections = []
      const sync = () => {
        if (!film) return
        const under = sections.find((t) => t.isActive)
        const past = window.scrollY > film.start // a position check: triggers read inactive at the very page end
        const state = under ? (under.trigger.dataset.nav === 'light' ? 'light' : 'solid') : past ? 'solid' : null
        if (state) nav.dataset.state = state
        else delete nav.dataset.state
      }
      film = ScrollTrigger.create({ trigger: '.cinematic', start: () => `bottom top+=${offset()}`, end: 'max', onToggle: sync })
      sections = gsap.utils.toArray('[data-nav]').map((el) =>
        ScrollTrigger.create({
          trigger: el,
          start: () => `top top+=${offset()}`,
          end: () => `bottom top+=${offset()}`,
          onToggle: sync,
        }),
      )
      ScrollTrigger.addEventListener('refresh', sync)
      sync()
      return () => ScrollTrigger.removeEventListener('refresh', sync)
    })

    const disposeReveals = initReveals(document)

    return () => {
      disposeReveals()
      ctx.revert()
    }
  }, [])

  return (
    <>
      <Nav />
      <main>
        <CinematicConstruction />
        <About />
        <Projects />
        <Process />
        <Values />
      </main>
      <Contact />
    </>
  )
}
