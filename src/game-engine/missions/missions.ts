import type { DailyMission } from '../../types/game'
import type { SaveData } from '../../types/save'
import { getLocalDateKey } from '../../utils/date'
import { planets, type PlanetId } from '../../data/planets'
import { getPlanetLearningTarget, planetOperations } from '../learning/planetLearning'
import { factFromResult } from '../questions/factIds'
import type { GameSessionSummary } from '../../types/game'

export function generateDailyMissions(
  save: SaveData,
  date = new Date(),
  planet: PlanetId = 'multiply',
): DailyMission[] {
  const { stage, areaId, label } = getPlanetLearningTarget(save, planet)
  const operation = planetOperations[planet]
  const prefix = `${getLocalDateKey(date)}-${planet}`
  const missions: DailyMission[] = [
    {
      id: `${prefix}-correct-10`,
      operation,
      label: '10もん せいかいしよう',
      kind: 'correct-count',
      target: 10,
      progress: 0,
      completed: false,
    },
    {
      id: `${prefix}-practice-${areaId ?? stage}`,
      label: `${label}を 5もん とこう`,
      kind: areaId ? 'area-practice' : 'stage-practice',
      operation,
      areaId,
      stage,
      target: 5,
      progress: 0,
      completed: false,
    },
    {
      id: `${prefix}-combo-5`,
      operation,
      label: '5れんぞくを めざそう',
      kind: 'combo',
      target: 5,
      progress: 0,
      completed: false,
    },
  ]
  return missions
}

export function updateMissionProgress(
  mission: DailyMission,
  summary: GameSessionSummary,
): DailyMission {
  const matching = summary.results.filter(
    (result) => !mission.operation || factFromResult(result)?.operation === mission.operation,
  )
  let gained = 0
  if (mission.kind === 'correct-count') gained = matching.filter((result) => result.correct).length
  if (mission.kind === 'stage-practice') {
    const stage = mission.stage ?? Number(mission.id.match(/stage-(\d+)/)?.[1])
    gained = matching.filter(
      (result) => result.correct && factFromResult(result)?.left === stage,
    ).length
  }
  if (mission.kind === 'area-practice') {
    gained = matching.filter(
      (result) => result.correct && factFromResult(result)?.areaId === mission.areaId,
    ).length
  }
  if (mission.kind === 'speed-play')
    gained = summary.mode === 'speed' && matching.length > 0 ? 1 : 0
  if (mission.kind === 'combo') {
    let combo = 0
    for (const result of summary.results) {
      combo =
        result.correct &&
        (!mission.operation || factFromResult(result)?.operation === mission.operation)
          ? combo + 1
          : 0
      gained = Math.max(gained, combo)
    }
  }
  const progress = Math.min(
    mission.target,
    mission.kind === 'combo' ? Math.max(mission.progress, gained) : mission.progress + gained,
  )
  return { ...mission, progress, completed: progress >= mission.target }
}

export function refreshMissionsIfNeeded(save: SaveData, date = new Date()): SaveData {
  const key = getLocalDateKey(date)
  if (save.progress.missionDate === key && save.progress.missions.some((mission) => mission.operation)) {
    const missing = planets.filter(
      (planet) => !save.progress.missions.some(
        (mission) => mission.operation === planetOperations[planet.id],
      ),
    )
    if (!missing.length) return save
    return {
      ...save,
      progress: {
        ...save.progress,
        missions: [
          ...save.progress.missions,
          ...missing.flatMap((planet) => generateDailyMissions(save, date, planet.id)),
        ],
      },
    }
  }
  return {
    ...save,
    progress: {
      ...save.progress,
      missionDate: key,
      missions: planets.map((planet) => planet.id).flatMap((planet) =>
        generateDailyMissions(save, date, planet),
      ),
    },
  }
}
