import Lines from '../Lines.jsx'
import { PROCESS } from '../../data/site.js'

export default function Process() {
  return (
    <section className="process" id="expertise" data-nav="light" aria-labelledby="process-title">
      <header className="process__head">
        <p className="eyebrow" data-reveal="fade">Our process</p>
        <h2 className="display" id="process-title" data-reveal="lines">
          <Lines lines={['A clear path', 'from concept to completion.']} />
        </h2>
      </header>

      <ol className="process__steps">
        {PROCESS.map((step) => (
          <li className="step" key={step.id}>
            <span className="step__rule" data-reveal="rule" aria-hidden="true" />
            <div className="step__body" data-reveal="fade">
              <span className="step__num">{step.id}</span>
              <h3 className="step__title">{step.title}</h3>
              <p className="step__text">
                {step.text[0]}
                <br />
                {step.text[1]}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
