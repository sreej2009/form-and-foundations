// Faded out by the master timeline as soon as scrolling begins.
export default function ScrollIndicator() {
  return (
    <div className="scroll-indicator" aria-hidden="true">
      <span className="scroll-indicator__label">Scroll to build</span>
      <span className="scroll-indicator__line" />
    </div>
  )
}
