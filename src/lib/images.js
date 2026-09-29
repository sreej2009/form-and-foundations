// If an image fails, hide it so no broken-image icon or alt text shows; the
// frame behind it keeps its stone-coloured surface. DOM-only: no re-render.
export function hideOnError(event) {
  event.currentTarget.dataset.failed = ''
}
