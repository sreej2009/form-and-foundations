import Lines from '../Lines.jsx'
import Photo from '../Photo.jsx'
import { architecturalImages } from '../../data/site.js'
import { scrollToHash } from '../../lib/scrollTo.js'

// The studio's enquiry address, set at build time: VITE_CONTACT_EMAIL=hello@example.com
const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || ''
const mail = (subject) => (CONTACT_EMAIL ? `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}` : '#contact')

const [image] = architecturalImages.contact

export default function Contact() {
  return (
    <footer className="contact" id="contact" data-nav="dark" aria-labelledby="contact-title">
      <div className="contact__media" aria-hidden="true">
        <Photo image={image} parallax="6" decorative />
      </div>
      <div className="contact__shade" aria-hidden="true" />

      <div className="contact__inner">
        <p className="eyebrow" data-reveal="fade">Contact</p>
        <h2 className="contact__title" id="contact-title" data-reveal="lines">
          <Lines lines={['Let’s build', 'what comes next.']} />
        </h2>

        <div className="contact__row">
          <p className="contact__text" data-reveal="fade">
            Have a project in mind?
            <br />
            Let’s discuss the site, the vision and what it could become.
          </p>
          <div className="contact__actions" data-reveal="stagger">
            <a className="button" href={mail('New project enquiry')}>
              Start a project <span aria-hidden="true">→</span>
            </a>
            <a className="link-arrow" href={mail('Enquiry for the team')}>
              Contact our team <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        <div className="contact__foot">
          <p className="contact__brand">
            Form &amp; Foundations
            <span>Construction / Architecture / Development</span>
          </p>
          <nav className="contact__links" aria-label="Footer">
            <a href="#projects" onClick={scrollToHash}>Projects</a>
            <a href="#expertise" onClick={scrollToHash}>Expertise</a>
            <a href="#about" onClick={scrollToHash}>About</a>
            <a href="#top" onClick={scrollToHash}>Rewind the film ↑</a>
          </nav>
          <p className="contact__copy">© {new Date().getFullYear()} Form &amp; Foundations</p>
        </div>
      </div>
    </footer>
  )
}
