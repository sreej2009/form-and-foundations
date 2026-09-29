// Stand-in for the construction film while public/videos/construction.mp4 is
// missing. Draws an architectural elevation that builds itself from the same
// 0 → 1 progress the video would use, following the six stages.

const INK = '245, 243, 238'
const BAYS = 6
const FLOORS = 9
const SETBACK_FLOOR = 7 // floors from here up step back one bay on the left
const PANES = 3
const GROUND_FLOOR_RATIO = 1.35
const LEVEL_LABELS = ['±0.00', '+4.80', '+8.40', '+12.00', '+15.60', '+19.20', '+22.80', '+26.40', '+30.00', '+33.60']

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const range = (p, a, b) => clamp01((p - a) / (b - a))
const easeOut = (t) => 1 - (1 - t) ** 3
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Stable per-pane values so window lights don't shuffle on resize.
const rand = mulberry32(2026)
const PANE_LIGHTS = Array.from({ length: FLOORS * BAYS * PANES }, () => ({ level: rand(), delay: rand() }))

function computeLayout(w, h) {
  const portrait = h > w * 1.05
  const groundY = h * (portrait ? 0.72 : 0.77)
  const bw = portrait ? w * 0.58 : Math.min(w * 0.32, h * 0.6)
  const bh = portrait ? Math.min(h * 0.42, bw * 1.3) : h * 0.52
  const cx = portrait ? w * 0.5 : w * 0.6
  const unit = bh / (GROUND_FLOOR_RATIO + FLOORS - 1)
  const levels = [groundY]
  for (let k = 1; k <= FLOORS; k++) levels.push(levels[k - 1] - unit * (k === 1 ? GROUND_FLOOR_RATIO : 1))

  return {
    w,
    h,
    portrait,
    groundY,
    cx,
    bw,
    unit,
    levels,
    x0: cx - bw / 2,
    x1: cx + bw / 2,
    bay: bw / BAYS,
    top: levels[FLOORS],
    depth: h * (portrait ? 0.035 : 0.05),
    annotate: w >= 720,
  }
}

export function createBlueprint(canvas) {
  const ctx = canvas.getContext('2d')
  let L = null
  let progress = 0
  let drawn = false

  const stroke = (alpha, width = 1) => {
    ctx.strokeStyle = `rgba(${INK}, ${alpha})`
    ctx.lineWidth = width
  }
  const fill = (alpha) => {
    ctx.fillStyle = `rgba(${INK}, ${alpha})`
  }
  const line = (ax, ay, bx, by) => {
    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(bx, by)
    ctx.stroke()
  }
  // Strokes the current path only up to `t` of its length.
  const partial = (build, length, t) => {
    if (t <= 0) return
    ctx.setLineDash([length, length])
    ctx.lineDashOffset = length * (1 - t)
    ctx.beginPath()
    build()
    ctx.stroke()
    ctx.setLineDash([])
    ctx.lineDashOffset = 0
  }
  const text = (str, x, y, alpha, align = 'left') => {
    fill(alpha)
    ctx.textAlign = align
    ctx.fillText(str, x, y)
  }
  const cross = (x, y, size, alpha) => {
    stroke(alpha)
    line(x - size, y, x + size, y)
    line(x, y - size, x, y + size)
    ctx.beginPath()
    ctx.arc(x, y, size * 0.45, 0, Math.PI * 2)
    ctx.stroke()
  }

  const floorSpan = (f) => (f >= SETBACK_FLOOR ? [1, BAYS] : [0, BAYS])

  function draw(p) {
    const { w, h, groundY, cx, x0, x1, bw, bay, unit, levels, top, depth, portrait, annotate } = L
    ctx.clearRect(0, 0, w, h)
    ctx.font = '500 9px "Geist Mono", ui-monospace, monospace'
    ctx.textBaseline = 'middle'

    const complete = easeInOut(range(p, 0.88, 1))
    const drafting = 1 - 0.65 * complete // construction aids recede once it's built
    const buildH = groundY - top

    // 01 ORIGIN: axes, ground, survey marks ---------------------------------
    const axes = easeOut(range(p, 0, 0.12))
    if (axes > 0) {
      const reach = (groundY - h * 0.1) * axes
      const bubbleY = groundY + depth + h * 0.085
      ctx.setLineDash([2, 6])
      stroke(0.1 * axes * drafting)
      for (let c = 0; c <= BAYS; c++) {
        const x = x0 + c * bay
        line(x, groundY, x, groundY - reach)
        line(x, groundY, x, bubbleY - 9)
      }
      ctx.setLineDash([])
      for (let c = 0; c <= BAYS; c++) {
        const x = x0 + c * bay
        stroke(0.3 * axes * drafting)
        ctx.beginPath()
        ctx.arc(x, bubbleY, 8, 0, Math.PI * 2)
        ctx.stroke()
        text(String.fromCharCode(65 + c), x, bubbleY + 0.5, 0.45 * axes * drafting, 'center')
      }
    }

    const ground = easeInOut(range(p, 0, 0.1))
    if (ground > 0) {
      stroke(0.55)
      line(cx * (1 - ground), groundY, cx + (w - cx) * ground, groundY)

      // Earth hatch either side of the plot.
      const hatch = range(p, 0.04, 0.14)
      stroke(0.14 * hatch)
      for (let x = x0 - bw * 0.7; x < x1 + bw * 0.7; x += 9) {
        if (x > x0 - bay * 0.35 && x < x1 + bay * 0.35) continue
        line(x, groundY + 1, x - 6, groundY + 7)
      }
    }

    const survey = easeOut(range(p, 0.05, 0.15))
    if (survey > 0) {
      const a = 0.5 * survey * drafting
      cross(x0, groundY, 7, a)
      cross(x1, groundY, 7, a)
      cross(x0 + bay, top, 7, a)
      cross(x1, top, 7, a)

      // Overall width, set out before anything is built.
      const dimY = top - 26
      stroke(0.3 * survey * drafting)
      line(x0, dimY, x0 + bw * survey, dimY)
      line(x0, dimY - 4, x0, dimY + 4)
      if (survey > 0.98) line(x1, dimY - 4, x1, dimY + 4)
      text('36 000', cx, dimY - 10, 0.4 * survey * drafting, 'center')
    }

    // 02 FOUNDATION: excavation, slab, piles ---------------------------------
    const pad = bay * 0.3
    const ex0 = x0 - pad
    const exW = bw + pad * 2
    const outline = easeInOut(range(p, 0.15, 0.22))
    if (outline > 0) {
      stroke(0.6)
      partial(() => ctx.rect(ex0, groundY, exW, depth), (exW + depth) * 2, outline)
    }

    const slab = range(p, 0.2, 0.27)
    if (slab > 0) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(ex0, groundY, exW, depth)
      ctx.clip()
      stroke(0.2 * slab)
      for (let x = ex0 - depth; x < ex0 + exW; x += 7) line(x, groundY + depth, x + depth, groundY)
      ctx.restore()
    }

    for (let c = 0; c <= BAYS; c++) {
      const pile = easeOut(range(p, 0.21 + c * 0.008, 0.29))
      if (pile <= 0) continue
      const x = x0 + c * bay
      stroke(0.45)
      line(x, groundY + depth, x, groundY + depth + h * 0.045 * pile)
    }

    // 03 STRUCTURE: columns rise, slabs follow, crane climbs -----------------
    const structure = range(p, 0.3, 0.5)
    const risen = structure * buildH

    if (structure > 0) {
      stroke(0.6)
      for (let c = 0; c <= BAYS; c++) {
        const maxH = c === 0 ? groundY - levels[SETBACK_FLOOR] : buildH
        const colH = Math.min(risen, maxH)
        line(x0 + c * bay, groundY, x0 + c * bay, groundY - colH)
      }

      for (let k = 1; k <= FLOORS; k++) {
        const levelH = groundY - levels[k]
        const t = easeOut(range(risen, levelH - unit * 0.2, levelH + unit * 0.6))
        if (t <= 0) continue
        const [from, to] = k > SETBACK_FLOOR ? [1, BAYS] : [0, BAYS]
        const sx = x0 + from * bay
        const ex = x0 + to * bay
        stroke(0.85, 2)
        line(sx, levels[k], sx + (ex - sx) * t, levels[k])
        if (annotate) text(LEVEL_LABELS[k], x1 + 14, levels[k], 0.35 * t * drafting)
      }
      if (annotate) text(LEVEL_LABELS[0], x1 + 14, groundY - 8, 0.35 * range(p, 0.3, 0.34) * drafting)
    }

    const crane = range(p, 0.3, 0.34) * (1 - range(p, 0.84, 0.9))
    if (crane > 0) {
      const mx = portrait ? x1 + bay * 0.45 : x1 + bay * 0.9
      const mw = 7
      const craneTop = groundY - Math.min(risen, buildH) - unit * 1.8
      const a = 0.42 * crane

      stroke(a)
      line(mx, groundY, mx, craneTop)
      line(mx + mw, groundY, mx + mw, craneTop)
      stroke(a * 0.6)
      for (let y = groundY, flip = false; y > craneTop + mw; y -= mw * 1.4, flip = !flip) {
        line(flip ? mx : mx + mw, y, flip ? mx + mw : mx, y - mw * 1.4)
      }

      const jibL = mx - bw * (portrait ? 0.7 : 0.78)
      const jibR = mx + mw + bw * (portrait ? 0.12 : 0.2)
      const apex = craneTop - 18
      stroke(a)
      line(jibL, craneTop, jibR, craneTop)
      line(jibL, craneTop + 5, mx, craneTop + 5)
      line(mx + mw / 2, apex, jibL + bw * 0.1, craneTop)
      line(mx + mw / 2, apex, jibR, craneTop)
      line(mx, craneTop, mx + mw / 2, apex)
      line(mx + mw, craneTop, mx + mw / 2, apex)
      fill(a * 0.8)
      ctx.fillRect(jibR - 16, craneTop + 1, 14, 9)

      // Trolley drifts along the jib as you scroll.
      const tx = mx - bw * (0.18 + 0.42 * (0.5 + 0.5 * Math.sin(p * 46)))
      const hookY = Math.min(groundY - risen + unit * 0.5, craneTop + h * 0.3)
      stroke(a * 0.8)
      line(tx, craneTop + 5, tx, hookY)
      ctx.strokeRect(tx - 3, craneTop + 3, 6, 4)
      line(tx - 3, hookY, tx + 3, hookY)
    }

    // 04 FORM: envelope, spandrels, parapet ----------------------------------
    const envelope = easeInOut(range(p, 0.5, 0.64))
    if (envelope > 0) {
      const setY = levels[SETBACK_FLOOR]
      const len = (groundY - setY) + bay + (setY - top) + (x1 - x0 - bay) + buildH
      stroke(0.9, 1.5)
      partial(
        () => {
          ctx.moveTo(x0, groundY)
          ctx.lineTo(x0, setY)
          ctx.lineTo(x0 + bay, setY)
          ctx.lineTo(x0 + bay, top)
          ctx.lineTo(x1, top)
          ctx.lineTo(x1, groundY)
        },
        len,
        envelope,
      )
    }

    for (let k = 1; k <= FLOORS; k++) {
      const band = range(p, 0.53 + k * 0.01, 0.6 + k * 0.01)
      if (band <= 0) continue
      const [from, to] = k > SETBACK_FLOOR ? [1, BAYS] : [0, BAYS]
      fill(0.1 * band)
      ctx.fillRect(x0 + from * bay, levels[k], (to - from) * bay, unit * 0.16)
    }

    const parapet = easeOut(range(p, 0.62, 0.7))
    if (parapet > 0) {
      stroke(0.7)
      line(x0 + bay, top - 6, x0 + bay + (bw - bay) * parapet, top - 6)
      line(x0, levels[SETBACK_FLOOR] - 5, x0 + bay * parapet, levels[SETBACK_FLOOR] - 5)
      stroke(0.5)
      line(x1 - bay * 0.6, top - 6, x1 - bay * 0.6, top - 6 - h * 0.05 * parapet)
    }

    if (annotate) {
      const dim = range(p, 0.58, 0.68) * drafting
      if (dim > 0) {
        const dx = x0 - 26
        stroke(0.3 * dim)
        line(dx, groundY, dx, groundY - buildH * dim)
        line(dx - 4, groundY, dx + 4, groundY)
        if (dim > 0.98 * drafting) line(dx - 4, top, dx + 4, top)
        text('33 600', dx - 8, (groundY + top) / 2, 0.4 * dim, 'right')
      }
    }

    // 05 DETAIL: mullions floor by floor, canopy, trees ----------------------
    for (let f = 0; f < FLOORS; f++) {
      const t = easeOut(range(p, 0.7 + f * 0.011, 0.77 + f * 0.011))
      if (t <= 0) continue
      const [from, to] = floorSpan(f)
      const bottom = levels[f]
      const ceiling = levels[f + 1] + unit * 0.16
      const reach = (bottom - ceiling) * t
      stroke(0.3)
      for (let b = from; b < to; b++) {
        for (let j = 1; j < PANES; j++) {
          const x = x0 + b * bay + (j * bay) / PANES
          line(x, bottom, x, bottom - reach)
        }
      }
      if (f === 0) {
        const transom = bottom - (bottom - ceiling) * 0.72
        line(x0, transom, x0 + bw * t, transom)
      }
    }

    const canopy = easeOut(range(p, 0.8, 0.86))
    if (canopy > 0) {
      const cy = levels[0] - unit * 0.95
      const c0 = x0 + bay * 2.2
      stroke(0.75, 2)
      line(c0, cy, c0 + bay * 1.6 * canopy, cy)
    }

    const trees = easeOut(range(p, 0.83, 0.9))
    if (trees > 0) {
      const spots = portrait ? [x0 - bay * 0.6, x1 + bay * 0.3] : [x0 - bay * 1.5, x0 - bay * 0.85, x1 + bay * 1.4]
      stroke(0.35 * trees)
      spots.forEach((x, i) => {
        const r = unit * (0.55 + (i % 2) * 0.15)
        const trunk = unit * 0.9 * trees
        line(x, groundY, x, groundY - trunk)
        ctx.beginPath()
        ctx.arc(x, groundY - trunk - r * 0.7, r * trees, 0, Math.PI * 2)
        ctx.stroke()
      })
    }

    // 06 COMPLETE: the windows come on ---------------------------------------
    if (complete > 0) {
      for (let f = 0; f < FLOORS; f++) {
        const [from, to] = floorSpan(f)
        const bottom = levels[f]
        const ceiling = levels[f + 1] + unit * 0.16
        for (let b = from; b < to; b++) {
          for (let j = 0; j < PANES; j++) {
            const light = PANE_LIGHTS[(f * BAYS + b) * PANES + j]
            const on = easeOut(range(p, 0.88 + light.delay * 0.08, 0.92 + light.delay * 0.08))
            const alpha = 0.035 * complete + (light.level > 0.4 ? (light.level - 0.4) * 0.38 * on : 0)
            if (alpha <= 0.002) continue
            fill(alpha)
            const px = x0 + b * bay + (j * bay) / PANES
            ctx.fillRect(px + 1.5, ceiling + 1.5, bay / PANES - 3, bottom - ceiling - 3)
          }
        }
      }
    }
  }

  const resize = () => {
    // Layout size, not getBoundingClientRect: the media layer is scaled by the dolly-in.
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (!width || !height) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    L = computeLayout(width, height)
    draw(progress)
    drawn = true
  }

  const observer = new ResizeObserver(resize)
  observer.observe(canvas)
  resize()

  // Redraw the drawing once the mono font is available for the annotations.
  document.fonts?.ready.then(() => L && draw(progress))

  return {
    render(p) {
      if (drawn && p === progress) return
      progress = p
      if (!L) return
      draw(p)
      drawn = true
    },
    destroy() {
      observer.disconnect()
      L = null
    },
  }
}
