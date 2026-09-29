// A heading split into lines that rise through a clip (see lib/reveals.js).
export default function Lines({ lines }) {
  return lines.map((line) => (
    <span className="line" key={line}>
      <span>{line}</span>
    </span>
  ))
}
