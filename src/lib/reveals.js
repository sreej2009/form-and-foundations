import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Scroll animations for the sections after the hero. These are plain,
// un-pinned ScrollTriggers on elements the film never touches, so they can't
// compete with the construction timeline. Each reveal plays once on the way
// down and rewinds on the way back up.
//
//   data-reveal="lines"    heading lines rise through a clip   (<span class="line"><span>…</span></span>)
//   data-reveal="fade"     soft rise and fade
//   data-reveal="stagger"  children rise one after another
//   data-reveal="rule"     hairline draws left to right
//   data-reveal="image"    frame opens from a slight inset while the photograph settles 1.05 → 1
//   data-parallax="n"      photograph drifts ±n% against the scroll (inside an overflow-hidden frame)

const EASE = 'expo.out'
const once = (trigger, start = 'top 86%') => ({ trigger, start, toggleActions: 'play none none reverse' })

export function initReveals(root = document) {
  const mm = gsap.matchMedia()

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const all = (sel) => gsap.utils.toArray(root.querySelectorAll(sel))

    all('[data-reveal="lines"]').forEach((el) => {
      gsap.fromTo(
        el.querySelectorAll('.line > span'),
        { yPercent: 110 },
        { yPercent: 0, duration: 1.5, ease: EASE, stagger: 0.12, scrollTrigger: once(el) },
      )
    })

    all('[data-reveal="fade"]').forEach((el) => {
      gsap.fromTo(el, { autoAlpha: 0, y: 32 }, { autoAlpha: 1, y: 0, duration: 1.4, ease: EASE, scrollTrigger: once(el) })
    })

    all('[data-reveal="stagger"]').forEach((el) => {
      gsap.fromTo(
        el.children,
        { autoAlpha: 0, y: 28 },
        { autoAlpha: 1, y: 0, duration: 1.3, ease: EASE, stagger: 0.12, scrollTrigger: once(el, 'top 88%') },
      )
    })

    all('[data-reveal="rule"]').forEach((el) => {
      gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: 1.8, ease: 'power3.inOut', scrollTrigger: once(el, 'top 92%') })
    })

    all('[data-reveal="image"]').forEach((el) => {
      const image = el.querySelector('img')
      const tl = gsap.timeline({ scrollTrigger: once(el, 'top 90%') })
      tl.fromTo(el, { clipPath: 'inset(8% 6% 8% 6%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: EASE }, 0)
      if (image) tl.fromTo(image, { scale: 1.12 }, { scale: 1.06, duration: 2.2, ease: EASE }, 0)
    })

    // Parallax on the photograph itself. It is pre-scaled (see CSS) so its
    // edges never show; the reveal above only animates scale, this only y.
    all('[data-parallax]').forEach((image) => {
      const amount = Number(image.dataset.parallax) || 6
      gsap.fromTo(
        image,
        { yPercent: -amount / 2 },
        {
          yPercent: amount / 2,
          ease: 'none',
          scrollTrigger: { trigger: image.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      )
    })
  })

  return () => mm.revert()
}
