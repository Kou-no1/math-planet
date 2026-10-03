import { describe, expect, it } from 'vitest'
import { additionAreas, divisionAreas, subtractionAreas } from '../data/planets'
import { bosses } from '../data/bosses'
import { createFactProgress, updateFactProgress } from '../game-engine/mastery/mastery'
import { generateAdditionFactQuestion } from '../game-engine/questions/addition'
import { generateSubtractionFactQuestion } from '../game-engine/questions/subtraction'
import { generateDivisionFactQuestion } from '../game-engine/questions/division'
import { parseFactId } from '../game-engine/questions/factIds'
import { isMonsterOvercome, getWeakFacts } from '../game-engine/review/weakFacts'
import { createPlanetReviewQuestion } from '../game-engine/review/planetReview'
import {
  selectAdaptiveAdditionFact,
  selectAdaptiveDivisionFact,
  selectAdaptiveSubtractionFact,
} from '../game-engine/school/schoolMode2'
import { buildSessionSummary } from '../game-engine/rewards/rewards'
import { getTitleDefinitions, titleLabel, titleRecordId } from '../game-engine/rewards/titles'
import {
  generateDailyMissions,
  refreshMissionsIfNeeded,
  updateMissionProgress,
} from '../game-engine/missions/missions'
import { sessionRecordScope } from '../game-engine/scoring/sessionRecords'
import { calculationHint } from '../game-engine/learning/calculationHints'
import { expeditionProgress } from '../game-engine/learning/expeditions'
import { applyLearningPreset, applyQuietPreset } from '../game-engine/settings/learningPreferences'
import { buildCustomInventory } from '../game-engine/custom/customInventory'
import { applySessionResult } from '../services/resultService'
import {
  createPlayerFromOnboarding,
  migrateSaveData,
  parseSaveData,
  SAVE_DATA_VERSION,
} from '../storage/saveData'
import type { AnswerResult, GameSessionSummary, Question } from '../types/game'

const day1 = '2026-10-01T09:00:00.000Z'
const day2 = '2026-10-02T09:00:00.000Z'
const makeSave = () =>
  createPlayerFromOnboarding({
    nickname: 'みらい',
    icon: 'たまご',
    learningLevel: 'first',
    soundEnabled: false,
  })

function answer(question: Question, correct = true, answeredAt = day2): AnswerResult {
  return {
    questionId: question.id,
    prompt: question.prompt,
    expectedAnswer: question.answer,
    givenAnswer: correct ? question.answer : -1,
    correct,
    difficulty: question.difficulty,
    responseTimeMs: 1000,
    answeredAt,
  }
}

function session(
  question: Question,
  options: {
    score?: number
    count?: number
    mode?: GameSessionSummary['mode']
    details?: GameSessionSummary['details']
  } = {},
) {
  return buildSessionSummary({
    id: 'test',
    mode: options.mode ?? 'learn',
    results: Array.from({ length: options.count ?? 1 }, () => answer(question)),
    maxCombo: options.count ?? 1,
    score: options.score ?? 100,
    finishedAt: day2,
    details: options.details,
  })
}

function progress(question: Question) {
  const fact = parseFactId(question.id)!
  return createFactProgress(fact.left, fact.right, fact)
}

describe('learning integrity', () => {
  it('keeps overcome progress after mistakes leave the eight-answer window', () => {
    const question = generateAdditionFactQuestion('add-within-9', 2, 3)
    let fact = progress(question)
    for (let index = 0; index < 20; index += 1)
      fact = updateFactProgress(fact, answer(question, false, day1))
    for (let index = 0; index < 3; index += 1) fact = updateFactProgress(fact, answer(question))
    expect(isMonsterOvercome(fact)).toBe(true)
    for (let index = 0; index < 5; index += 1) fact = updateFactProgress(fact, answer(question))
    expect(fact.recentResults.every((result) => result.correct)).toBe(true)
    expect(fact.masteryLevel).toBe(2)
    expect(isMonsterOvercome(fact)).toBe(true)
    expect(getWeakFacts({ [fact.id]: fact })).toEqual([])
    expect(isMonsterOvercome(updateFactProgress(fact, answer(question, false)))).toBe(true)
  })

  it('does not count a same-day retry as a different-day overcome', () => {
    const question = generateSubtractionFactQuestion('sub-within-9', 5, 2)
    let fact = updateFactProgress(progress(question), answer(question, false, day1))
    for (let index = 0; index < 8; index += 1)
      fact = updateFactProgress(fact, answer(question, true, day1))
    expect(isMonsterOvercome(fact)).toBe(false)
    fact = updateFactProgress(fact, answer(question))
    expect(isMonsterOvercome(fact)).toBe(true)
  })

  it('keeps intrinsic difficulty when a difficult saved fact has low mastery', () => {
    const question = generateDivisionFactQuestion('divide-large', 98, 3)
    const fact = {
      ...progress(question),
      masteryLevel: 2 as const,
      correctCount: 1,
      incorrectCount: 2,
    }
    for (const rng of [() => 0, () => 0.5, () => 0.9999]) {
      const selected = selectAdaptiveDivisionFact({
        facts: { [fact.id]: fact },
        areaId: 'divide-large',
        recentIncorrectCount: 2,
        rng,
      })
      expect(selected.difficulty).toBeLessThanOrEqual(3)
      expect(selected.left === 98 && selected.right === 3).toBe(false)
    }
  })

  it('selects the easiest available tier for three-digit arithmetic after two misses', () => {
    const addition = generateAdditionFactQuestion('add-three-digit', 888, 777)
    const subtraction = generateSubtractionFactQuestion('sub-three-digit', 304, 176)
    const addFact = { ...progress(addition), masteryLevel: 1 as const }
    const subFact = { ...progress(subtraction), masteryLevel: 1 as const }
    expect(
      selectAdaptiveAdditionFact({
        facts: { [addFact.id]: addFact },
        areaId: 'add-three-digit',
        recentIncorrectCount: 2,
        rng: () => 0.99,
      }).difficulty,
    ).toBe(4)
    expect(
      selectAdaptiveSubtractionFact({
        facts: { [subFact.id]: subFact },
        areaId: 'sub-three-digit',
        recentIncorrectCount: 2,
        rng: () => 0.99,
      }).difficulty,
    ).toBe(4)
  })

  it('rejects a saved pair outside the requested generator rules', () => {
    const question = generateAdditionFactQuestion('add-carry-basic', 1, 1)
    const fact = progress(question)
    const selected = selectAdaptiveAdditionFact({
      facts: { [fact.id]: fact },
      areaId: 'add-carry-basic',
      rng: () => 0,
    })
    expect(selected.left + selected.right).toBeGreaterThanOrEqual(11)
  })

  it('keeps addition distractors plausible for the operand size', () => {
    for (let left = 1; left <= 9; left += 1) {
      for (let right = 1; right <= 9; right += 1) {
        for (const random of [0, 0.25, 0.5, 0.9]) {
          const choices = generateAdditionFactQuestion(
            left + right >= 11 ? 'add-carry-basic' : 'add-within-10',
            left,
            right,
            () => random,
          ).choices as number[]
          expect(new Set(choices).size).toBe(4)
          expect(choices.every((choice) => choice > 0 && choice <= left + right + 10)).toBe(true)
        }
      }
    }
    expect(generateAdditionFactQuestion('add-two-digit-carry', 27, 58).choices).toContain(75)
    expect(generateAdditionFactQuestion('add-two-digit-carry', 27, 58).choices).not.toContain(715)
  })

  it('separates personal bests by planet and retains scoped history', () => {
    const add = session(generateAdditionFactQuestion('add-within-9', 2, 3), {
      score: 100,
    })
    const sub = session(generateSubtractionFactQuestion('sub-within-9', 5, 2), {
      score: 50,
    })
    const first = applySessionResult(makeSave(), add)
    const second = applySessionResult(first.save, sub)
    expect(second.summary.bestUpdated).toBe(true)
    expect(Object.keys(second.save.progress.bests)).toHaveLength(2)
    expect(second.save.progress.history.map((entry) => entry.planet)).toEqual(['subtract', 'add'])
    expect(applySessionResult(second.save, sub).summary.bestUpdated).toBe(false)
  })

  it('separates timed records by duration and normalizes area order', () => {
    const question = generateDivisionFactQuestion('divide-with-remainder', 13, 4)
    const a = session(question, {
      mode: 'speed',
      details: {
        selectedAreas: ['divide-large', 'divide-with-remainder'],
        durationSeconds: 30,
      },
    })
    const b = {
      ...a,
      details: {
        ...a.details,
        selectedAreas: ['divide-with-remainder', 'divide-large'],
      },
    }
    expect(sessionRecordScope(a).recordKey).toBe(sessionRecordScope(b).recordKey)
    expect(sessionRecordScope(a).recordKey).not.toBe(
      sessionRecordScope({
        ...a,
        details: { ...a.details, durationSeconds: 60 },
      }).recordKey,
    )
  })

  it('separates rocket difficulty without depending on randomly sampled areas', () => {
    const first = session(generateAdditionFactQuestion('add-within-9', 2, 3), {
      mode: 'rocket',
      details: { planet: 'add', additionRocketDifficulty: 'easy' },
    })
    const second = {
      ...first,
      results: [answer(generateAdditionFactQuestion('add-carry-basic', 7, 8))],
    }
    expect(sessionRecordScope(first).recordKey).toBe(sessionRecordScope(second).recordKey)
    expect(sessionRecordScope(first).recordKey).not.toBe(
      sessionRecordScope({
        ...first,
        details: { ...first.details, additionRocketDifficulty: 'hard' },
      }).recordKey,
    )
  })

  it('separates practice lengths and boss identities at the same difficulty', () => {
    const question = generateAdditionFactQuestion('add-within-9', 2, 3)
    const short = session(question, { count: 5 })
    const long = session(question, { count: 15 })
    expect(sessionRecordScope(short).recordKey).not.toBe(sessionRecordScope(long).recordKey)
    const boss = {
      ...short,
      mode: 'boss' as const,
      results: [],
      details: { bossId: 'boss-square', bossDifficulty: 'normal' },
    }
    expect(sessionRecordScope(boss).recordKey).not.toBe(
      sessionRecordScope({
        ...boss,
        details: { ...boss.details, bossId: 'boss-pi' },
      }).recordKey,
    )
  })

  it('does not grant multiplication-only titles for addition', () => {
    const applied = applySessionResult(
      makeSave(),
      session(generateAdditionFactQuestion('add-within-9', 2, 3), {
        count: 10,
      }),
    )
    expect(applied.summary.newTitles).not.toContain('かけざんビギナー')
    expect(applied.summary.newTitles).not.toContain('くくファイター')
    expect(applied.save.player?.titles).toContain(titleRecordId('たしざんのたまご'))
    expect(applied.save.player?.currentTitle).toBe(titleRecordId('はじめのいっぽ'))
  })

  it('uses unique stable title ids and distinguishes both large-number bosses', () => {
    const definitions = getTitleDefinitions()
    expect(new Set(definitions.map((title) => title.id)).size).toBe(definitions.length)
    expect(new Set(definitions.map((title) => title.label)).size).toBe(definitions.length)
    expect(titleRecordId('おおきいかずこまんだー')).not.toBe(titleRecordId('おおひきこまんだー'))
    expect(titleLabel(titleRecordId('たしざんロケットパイロット'))).toBe(
      'たしざんロケットパイロット',
    )
  })

  it('migrates label titles, acquisition records and unknown legacy records without guessing a planet', () => {
    const old = makeSave()
    old.version = 14
    old.player!.titles = ['はじめのいっぽ', 'たしざんロケットパイロット']
    old.player!.currentTitle = 'たしざんロケットパイロット'
    old.progress.collectionRecords = [
      {
        id: 'title:たしざんロケットパイロット',
        acquiredAt: day1,
        method: 'ろけっと',
      },
    ]
    old.progress.bests.learn = {
      score: 42,
      achievedAt: day1,
      accuracy: 100,
      averageResponseTimeMs: 1000,
    }
    old.progress.history = [
      {
        id: 'old',
        mode: 'learn',
        score: 42,
        playedAt: day1,
        correctCount: 1,
        totalQuestions: 1,
        averageResponseTimeMs: 1000,
      },
    ]
    old.progress.rocketBestDistance = 1000
    const migrated = parseSaveData(JSON.stringify(old))
    expect(migrated.version).toBe(SAVE_DATA_VERSION)
    expect(migrated.player?.currentTitle).toBe(titleRecordId('たしざんロケットパイロット'))
    expect(migrated.progress.bests['legacy:learn'].score).toBe(42)
    expect(migrated.progress.history[0].planet).toBe('legacy')
    expect(migrated.progress.rocketBestDistance).toBe(1000)
    expect(migrated.progress.collectionRecords[0]).toEqual({
      id: `title:${titleRecordId('たしざんロケットパイロット')}`,
      acquiredAt: day1,
      method: 'ろけっと',
    })
    expect(parseSaveData(JSON.stringify(migrated))).toEqual(migrated)
  })

  it('recovers a formerly colliding title from the actual subtraction boss record', () => {
    const old = makeSave()
    old.version = 14
    old.player!.titles = ['おおきいかずこまんだー']
    old.player!.currentTitle = 'おおきいかずこまんだー'
    old.progress.bossProgress['boss-sub-three-digit'] = {
      bossId: 'boss-sub-three-digit',
      difficulties: {
        normal: {
          cleared: true,
          clearCount: 1,
          firstClearedAt: day1,
          bestTimeMs: 1000,
        },
      },
    }
    const migrated = migrateSaveData(old)
    expect(migrated.player?.titles).toEqual([titleRecordId('おおひきこまんだー')])
    expect(
      buildCustomInventory(migrated, 'subtract')
        .find((tab) => tab.id === 'title')
        ?.entries.some((entry) => entry.owned && entry.label === 'おおひきこまんだー'),
    ).toBe(true)
  })

  it('retains the historical v9 boss reset for raw label acquisition records', () => {
    const old = makeSave()
    old.version = 9
    const label = bosses.find((boss) => boss.id === 'boss-square')!.rewards.normal.title
    old.player!.titles = [label]
    old.player!.currentTitle = label
    old.progress.collectionRecords = [{ id: `title:${label}`, acquiredAt: day1, method: 'old' }]
    const migrated = migrateSaveData(old)
    expect(migrated.player?.titles).not.toContain(titleRecordId(label))
    expect(migrated.progress.collectionRecords).not.toContainEqual(
      expect.objectContaining({ id: `title:${titleRecordId(label)}` }),
    )
  })

  it('preserves recorded overcome achievements during migration', () => {
    const question = generateDivisionFactQuestion('divide-with-remainder', 13, 4)
    const old = makeSave()
    old.version = 14
    old.progress.facts[question.id] = {
      ...progress(question),
      correctCount: 3,
      incorrectCount: 1,
      lastAnsweredAt: day2,
      recentResults: [answer(question), answer(question, false, day1)],
    }
    const migrated = migrateSaveData(old)
    expect(migrated.progress.facts[question.id].overcomeAt).toBe(day2)
    expect(migrated.progress.facts[question.id].firstIncorrectAt).toBe(day1)
  })

  it('creates three appropriate missions for each planet', () => {
    const save = makeSave()
    for (const planet of ['add', 'subtract', 'divide'] as const) {
      const missions = generateDailyMissions(save, new Date(day2), planet)
      expect(missions).toHaveLength(3)
      expect(missions[1].kind).toBe('area-practice')
      expect(missions.some((mission) => mission.label.includes('のだん'))).toBe(false)
    }
    const refreshed = refreshMissionsIfNeeded(save, new Date(day2))
    expect(refreshed.progress.missions).toHaveLength(12)
    expect(refreshMissionsIfNeeded(refreshed, new Date(day2))).toBe(refreshed)
  })

  it('does not add separate short streaks into a five-answer combo mission', () => {
    const mission = generateDailyMissions(makeSave(), new Date(day2), 'add')[2]
    const question = generateAdditionFactQuestion('add-within-9', 2, 3)
    const once = session(question)
    let next = mission
    for (let index = 0; index < 5; index += 1) next = updateMissionProgress(next, once)
    expect(next.progress).toBe(1)
    expect(next.completed).toBe(false)
    expect(updateMissionProgress(next, session(question, { count: 5 })).completed).toBe(true)
  })

  it('only advances an area mission with that planet and area', () => {
    const mission = generateDailyMissions(makeSave(), new Date(day2), 'subtract')[1]
    const other = session(generateAdditionFactQuestion('add-within-9', 2, 3), {
      count: 5,
    })
    expect(updateMissionProgress(mission, other).progress).toBe(0)
    const matching = session(generateSubtractionFactQuestion('sub-within-9', 5, 2), { count: 5 })
    expect(updateMissionProgress(mission, matching).completed).toBe(true)
  })

  it.each([
    ['add', generateAdditionFactQuestion('add-carry-basic', 7, 8)],
    ['subtract', generateSubtractionFactQuestion('sub-borrow-basic', 13, 4)],
    ['divide', generateDivisionFactQuestion('divide-with-remainder', 13, 4)],
  ] as const)(
    'reviews an actual weak %s fact instead of switching to multiplication',
    (planet, question) => {
      const fact = { ...progress(question), incorrectCount: 1 }
      const generated = createPlanetReviewQuestion({
        planet,
        facts: { [fact.id]: fact },
        queue: [fact],
        index: 0,
        schoolMode2Enabled: true,
        recentIncorrectCount: 0,
      })
      expect(generated.id).toBe(question.id)
      expect(generated.answer).toEqual(question.answer)
    },
  )

  it('explains carry, cascading borrow and the quotient/remainder relationship correctly', () => {
    expect(
      calculationHint(generateAdditionFactQuestion('add-two-digit-carry', 27, 58))?.steps,
    ).toContain('10のくらい: 2 + 5 + 1 = 8')
    const borrow = calculationHint(generateSubtractionFactQuestion('sub-three-digit', 304, 176))!
    expect(borrow.steps).toContain('100のまとまりを くずして、1のくらいへ')
    expect(borrow.steps).toContain('10のくらい: 9 - 7 = 2')
    expect(
      calculationHint(generateDivisionFactQuestion('divide-with-remainder', 13, 4))?.groups.map(
        (group) => group.count,
      ),
    ).toEqual([3, 3, 3, 3, 1])
  })

  it('derives world progress from existing records without new rewards', () => {
    const save = makeSave()
    save.progress.categoryCorrect['addition:add-within-9'] = 20
    expect(expeditionProgress(save, 'add')[0].completed).toBe(true)
    expect(expeditionProgress(save, 'subtract')[0].completed).toBe(false)
    expect(expeditionProgress(save, 'add')).toHaveLength(additionAreas.length)
    expect(expeditionProgress(save, 'subtract')).toHaveLength(subtractionAreas.length)
    expect(expeditionProgress(save, 'divide')).toHaveLength(divisionAreas.length)
  })

  it('keeps presets independent of time budgets and supports quiet play', () => {
    const settings = makeSave().settings
    expect(applyLearningPreset(settings, 'relaxed')).toMatchObject({
      practiceQuestionCount: 5,
      practiceAnswerMode: 'choice',
      dailyBudgetMinutes: 10,
    })
    expect(applyLearningPreset(settings, 'challenge')).toMatchObject({
      practiceQuestionCount: 15,
      practiceAnswerMode: 'input',
    })
    expect(applyQuietPreset(settings)).toMatchObject({
      soundEnabled: false,
      speechEnabled: false,
      reduceMotion: true,
    })
    expect(
      bosses.every((boss) =>
        getTitleDefinitions().some((title) => title.id === `boss:${boss.id}:normal`),
      ),
    ).toBe(true)
  })
})
