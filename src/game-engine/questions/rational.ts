import Fraction from 'fraction.js'
import type { AnswerValue, DecimalAnswerValue, FractionAnswerValue } from '../../types/game'

export function isExactAnswer(
  value: AnswerValue,
): value is DecimalAnswerValue | FractionAnswerValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value.kind === 'decimal' || value.kind === 'fraction')
  )
}

export function exactFraction(value: AnswerValue): Fraction | null {
  try {
    if (typeof value === 'object' && value !== null) {
      if (value.kind === 'decimal') {
        if (!/^\d+(?:\.\d+)?$/.test(value.value)) return null
        return new Fraction(value.value)
      }
      if (
        value.kind === 'fraction' &&
        Number.isSafeInteger(value.numerator) &&
        Number.isSafeInteger(value.denominator) &&
        value.numerator >= 0 &&
        value.denominator > 0
      ) {
        return new Fraction(value.numerator, value.denominator)
      }
      return null
    }
    const text = String(value)
      .trim()
      .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
      .replace('．', '.')
    if (!/^\d+(?:\.\d+|\/\d+)?$/.test(text)) return null
    return new Fraction(text)
  } catch {
    return null
  }
}

export function fractionAnswer(value: Fraction): FractionAnswerValue {
  const numerator = Number(value.n * value.s)
  const denominator = Number(value.d)
  if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator) || numerator < 0) {
    throw new RangeError('Answer must be a nonnegative, safely serializable fraction')
  }
  return { kind: 'fraction', numerator, denominator }
}

export function decimalAnswer(value: Fraction): DecimalAnswerValue {
  const text = value.toString(6)
  if (!/^\d+(?:\.\d+)?$/.test(text) || !new Fraction(text).equals(value)) {
    throw new RangeError('Decimal answer must terminate within six places')
  }
  return { kind: 'decimal', value: text }
}

export function exactAnswerKey(value: AnswerValue): string | null {
  const fraction = exactFraction(value)
  return fraction ? `exact:${fraction.toFraction()}` : null
}

export function formatNumericOperand(
  planet: 'decimal' | 'fraction',
  numerator: number,
  denominator: number,
): string {
  if (planet === 'decimal') return new Fraction(numerator, denominator).toString(6)
  return denominator === 1 ? String(numerator) : `${numerator}/${denominator}`
}
