import { memo } from 'react'

// Static markup only. Visibility and motion are driven by the master
// timeline in CinematicConstruction, never by React state.
function CinematicText({ stages }) {
  return (
    <div className="cinematic__text">
      {stages.map((stage) => {
        return (
          <article className="stage" key={stage.id}>
            <p className="stage__label">
              <span className="stage__num">{stage.id}</span>
              <span aria-hidden="true">—</span>
              <span>{stage.label}</span>
            </p>
            <h2 className="stage__title">
              {stage.lines.map((line) => (
                <span className="stage__line" key={line}>
                  {line}
                </span>
              ))}
            </h2>
          </article>
        )
      })}
    </div>
  )
}

export default memo(CinematicText)
