import Fraction from 'fraction.js'
import {
  getNumericAreaById,
  isNumericAreaId,
  numericCalculationSymbols,
  type NumericAreaId,
  type NumericOperands,
} from '../../data/numericAreas'
import type { AnswerValue, MultiplicationFactProgress, Question } from '../../types/game'
import { getReviewQueue } from '../review/weakFacts'
import { selectAdaptiveCandidate } from '../school/schoolMode2'
import { answerValueKey, formatAnswerValue } from './answer'
import { makeNumericFactId, parseFactId } from './factIds'
import type { RandomSource } from './questionGenerator'
import { decimalAnswer, formatNumericOperand, fractionAnswer } from './rational'

function shuffled<T>(values: T[], rng: RandomSource): T[] {
  const items = [...values]
  for (let index = items.length - 1; index > 0; index--) {
    const next = Math.floor(rng() * (index + 1))
    ;[items[index], items[next]] = [items[next], items[index]]
  }
  return items
}

export function calculateNumericAnswer(areaId: NumericAreaId, operands: NumericOperands): Fraction {
  const [a, ad, b, bd] = operands
  const left = new Fraction(a, ad)
  const right = new Fraction(b, bd)
  const operation = getNumericAreaById(areaId).generator.calculation
  if (operation === 'add') return left.add(right)
  if (operation === 'subtract') return left.sub(right)
  if (operation === 'multiply') return left.mul(right)
  return left.div(right)
}

export function matchesNumericArea(areaId: NumericAreaId, operands: NumericOperands): boolean {
  if (!operands.every((value) => Number.isSafeInteger(value) && value > 0)) return false
  const [a, ad, b, bd] = operands
  const spec = getNumericAreaById(areaId).generator
  if (spec.operation === 'decimal') {
    if (ad !== spec.scale) return false
    if (spec.calculation === 'multiply' || spec.calculation === 'divide') {
      if (bd !== 1 || b < 1 || b > 9 || a % ad === 0) return false
      if (spec.calculation === 'multiply') return a <= spec.maxCoefficient
      const answer = calculateNumericAnswer(areaId, operands)
      return a <= spec.maxCoefficient * b && 100n % answer.d === 0n
    }
    if (
      bd !== spec.scale ||
      a > spec.maxCoefficient ||
      b > spec.maxCoefficient ||
      (a % ad === 0 && b % bd === 0)
    )
      return false
  } else {
    if (ad < 2 || ad > 12 || bd < 2 || bd > 12 || a >= ad || b >= bd) return false
    if ((spec.denominatorMode === 'same') !== (ad === bd)) return false
  }
  return calculateNumericAnswer(areaId, operands).gte(0)
}

function randomOperands(areaId: NumericAreaId, rng: RandomSource): NumericOperands {
  const spec = getNumericAreaById(areaId).generator
  const integer = (max: number) => Math.min(max, Math.floor(rng() * max) + 1)
  if (spec.operation === 'decimal') {
    let a = integer(spec.maxCoefficient)
    const b = integer(
      spec.calculation === 'multiply' || spec.calculation === 'divide' ? 9 : spec.maxCoefficient,
    )
    if (spec.calculation === 'divide') {
      if ((a * b) % spec.scale === 0) a = Math.max(1, a - 1)
      return [a * b, spec.scale, b, 1]
    }
    if (spec.calculation === 'multiply') {
      if (a % spec.scale === 0) a = Math.max(1, a - 1)
      return [a, spec.scale, b, 1]
    }
    if (a % spec.scale === 0 && b % spec.scale === 0) a = Math.max(1, a - 1)
    return spec.calculation === 'subtract' && a < b
      ? [b, spec.scale, a, spec.scale]
      : [a, spec.scale, b, spec.scale]
  }
  const ad = integer(11) + 1
  const other = integer(10) + 1
  const bd = spec.denominatorMode === 'same' ? ad : other >= ad ? other + 1 : other
  const a = integer(ad - 1)
  const b = integer(bd - 1)
  return spec.calculation === 'subtract' && new Fraction(a, ad).lt(new Fraction(b, bd))
    ? [b, bd, a, ad]
    : [a, ad, b, bd]
}

export function numericChoices(
  areaId: NumericAreaId,
  operands: NumericOperands,
  rng: RandomSource,
): AnswerValue[] {
  const spec = getNumericAreaById(areaId).generator
  const result = calculateNumericAnswer(areaId, operands)
  const toAnswer = spec.operation === 'decimal' ? decimalAnswer : fractionAnswer
  const correct = toAnswer(result)
  const [a, ad, b, bd] = operands
  const unit = new Fraction(
    1,
    spec.operation === 'decimal' ? spec.scale : Number(new Fraction(ad).lcm(bd).n),
  )
  const mistakes =
    spec.operation === 'decimal'
      ? [
          result.mul(10),
          result.div(10),
          result.sub(1),
          result.add(1),
          result.add(unit),
          result.sub(unit),
        ]
      : [
          new Fraction(spec.calculation === 'add' ? a + b : Math.abs(a - b), ad + bd),
          new Fraction(spec.calculation === 'add' ? a + b : Math.abs(a - b), ad),
          result.add(unit),
          result.sub(unit),
          result.add(1),
        ]
  const choices = new Map<string, AnswerValue>([[answerValueKey(correct), correct]])
  for (const value of [
    ...shuffled(mistakes, rng),
    ...Array.from({ length: 6 }, (_, index) => result.add(unit.mul(index + 1))),
  ]) {
    if (value.lt(0)) continue
    try {
      const answer = toAnswer(value)
      choices.set(answerValueKey(answer), answer)
    } catch {
      continue
    }
    if (choices.size === 4) break
  }
  return shuffled([...choices.values()], rng)
}

export function generateNumericFactQuestion(
  areaId: NumericAreaId,
  operands: NumericOperands,
  rng: RandomSource = Math.random,
): Question {
  if (!matchesNumericArea(areaId, operands)) throw new RangeError(`Invalid operands for ${areaId}`)
  const area = getNumericAreaById(areaId)
  const spec = area.generator
  const [a, ad, b, bd] = operands
  const result = calculateNumericAnswer(areaId, operands)
  const answer = spec.operation === 'decimal' ? decimalAnswer(result) : fractionAnswer(result)
  const prompt = `${formatNumericOperand(spec.operation, a, ad)} ${numericCalculationSymbols[spec.calculation]} ${formatNumericOperand(spec.operation, b, bd)}`
  const common = Number(new Fraction(ad).lcm(bd).n)
  const explanation =
    spec.operation === 'fraction'
      ? `${a * (common / ad)}/${common} ${numericCalculationSymbols[spec.calculation]} ${b * (common / bd)}/${common} = ${formatAnswerValue(answer)}。同じ大きさのまとまりを計算して、約分しよう。`
      : `${prompt} = ${formatAnswerValue(answer)}。小数点の位置と、位の大きさを確かめよう。`
  const base = spec.operation === 'decimal' ? Math.ceil(area.no / 2) + 1 : area.no + 1
  const extra = spec.operation === 'decimal' ? (a + b >= spec.scale ? 1 : 0) : common >= 12 ? 1 : 0
  return {
    id: makeNumericFactId(spec.operation, areaId, operands),
    category: spec.category,
    prompt,
    answer,
    choices: numericChoices(areaId, operands, rng),
    explanation,
    difficulty: base + extra,
    metadata: {
      operation: spec.operation,
      areaId,
      areaName: area.name,
      numericOperands: operands,
      calculation: spec.calculation,
      answerMode: 'choice',
    },
  }
}

export function generateNumericQuestion(
  areaId: NumericAreaId,
  rng: RandomSource = Math.random,
): Question {
  return generateNumericFactQuestion(areaId, randomOperands(areaId, rng), rng)
}

export function generateAdaptiveNumericQuestion(
  facts: Record<string, MultiplicationFactProgress>,
  areaId: NumericAreaId,
  options: {
    schoolMode2Enabled?: boolean
    recentIncorrectCount?: number
    rng?: RandomSource
  } = {},
): Question {
  const rng = options.rng ?? Math.random
  const pool = new Map<string, Question>()
  const spec = getNumericAreaById(areaId).generator
  for (let index = 0; index < 32; index++) {
    const question = generateNumericQuestion(areaId, index < 4 ? () => index / 64 : rng)
    pool.set(question.id, question)
  }
  const reviewFacts = getReviewQueue(facts, new Date(), 8, {
    operation: spec.operation,
    areaId,
  })
  // Keep due reviews and weaker facts without rebuilding an ever-growing question bank.
  const savedFacts = Object.values(facts)
    .filter((fact) => fact.id.startsWith(`${spec.operation}:${areaId}:`))
    .sort(
      (left, right) =>
        left.masteryLevel - right.masteryLevel || right.incorrectCount - left.incorrectCount,
    )
    .slice(0, 48)
  for (const fact of [...reviewFacts, ...savedFacts]) {
    const parsed = parseFactId(fact.id)
    if (
      parsed?.areaId === areaId &&
      parsed.numericOperands &&
      matchesNumericArea(areaId, parsed.numericOperands)
    ) {
      pool.set(parsed.id, generateNumericFactQuestion(areaId, parsed.numericOperands, rng))
    }
  }
  if (options.schoolMode2Enabled)
    return selectAdaptiveCandidate(
      [...pool.values()],
      facts,
      options.recentIncorrectCount ?? 0,
      rng,
    )
  const queue = reviewFacts
    .map((fact) => pool.get(fact.id))
    .filter((question): question is Question => Boolean(question))
  const candidates = queue.length && rng() < 0.7 ? queue : [...pool.values()]
  return candidates[Math.floor(rng() * candidates.length)] ?? candidates[0]
}

export function numericQuestionFromFactId(
  id: string,
  rng: RandomSource = Math.random,
): Question | null {
  const parsed = parseFactId(id)
  return parsed?.numericOperands &&
    isNumericAreaId(parsed.areaId) &&
    matchesNumericArea(parsed.areaId, parsed.numericOperands)
    ? generateNumericFactQuestion(parsed.areaId, parsed.numericOperands, rng)
    : null
}
