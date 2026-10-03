import type { PlanetId } from '../../data/planets'
import type { GameSessionSummary } from '../../types/game'
import { parseFactId } from '../questions/factIds'
import { planetForOperation } from '../learning/planetLearning'

export function sessionRecordScope(
  summary: Pick<GameSessionSummary, 'mode' | 'results' | 'details'>,
) {
  const details = summary.details ?? {}
  const parsed = summary.results
    .map((result) => parseFactId(result.questionId))
    .filter((fact) => fact !== null)
  const inferred = new Set(parsed.map((fact) => planetForOperation(fact.operation)))
  const explicit = details.planet
  const planet: PlanetId | 'mixed' | 'legacy' =
    inferred.size > 1
      ? 'mixed'
      : inferred.size === 1
        ? [...inferred][0]
        : explicit === 'add' ||
            explicit === 'subtract' ||
            explicit === 'divide' ||
            explicit === 'multiply' || explicit === 'decimal' || explicit === 'fraction'
          ? explicit
          : summary.results.length > 0
            ? 'multiply'
            : 'legacy'
  const configuredAreas = Array.isArray(details.selectedAreas)
    ? details.selectedAreas
    : typeof details.areaId === 'string'
      ? [details.areaId]
      : Array.isArray(details.selectedStages)
        ? details.selectedStages.map(String)
        : typeof details.stage === 'number'
          ? [String(details.stage)]
          : []
  const areaIds = [
    ...new Set(
      configuredAreas.length > 0
        ? configuredAreas
        : summary.mode === 'rocket' || summary.mode === 'battle' || summary.mode === 'treasure'
          ? ['mix']
          : parsed.map((fact) => fact.areaId ?? String(fact.left)),
    ),
  ].sort()
  const difficultyId = [
    details.additionRocketDifficulty,
    details.subtractionRocketDifficulty,
    details.divisionRocketDifficulty,
    details.numericRocketDifficulty,
    details.bossDifficulty,
  ].find((value) => typeof value === 'string') as string | undefined
  const answerMode = details.answerMode === 'input' ? ('input' as const) : ('choice' as const)
  const durationSeconds =
    typeof details.durationSeconds === 'number' ? details.durationSeconds : null
  const challenge =
    typeof details.bossId === 'string'
      ? details.bossId
      : typeof details.learnKind === 'string'
        ? details.learnKind
        : 'basic'
  const questionCount =
    summary.mode === 'learn' || summary.mode === 'review' || summary.mode === 'advanced'
      ? typeof details.questionCount === 'number'
        ? details.questionCount
        : summary.results.length
      : null
  const recordKey = JSON.stringify([
    planet,
    summary.mode,
    challenge,
    difficultyId ?? null,
    areaIds,
    durationSeconds,
    answerMode,
    questionCount,
  ])
  return {
    planet,
    recordKey,
    areaIds,
    difficultyId: difficultyId ?? null,
    answerMode,
    durationSeconds,
  }
}
