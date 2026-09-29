import Lines from '../Lines.jsx'
import Photo from '../Photo.jsx'
import { architecturalImages, VALUES } from '../../data/site.js'

// Minimal line icons, drawn on a 32px grid with a hairline stroke.
const ICONS = {
  // a set square: precision, nothing left to chance
  quality: <path d="M7 25V7l18 18H7Zm4-4v-5.5l5.5 5.5H11Z" />,
  // stacked planes: layers of new thinking
  innovation: (
    <>
      <path d="m16 6 10 5-10 5-10-5 10-5Z" />
      <path d="m6 16 10 5 10-5M6 21l10 5 10-5" />
    </>
  ),
  // a leaf with its vein
  sustainability: (
    <>
      <path d="M8 24C8 13 14 7 25 7c0 11-6 17-17 17Z" />
      <path d="M8 24 19 13" />
    </>
  ),
  // two interlocking frames
  trust: (
    <>
      <path d="M6 10h13v13H6z" />
      <path d="M13 9V6h13v13h-3" />
    </>
  ),
}

const [image] = architecturalImages.values

export default function Values() {
  return (
    <section className="values" data-nav="light" aria-labelledby="values-title">
      <figure className="frame values__media" data-reveal="image">
        <Photo image={image} parallax="6" />
      </figure>

      <div className="values__content">
        <p className="eyebrow" data-reveal="fade">Our values</p>
        <h2 className="display" id="values-title" data-reveal="lines">
          <Lines lines={['Built with integrity.', 'For a lasting impact.']} />
        </h2>

        <ul className="values__list" data-reveal="stagger">
          {VALUES.map((value) => (
            <li className="value" key={value.id}>
              <svg className="value__icon" viewBox="0 0 32 32" aria-hidden="true">
                {ICONS[value.id]}
              </svg>
              <h3 className="value__name">{value.name}</h3>
              <p className="value__text">{value.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
