import { memo } from 'react'

// Active/past classes and segment fills are set directly by the master
// timeline; memo keeps React from ever touching this markup again.
function ProgressIndicator({ stages }) {
  return (
    <ol className="progress" aria-hidden="true">
      {stages.map((stage, i) => (
        <li className="progress__item" key={stage.id}>
          <span className="progress__num">{stage.id}</span>
          <span className="progress__dot" />
          {i < stages.length - 1 && (
            <span className="progress__seg">
              <span className="progress__fill" />
            </span>
          )}
        </li>
      ))}
    </ol>
  )
}

export default memo(ProgressIndicator)
