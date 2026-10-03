import { getDivisionAreaById, type DivisionAreaId } from '../../data/planets'
import type { AnswerValue, Question, RemainderAnswerValue } from '../../types/game'
import { answerValueKey } from './answer'
import { makeDivisionFactId } from './factIds'

export type RandomSource = () => number

export type DivisionFactPair = {
  areaId: DivisionAreaId
  left: number
  right: number
  quotient: number
  remainder: number
  difficulty: number
}

function shuffle<T>(items: T[], rng: RandomSource): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(rng() * (index + 1))
    const current = copy[index]
    copy[index] = copy[target]
    copy[target] = current
  }
  return copy
}

function randomInt(min: number, max: number, rng: RandomSource): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

export function divisionAnswerValue(quotient: number, remainder: number): AnswerValue {
  if (remainder === 0) {
    return quotient
  }
  return { kind: 'remainder', quotient, remainder }
}

function remainderAnswer(quotient: number, remainder: number): RemainderAnswerValue {
  return {
    kind: 'remainder',
    quotient: Math.max(0, quotient),
    remainder: Math.max(0, remainder),
  }
}

function quotient(left: number, right: number): number {
  return Math.floor(left / right)
}

function remainder(left: number, right: number): number {
  return left % right
}

export function matchesDivisionArea(areaId: DivisionAreaId, left: number, right: number): boolean {
  if (right <= 0) {
    return false
  }
  const q = quotient(left, right)
  const r = remainder(left, right)
  if (q < 1 || r < 0 || r >= right) {
    return false
  }
  if (areaId === 'divide-no-remainder') {
    return right >= 1 && right <= 9 && q >= 1 && q <= 9 && r === 0
  }
  if (areaId === 'divide-with-remainder') {
    return right >= 2 && right <= 9 && q >= 1 && q <= 9 && r >= 1
  }
  return left >= 10 && left <= 99 && right >= 2 && right <= 9
}

export function difficultyForDivision(areaId: DivisionAreaId, left: number, right: number): number {
  const q = quotient(left, right)
  const r = remainder(left, right)
  if (areaId === 'divide-no-remainder') {
    return q <= 5 && right <= 5 ? 2 : 3
  }
  if (areaId === 'divide-with-remainder') {
    return r === 1 && q <= 5 ? 3 : 4
  }
  if (r === 0) {
    return q <= 9 ? 3 : 4
  }
  return q <= 9 ? 4 : 5
}

function createPair(areaId: DivisionAreaId, left: number, right: number): DivisionFactPair {
  return {
    areaId,
    left,
    right,
    quotient: quotient(left, right),
    remainder: remainder(left, right),
    difficulty: difficultyForDivision(areaId, left, right),
  }
}

export function createDivisionFactPool({ areaId }: { areaId: DivisionAreaId }): DivisionFactPair[] {
  const area = getDivisionAreaById(areaId)
  const pairs: DivisionFactPair[] = []
  if (areaId === 'divide-no-remainder') {
    for (let right = area.generator.minDivisor; right <= area.generator.maxDivisor; right += 1) {
      for (let q = 1; q <= 9; q += 1) {
        const left = right * q
        if (matchesDivisionArea(areaId, left, right)) {
          pairs.push(createPair(areaId, left, right))
        }
      }
    }
    return pairs
  }
  if (areaId === 'divide-with-remainder') {
    for (let right = area.generator.minDivisor; right <= area.generator.maxDivisor; right += 1) {
      for (let q = 1; q <= 9; q += 1) {
        for (let r = 1; r < right; r += 1) {
          const left = right * q + r
          if (matchesDivisionArea(areaId, left, right)) {
            pairs.push(createPair(areaId, left, right))
          }
        }
      }
    }
    return pairs
  }
  for (let left = area.generator.minDividend; left <= area.generator.maxDividend; left += 1) {
    for (let right = area.generator.minDivisor; right <= area.generator.maxDivisor; right += 1) {
      if (matchesDivisionArea(areaId, left, right)) {
        pairs.push(createPair(areaId, left, right))
      }
    }
  }
  return pairs
}

export function generateDivisionFactPair(
  areaId: DivisionAreaId,
  rng: RandomSource = Math.random,
): DivisionFactPair {
  const area = getDivisionAreaById(areaId)
  for (let attempts = 0; attempts < 500; attempts += 1) {
    let left = randomInt(area.generator.minDividend, area.generator.maxDividend, rng)
    const right = randomInt(area.generator.minDivisor, area.generator.maxDivisor, rng)
    if (areaId === 'divide-no-remainder') {
      left = right * randomInt(1, 9, rng)
    }
    if (areaId === 'divide-with-remainder') {
      left = right * randomInt(1, 9, rng) + randomInt(1, right - 1, rng)
    }
    if (matchesDivisionArea(areaId, left, right)) {
      return createPair(areaId, left, right)
    }
  }
  const pool = createDivisionFactPool({ areaId })
  return pool[Math.floor(rng() * pool.length)] ?? createPair(areaId, 12, 3)
}

function addChoice(candidates: Map<string, AnswerValue>, value: AnswerValue, correct: AnswerValue) {
  if (answerValueKey(value) === answerValueKey(correct)) {
    return
  }
  candidates.set(answerValueKey(value), value)
}

export function generateDivisionChoices(
  quotientValue: number,
  remainderValue: number,
  divisor: number,
  rng: RandomSource = Math.random,
): AnswerValue[] {
  const correct = divisionAnswerValue(quotientValue, remainderValue)
  const candidates = new Map<string, AnswerValue>([[answerValueKey(correct), correct]])

  if (remainderValue === 0) {
    const numericCandidates = [
      quotientValue + 1,
      quotientValue - 1,
      quotientValue + divisor,
      Math.max(1, divisor - 1),
      quotientValue * divisor,
    ].filter((value) => value > 0)
    for (const value of numericCandidates) {
      addChoice(candidates, value, correct)
    }
    while (candidates.size < 4) {
      addChoice(candidates, Math.max(1, quotientValue + randomInt(-4, 4, rng)), correct)
    }
    return shuffle(Array.from(candidates.values()).slice(0, 4), rng)
  }

  const remainderCandidates = [
    remainderAnswer(Math.max(1, quotientValue - 1), remainderValue + divisor),
    remainderAnswer(quotientValue + 1, remainderValue),
    remainderAnswer(quotientValue - 1, remainderValue),
    remainderAnswer(quotientValue, remainderValue + 1),
    remainderAnswer(quotientValue, Math.max(1, remainderValue - 1)),
    remainderAnswer(remainderValue, quotientValue),
    remainderAnswer(quotientValue + 1, Math.max(1, remainderValue - divisor)),
  ]
  for (const value of remainderCandidates) {
    addChoice(candidates, value, correct)
  }
  while (candidates.size < 4) {
    addChoice(
      candidates,
      remainderAnswer(
        Math.max(1, quotientValue + randomInt(-3, 3, rng)),
        Math.max(1, remainderValue + randomInt(-3, divisor + 2, rng)),
      ),
      correct,
    )
  }
  return shuffle(Array.from(candidates.values()).slice(0, 4), rng)
}

export function generateDivisionFactQuestion(
  areaId: DivisionAreaId,
  left: number,
  right: number,
  rng: RandomSource = Math.random,
): Question {
  const area = getDivisionAreaById(areaId)
  const q = quotient(left, right)
  const r = remainder(left, right)
  const answer = divisionAnswerValue(q, r)
  return {
    id: makeDivisionFactId(areaId, left, right),
    category: area.generator.category,
    prompt: `${left} ÷ ${right}`,
    answer,
    choices: generateDivisionChoices(q, r, right, rng),
    explanation:
      r === 0 ? `${right} × ${q} = ${left}` : `${right} × ${q} = ${left - r}、あまり${r}`,
    difficulty: difficultyForDivision(areaId, left, right),
    metadata: {
      left,
      right,
      quotient: q,
      remainder: r,
      areaId,
      operation: 'division',
      answerMode: 'choice',
    },
  }
}

export function generateDivisionQuestion(
  areaId: DivisionAreaId,
  rng: RandomSource = Math.random,
): Question {
  const pair = generateDivisionFactPair(areaId, rng)
  return generateDivisionFactQuestion(areaId, pair.left, pair.right, rng)
}
