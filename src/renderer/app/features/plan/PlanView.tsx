import { AlertTriangle, ArrowRight, FileCode } from 'lucide-react'
import { useSessionStore } from '../../store/session'
import type { PlanStep as PlanStepType } from '../../../../shared/types'

const RISK_TONE: Record<string, string> = {
  low: 'is-low',
  medium: 'is-medium',
  high: 'is-high'
}

function StepCard({ step, index }: { step: PlanStepType; index: number }) {
  return (
    <article className="plan-step-card">
      <div className="plan-step-card-top">
        <div className="plan-step-title-wrap">
          <span className="plan-step-index">{index + 1}</span>
          <h4 className="plan-step-title">{step.title}</h4>
        </div>
        <span className={`plan-risk-pill ${RISK_TONE[step.risk]}`}>{step.risk}</span>
      </div>

      {step.why && <p className="plan-step-why">{step.why}</p>}

      {step.files.length > 0 && (
        <div className="plan-step-files">
          {step.files.map((file) => (
            <span key={file} className="plan-file-chip">
              <FileCode size={10} />
              {file}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}

export function PlanView() {
  const { currentPlan, isStreaming, setMode } = useSessionStore()

  if (isStreaming) {
    return (
      <div className="plan-empty-state">
        <div className="plan-empty-icon">
          <span className="thread-status-dot" />
        </div>
        <p>Generating plan...</p>
      </div>
    )
  }

  if (!currentPlan) {
    return (
      <div className="plan-empty-state">
        <div className="plan-empty-icon">
          <AlertTriangle size={28} />
        </div>
        <div className="plan-empty-copy">
          <h2>Turn a rough goal into a concrete execution path.</h2>
          <p>
            Plan mode breaks the task into ordered steps, touched files, and risk so you can hand
            it to Agent with intent.
          </p>
        </div>
      </div>
    )
  }

  const riskCounts = { low: 0, medium: 0, high: 0 }
  currentPlan.steps.forEach((step) => {
    riskCounts[step.risk] += 1
  })

  return (
    <div className="plan-shell">
      <section className="plan-summary-card">
        <div className="plan-summary-top">
          <div>
            <span className="plan-kicker">Execution plan</span>
            <h2 className="plan-goal">{currentPlan.goal}</h2>
          </div>
          <p className="plan-meta">
            {currentPlan.model} · {new Date(currentPlan.createdAt).toLocaleString()}
          </p>
        </div>

        {currentPlan.assumptions.length > 0 && (
          <div className="plan-assumptions">
            <h3>Assumptions</h3>
            <ul>
              {currentPlan.assumptions.map((assumption, index) => (
                <li key={index}>{assumption}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="plan-risk-row">
          <span className="plan-risk-pill is-low">{riskCounts.low} low</span>
          <span className="plan-risk-pill is-medium">{riskCounts.medium} medium</span>
          <span className="plan-risk-pill is-high">{riskCounts.high} high</span>
        </div>
      </section>

      <div className="plan-steps">
        {currentPlan.steps.map((step, index) => (
          <StepCard key={index} step={step} index={index} />
        ))}
      </div>

      <button onClick={() => setMode('agent')} className="plan-send-button">
        <ArrowRight size={14} />
        Send to Agent
      </button>
    </div>
  )
}
