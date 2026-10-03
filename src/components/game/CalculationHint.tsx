import type { Question } from '../../types/game'
import { calculationHint } from '../../game-engine/learning/calculationHints'
import { useRef } from 'react'

export function CalculationHint({ question, onOpen }: { question: Question; onOpen?: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const hint = calculationHint(question)
  if (!hint) return null
  return (
    <>
      <button
        className="secondary-action hint-trigger"
        type="button"
        onClick={() => {
          if (dialog.current?.showModal) dialog.current.showModal()
          else dialog.current?.setAttribute('open', '')
          onOpen?.()
        }}
      >
        <span aria-hidden="true">?</span> ひんと
      </button>
      <dialog
        className="calculation-hint-dialog"
        ref={dialog}
        aria-label="ひんと"
        onClick={(event) => {
          if (event.target === dialog.current) {
            if (dialog.current?.close) dialog.current.close()
            else dialog.current?.removeAttribute('open')
          }
        }}
      >
        <div className="calculation-hint-heading">
          <h2>{hint.title}</h2>
          <button
            className="icon-button"
            type="button"
            aria-label="ひんとをとじる"
            onClick={() => {
              if (dialog.current?.close) dialog.current.close()
              else dialog.current?.removeAttribute('open')
            }}
          >
            ×
          </button>
        </div>
        <div className="calculation-hint-content">
          {hint.groups.length > 0 ? (
            <div className="hint-group-grid">
              {hint.groups.map((group, index) => (
                <div
                  className={`hint-number-group ${group.kind}`}
                  key={index}
                  aria-label={`${group.label} ${group.count}こ`}
                >
                  <span>{group.label}</span>
                  <div className="hint-dots" aria-hidden="true">
                    {Array.from({ length: Math.min(10, group.count) }, (_, dot) => (
                      <i key={dot} />
                    ))}
                    {group.count > 10 ? <b>+{group.count - 10}</b> : null}
                  </div>
                  <strong>{group.count}</strong>
                </div>
              ))}
            </div>
          ) : null}
          <ol>
            {hint.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
      </dialog>
    </>
  )
}
