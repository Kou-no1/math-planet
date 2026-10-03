import Fraction from 'fraction.js'
import { describe, expect, it } from 'vitest'
import { numericAreas, numericAreasForPlanet } from '../data/numericAreas'
import { numericRocketDifficulties } from '../data/numericRocket'
import {
  numericBosses,
  numericMonsterDefinitions,
  isNumericMonsterOwned,
  numericAreaCorrectKey,
  numericMasterTitle,
} from '../data/numericRewards'
import {
  calculateNumericAnswer,
  generateAdaptiveNumericQuestion,
  generateNumericFactQuestion,
  generateNumericQuestion,
  matchesNumericArea,
} from '../game-engine/questions/numeric'
import { answerValueKey, formatAnswerValue, isCorrectAnswer } from '../game-engine/questions/answer'
import { exactFraction } from '../game-engine/questions/rational'
import { parseFactId, formatFactLabel } from '../game-engine/questions/factIds'
import { createFactProgress, updateFactProgress } from '../game-engine/mastery/mastery'
import { createPlanetReviewQuestion } from '../game-engine/review/planetReview'
import { buildSessionSummary } from '../game-engine/rewards/rewards'
import { applySessionResult } from '../services/resultService'
import { buildCustomInventory } from '../game-engine/custom/customInventory'
import { applyBossClearReward, isBossUnlocked } from '../game-engine/bosses/bossEngine'
import { fullOpenDebugSaveData as unlockAllDebugContent } from '../game-engine/debug/debugTools'
import { createPlayerFromOnboarding, parseSaveData, SAVE_DATA_VERSION } from '../storage/saveData'
import { createMiniQuestion } from '../features/miniGames/MiniGamePage'
import { createSpeedQuestion } from '../features/speed/SpeedPage'
import { sessionRecordScope } from '../game-engine/scoring/sessionRecords'
import { getTitleDefinitions } from '../game-engine/rewards/titles'
import { refreshMissionsIfNeeded } from '../game-engine/missions/missions'
import { bosses } from '../data/bosses'
import { isBuddySelectionOwned } from '../game-engine/collection/buddies'
import type { AnswerResult, Question } from '../types/game'

const makeSave = () =>
  createPlayerFromOnboarding({
    nickname: 'みらい',
    icon: 'たまご',
    learningLevel: 'advanced',
    soundEnabled: false,
  })
const time = '2026-10-03T09:00:00.000Z'
const result = (question: Question, correct = true): AnswerResult => ({
  questionId: question.id,
  prompt: question.prompt,
  expectedAnswer: question.answer,
  givenAnswer: correct ? question.answer : -1,
  correct,
  difficulty: question.difficulty,
  responseTimeMs: 1000,
  answeredAt: time,
})
const summary = (question: Question) =>
  buildSessionSummary({
    id: 'numeric-test',
    mode: 'learn',
    maxCombo: 1,
    score: 100,
    results: [result(question)],
    finishedAt: time,
  })
function random(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
}

describe('decimal and fraction planets', () => {
  it.each(numericAreas)('$id generates exact valid answers and four distinct choices', (area) => {
    const rng = random(73)
    for (let index = 0; index < 100; index++) {
      const question = generateNumericQuestion(area.id, rng)
      const fact = parseFactId(question.id)!
      expect(matchesNumericArea(area.id, fact.numericOperands!)).toBe(true)
      expect(
        exactFraction(question.answer)?.equals(
          calculateNumericAnswer(area.id, fact.numericOperands!),
        ),
      ).toBe(true)
      expect(question.choices).toHaveLength(4)
      expect(new Set(question.choices!.map(answerValueKey)).size).toBe(4)
      expect(question.choices!.filter((answer) => isCorrectAnswer(question, answer))).toHaveLength(
        1,
      )
      expect(question.choices!.every((answer) => exactFraction(answer)!.gte(0))).toBe(true)
      expect(() => JSON.stringify(question)).not.toThrow()
      if (area.generator.operation === 'decimal')
        expect(formatAnswerValue(question.answer)).not.toMatch(/[()eE]/)
    }
  })

  it('does not use floating point equality and accepts equivalent reduced fractions', () => {
    const decimal = generateNumericFactQuestion('decimal-add-tenths', [1, 10, 2, 10])
    expect(formatAnswerValue(decimal.answer)).toBe('0.3')
    expect(isCorrectAnswer(decimal, '０．３０')).toBe(true)
    expect(isCorrectAnswer(decimal, 0.1 + 0.2)).toBe(false)
    const fraction = generateNumericFactQuestion('fraction-add-same', [1, 4, 1, 4])
    expect(formatAnswerValue(fraction.answer)).toBe('1/2')
    expect(
      isCorrectAnswer(fraction, {
        kind: 'fraction',
        numerator: 2,
        denominator: 4,
      }),
    ).toBe(true)
    expect(
      isCorrectAnswer(fraction, {
        kind: 'fraction',
        numerator: 1,
        denominator: 0,
      }),
    ).toBe(false)
    expect(isCorrectAnswer(fraction, '1/3')).toBe(false)
    expect(
      formatAnswerValue(generateNumericFactQuestion('fraction-add-same', [1, 2, 1, 2]).answer),
    ).toBe('1')
    expect(matchesNumericArea('decimal-divide-integer', [1, 100, 3, 1])).toBe(false)
  })

  it('keeps denominators and calculation types in namespaced facts for review and backups', () => {
    const question = generateNumericFactQuestion('fraction-add-unlike', [1, 3, 1, 6])
    const fact = parseFactId(question.id)!
    const progress = updateFactProgress(
      createFactProgress(fact.left, fact.right, fact),
      result(question, false),
    )
    const reviewed = createPlanetReviewQuestion({
      planet: 'fraction',
      facts: { [fact.id]: progress },
      queue: [progress],
      index: 0,
      schoolMode2Enabled: false,
      recentIncorrectCount: 0,
    })
    expect(reviewed.id).toBe(question.id)
    expect(formatFactLabel(progress)).toBe('1/3 + 1/6')
    expect(reviewed.answer).toEqual(question.answer)
    expect(parseFactId('fraction:fraction-add-same:[1,0,1,4]')).toBeNull()
    expect(parseFactId('decimal:fraction-add-same:[1,4,1,4]')).toBeNull()
    const save = applySessionResult(makeSave(), summary(question)).save
    const restored = parseSaveData(JSON.stringify(save))!
    expect(restored.version).toBe(SAVE_DATA_VERSION)
    expect(restored.progress.facts[question.id].recentResults[0].expectedAnswer).toEqual(
      question.answer,
    )
  })

  it.each(['decimal', 'fraction'] as const)(
    '%s reuses coins, EXP, tapering, missions and scoped records',
    (planet) => {
      const question = generateNumericQuestion(numericAreasForPlanet(planet)[0].id, () => 0)
      const save = makeSave()
      save.settings.schoolMode2Enabled = true
      const first = applySessionResult(save, summary(question))
      expect(first.summary.earnedCoins).toBeGreaterThan(0)
      expect(first.summary.earnedExp).toBeGreaterThan(0)
      let trained = first.save
      for (let index = 0; index < 15; index++)
        trained = applySessionResult(trained, summary(question)).save
      expect(applySessionResult(trained, summary(question)).summary.earnedExp).toBeLessThan(
        first.summary.earnedExp,
      )
      expect(
        first.save.progress.categoryCorrect[
          numericAreaCorrectKey(numericAreasForPlanet(planet)[0].id)
        ],
      ).toBe(1)
      expect(first.save.progress.history[0].planet).toBe(planet)
      expect(
        first.save.progress.missions.filter((mission) => mission.operation === planet),
      ).toHaveLength(3)
      expect(
        sessionRecordScope({
          mode: 'rocket',
          results: [],
          details: { planet, numericRocketDifficulty: 'easy' },
        }).recordKey,
      ).not.toBe(
        sessionRecordScope({
          mode: 'rocket',
          results: [],
          details: { planet, numericRocketDifficulty: 'hard' },
        }).recordKey,
      )
    },
  )

  it('preserves existing same-day missions when adding new planets', () => {
    const save = refreshMissionsIfNeeded(makeSave(), new Date(time))
    save.progress.missions = save.progress.missions.filter(
      (mission) => mission.operation !== 'decimal' && mission.operation !== 'fraction',
    )
    save.progress.missions[0].progress = 4
    const expanded = refreshMissionsIfNeeded(save, new Date(time))
    expect(expanded.progress.missions[0].progress).toBe(4)
    expect(expanded.progress.missions).toHaveLength(18)
  })

  it.each(['decimal', 'fraction'] as const)(
    '%s equipment survives JSON restore and filter changes',
    (planet) => {
      const save = unlockAllDebugContent(makeSave(), time)
      const inventory = buildCustomInventory(save, planet)
      const buddy = inventory.find((tab) => tab.id === 'buddy')!.entries[0]
      const ufo = inventory.find((tab) => tab.id === 'ufo')!.entries[0]
      save.progress.equippedBuddyId = buddy.id
      save.progress.equippedUfoId = ufo.id
      const restored = parseSaveData(JSON.stringify(save))!
      expect(restored.progress.equippedBuddyId).toBe(buddy.id)
      expect(restored.progress.equippedUfoId).toBe(ufo.id)
      expect(isBuddySelectionOwned(restored, buddy.id)).toBe(true)
      expect(
        buildCustomInventory(restored, 'all')
          .flatMap((tab) => tab.entries)
          .find((entry) => entry.id === buddy.id)?.selected,
      ).toBe(true)
      buildCustomInventory(restored, 'multiply')
      expect(restored.progress.equippedBuddyId).toBe(buddy.id)
    },
  )

  it.each(numericAreas)('$id becomes easier after two consecutive mistakes', (area) => {
    const question = generateAdaptiveNumericQuestion({}, area.id, {
      schoolMode2Enabled: true,
      recentIncorrectCount: 2,
      rng: () => 0.99,
    })
    const easiest = generateNumericQuestion(area.id, () => 0)
    expect(question.difficulty).toBe(easiest.difficulty)
  })

  it.each(['decimal', 'fraction'] as const)(
    '%s rocket difficulty, speed, rewards and unlocks use its own definitions',
    (planet) => {
      for (const difficulty of numericRocketDifficulties(planet))
        for (const rng of [() => 0, () => 0.5, () => 0.999]) {
          const question = createMiniQuestion({
            planet,
            numericRocketDifficulty: difficulty.id,
            rng,
          })
          expect(difficulty.areaIds).toContain(question.metadata?.areaId)
          expect(question.metadata?.operation).toBe(planet)
        }
      expect(
        createSpeedQuestion({
          planet,
          selectedAreas: [numericAreasForPlanet(planet)[0].id],
        }).metadata?.operation,
      ).toBe(planet)
      let save = unlockAllDebugContent(makeSave(), time)
      const inventory = buildCustomInventory(save, planet)
      expect(inventory.find((tab) => tab.id === 'buddy')!.entries).toHaveLength(
        planet === 'decimal' ? 18 : 12,
      )
      expect(inventory.find((tab) => tab.id === 'ufo')!.entries).toHaveLength(3)
      expect(
        inventory.every((tab) =>
          tab.entries.every((entry) => entry.origin === planet && entry.owned),
        ),
      ).toBe(true)
      expect(
        numericMonsterDefinitions
          .filter((monster) => monster.origin === planet)
          .every((monster) => isNumericMonsterOwned(monster, save.progress.categoryCorrect)),
      ).toBe(true)
      save = makeSave()
      for (const boss of numericBosses.filter((boss) => boss.group === planet)) {
        expect(isBossUnlocked(boss, save)).toBe(false)
        save.progress.categoryCorrect[numericAreaCorrectKey(boss.numericAreaId!)] = 20
        expect(isBossUnlocked(boss, save)).toBe(true)
        const cleared = applyBossClearReward(save, boss.id, 'normal', 1000, time)
        save = cleared.save
        if (boss.rewards.normal.ufoId)
          expect(save.progress.ownedUfos).toContain(boss.rewards.normal.ufoId)
        if (boss.rewards.normal.effectId)
          expect(save.progress.ownedItems).toContain(boss.rewards.normal.effectId)
      }
      const master = getTitleDefinitions().find(
        (title) => title.label === numericMasterTitle(planet),
      )!
      expect(save.player!.titles).toContain(master.id)
      expect(save.progress.ownedUfos).not.toContain('ufo-special-master')
      expect(
        bosses.filter((entry) => entry.group === 'basic' || entry.group === 'advanced'),
      ).toHaveLength(12)
    },
  )

  it('reduces fractions exactly without changing values', () => {
    expect(new Fraction(4, 8).toFraction()).toBe('1/2')
  })
})
