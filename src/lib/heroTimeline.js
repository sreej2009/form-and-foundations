import gsap from 'gsap'

// Everything after the completed-building hold, added to the film's master
// timeline (one pinned ScrollTrigger, so it all reverses with scroll).
//
// Positions are in timeline units relative to `at` (the end of the hold):
//
//  0 ───────── APPROACH ─── the camera dollies toward one large window of the
//  │                        finished building. The interior is visible only
//  │                        through that window's outline, which grows with
//  │                        the camera until its frame sweeps past: we're in.
//  APPROACH ── TRAVEL ───── inside, the camera keeps moving and settles, the
//  │                        daylight exposure easing to the room's own light.
//  HERO ────────────────── navigation and hero typography arrive.
//  SEQUENCE ────────────── photographs 02…05 cross-dissolve with scroll.
//  → ENTRANCE_DURATION: the pin releases and the page scrolls normally.

export const APPROACH = 0.62
export const TRAVEL = 0.38
export const HERO = APPROACH + TRAVEL * 0.55
const SEQUENCE = APPROACH + TRAVEL + 0.08
const STEP = 0.07
const DISSOLVE = 0.045
const TAIL = 0.045
const FRAMES = 5
export const ENTRANCE_DURATION = SEQUENCE + (FRAMES - 1) * STEP + TAIL

// The camera ends this far past the point where the glass fills the frame,
// so the window's edges travel fully out of view.
const PASS = 1.3

// Start of the dissolve that brings in frame i (i ≥ 1), relative to `at`.
const frameIn = (i) => SEQUENCE + (i - 1) * STEP

/**
 * @param tl        the master timeline
 * @param q         selector scoped to the film viewport
 * @param nav       the fixed navigation element
 * @param at        timeline position where the approach begins
 * @param media     the film's media layer (video or fallback drawing)
 * @param geometry  () => { vw, vh, origin: {x, y}, rect: {x, y, w, h} } — in px at scale 1:
 *                  the media's transform origin and the target window's glass
 * @returns sync(time): keeps the interior clipped to the window; call on every timeline update
 */
export function buildEntrance(tl, { q, nav, at, media, geometry }) {
  const frames = q('.hero__frame')
  const [interior] = frames
  const camera = gsap.utils.toArray(media)[0] // tweens accept arrays; getProperty needs the element
  const glass = q('.hero__glass')[0]
  const nums = q('.hero__index-num')
  const fills = q('.hero__index-fill')
  const last = frames.length - 1
  const end = at + ENTRANCE_DURATION

  // ---- geometry, re-measured whenever the camera tween re-initialises (resize)
  let g = null
  const measure = () => {
    const { vw, vh, origin, rect } = geometry()
    const wc = { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 }
    const sEnd = Math.max(vw / rect.w, vh / rect.h) * PASS
    g = { vw, vh, origin, rect, wc, sEnd, vc: { x: vw / 2, y: vh / 2 } }
    return g
  }
  measure()

  // A camera dollying forward at constant speed: apparent scale grows as
  // 1 / distance. It eases out of the hold, so the move starts from rest and
  // is at full speed as it passes through the glass. Maps time → progress q.
  const dolly = (t) => {
    const eased = 1 - Math.cos((t * Math.PI) / 2)
    const s = 1 / (1 - (1 - 1 / g.sEnd) * eased)
    return (s - 1) / (g.sEnd - 1)
  }

  // Scale about the media's existing transform origin (so nothing earlier in
  // the film changes) while translating so the window's centre travels to the
  // centre of the frame. With scale = 1 + q(sEnd − 1), the required
  // translation is linear in q, so one eased tween drives both exactly.
  const shift = (axis) => g.vc[axis] - g.wc[axis] - (g.sEnd - 1) * (g.wc[axis] - g.origin[axis])

  // ================================================== APPROACH — the facade
  tl.fromTo(
    media,
    { scale: 1, x: 0, y: 0 },
    {
      scale: () => measure().sEnd,
      x: () => shift('x'),
      y: () => shift('y'),
      duration: APPROACH,
      ease: dolly,
      immediateRender: false,
    },
    at,
  )

  // Closing in on bright glass: a touch more exposure, and the facade softens
  // as it rushes past the lens.
  tl.fromTo(
    media,
    { filter: 'brightness(1) blur(0px)' },
    { filter: 'brightness(1.12) blur(3px)', duration: APPROACH * 0.55, ease: 'power2.in', immediateRender: false },
    at + APPROACH * 0.45,
  )

  // Depth: the lens vignette opens at a different rate from the image.
  tl.fromTo(
    q('.cinematic__vignette'),
    { scale: 1, opacity: 1 },
    { scale: 1.3, opacity: 0.5, duration: APPROACH, ease: 'power2.in', immediateRender: false },
    at,
  )

  // Once through the glass the exterior is out of view; stop compositing it.
  tl.fromTo(q('.cinematic__parallax'), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.001, immediateRender: false }, at + APPROACH)

  // ============================================ THROUGH THE GLASS — interior
  // Seen through the window at first: reflections on the glass, the room
  // resolving behind it. Its own slow forward drift reads as depth against
  // the facade rushing past.
  tl.fromTo(interior, { autoAlpha: 0 }, { autoAlpha: 1, duration: APPROACH * 0.42, ease: 'sine.inOut' }, at + APPROACH * 0.3)
  tl.fromTo(
    interior,
    { scale: 1 },
    { scale: 1.26, duration: APPROACH * 0.6 + TRAVEL, ease: 'power1.inOut', immediateRender: false },
    at + APPROACH * 0.4,
  )
  // Eyes adjusting from daylight: the room starts slightly overexposed.
  tl.fromTo(
    interior,
    { filter: 'brightness(1.32) saturate(0.9)' },
    { filter: 'brightness(1) saturate(1)', duration: APPROACH * 0.5 + TRAVEL * 0.6, ease: 'sine.out' },
    at + APPROACH * 0.5,
  )

  tl.fromTo(glass, { opacity: 0 }, { opacity: 0.6, duration: APPROACH * 0.3, ease: 'sine.out' }, at + APPROACH * 0.12)
  tl.fromTo(glass, { opacity: 0.6 }, { opacity: 0, duration: APPROACH * 0.3, ease: 'sine.in', immediateRender: false }, at + APPROACH * 0.66)

  // ===================================================== HERO — the website
  const h = at + HERO
  tl.fromTo(q('.hero__shade'), { opacity: 0 }, { opacity: 1, duration: 0.14, ease: 'power1.inOut' }, h - 0.04)
  tl.fromTo(q('.hero__label'), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.07, ease: 'power2.out' }, h)
  tl.fromTo(
    q('.hero__line'),
    { autoAlpha: 0, yPercent: 100, clipPath: 'inset(0% 0% 100% 0%)' },
    { autoAlpha: 1, yPercent: 0, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.1, stagger: 0.035, ease: 'power3.out' },
    h + 0.02,
  )
  tl.fromTo(
    q('.hero__lede, .hero__cta'),
    { autoAlpha: 0, y: 16 },
    { autoAlpha: 1, y: 0, duration: 0.07, stagger: 0.025, ease: 'power2.out' },
    h + 0.1,
  )
  tl.fromTo(q('.hero__scroll'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08, ease: 'power1.out' }, h + 0.14)
  tl.fromTo(q('.hero__index'), { opacity: 0 }, { opacity: 1, duration: 0.08, ease: 'power1.out' }, h + 0.1)
  if (nav) {
    tl.fromTo(
      nav.querySelectorAll('.nav__reveal'),
      { autoAlpha: 0, y: -8 },
      { autoAlpha: 1, y: 0, duration: 0.06, stagger: 0.012, ease: 'power2.out' },
      h + 0.06,
    )
  }

  // ====================================== SEQUENCE — photographs 02…05
  for (let i = 1; i <= last; i++) {
    const t = at + frameIn(i)
    const next = i === last ? end : at + frameIn(i + 1) + DISSOLVE
    tl.fromTo(frames[i], { autoAlpha: 0, scale: 1.1 }, { autoAlpha: 1, scale: 1.06, duration: DISSOLVE, ease: 'sine.inOut' }, t)
    // Each settles and drifts while on screen, alternating direction like
    // successive shots. The drift stays inside the overscan of scale 1.035.
    tl.fromTo(
      frames[i],
      { scale: 1.06, xPercent: 0 },
      { scale: 1.035, xPercent: i % 2 ? -1.2 : 1.2, duration: next - t - DISSOLVE, ease: 'none', immediateRender: false },
      t + DISSOLVE,
    )
    // Hide the frame underneath once it's covered: fewer layers to composite.
    tl.fromTo(frames[i - 1], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.001, immediateRender: false }, t + DISSOLVE)

    tl.fromTo(fills[i - 1], { scaleY: 0 }, { scaleY: 1, duration: STEP, ease: 'none' }, t - STEP + DISSOLVE)
    tl.fromTo(nums[i - 1], { opacity: 1 }, { opacity: 0.5, duration: DISSOLVE * 0.6, immediateRender: false }, t)
    tl.fromTo(nums[i], { opacity: 0.5 }, { opacity: 1, duration: DISSOLVE * 0.6 }, t + DISSOLVE * 0.4)
  }

  // ---- the window outline, recomputed from the camera's actual scale
  const clipped = [interior, glass]
  let lastClip = ''
  return function sync(time) {
    let clip = 'inset(50%)'
    if (time > at) {
      const s = gsap.getProperty(camera, 'scale')
      const p = Math.min(1, Math.max(0, (s - 1) / (g.sEnd - 1)))
      const cx = g.wc.x + p * (g.vc.x - g.wc.x)
      const cy = g.wc.y + p * (g.vc.y - g.wc.y)
      const hw = (s * g.rect.w) / 2
      const hh = (s * g.rect.h) / 2
      const top = Math.max(0, cy - hh)
      const left = Math.max(0, cx - hw)
      const right = Math.max(0, g.vw - cx - hw)
      const bottom = Math.max(0, g.vh - cy - hh)
      clip = top + right + bottom + left < 0.5 ? 'none' : `inset(${top.toFixed(1)}px ${right.toFixed(1)}px ${bottom.toFixed(1)}px ${left.toFixed(1)}px)`
    }
    if (clip !== lastClip) {
      lastClip = clip
      clipped.forEach((el) => (el.style.clipPath = clip))
    }
  }
}

// After the pin releases the hero is already on screen (it lives inside the
// pinned viewport), so it simply scrolls away, its photograph a little slower.
// Touches only wrappers the master timeline never animates.
export function bindHeroLeave({ q, section }) {
  const leave = { trigger: section, start: 'bottom bottom', end: 'bottom top', scrub: true }
  gsap.fromTo(q('.hero__media'), { yPercent: 0 }, { yPercent: 22, ease: 'none', scrollTrigger: leave })
  gsap.fromTo(q('.hero__layer'), { yPercent: 0, opacity: 1 }, { yPercent: -8, opacity: 0.15, ease: 'none', scrollTrigger: { ...leave } })
}

// Hero photographs 02+ stay unrequested while the construction video buffers,
// then load once the visitor is well into the film (or after a short delay).
export function loadHeroImages(root) {
  root.querySelectorAll('img[data-src]').forEach((image) => {
    image.src = image.dataset.src
    image.removeAttribute('data-src')
  })
}
