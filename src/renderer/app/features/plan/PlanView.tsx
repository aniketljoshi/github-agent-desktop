import { useSessionStore } from '../../store/session'
import { AlertTriangle, FileCode, ArrowRight } from 'lucide-react'
import type { PlanStep as PlanStepType } from '../../../../shared/types'

const RISK_STYLES: Record<string, string> = {
  low: 'bg-success/10 text-success',
  medium: 'bg-warning/10 text-warning',
  high: 'bg-danger/10 text-danger'
}

function StepCard({ step, index }: { step: PlanStepType; index: number }) {
  return (
    <div className="rounded-lg border border-border bg-bg-base p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-bg-elevated text-[10px] font-medium text-text-secondary">
            {index + 1}
          </span>
          <h4 className="text-sm font-medium text-text-primary">{step.title}</h4>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${RISK_STYLES[step.risk]}`}>
          {step.risk}
        </span>
      </div>
      {step.why && <p className="mt-1.5 pl-7 text-xs text-text-secondary">{step.why}</p>}
      {step.files.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1 pl-7">
          {step.files.map((f) => (
            <span
              key={f}
              className="inline-flex items-center gap-1 rounded-md bg-bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-text-secondary"
            >
              <FileCode size={10} />
              {f}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function PlanView() {
  const { currentPlan, isStreaming, setMode } = useSessionStore()

  if (isStreaming) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-text-muted">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
        Generating plan…
      </div>
    )
  }

  if (!currentPlan) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-text-muted">
        <AlertTriangle size={32} className="text-border" />
        <p className="text-sm">Describe what you want to build and get an execution plan</p>
      </div>
    )
  }

  const riskCounts = { low: 0, medium: 0, high: 0 }
  currentPlan.steps.forEach((s) => riskCounts[s.risk]++)

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-lg border border-border bg-bg-surface p-4">
        <h2 className="text-base font-semibold text-text-primary">{currentPlan.goal}</h2>
        <p className="mt-1 text-xs text-text-muted">
          {currentPlan.model} · {new Date(currentPlan.createdAt).toLocaleString()}
        </p>

        {currentPlan.assumptions.length > 0 && (
          <div className="mt-3">
            <h3 className="text-xs font-medium text-text-secondary">Assumptions</h3>
            <ul className="mt-1 list-inside list-disc text-xs text-text-secondary">
              {currentPlan.assumptions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-3 flex gap-3 text-[10px]">
          <span className="text-success">{riskCounts.low} low risk</span>
          <span className="text-warning">{riskCounts.medium} medium</span>
          <span className="text-danger">{riskCounts.high} high</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {currentPlan.steps.map((step, i) => (
          <StepCard key={i} step={step} index={i} />
        ))}
      </div>

      <button
        onClick={() => setMode('agent')}
        className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
      >
        <ArrowRight size={14} />
        Send to Agent
      </button>
    </div>
  )
}
