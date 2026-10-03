import type { AnswerValue, Question, RemainderAnswerValue } from '../../types/game'
import { exactAnswerKey, exactFraction, isExactAnswer } from './rational'

export function isRemainderAnswerValue(value: AnswerValue): value is RemainderAnswerValue {
  return typeof value === 'object' && value !== null && value.kind === 'remainder'
}

export function formatAnswerValue(value: AnswerValue): string {
  if (isExactAnswer(value)) {
    const fraction = exactFraction(value)
    if (!fraction) return '？'
    return value.kind === 'decimal' ? fraction.toString(6) : fraction.toFraction()
  }
  if (isRemainderAnswerValue(value)) {
    return value.remainder === 0
      ? String(value.quotient)
      : `${value.quotient}あまり${value.remainder}`
  }
  return String(value)
}

export function answerValueKey(value: AnswerValue): string {
  if (isExactAnswer(value)) return exactAnswerKey(value) ?? 'invalid-exact'
  if (isRemainderAnswerValue(value)) {
    return `remainder:${value.quotient}:${value.remainder}`
  }
  return normalizeAnswer(value)
}

function normalizeAnswer(value: number | string): string {
  return String(value).trim().replace(/[０-９]/g, (char) => {
    return String.fromCharCode(char.charCodeAt(0) - 0xfee0)
  })
}

export function isCorrectAnswer(
  question: Question,
  answer: AnswerValue,
): boolean {
  if (isExactAnswer(question.answer)) {
    const expected = exactAnswerKey(question.answer)
    const given = exactAnswerKey(answer)
    return expected !== null && given !== null && expected === given
  }
  return answerValueKey(question.answer) === answerValueKey(answer)
}
