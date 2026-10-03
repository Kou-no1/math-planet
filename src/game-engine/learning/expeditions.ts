import type { PlanetId } from '../../data/planets'
import type { SaveData } from '../../types/save'
import { learningAreasForPlanet, planetOperations } from './planetLearning'
import { factOperationOf } from '../questions/factIds'

export function expeditionProgress(save: SaveData, planet: PlanetId) {
  const operation = planetOperations[planet]
  const areas = learningAreasForPlanet(planet)
  const milestones =
    planet === 'multiply'
      ? Array.from({ length: 9 }, (_, index) => {
          const stage = index + 1
          return {
            id: String(stage),
            label: `${stage}のだん`,
            correct: Object.values(save.progress.facts)
              .filter((fact) => factOperationOf(fact) === operation && fact.left === stage)
              .reduce((sum, fact) => sum + fact.correctCount, 0),
          }
        })
      : areas.map((area) => ({
          id: area.id,
          label: area.shortName,
          correct: save.progress.categoryCorrect[`${operation}:${area.id}`] ?? 0,
        }))
  return milestones.map((milestone) => ({
    ...milestone,
    target: 20,
    completed: milestone.correct >= 20,
  }))
}
