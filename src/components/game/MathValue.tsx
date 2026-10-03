import type { AnswerValue, Question } from '../../types/game'
import { formatAnswerValue } from '../../game-engine/questions/answer'
import { parseFactId } from '../../game-engine/questions/factIds'
import {
  getNumericAreaById,
  isNumericAreaId,
  numericCalculationSymbols,
} from '../../data/numericAreas'

export function FractionValue({
  numerator,
  denominator,
}: {
  numerator: number
  denominator: number
}) {
  if (denominator === 1) return <span>{numerator}</span>
  return (
    <span className="fraction-value" aria-label={`${numerator}/${denominator}`}>
      <span aria-hidden="true">{numerator}</span>
      <span aria-hidden="true">{denominator}</span>
    </span>
  )
}

export function MathValue({ value }: { value: AnswerValue }) {
  return typeof value === 'object' && value.kind === 'fraction' ? (
    <FractionValue numerator={value.numerator} denominator={value.denominator} />
  ) : (
    <span>{formatAnswerValue(value)}</span>
  )
}

export function MathQuestion({ question }: { question: Question }) {
  const fact = parseFactId(question.id)
  if (fact?.operation !== 'fraction' || !fact.numericOperands || !isNumericAreaId(fact.areaId))
    return <>{question.prompt}</>
  const [a, ad, b, bd] = fact.numericOperands
  const symbol = numericCalculationSymbols[getNumericAreaById(fact.areaId).generator.calculation]
  return (
    <span className="fraction-expression" aria-label={question.prompt}>
      <FractionValue numerator={a} denominator={ad} />
      <span aria-hidden="true">{symbol}</span>
      <FractionValue numerator={b} denominator={bd} />
    </span>
  )
}
