import { getSubtractionAreaById, type SubtractionAreaId } from '../../data/planets'
import type { Question } from '../../types/game'
import { makeSubtractionFactId } from './factIds'

export type RandomSource = () => number

export type SubtractionFactPair = {
  areaId: SubtractionAreaId
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

function hundreds(value: number): number {
  return Math.floor(value / 100) % 10
}

function hasNoBorrow(left: number, right: number): boolean {
  return left >= right && ones(left) >= ones(right) && tens(left) >= tens(right)
}

function hasOnesBorrow(left: number, right: number): boolean {
  return left >= right && ones(left) < ones(right)
}

export function hasCascadingBorrow(left: number, right: number): boolean {
  return (
    left >= right &&
    left >= 100 &&
    right >= 100 &&
    ones(left) < ones(right) &&
    tens(left) === 0 &&
    tens(right) > 0 &&
    hundreds(left) > hundreds(right)
  )
}

export function matchesSubtractionArea(
  areaId: SubtractionAreaId,
  left: number,
  right: number,
): boolean {
  const answer = left - right
  if (answer <= 0) {
    return false
  }
  if (areaId === 'sub-within-9') {
    return left >= 2 && left <= 9 && right >= 1 && right < left
  }
  if (areaId === 'sub-within-10') {
    return left >= 2 && left <= 10 && right >= 1 && right < left
  }
  if (areaId === 'sub-borrow-basic') {
    return left >= 11 && left <= 18 && right >= 1 && right <= 9 && ones(left) < right
  }
  if (areaId === 'sub-two-digit-no-borrow') {
    return left >= 10 && left <= 99 && right >= 10 && right <= 99 && hasNoBorrow(left, right)
  }
  if (areaId === 'sub-two-digit-borrow') {
    return left >= 10 && left <= 99 && right >= 10 && right <= 99 && hasOnesBorrow(left, right)
  }
  return left >= 100 && left <= 999 && right >= 100 && right <= 999 && left > right
}

export function difficultyForSubtraction(
  areaId: SubtractionAreaId,
  left: number,
  right: number,
): number {
  const answer = left - right
  if (areaId === 'sub-within-9') {
    return left <= 5 ? 1 : 2
  }
  if (areaId === 'sub-within-10') {
    return left <= 6 ? 1 : 2
  }
  if (areaId === 'sub-borrow-basic') {
    return answer <= 7 ? 2 : 3
  }
  if (areaId === 'sub-two-digit-no-borrow') {
    return tens(left) <= 5 && ones(left) <= 6 ? 2 : 3
  }
  if (areaId === 'sub-two-digit-borrow') {
    return answer < 50 ? 3 : 4
  }
  return hasCascadingBorrow(left, right) ? 5 : 4
}

function createPair(areaId: SubtractionAreaId, left: number, right: number): SubtractionFactPair {
  return {
    areaId,
    left,
    right,
    difficulty: difficultyForSubtraction(areaId, left, right),
  }
}

function createThreeDigitPool(areaId: SubtractionAreaId): SubtractionFactPair[] {
  const pairs: SubtractionFactPair[] = []
  for (let left = 100; left <= 999; left += 37) {
    for (let right = 100; right <= left; right += 53) {
      if (matchesSubtractionArea(areaId, left, right)) {
        pairs.push(createPair(areaId, left, right))
      }
    }
  }
  const cascadeSeeds: Array<[number, number]> = [
    [304, 176],
    [402, 185],
    [503, 264],
    [701, 389],
    [806, 427],
    [904, 538],
  ]
  for (const [left, right] of cascadeSeeds) {
    pairs.push(createPair(areaId, left, right))
  }
  return pairs
}

export function createSubtractionFactPool({
  areaId,
}: {
  areaId: SubtractionAreaId
}): SubtractionFactPair[] {
  if (areaId === 'sub-three-digit') {
    return createThreeDigitPool(areaId)
  }

  const area = getSubtractionAreaById(areaId)
  const pairs: SubtractionFactPair[] = []
  for (let left = area.generator.minMinuend; left <= area.generator.maxMinuend; left += 1) {
    for (
      let right = area.generator.minSubtrahend;
      right <= area.generator.maxSubtrahend;
      right += 1
    ) {
      if (matchesSubtractionArea(areaId, left, right)) {
        pairs.push(createPair(areaId, left, right))
      }
    }
  }
  return pairs
}

function generateCascadingBorrowPair(rng: RandomSource): SubtractionFactPair {
  const leftHundreds = randomInt(2, 9, rng)
  const leftOnes = randomInt(0, 4, rng)
  const rightHundreds = randomInt(1, leftHundreds - 1, rng)
  const rightTens = randomInt(1, 9, rng)
  const rightOnes = randomInt(leftOnes + 1, 9, rng)
  const left = leftHundreds * 100 + leftOnes
  const right = rightHundreds * 100 + rightTens * 10 + rightOnes
  return createPair('sub-three-digit', left, right)
}

export function generateSubtractionFactPair(
  areaId: SubtractionAreaId,
  rng: RandomSource = Math.random,
): SubtractionFactPair {
  const area = getSubtractionAreaById(areaId)
  if (areaId === 'sub-three-digit' && rng() < 0.35) {
    return generateCascadingBorrowPair(rng)
  }
  for (let attempts = 0; attempts < 500; attempts += 1) {
    const left = randomInt(area.generator.minMinuend, area.generator.maxMinuend, rng)
    const right = randomInt(area.generator.minSubtrahend, area.generator.maxSubtrahend, rng)
    if (matchesSubtractionArea(areaId, left, right)) {
      return createPair(areaId, left, right)
    }
  }
  return pick(createSubtractionFactPool({ areaId }), rng)
}

function borrowForgottenAnswer(left: number, right: number): number {
  const maxDigits = Math.max(String(left).length, String(right).length)
  let place = 1
  let value = 0
  for (let index = 0; index < maxDigits; index += 1) {
    const digit = Math.abs((Math.floor(left / place) % 10) - (Math.floor(right / place) % 10))
    value += digit * place
    place *= 10
  }
  return value
}

function reversedDigits(value: number): number {
  return Number(String(value).split('').reverse().join(''))
}

export function generateSubtractionChoices(
  correctAnswer: number,
  left: number,
  right: number,
  rng: RandomSource = Math.random,
): number[] {
  const candidates = new Set<number>([correctAnswer])
  const borrowForgotten = borrowForgottenAnswer(left, right)
  if (borrowForgotten !== correctAnswer) {
    candidates.add(borrowForgotten)
  }
  const nearValues = [
    correctAnswer + 10,
    correctAnswer - 10,
    correctAnswer + 1,
    correctAnswer - 1,
    correctAnswer + 100,
    correctAnswer - 100,
    reversedDigits(correctAnswer),
    right - left,
    left - ones(right),
    Math.abs(ones(left) - ones(right)),
  ].filter((value) => value >= 0 && value !== correctAnswer)

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
    if (value >= 0) {
      candidates.add(value)
    }
    offset += offset < 12 ? 1 : 10
  }

  return shuffle([...candidates], rng)
}

export function generateSubtractionFactQuestion(
  areaId: SubtractionAreaId,
  left: number,
  right: number,
  rng: RandomSource = Math.random,
): Question {
  const area = getSubtractionAreaById(areaId)
  const answer = left - right
  return {
    id: makeSubtractionFactId(areaId, left, right),
    category: area.generator.category,
    prompt: `${left} - ${right}`,
    answer,
    choices: generateSubtractionChoices(answer, left, right, rng),
    explanation: `${left} - ${right} = ${answer}`,
    difficulty: difficultyForSubtraction(areaId, left, right),
    metadata: {
      operation: 'subtraction',
      areaId,
      left,
      right,
      answerMode: 'choice',
    },
  }
}

export function generateSubtractionQuestion(
  areaId: SubtractionAreaId,
  rng: RandomSource = Math.random,
): Question {
  const pair = generateSubtractionFactPair(areaId, rng)
  return generateSubtractionFactQuestion(areaId, pair.left, pair.right, rng)
}
