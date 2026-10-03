import {
  isAdditionAreaId,
  isDivisionAreaId,
  isSubtractionAreaId,
  type PlanetId,
} from '../../data/planets'
import type { MultiplicationFactProgress, Question } from '../../types/game'
import { generateAdditionFactQuestion, matchesAdditionArea } from '../questions/addition'
import { generateDivisionFactQuestion, matchesDivisionArea } from '../questions/division'
import { generateSubtractionFactQuestion, matchesSubtractionArea } from '../questions/subtraction'
import {
  generateAdaptiveAdditionQuestion,
  generateAdaptiveDivisionQuestion,
  generateAdaptiveMultiplicationQuestion,
  generateAdaptiveSubtractionQuestion,
  generateMultiplicationFactQuestion,
} from '../questions/questionGenerator'
import { parseFactId } from '../questions/factIds'
import { isNumericAreaId, isNumericPlanetId, numericAreasForPlanet } from '../../data/numericAreas'
import { generateAdaptiveNumericQuestion, numericQuestionFromFactId } from '../questions/numeric'

export function questionForReviewFact(fact: MultiplicationFactProgress): Question | null {
  const parsed = parseFactId(fact.id)
  if (!parsed) return null
  if (isNumericPlanetId(parsed.operation)) return numericQuestionFromFactId(fact.id)
  if (
    parsed.operation === 'addition' &&
    isAdditionAreaId(parsed.areaId) &&
    matchesAdditionArea(parsed.areaId, parsed.left, parsed.right)
  )
    return generateAdditionFactQuestion(parsed.areaId, parsed.left, parsed.right)
  if (
    parsed.operation === 'subtraction' &&
    isSubtractionAreaId(parsed.areaId) &&
    matchesSubtractionArea(parsed.areaId, parsed.left, parsed.right)
  )
    return generateSubtractionFactQuestion(parsed.areaId, parsed.left, parsed.right)
  if (
    parsed.operation === 'division' &&
    isDivisionAreaId(parsed.areaId) &&
    matchesDivisionArea(parsed.areaId, parsed.left, parsed.right)
  )
    return generateDivisionFactQuestion(parsed.areaId, parsed.left, parsed.right)
  if (parsed.operation === 'multiplication')
    return generateMultiplicationFactQuestion(parsed.left, parsed.right)
  return null
}

export function createPlanetReviewQuestion({
  planet,
  facts,
  queue,
  index,
  schoolMode2Enabled,
  recentIncorrectCount,
}: {
  planet: PlanetId
  facts: Record<string, MultiplicationFactProgress>
  queue: MultiplicationFactProgress[]
  index: number
  schoolMode2Enabled: boolean
  recentIncorrectCount: number
}): Question {
  const fact = queue[index % Math.max(1, queue.length)]
  if (fact && (!schoolMode2Enabled || recentIncorrectCount < 2)) {
    const question = questionForReviewFact(fact)
    if (question) return question
  }
  const options = { schoolMode2Enabled, recentIncorrectCount }
  if (isNumericPlanetId(planet))
    return generateAdaptiveNumericQuestion(facts,
      isNumericAreaId(fact?.areaId) && numericAreasForPlanet(planet).some((area) => area.id === fact.areaId)
        ? fact.areaId : numericAreasForPlanet(planet)[0].id, options)
  if (planet === 'add')
    return generateAdaptiveAdditionQuestion(
      facts,
      isAdditionAreaId(fact?.areaId) ? fact.areaId : 'add-within-9',
      options,
    )
  if (planet === 'subtract')
    return generateAdaptiveSubtractionQuestion(
      facts,
      isSubtractionAreaId(fact?.areaId) ? fact.areaId : 'sub-within-9',
      options,
    )
  if (planet === 'divide')
    return generateAdaptiveDivisionQuestion(
      facts,
      isDivisionAreaId(fact?.areaId) ? fact.areaId : 'divide-no-remainder',
      options,
    )
  return generateAdaptiveMultiplicationQuestion(facts, {
    ...options,
    stages: fact ? [fact.left] : undefined,
  })
}
