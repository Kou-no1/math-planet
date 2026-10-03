import { useEffect } from 'react'
import { NumericKeypad } from './NumericKeypad'
import { answerValueKey, formatAnswerValue } from '../../game-engine/questions/answer'
import type { AnswerMode, AnswerValue, Question } from '../../types/game'

export function AnswerControls({
  question,
  answerMode,
  inputValue,
  onInputChange,
  onAnswer,
  disabled,
}: {
  question: Question
  answerMode: AnswerMode
  inputValue: string
  onInputChange: (value: string) => void
  onAnswer: (answer: AnswerValue) => void
  disabled: boolean
}) {
  useEffect(() => {
    if (answerMode !== 'input') {
      return undefined
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (disabled || document.querySelector('dialog[open]')) {
        return
      }
      if (/^\d$/.test(event.key)) {
        onInputChange(inputValue + event.key)
      }
      if (event.key === 'Backspace') {
        onInputChange(inputValue.slice(0, -1))
      }
      if (event.key === 'Enter') {
        if (inputValue.length > 0) onAnswer(inputValue)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [answerMode, disabled, inputValue, onAnswer, onInputChange])

  if (answerMode === 'input') {
    return (
      <NumericKeypad
        value={inputValue}
        disabled={disabled}
        onChange={onInputChange}
        onSubmit={() => onAnswer(inputValue)}
      />
    )
  }

  return (
    <div className="choice-grid" aria-label="こたえをえらぶ">
      {(question.choices ?? []).map((choice) => (
        <button
          className="choice-button"
          key={answerValueKey(choice)}
          type="button"
          onClick={() => onAnswer(choice)}
          disabled={disabled}
        >
          {formatAnswerValue(choice)}
        </button>
      ))}
    </div>
  )
}
