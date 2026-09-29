import Lines from '../Lines.jsx'
import Photo from '../Photo.jsx'
import { architecturalImages, METRICS } from '../../data/site.js'

const [main, facade, interior] = architecturalImages.about

export default function About() {
  return (
    <section className="about" id="about" data-nav="light" aria-labelledby="about-title">
      <div className="about__text">
        <p className="eyebrow" data-reveal="fade">About</p>
        <h2 className="display" id="about-title" data-reveal="lines">
          <Lines lines={['From vision', 'to lasting spaces.']} />
        </h2>
        <p className="about__body" data-reveal="fade">
          We are a construction and development company committed to creating spaces that inspire, perform and stand
          the test of time.
        </p>
        <ul className="metrics" data-reveal="stagger">
          {METRICS.map((m) => (
            <li className="metric" key={m.value}>
              <span className="metric__value">{m.value}</span>
              <span className="metric__label">
                {m.label[0]}
                <br />
                {m.label[1]}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="about__images">
        <figure className="frame about__img about__img--main" data-reveal="image">
          <Photo image={main} parallax="6" />
        </figure>
        <figure className="frame about__img about__img--facade" data-reveal="image">
          <Photo image={facade} parallax="6" />
        </figure>
        <figure className="frame about__img about__img--interior" data-reveal="image">
          <Photo image={interior} parallax="6" />
        </figure>
      </div>
    </section>
  )
}
