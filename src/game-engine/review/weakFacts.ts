import type { ArithmeticOperation, MultiplicationFactProgress } from '../../types/game'
import { factOperationOf, parseFactId } from '../questions/factIds'

export type MonsterOvercomeProgress = {
  remainingCorrect: number
  needsDifferentDay: boolean
  message: string | null
}

export const weakFactHintText = 'べつの日に また せいかいすると きえるよ'

export type FactReviewFilter = {
  operation?: ArithmeticOperation
  areaId?: string
}

function attemptsOf(fact: MultiplicationFactProgress): number {
  return fact.correctCount + fact.incorrectCount
}

function accuracyOf(fact: MultiplicationFactProgress): number {
  const attempts = attemptsOf(fact)
  return attempts === 0 ? 1 : fact.correctCount / attempts
}

function firstWrongDate(fact: MultiplicationFactProgress): string | null {
  if (fact.firstIncorrectAt) {
    return fact.firstIncorrectAt
  }
  const wrongs = fact.recentResults.filter((result) => !result.correct)
  return wrongs.at(-1)?.answeredAt ?? null
}

function isDifferentDay(left: string, right: string): boolean {
  return new Date(left).toDateString() !== new Date(right).toDateString()
}

export function isMonsterOvercome(fact: MultiplicationFactProgress): boolean {
  if (fact.overcomeAt) {
    return true
  }
  if (fact.incorrectCount <= 0 || fact.correctCount < 3) {
    return false
  }
  const registeredAt = firstWrongDate(fact)
  if (!registeredAt) {
    return false
  }
  return fact.recentResults.some(
    (result) => result.correct && isDifferentDay(registeredAt, result.answeredAt),
  )
}

export function getMonsterOvercomeProgress(
  fact: MultiplicationFactProgress,
): MonsterOvercomeProgress {
  if (fact.incorrectCount <= 0 || isMonsterOvercome(fact)) {
    return {
      remainingCorrect: 0,
      needsDifferentDay: false,
      message: null,
    }
  }

  const registeredAt = firstWrongDate(fact)
  const remainingCorrect = Math.max(0, 3 - fact.correctCount)
  const hasDifferentDayCorrect = registeredAt
    ? fact.recentResults.some(
        (result) => result.correct && isDifferentDay(registeredAt, result.answeredAt),
      )
    : false
  const needsDifferentDay = !hasDifferentDayCorrect

  if (remainingCorrect > 0 && needsDifferentDay) {
    return {
      remainingCorrect,
      needsDifferentDay,
      message: `あと ${remainingCorrect}かい、また あしたも といてみよう！`,
    }
  }
  if (remainingCorrect > 0) {
    return {
      remainingCorrect,
      needsDifferentDay,
      message: `あと ${remainingCorrect}かいで こくふく！`,
    }
  }
  if (needsDifferentDay) {
    return {
      remainingCorrect,
      needsDifferentDay,
      message: 'また あした も といてみよう！',
    }
  }

  return {
    remainingCorrect,
    needsDifferentDay,
    message: null,
  }
}

export function getWeakFacts(
  facts: Record<string, MultiplicationFactProgress>,
  limit = 5,
  filter: FactReviewFilter = {},
): MultiplicationFactProgress[] {
  return Object.values(facts)
    .filter(
      (fact) =>
        attemptsOf(fact) > 0 &&
        fact.incorrectCount > 0 &&
        !isMonsterOvercome(fact) &&
        matchesFactFilter(fact, filter),
    )
    .sort((left, right) => {
      const leftAccuracy = accuracyOf(left)
      const rightAccuracy = accuracyOf(right)
      if (leftAccuracy !== rightAccuracy) {
        return leftAccuracy - rightAccuracy
      }
      return right.averageResponseTimeMs - left.averageResponseTimeMs
    })
    .slice(0, limit)
}

export function getMasteredFacts(
  facts: Record<string, MultiplicationFactProgress>,
): MultiplicationFactProgress[] {
  return Object.values(facts).filter((fact) => fact.masteryLevel >= 4 || isMonsterOvercome(fact))
}

export function getDueReviewFacts(
  facts: Record<string, MultiplicationFactProgress>,
  now = new Date(),
  limit = 8,
  filter: FactReviewFilter = {},
): MultiplicationFactProgress[] {
  const time = now.getTime()
  return Object.values(facts)
    .filter(
      (fact) =>
        fact.nextReviewAt &&
        new Date(fact.nextReviewAt).getTime() <= time &&
        matchesFactFilter(fact, filter),
    )
    .sort((left, right) => {
      const leftTime = new Date(left.nextReviewAt ?? 0).getTime()
      const rightTime = new Date(right.nextReviewAt ?? 0).getTime()
      return leftTime - rightTime
    })
    .slice(0, limit)
}

export function isMonsterFact(fact: MultiplicationFactProgress): boolean {
  return (
    factOperationOf(fact) === 'multiplication' &&
    fact.incorrectCount > 0 &&
    !isMonsterOvercome(fact)
  )
}

export function getMonsterFacts(
  facts: Record<string, MultiplicationFactProgress>,
  limit = 12,
): MultiplicationFactProgress[] {
  return Object.values(facts)
    .filter(isMonsterFact)
    .sort((left, right) => {
      const leftPriority =
        (1 - accuracyOf(left)) * 100 + left.averageResponseTimeMs / 1000 - left.masteryLevel
      const rightPriority =
        (1 - accuracyOf(right)) * 100 + right.averageResponseTimeMs / 1000 - right.masteryLevel
      return rightPriority - leftPriority
    })
    .slice(0, limit)
}

export function getReviewQueue(
  facts: Record<string, MultiplicationFactProgress>,
  now = new Date(),
  limit = 8,
  filter: FactReviewFilter = {},
): MultiplicationFactProgress[] {
  const seen = new Set<string>()
  const queue = [
    ...getWeakFacts(facts, limit, filter),
    ...getDueReviewFacts(facts, now, limit, filter),
  ].filter((fact) => {
    if (seen.has(fact.id)) {
      return false
    }
    seen.add(fact.id)
    return true
  })
  return queue.slice(0, limit)
}

function matchesFactFilter(fact: MultiplicationFactProgress, filter: FactReviewFilter): boolean {
  const parsed = parseFactId(fact.id)
  const operation = fact.operation ?? parsed?.operation
  if (filter.operation && operation !== filter.operation) {
    return false
  }
  if (filter.areaId && parsed?.areaId !== filter.areaId && fact.areaId !== filter.areaId) {
    return false
  }
  return true
}
