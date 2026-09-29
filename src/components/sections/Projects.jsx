import Lines from '../Lines.jsx'
import Photo from '../Photo.jsx'
import { PROJECTS } from '../../data/site.js'

export default function Projects() {
  return (
    <section className="projects" id="projects" data-nav="dark" aria-labelledby="projects-title">
      <header className="projects__head">
        <p className="eyebrow" data-reveal="fade">Featured projects</p>
        <h2 className="display" id="projects-title" data-reveal="lines">
          <Lines lines={['Crafting spaces', 'for a better tomorrow.']} />
        </h2>
      </header>

      <div className="projects__grid">
        {PROJECTS.map((project, i) => (
          <article className={`project project--${i + 1}`} key={project.id} aria-labelledby={`project-${project.id}`}>
            <figure className="frame project__media" data-reveal="image">
              <div className="project__zoom">
                <Photo image={project.image} parallax="6" />
              </div>
              <span className="project__overlay" aria-hidden="true" />
            </figure>
            <div className="project__meta" data-reveal="fade">
              <span className="project__num">{project.id}</span>
              <h3 className="project__name" id={`project-${project.id}`}>
                {project.name}
              </h3>
              <span className="project__cat">{project.category}</span>
              <span className="project__arrow" aria-hidden="true">
                →
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
