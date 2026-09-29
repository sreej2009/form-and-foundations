// Smooth in-page navigation. Going back to #top rewinds the film on the way,
// because the scroll position is the film's timeline.
export function scrollToHash(event) {
  const hash = event.currentTarget.getAttribute('href')
  if (!hash?.startsWith('#')) return
  const target = hash === '#top' ? null : document.querySelector(hash)
  if (hash !== '#top' && !target) return
  event.preventDefault()
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const behavior = reduce ? 'auto' : 'smooth'
  if (target) target.scrollIntoView({ behavior, block: 'start' })
  else window.scrollTo({ top: 0, behavior })
}
