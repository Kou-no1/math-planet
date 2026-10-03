import { additionAreas, divisionAreas, subtractionAreas, type PlanetId } from '../../data/planets'
import type { ArithmeticOperation } from '../../types/game'
import type { SaveData } from '../../types/save'
import { factOperationOf } from '../questions/factIds'
import { getWeakFacts } from '../review/weakFacts'
import { isNumericPlanetId, numericAreasForPlanet } from '../../data/numericAreas'

export const planetOperations: Record<PlanetId, ArithmeticOperation> = {
  add: 'addition',
  subtract: 'subtraction',
  multiply: 'multiplication',
  divide: 'division',
  decimal: 'decimal',
  fraction: 'fraction',
}

export function planetForOperation(operation: ArithmeticOperation): PlanetId {
  return (Object.keys(planetOperations) as PlanetId[]).find(
    (id) => planetOperations[id] === operation,
  )!
}

export function learningAreasForPlanet(planet: PlanetId) {
  if (isNumericPlanetId(planet)) return numericAreasForPlanet(planet)
  return planet === 'add'
    ? additionAreas
    : planet === 'subtract'
      ? subtractionAreas
      : planet === 'divide'
        ? divisionAreas
        : []
}

export function getPlanetLearningTarget(save: SaveData, planet: PlanetId) {
  const operation = planetOperations[planet]
  const weak = getWeakFacts(save.progress.facts, 1, { operation })[0]
  if (planet === 'multiply') {
    const stage =
      weak?.left ??
      Array.from({ length: 9 }, (_, index) => index + 1).find(
        (left) =>
          Object.values(save.progress.facts)
            .filter((fact) => factOperationOf(fact) === operation && fact.left === left)
            .reduce((sum, fact) => sum + fact.correctCount, 0) < 20,
      ) ??
      2
    return {
      label: `${stage}のだん`,
      stage,
      areaId: undefined,
      href: `/learn?planet=multiply&stage=${stage}`,
    }
  }
  const areas = learningAreasForPlanet(planet)
  const area =
    areas.find((entry) => entry.id === weak?.areaId) ??
    areas.find((entry) => (save.progress.categoryCorrect[`${operation}:${entry.id}`] ?? 0) < 20) ??
    areas[0]
  return {
    label: area.name,
    areaId: area.id,
    stage: undefined,
    href: `/learn?planet=${planet}&area=${area.id}`,
  }
}
