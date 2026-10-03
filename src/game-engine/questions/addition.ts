import { getAdditionAreaById, type AdditionAreaId } from '../../data/planets'
import type { Question } from '../../types/game'
import { makeAdditionFactId } from './factIds'

export type RandomSource = () => number

export type AdditionFactPair = {
  areaId: AdditionAreaId
  left: number
  right: number
  difficulty: number
}

function pick<T>(items: T[], rng: RandomSource): T {
  return items[Math.floor(rng() * items.length)] ?? items[0]
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

function ones(value: number): number {
  return value % 10
}

function tens(value: number): number {
  return Math.floor(value / 10) % 10
}

function hasNoCarry(left: number, right: number): boolean {
  return ones(left) + ones(right) <= 9 && tens(left) + tens(right) <= 9
}

export function matchesAdditionArea(areaId: AdditionAreaId, left: number, right: number): boolean {
  if (areaId === 'add-within-9') {
    return left >= 1 && left <= 8 && right >= 1 && right <= 8 && left + right <= 9
  }
  if (areaId === 'add-within-10') {
    return left >= 1 && left <= 9 && right >= 1 && right <= 9 && left + right <= 10
  }
  if (areaId === 'add-carry-basic') {
    return left >= 1 && left <= 9 && right >= 1 && right <= 9 && left + right >= 11
  }
  if (areaId === 'add-two-digit-no-carry') {
    return left >= 10 && left <= 99 && right >= 10 && right <= 99 && hasNoCarry(left, right)
  }
  if (areaId === 'add-two-digit-carry') {
    return left >= 10 && left <= 99 && right >= 10 && right <= 99 && ones(left) + ones(right) >= 10
  }
  return left >= 100 && left <= 999 && right >= 100 && right <= 999
}

export function difficultyForAddition(areaId: AdditionAreaId, left: number, right: number): number {
  const digitSum = ones(left) + ones(right)
  const tensSum = tens(left) + tens(right)
  if (areaId === 'add-within-9') {
    return left + right <= 5 ? 1 : 2
  }
  if (areaId === 'add-within-10') {
    return left + right <= 6 ? 1 : 2
  }
  if (areaId === 'add-carry-basic') {
    return left + right <= 14 ? 2 : 3
  }
  if (areaId === 'add-two-digit-no-carry') {
    return tensSum <= 5 && digitSum <= 6 ? 2 : 3
  }
  if (areaId === 'add-two-digit-carry') {
    return tensSum <= 5 && digitSum <= 11 ? 2 : 4
  }
  return left + right < 900 || carryForgottenAnswer(left, right) === left + right ? 4 : 5
}

function createPair(areaId: AdditionAreaId, left: number, right: number): AdditionFactPair {
  return {
    areaId,
    left,
    right,
    difficulty: difficultyForAddition(areaId, left, right),
  }
}

export function createAdditionFactPool({ areaId }: { areaId: AdditionAreaId }): AdditionFactPair[] {
  if (areaId === 'add-three-digit') {
    const pairs: AdditionFactPair[] = []
    for (let left = 100; left <= 999; left += 37) {
      for (let right = 100; right <= 999; right += 53) {
        pairs.push(createPair(areaId, left, right))
      }
    }
    return pairs
  }

  const area = getAdditionAreaById(areaId)
  const pairs: AdditionFactPair[] = []
  for (let left = area.generator.minAddend; left <= area.generator.maxAddend; left += 1) {
    for (let right = area.generator.minAddend; right <= area.generator.maxAddend; right += 1) {
      if (matchesAdditionArea(areaId, left, right)) {
        pairs.push(createPair(areaId, left, right))
      }
    }
  }
  return pairs
}

export function generateAdditionFactPair(
  areaId: AdditionAreaId,
  rng: RandomSource = Math.random,
): AdditionFactPair {
  const area = getAdditionAreaById(areaId)
  for (let attempts = 0; attempts < 500; attempts += 1) {
    const left = randomInt(area.generator.minAddend, area.generator.maxAddend, rng)
    const right = randomInt(area.generator.minAddend, area.generator.maxAddend, rng)
    if (matchesAdditionArea(areaId, left, right)) {
      return createPair(areaId, left, right)
    }
  }
  return pick(createAdditionFactPool({ areaId }), rng)
}

function carryForgottenAnswer(left: number, right: number): number {
  const maxDigits = Math.max(String(left).length, String(right).length)
  let place = 1
  let value = 0
  for (let index = 0; index < maxDigits; index += 1) {
    const digit = ((Math.floor(left / place) % 10) + (Math.floor(right / place) % 10)) % 10
    value += digit * place
    place *= 10
  }
  return value
}

function reversedDigits(value: number): number {
  return Number(String(value).split('').reverse().join(''))
}

export function generateAdditionChoices(
  correctAnswer: number,
  left: number,
  right: number,
  rng: RandomSource = Math.random,
): number[] {
  const candidates = new Set<number>([correctAnswer])
  const carryForgotten = carryForgottenAnswer(left, right)
  if (carryForgotten > 0 && carryForgotten !== correctAnswer) {
    candidates.add(carryForgotten)
  }
  const nearValues = [
    correctAnswer + 10,
    correctAnswer - 10,
    correctAnswer + 1,
    correctAnswer - 1,
    ...(correctAnswer >= 100 ? [correctAnswer + 100, correctAnswer - 100] : []),
    ...(Math.max(left, right) >= 10 &&
    reversedDigits(correctAnswer) <= 2 * 10 ** String(Math.max(left, right)).length
      ? [reversedDigits(correctAnswer)]
      : []),
    left + ones(right),
    right + ones(left),
  ].filter((value) => value > 0 && value !== correctAnswer)

  for (const value of shuffle(nearValues, rng)) {
    candidates.add(value)
    if (candidates.size === 4) {
      break
    }
  }

  let offset = 2
  while (candidates.size < 4) {
    const sign = candidates.size % 2 === 0 ? 1 : -1
    const value = correctAnswer + sign * offset
    if (value > 0) {
      candidates.add(value)
    }
    offset += offset < 12 ? 1 : 10
  }

  return shuffle([...candidates], rng)
}

export function generateAdditionFactQuestion(
  areaId: AdditionAreaId,
  left: number,
  right: number,
  rng: RandomSource = Math.random,
): Question {
  const area = getAdditionAreaById(areaId)
  const answer = left + right
  return {
    id: makeAdditionFactId(areaId, left, right),
    category: area.generator.category,
    prompt: `${left} + ${right}`,
    answer,
    choices: generateAdditionChoices(answer, left, right, rng),
    explanation: `${left} + ${right} = ${answer}`,
    difficulty: difficultyForAddition(areaId, left, right),
    metadata: {
      operation: 'addition',
      areaId,
      left,
      right,
      answerMode: 'choice',
    },
  }
}

export function generateAdditionQuestion(
  areaId: AdditionAreaId,
  rng: RandomSource = Math.random,
): Question {
  const pair = generateAdditionFactPair(areaId, rng)
  return generateAdditionFactQuestion(areaId, pair.left, pair.right, rng)
}
