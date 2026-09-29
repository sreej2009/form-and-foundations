import { memo, useEffect } from 'react'
import { architecturalImages } from '../data/site.js'
import { scrollToHash } from '../lib/scrollTo.js'
import { hideOnError } from '../lib/images.js'
import { loadHeroImages } from '../lib/heroTimeline.js'

const frames = architecturalImages.hero

// The room the camera enters through the building's glass, which becomes the
// hero. It lives inside the pinned viewport, so when the pin releases the page
// is already on the hero: no seam, no jump. Every animation here is scrubbed by
// the film's master timeline (heroTimeline.js).
function Hero() {
  // The entry interior (01) loads with the page, ready well before the camera
  // reaches the glass; 02–05 wait until the visitor is well into the film (or a
  // few seconds pass), so they never compete with the video.
  useEffect(() => {
    const root = document.querySelector('.hero__media')
    const load = () => {
      loadHeroImages(root)
      window.removeEventListener('scroll', onScroll)
    }
    const onScroll = () => window.scrollY > window.innerHeight * 2 && load()
    const timer = setTimeout(load, 6000)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <div className="hero" aria-labelledby="hero-title">
      <div className="hero__media" aria-hidden="true">
        {frames.map((image, i) => (
          <div className="hero__frame" key={image.src} style={image.origin ? { transformOrigin: image.origin } : undefined}>
            <img
              className="hero__image"
              {...(i === 0 ? { src: image.src, fetchPriority: 'low' } : { 'data-src': image.src })}
              width={image.width}
              height={image.height}
              alt=""
              decoding="async"
              style={image.position ? { objectPosition: image.position } : undefined}
              onError={hideOnError}
            />
          </div>
        ))}
        {/* Reflections on the window the camera passes through; clipped to it. */}
        <div className="hero__glass" />
      </div>

      <div className="hero__shade" aria-hidden="true" />

      <div className="hero__layer">
        <div className="hero__content">
          <p className="hero__label">Building a better tomorrow</p>
          <h1 className="hero__title" id="hero-title">
            <span className="hero__line">Spaces</span>
            <span className="hero__line">that belong.</span>
          </h1>
          <p className="hero__lede">
            We design and build residential, commercial and mixed-use spaces with precision, purpose and permanence.
          </p>
          <a className="hero__cta" href="#projects" onClick={scrollToHash}>
            Explore our projects <span aria-hidden="true">→</span>
          </a>
        </div>

        <a className="hero__scroll" href="#about" onClick={scrollToHash}>
          <span className="hero__scroll-line" aria-hidden="true" />
          Scroll to explore <span aria-hidden="true">→</span>
        </a>

        <ol className="hero__index" aria-hidden="true">
          {frames.map((image, i) => (
            <li key={image.src}>
              <span className="hero__index-num">0{i + 1}</span>
              {i < frames.length - 1 && (
                <span className="hero__index-seg">
                  <span className="hero__index-fill" />
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export default memo(Hero)
