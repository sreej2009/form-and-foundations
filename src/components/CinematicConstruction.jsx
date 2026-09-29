import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import CinematicText from './CinematicText.jsx'
import ProgressIndicator from './ProgressIndicator.jsx'
import ScrollIndicator from './ScrollIndicator.jsx'
import Hero from './Hero.jsx'
import { createBlueprint } from '../lib/blueprint.js'
import { ENTRANCE_DURATION, HERO, buildEntrance, bindHeroLeave } from '../lib/heroTimeline.js'

gsap.registerPlugin(ScrollTrigger)
ScrollTrigger.config({ ignoreMobileResize: true })

// `#t=0.001` makes iOS Safari paint the first frame without playing.
const VIDEO_SRC = `${import.meta.env.BASE_URL}videos/construction.mp4#t=0.001`

// ---- One master timeline, measured in "units". 1 unit = VH_PER_UNIT viewport heights of scroll.
// |-- construction 0→1 --|-- hold --|-- approach window → through the glass → interior → hero, photographs --|→ unpin
const CONSTRUCTION = 1
const HOLD = 0.1
const ZOOM_AT = CONSTRUCTION + HOLD
// After the hold: approach the building, enter through its glass, and arrive
// in the hero. That whole sequence is defined in heroTimeline.js.
const REVEAL_AT = ZOOM_AT + HERO
const TOTAL = ZOOM_AT + ENTRANCE_DURATION
const VH_PER_UNIT = 6 // construction alone ≈ the original 700vh section

// Seconds the timeline takes to catch up with the scrollbar. Higher = heavier, slower, more filmic.
const SCRUB = 1.6
// Share of the timeline spent fading a text block out (and the next one in).
const FADE = 0.035
// Never seek to the exact last frame; some browsers render black there.
const END_GUARD = 0.05
// Frame rate of construction.mp4. Seeks are made once per video frame, never
// for sub-frame changes, so the decoder is never busy with redundant work.
const VIDEO_FPS = 24
// Seconds for the video to ease onto the scroll position. Short enough to feel
// immediate, long enough to turn wheel/trackpad steps into continuous motion.
const VIDEO_SMOOTHING = 0.12

// Pivot of the gentle dolly during construction, in video-frame coordinates (0–1).
const ZOOM_TARGET = { x: 0.54, y: 0.5 }
// The glass of the large window the camera enters (left of the two on the main
// facade), in video-frame coordinates. It stays in frame on phones too.
const ENTRY_WINDOW = { x0: 0.428, x1: 0.541, y0: 0.421, y1: 0.604 }
// Pointer parallax on the hero background, in px.
const DRIFT = 16

export const STAGES = [
  { id: '01', label: 'Origin', lines: ['Every space', 'starts with', 'an idea.'], start: 0, end: 0.15 },
  { id: '02', label: 'Foundation', lines: ['From ground', 'to possibility.'], start: 0.15, end: 0.3 },
  { id: '03', label: 'Structure', lines: ['Form', 'takes shape.'], start: 0.3, end: 0.5 },
  { id: '04', label: 'Form', lines: ['An idea', 'becomes real.'], start: 0.5, end: 0.7 },
  { id: '05', label: 'Detail', lines: ['Every detail', 'has a purpose.'], start: 0.7, end: 0.88 },
  { id: '06', label: 'Complete', lines: ['Built to become.'], start: 0.88, end: 1 },
]

const stageAt = (p) => {
  for (let i = STAGES.length - 1; i > 0; i--) if (p >= STAGES[i].start) return i
  return 0
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))


export default function CinematicConstruction() {
  const sectionRef = useRef(null)
  const viewportRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const progressRef = useRef(0)
  const blueprintRef = useRef(null)
  const frameRef = useRef({ aspect: 16 / 9, drawing: false })
  const [fallback, setFallback] = useState(false)

  useLayoutEffect(() => {
    const section = sectionRef.current
    const viewport = viewportRef.current
    const video = videoRef.current
    const nav = document.querySelector('.nav')
    const media = { ready: false, duration: 0 }

    video.muted = true
    video.disablePictureInPicture = true
    video.disableRemotePlayback = true

    // The camera's focal point in viewport fractions, following object-fit: cover.
    const focus = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      if (frameRef.current.drawing) return vh > vw * 1.05 ? { x: 0.5, y: 0.5 } : { x: 0.6, y: 0.5 }
      const aspect = frameRef.current.aspect
      const w = Math.max(vw, vh * aspect)
      const h = Math.max(vh, vw / aspect)
      return {
        x: clamp(((vw - w) / 2 + ZOOM_TARGET.x * w) / vw, 0.25, 0.75),
        y: clamp(((vh - h) / 2 + ZOOM_TARGET.y * h) / vh, 0.3, 0.7),
      }
    }
    const origin = () => {
      const f = focus()
      return `${f.x * 100}% ${f.y * 100}%`
    }

    // The entry window and the media's pivot, in px at scale 1 (object-fit: cover).
    const entryGeometry = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const f = focus()
      let rect
      if (frameRef.current.drawing) {
        const size = Math.min(vw, vh) * 0.14
        rect = { x: f.x * vw - size / 2, y: f.y * vh - size / 2, w: size, h: size }
      } else {
        const aspect = frameRef.current.aspect
        const w = Math.max(vw, vh * aspect)
        const h = Math.max(vh, vw / aspect)
        const ox = (vw - w) / 2
        const oy = (vh - h) / 2
        rect = {
          x: ox + ENTRY_WINDOW.x0 * w,
          y: oy + ENTRY_WINDOW.y0 * h,
          w: (ENTRY_WINDOW.x1 - ENTRY_WINDOW.x0) * w,
          h: (ENTRY_WINDOW.y1 - ENTRY_WINDOW.y0) * h,
        }
      }
      return { vw, vh, origin: { x: f.x * vw, y: f.y * vh }, rect }
    }

    // ---------------------------------------------------------------- video

    // The video follows the scroll position itself, through the same single
    // mapping the timeline uses (scroll → timeline time → construction
    // progress), easing onto it with its own short time constant rather than
    // inheriting the timeline's slower scrub. At rest it lands on exactly the
    // frame for the scroll position.
    let trigger = null // the pinned ScrollTrigger, once created
    const follow = { p: null, frame: -1 }

    const scrollProgress = () => {
      if (!trigger) return progressRef.current
      const span = trigger.end - trigger.start
      const units = span > 0 ? clamp((window.scrollY - trigger.start) / span, 0, 1) * TOTAL : 0
      return Math.min(units / CONSTRUCTION, 1)
    }

    // Only one seek is in flight at a time, and only when the target reaches a
    // new video frame: while the decoder is busy we skip, and the next tick
    // (or `seeked`) goes straight to the latest frame.
    const seek = () => {
      if (!media.ready || video.seeking || follow.p === null) return
      const time = Math.min(follow.p * media.duration, media.duration - END_GUARD)
      const frame = Math.floor(time * VIDEO_FPS)
      if (frame === follow.frame) return
      follow.frame = frame
      // The middle of the frame, so the decoder can't settle on its neighbour.
      video.currentTime = Math.min((frame + 0.5) / VIDEO_FPS, media.duration - END_GUARD)
    }

    // gsap.ticker (requestAnimationFrame): frame-rate-independent easing
    // toward the scroll position, then a seek if that crossed a frame.
    const onTick = (time, deltaTime) => {
      const target = scrollProgress()
      if (follow.p === null) follow.p = target
      else {
        follow.p += (target - follow.p) * (1 - Math.exp(-deltaTime / 1000 / VIDEO_SMOOTHING))
        if (Math.abs(target - follow.p) < 1e-5) follow.p = target
      }
      seek()
    }

    const onMetadata = () => {
      const d = video.duration
      if (!Number.isFinite(d) || d <= 0) return
      media.duration = d
      media.ready = true
      video.pause()
      if (video.videoWidth && video.videoHeight) {
        const aspect = video.videoWidth / video.videoHeight
        if (Math.abs(aspect - frameRef.current.aspect) > 0.01) {
          frameRef.current.aspect = aspect
          ScrollTrigger.refresh() // re-aim the camera for the real frame shape
        }
      }
      seek()
    }
    const onFirstFrame = () => video.classList.add('is-ready')
    const onPlay = () => video.pause() // scroll is the only clock
    const onError = () => {
      media.ready = false
      setFallback(true)
    }

    const listeners = [
      ['loadedmetadata', onMetadata],
      ['durationchange', onMetadata],
      ['loadeddata', onFirstFrame],
      ['canplay', onFirstFrame],
      ['seeked', seek],
      ['play', onPlay],
      ['error', onError],
    ]
    listeners.forEach(([type, fn]) => video.addEventListener(type, fn))
    if (video.error) onError()
    else {
      if (video.readyState >= 1) onMetadata()
      if (video.readyState >= 2) onFirstFrame()
    }
    gsap.ticker.add(onTick)

    // ------------------------------------------------------ master timeline

    const ctx = gsap.context((self) => {
      const q = self.selector
      const stageEls = q('.stage')
      const items = q('.progress__item')
      const readout = q('.readout__value')[0]
      const mediaEl = q('.cinematic__media')
      let activeIndex = -1
      let lastPct = -1
      let heroActive = false
      let syncEntrance = () => {}

      // Pointer parallax on the hero background (fine pointers only).
      const drift = q('.cinematic__drift')
      const driftX = gsap.quickTo(drift, 'x', { duration: 1.6, ease: 'power3.out' })
      const driftY = gsap.quickTo(drift, 'y', { duration: 1.6, ease: 'power3.out' })
      const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
      const onPointer = (e) => {
        if (!heroActive) return
        driftX((0.5 - e.clientX / window.innerWidth) * DRIFT)
        driftY((0.5 - e.clientY / window.innerHeight) * DRIFT * 0.6)
      }
      if (finePointer) window.addEventListener('pointermove', onPointer, { passive: true })

      // Everything that isn't a tween reads the same timeline time here.
      const apply = (time) => {
        const p = Math.min(time / CONSTRUCTION, 1)
        progressRef.current = p
        blueprintRef.current?.render(p)
        syncEntrance(time)

        const idx = stageAt(p)
        if (idx !== activeIndex) {
          activeIndex = idx
          items.forEach((el, i) => {
            el.classList.toggle('is-active', i === idx)
            el.classList.toggle('is-past', i < idx)
          })
        }

        const pct = Math.round(p * 100)
        if (pct !== lastPct) {
          lastPct = pct
          readout.textContent = String(pct).padStart(3, '0')
        }

        const hero = time >= REVEAL_AT
        if (hero !== heroActive) {
          heroActive = hero
          if (!hero) {
            driftX(0)
            driftY(0)
          }
        }
      }

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        onUpdate: () => apply(tl.time()),
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${window.innerHeight * VH_PER_UNIT * TOTAL}`,
          pin: viewport,
          scrub: SCRUB,
          anticipatePin: 1,
          invalidateOnRefresh: true, // re-aim the camera on resize / rotation
        },
      })

      // The video reads its scroll position from this same trigger.
      trigger = tl.scrollTrigger

      // Fix the length so positions below are exact.
      tl.to({}, { duration: TOTAL }, 0)

      // ============================================ PHASE 01 — construction

      // A slow dolly-in, like a camera settling on the site.
      tl.fromTo(mediaEl, { scale: 1.06, transformOrigin: origin }, { scale: 1, duration: CONSTRUCTION }, 0)
      tl.fromTo(q('.hairline__fill'), { scaleX: 0 }, { scaleX: 1, duration: CONSTRUCTION }, 0)
      tl.fromTo(q('.scroll-indicator'), { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: 12, duration: 0.03, immediateRender: false }, 0)

      q('.progress__fill').forEach((fill, i) => {
        const { start, end } = STAGES[i]
        tl.fromTo(fill, { scaleY: 0 }, { scaleY: 1, duration: end - start }, start)
      })

      // Text: block N finishes leaving exactly where block N+1 starts arriving,
      // so there is never more than one block on screen. The last block leaves
      // as the camera starts to move.
      stageEls.forEach((el, i) => {
        const { start, end } = STAGES[i]
        const label = el.querySelector('.stage__label')
        const lines = el.querySelectorAll('.stage__line')
        const lineDur = FADE * 0.8
        const lineStagger = lines.length > 1 ? (FADE - lineDur) / (lines.length - 1) : 0
        const isLast = i === STAGES.length - 1

        if (i > 0) {
          tl.fromTo(
            label,
            { autoAlpha: 0, y: 12, filter: 'blur(6px)' },
            { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: FADE * 0.7, ease: 'power2.out' },
            start,
          )
          // Moving the line up while shrinking its bottom clip reads as a
          // mask reveal, without extra wrapper elements.
          tl.fromTo(
            lines,
            { autoAlpha: 0, yPercent: 70, clipPath: 'inset(0% 0% 70% 0%)', filter: 'blur(10px)' },
            {
              autoAlpha: 1,
              yPercent: 0,
              clipPath: 'inset(0% 0% 0% 0%)',
              filter: 'blur(0px)',
              duration: lineDur,
              stagger: lineStagger,
              ease: 'power3.out',
            },
            start,
          )
        }

        const out = isLast ? ZOOM_AT : end - FADE
        tl.fromTo(
          lines,
          { autoAlpha: 1, yPercent: 0, clipPath: 'inset(0% 0% 0% 0%)', filter: 'blur(0px)' },
          {
            autoAlpha: 0,
            yPercent: -40,
            clipPath: 'inset(40% 0% 0% 0%)',
            filter: 'blur(8px)',
            duration: lineDur,
            stagger: lineStagger,
            ease: 'power2.in',
            immediateRender: false,
          },
          out,
        )
        tl.fromTo(
          label,
          { autoAlpha: 1, y: 0, filter: 'blur(0px)' },
          { autoAlpha: 0, y: -10, filter: 'blur(6px)', duration: FADE * 0.7, ease: 'power2.in', immediateRender: false },
          out + FADE * 0.3,
        )
      })

      // ================================ PHASE 02 — hold the finished building
      // (Nothing moves between CONSTRUCTION and ZOOM_AT: the last frame and
      // "Built to become." rest on screen.)

      // ======================================= PHASE 03+ — enter the building

      // The film's instruments clear away as the camera starts to move.
      tl.fromTo(q('.cinematic__film'), { opacity: 1 }, { opacity: 0, duration: 0.1, ease: 'power1.in', immediateRender: false }, ZOOM_AT + 0.02)

      // Approach one window, pass through its glass into the interior, then
      // the hero and its photographs (heroTimeline.js).
      syncEntrance = buildEntrance(tl, { q, nav, at: ZOOM_AT, media: mediaEl, geometry: entryGeometry })

      apply(tl.time())

      // ================================ PHASE 06–07 — unpin, normal scroll
      // After the pin releases, the hero is already on screen (it *is* the
      // pinned viewport), so it simply scrolls away with slight parallax.
      bindHeroLeave({ q, section })

      // Entrance before the first scroll. Animates wrappers only, so it never
      // competes with the scrubbed tweens above. Opacity rather than autoAlpha:
      // visibility is inherited, and the text tweens must see their lines as visible.
      gsap.fromTo(q('.cinematic__ui'), { opacity: 0 }, { opacity: 1, duration: 1.8, delay: 0.2, ease: 'power2.out' })
      gsap.fromTo(
        q('.cinematic__text'),
        { y: 28, filter: 'blur(10px)' },
        { y: 0, filter: 'blur(0px)', duration: 2.4, delay: 0.3, ease: 'expo.out', clearProps: 'transform,filter' },
      )

      return () => window.removeEventListener('pointermove', onPointer)
    }, viewport)

    let disposed = false
    document.fonts.ready.then(() => { if (!disposed) ScrollTrigger.refresh() })

    return () => {
      disposed = true
      gsap.ticker.remove(onTick)
      listeners.forEach(([type, fn]) => video.removeEventListener(type, fn))
      ctx.revert() // kills the timeline, its ScrollTriggers and the pin
      trigger = null
    }
  }, [])

  // Without the video, draw the building instead so the page still works end to end.
  useEffect(() => {
    if (!fallback) return
    frameRef.current.drawing = true
    const blueprint = createBlueprint(canvasRef.current)
    blueprintRef.current = blueprint
    blueprint.render(progressRef.current)
    ScrollTrigger.refresh() // re-aim the camera at the drawing
    return () => {
      blueprint.destroy()
      blueprintRef.current = null
      frameRef.current.drawing = false
    }
  }, [fallback])

  return (
    <section className="cinematic" id="top" ref={sectionRef} aria-label="Construction film. Scroll to build.">
      <div className="cinematic__viewport" ref={viewportRef}>
        <div className="cinematic__parallax">
          <div className="cinematic__drift">
            <div className="cinematic__media">
              {fallback ? (
                <canvas className="cinematic__canvas" ref={canvasRef} aria-hidden="true" />
              ) : (
                <video className="cinematic__video" ref={videoRef} src={VIDEO_SRC} preload="auto" playsInline muted aria-hidden="true" tabIndex={-1} />
              )}
            </div>
          </div>
        </div>

        <div className="cinematic__vignette" aria-hidden="true" />

        <div className="cinematic__ui">
          <div className="cinematic__film">
            <header className="masthead">
              <p className="readout" aria-hidden="true">
                <span className="readout__label">Build</span>
                <span className="readout__value">000</span>
                <span>%</span>
              </p>
            </header>

            <CinematicText stages={STAGES} />
            <ProgressIndicator stages={STAGES} />
            <ScrollIndicator />

            <div className="hairline" aria-hidden="true">
              <span className="hairline__fill" />
              {STAGES.slice(1).map((s) => (
                <span className="hairline__tick" key={s.id} style={{ left: `${s.start * 100}%` }} />
              ))}
            </div>

            {fallback && <p className="cinematic__notice">Preview — video pending</p>}
          </div>
        </div>

        <Hero />

        <div className="cinematic__grain" aria-hidden="true" />
      </div>
    </section>
  )
}
