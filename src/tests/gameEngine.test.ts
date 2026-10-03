import { describe, expect, it } from 'vitest'
import globalCss from '../styles/global.css?raw'
import {
  formatAnswerValue,
  isCorrectAnswer,
  isRemainderAnswerValue,
} from '../game-engine/questions/answer'
import {
  generateAdditionQuestion,
  generateDivisionQuestion,
  generateAdaptiveMultiplicationQuestion,
  generateAdvancedQuestion,
  generateChoices,
  generateMissingFactorQuestion,
  generateMultiplicationQuestion,
  generatePiQuestion,
  generateSubtractionQuestion,
} from '../game-engine/questions/questionGenerator'
import {
  createMultiplicationFactPool,
  factDifficulty,
} from '../game-engine/questions/factDifficulty'
import {
  generateAdditionChoices,
  generateAdditionFactQuestion,
} from '../game-engine/questions/addition'
import {
  generateSubtractionChoices,
  hasCascadingBorrow,
} from '../game-engine/questions/subtraction'
import {
  makeAdditionFactId,
  makeDivisionFactId,
  makeSubtractionFactId,
} from '../game-engine/questions/factIds'
import {
  generateDivisionChoices,
  generateDivisionFactQuestion,
} from '../game-engine/questions/division'
import { applyAnswerToScore, calculateSpeedBonus } from '../game-engine/scoring/score'
import {
  buildSessionSummary,
  buildExpProgressAnimationSteps,
  calculateCoins,
  calculateExp,
  expProgressToNextLevel,
  expRequiredForLevel,
} from '../game-engine/rewards/rewards'
import {
  getTitleDefinitions,
  getTitleEmblemDefinition,
  judgeNewTitles,
  titleRecordId,
} from '../game-engine/rewards/titles'
import { canGrantFinalTitle, grantFinalTitleIfEarned } from '../game-engine/rewards/finalTitle'
import { createFactProgress, updateFactProgress } from '../game-engine/mastery/mastery'
import {
  getMonsterOvercomeProgress,
  getWeakFacts,
  isMonsterFact,
  isMonsterOvercome,
  weakFactHintText,
} from '../game-engine/review/weakFacts'
import { generateDailyMissions } from '../game-engine/missions/missions'
import { formatKukuReading, kukuReadings } from '../data/kukuReadings'
import { additionAreas, divisionAreas, planets, subtractionAreas } from '../data/planets'
import { danPalette, getDanSpriteColors } from '../data/danPalette'
import {
  getLevelIconUnlocksBetween,
  getUnlockedLevelIcons,
  levelIconDefinitions,
} from '../data/levelIcons'
import {
  advancedMonsterDefinitions,
  isAdvancedMonsterOwned,
  newlyOwnedAdvancedMonsters,
} from '../data/advancedMonsters'
import {
  additionLegendTitle,
  additionMasterTitle,
  allGekimuzuTitle,
  bossDifficulties,
  bosses,
  bossLimitedItems,
  divisionLegendTitle,
  divisionMasterTitle,
  subtractionLegendTitle,
  subtractionMasterTitle,
} from '../data/bosses'
import {
  additionMonsterDefinitions,
  additionAreaCorrectKey,
  isAdditionMonsterOwned,
} from '../data/additionMonsters'
import {
  isSubtractionMonsterOwned,
  subtractionAreaCorrectKey,
  subtractionMonsterDefinitions,
} from '../data/subtractionMonsters'
import {
  divisionAreaCorrectKey,
  divisionMonsterDefinitions,
  isDivisionMonsterOwned,
} from '../data/divisionMonsters'
import { buddyDefinitions, shopBuddyDefinitions } from '../data/buddies'
import { canKeyOpenChest, keyTypes, treasureChestTypes } from '../data/keys'
import { rocketBadges } from '../data/rocketBadges'
import { additionRocketDifficulties } from '../data/additionRocket'
import { divisionRocketDifficulties } from '../data/divisionRocket'
import { subtractionRocketDifficulties } from '../data/subtractionRocket'
import { playerIcons } from '../data/playerIcons'
import {
  equipShopItem,
  getEquippedItemForSlot,
  getShopItemTier,
  getHomeShipPreviewVisuals,
  getHomeShipVisuals,
  homeShipPreviewLayers,
  isShopTier2Unlocked,
  galaxySwirlEffectId,
  addGatherLightEffectId,
  addPlusBurstEffectId,
  divideFlashEffectId,
  divideSplitLightEffectId,
  phase15EffectItemIds,
  rainbowAuraEffectId,
  shopEffectItemIds,
  subMinusFlashEffectId,
  subScatterLightEffectId,
  suitShopItems,
  shopItems,
  treasureEffectItemIds,
} from '../data/shopItems'
import { normalizeCharacterNameInput, normalizeShipNameInput } from '../data/shipName'
import { treasureItems } from '../data/treasureItems'
import {
  additionDoubleDomeUfoId,
  additionPlusRingUfoId,
  additionSunriseUfoId,
  divisionNebulaUfoId,
  divisionQuarterUfoId,
  divisionRingUfoId,
  getUfoForBoss,
  specialUfoId,
  subtractionMinusRingUfoId,
  subtractionSplitUfoId,
  subtractionSunsetUfoId,
  ufoDefinitions,
} from '../data/ufos'
import { containsBannedWord, validateShipName } from '../utils/bannedWords'
import {
  applyBossClearReward,
  countCorrectForStages,
  getDifficultyProgress,
  isBossUnlocked,
  isDifficultyUnlocked,
  keyRewardsForBossClear,
  remainingQuestionsToUnlockBoss,
} from '../game-engine/bosses/bossEngine'
import { calculateBookProgress } from '../game-engine/collection/bookProgress'
import { collectionRecordId } from '../game-engine/collection/collectionRecords'
import {
  dedicatedBuddySelectionId,
  getOwnedBuddySelections,
  monsterBuddySelectionId,
} from '../game-engine/collection/buddies'
import {
  buildMonsterSprite,
  buildTrophySprite,
  getTrophyKindForDifficulty,
} from '../game-engine/collection/pixelSprites'
import { buildBuddySprite } from '../game-engine/collection/buddySprites'
import {
  buildCustomInventory,
  customRewardOrigins,
  customStarFilterOrder,
  matchesCustomStarFilter,
} from '../game-engine/custom/customInventory'
import {
  advancedBossDisplayNames,
  advancedBossVariantForBossId,
  buildAdvancedBossSprite,
  buildAdvancedMonsterSprite,
} from '../game-engine/collection/advancedPixelSprites'
import {
  createSeededRandom,
  getTreasurePoolForChest,
  openTreasureChest,
} from '../game-engine/treasure/treasureEngine'
import { chooseEffectPerformanceMode } from '../game-engine/effects/effectPerformance'
import {
  addAllDebugKeys,
  debugMenuPassword,
  fullOpenDebugSaveData,
  isDebugPasswordValid,
  nextDebugTapState,
  setDebugLevel,
} from '../game-engine/debug/debugTools'
import {
  DAILY_USAGE_STORAGE_KEY,
  addActiveUsage,
  applyRewardBudgetToSummary,
  createDailyUsageState,
  isRewardBudgetReached,
  normalizeDailyUsageState,
  shouldCountActiveUsage,
  shouldShowDailyBudgetNotice,
} from '../game-engine/school/dailyUsage'
import {
  NAME_CHANGE_COOLDOWN_MS,
  canChangeName,
  formatNameCooldownMessage,
  recordNameChange,
} from '../game-engine/settings/nameCooldown'
import {
  classifySchoolMastery,
  rewardScaleForFact,
  selectAdaptiveAdditionFact,
  selectAdaptiveDivisionFact,
  selectAdaptiveMultiplicationFact,
  selectAdaptiveSubtractionFact,
} from '../game-engine/school/schoolMode2'
import { createDefaultSaveData, migrateSaveData } from '../storage/saveData'
import { applySessionResult } from '../services/resultService'
import type { AnswerResult, GameSessionSummary } from '../types/game'
import type { SaveData } from '../types/save'
import { createSpeedQuestion } from '../features/speed/SpeedPage'
import { createMiniQuestion } from '../features/miniGames/MiniGamePage'

function result(overrides: Partial<AnswerResult> = {}): AnswerResult {
  return {
    questionId: '7x8',
    prompt: '7 × 8',
    expectedAnswer: 56,
    givenAnswer: 56,
    correct: true,
    difficulty: 5,
    responseTimeMs: 1200,
    answeredAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function createSaveWithPlayer(): SaveData {
  return {
    ...createDefaultSaveData(),
    player: {
      nickname: 'テスト',
      icon: 'たまご',
      shipName: 'くくっち',
      characterName: 'くくっち',
      learningLevel: 'first' as const,
      level: 1,
      exp: 0,
      coins: 0,
      titles: [],
      currentTitle: 'はじめのいっぽ',
      createdAt: '2026-01-01T00:00:00.000Z',
      lastPlayedAt: null,
    },
  }
}

describe('question generation', () => {
  it('maps multiplication facts to teacher-adjustable difficulty stars', () => {
    const expectations: Array<[number, number, number]> = [
      [2, 1, 1],
      [9, 1, 1],
      [2, 5, 2],
      [2, 3, 2],
      [5, 5, 2],
      [5, 4, 2],
      [3, 4, 3],
      [2, 7, 3],
      [5, 9, 3],
      [4, 4, 3],
      [3, 6, 3],
      [6, 6, 4],
      [4, 7, 4],
      [9, 9, 4],
      [3, 8, 4],
      [6, 9, 4],
      [6, 7, 5],
      [7, 8, 5],
      [8, 6, 5],
      [7, 7, 5],
      [7, 9, 5],
      [8, 9, 5],
    ]
    for (const [left, right, difficulty] of expectations) {
      expect(factDifficulty(left, right)).toBe(difficulty)
    }

    const allFacts = createMultiplicationFactPool({
      stages: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      minDifficulty: 1,
    })
    expect(allFacts.filter((fact) => fact.difficulty === 1)).toHaveLength(17)
    expect(allFacts.filter((fact) => fact.difficulty === 5)).toHaveLength(12)
  })

  it('builds deterministic pixel monsters from multiplication facts', () => {
    const allFacts = createMultiplicationFactPool({
      stages: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      minDifficulty: 1,
    })
    expect(allFacts).toHaveLength(81)
    expect(new Set(allFacts.map((fact) => `${fact.left}x${fact.right}`))).toHaveLength(81)

    const sprite = buildMonsterSprite(2, 3)
    const same = buildMonsterSprite(2, 3)
    const reversed = buildMonsterSprite(3, 2)
    expect(sprite.signature).toBe(same.signature)
    expect(sprite.signature).not.toBe(reversed.signature)
    expect(sprite.colors.base).toBe(danPalette[2].base)
    expect(reversed.colors.base).toBe(danPalette[3].base)
    expect(sprite.body.length).toBeGreaterThan(20)
    expect(sprite.outline.length).toBeGreaterThan(0)
  })

  it('builds deterministic buddy sprites from buddy ids', () => {
    expect(buddyDefinitions).toHaveLength(12)
    const sprite = buildBuddySprite('star-jelly')
    const same = buildBuddySprite('star-jelly')
    const other = buildBuddySprite('navi-robo')
    expect(sprite.signature).toBe(same.signature)
    expect(sprite.signature).not.toBe(other.signature)
    expect(sprite.body.length).toBeGreaterThan(20)
    expect(sprite.outline.length).toBeGreaterThan(0)
    expect(
      new Set(buddyDefinitions.map((buddy) => buildBuddySprite(buddy.id).signature)),
    ).toHaveLength(12)
    expect(
      new Set(
        buddyDefinitions.map((buddy) =>
          buildBuddySprite(buddy.id)
            .body.map((cell) => `${cell.x},${cell.y}`)
            .join('|'),
        ),
      ),
    ).toHaveLength(12)
  })

  it('builds deterministic pixel trophies with dan colors and difficulty metals', () => {
    const normal = buildTrophySprite({
      danLabel: '1・2',
      accentDan: 2,
      difficulty: 'normal',
    })
    const fast = buildTrophySprite({
      danLabel: '7',
      accentDan: 7,
      difficulty: 'fast',
    })
    expect(normal.signature).toBe(
      buildTrophySprite({
        danLabel: '1・2',
        accentDan: 2,
        difficulty: 'normal',
      }).signature,
    )
    expect(normal.kind).toBe('medal')
    expect(fast.kind).toBe('trophy')
    expect(getTrophyKindForDifficulty('hard')).toBe('medal')
    expect(getTrophyKindForDifficulty('fast')).toBe('trophy')
    expect(normal.colors.accent).toBe(danPalette[2].base)
    expect(fast.colors.accent).toBe(danPalette[7].base)
    expect(getDanSpriteColors(1).outline).not.toBe(getDanSpriteColors(1).base)
  })

  it('builds deterministic high-grade companion and boss sprites', () => {
    const square = advancedMonsterDefinitions.find((monster) => monster.category === 'square')
    const pi = advancedMonsterDefinitions.find((monster) => monster.category === 'pi')
    const mixed = advancedMonsterDefinitions.find((monster) => monster.category === 'mixed')
    expect(square).toBeTruthy()
    expect(pi).toBeTruthy()
    expect(mixed).toBeTruthy()
    if (!square || !pi || !mixed) {
      return
    }

    expect(advancedMonsterDefinitions).toHaveLength(20)
    expect(
      advancedMonsterDefinitions
        .filter((monster) => monster.category === 'pi')
        .map((monster) => [monster.id, monster.name]),
    ).toEqual([
      ['pi-1', 'ワンリングパイ'],
      ['pi-2', 'ツインリングパイ'],
      ['pi-5', 'ファイブリングパイ'],
      ['pi-10', 'スリーリングパイ'],
      ['pi-25', 'フォーリングパイ'],
      ['pi-100', 'フルムーンパイ'],
    ])
    expect(buildAdvancedMonsterSprite(square).signature).toBe(
      buildAdvancedMonsterSprite(square).signature,
    )
    expect(buildAdvancedMonsterSprite(square).signature).not.toBe(
      buildAdvancedMonsterSprite(pi).signature,
    )
    expect(buildAdvancedMonsterSprite(mixed).cells.length).toBeGreaterThan(20)
    expect(buildAdvancedBossSprite('square').signature).toBe(
      buildAdvancedBossSprite('square').signature,
    )
    expect(buildAdvancedBossSprite('square').name).toBe('クリスタルゴーレム')
    expect(buildAdvancedBossSprite('pi').rings.length).toBe(2)
    expect(buildAdvancedBossSprite('pi').name).toBe('リングプラネット')
    expect(buildAdvancedBossSprite('mixed').cells.length).toBeGreaterThan(50)
    expect(buildAdvancedBossSprite('mixed').name).toBe('にじいろキング')
    expect(advancedBossDisplayNames).toEqual({
      square: 'クリスタルゴーレム',
      pi: 'リングプラネット',
      mixed: 'にじいろキング',
    })
    expect(bosses.find((boss) => boss.id === 'boss-square')?.label).toBe('クリスタルゴーレム')
    expect(bosses.find((boss) => boss.id === 'boss-pi')?.label).toBe('リングプラネット')
    expect(bosses.find((boss) => boss.id === 'boss-development')?.label).toBe('にじいろキング')
    expect(advancedBossVariantForBossId('boss-square')).toBe('square')
    expect(advancedBossVariantForBossId('boss-pi')).toBe('pi')
    expect(advancedBossVariantForBossId('boss-development')).toBe('mixed')
    expect(advancedBossVariantForBossId('boss-stage-2')).toBeNull()
  })

  it('generates multiplication questions with unique choices', () => {
    const question = generateMultiplicationQuestion({
      stage: 7,
      rng: () => 0.75,
    })
    expect(question.category).toBe('multiplication-basic')
    expect(question.prompt).toContain('7 ×')
    expect(new Set(question.choices).size).toBe(4)
    expect(question.choices).toContain(question.answer)
  })

  it('filters multiplication pools by minDifficulty and relaxes empty pools', () => {
    const hardPool = createMultiplicationFactPool({
      stages: [7],
      minDifficulty: 5,
    })
    expect(hardPool.length).toBeGreaterThan(0)
    expect(hardPool.every((fact) => fact.left === 7 && fact.difficulty >= 5)).toBe(true)

    const relaxedPool = createMultiplicationFactPool({
      stages: [1],
      minDifficulty: 5,
    })
    expect(relaxedPool.length).toBe(9)
    expect(relaxedPool.every((fact) => fact.left === 1 && fact.difficulty === 1)).toBe(true)
  })

  it('generates speed questions only from selected stages', () => {
    const questions = Array.from({ length: 20 }, () =>
      generateMultiplicationQuestion({
        stages: [4],
        answerMode: 'choice',
        minDifficulty: 1,
        rng: () => 0.35,
      }),
    )
    expect(questions.every((question) => question.metadata?.left === 4)).toBe(true)
  })

  it('generates pi multiplication questions only with one-digit multipliers', () => {
    const samples = Array.from({ length: 25 }, (_, index) =>
      generatePiQuestion(createSeededRandom(100 + index)),
    )
    expect(samples.every((question) => question.category === 'pi-multiplication')).toBe(true)
    expect(samples.every((question) => Number(question.metadata?.value) >= 1)).toBe(true)
    expect(samples.every((question) => Number(question.metadata?.value) <= 9)).toBe(true)
    expect(samples.every((question) => !/×\s*[1-9][0-9]/.test(question.prompt))).toBe(true)
  })

  it('orders planets by school progression and defines live operation planets with six areas', () => {
    const multiplyPlanet = planets.find((planet) => planet.id === 'multiply')
    const additionPlanet = planets.find((planet) => planet.id === 'add')
    const subtractionPlanet = planets.find((planet) => planet.id === 'subtract')
    const divisionPlanet = planets.find((planet) => planet.id === 'divide')
    expect(planets.map((planet) => planet.id)).toEqual(['add', 'subtract', 'multiply', 'divide'])
    expect(additionPlanet?.status).toBe('live')
    expect(subtractionPlanet?.status).toBe('live')
    expect(divisionPlanet?.status).toBe('live')
    expect(additionPlanet?.areas.map((area) => area.name)).toEqual([
      '1〜9のたしざん',
      '10までのたしざん',
      'くりあがりのたしざん',
      '2けたのたしざん',
      '2けたのたしざん（くりあがり）',
      'おおきいかずのたしざん',
    ])
    expect(subtractionPlanet?.areas.map((area) => area.name)).toEqual([
      '1〜9のひきざん',
      '10からのひきざん',
      'くりさがりのひきざん',
      '2けたのひきざん',
      '2けたのひきざん（くりさがり）',
      'おおきいかずのひきざん',
    ])
    expect(additionPlanet?.theme.primary).not.toBe(multiplyPlanet?.theme.primary)
    expect(subtractionPlanet?.theme.motif).toBe('ゆうやけのくれーたー')
    expect(additionAreas.map((area) => area.generator.operation)).toEqual([
      'addition',
      'addition',
      'addition',
      'addition',
      'addition',
      'addition',
    ])
    expect(subtractionAreas.map((area) => area.generator.operation)).toEqual([
      'subtraction',
      'subtraction',
      'subtraction',
      'subtraction',
      'subtraction',
      'subtraction',
    ])
    expect(divisionPlanet?.areas).toHaveLength(3)
    expect(divisionPlanet?.theme.primary).not.toBe(additionPlanet?.theme.primary)
    expect(divisionPlanet?.theme.primary).not.toBe(subtractionPlanet?.theme.primary)
    expect(divisionAreas.map((area) => area.generator.operation)).toEqual([
      'division',
      'division',
      'division',
    ])
  })

  it('generates addition questions that match all six area rules', () => {
    const samples = Object.fromEntries(
      additionAreas.map((area, areaIndex) => [
        area.id,
        Array.from({ length: 35 }, (_, sampleIndex) =>
          generateAdditionQuestion(area.id, {
            rng: createSeededRandom(1000 + areaIndex * 100 + sampleIndex),
          }),
        ),
      ]),
    )

    expect(
      samples['add-within-9'].every((question) => {
        const left = Number(question.metadata?.left)
        const right = Number(question.metadata?.right)
        return left >= 1 && left <= 8 && right >= 1 && right <= 8 && left + right <= 9
      }),
    ).toBe(true)
    expect(
      samples['add-within-10'].every((question) => {
        const left = Number(question.metadata?.left)
        const right = Number(question.metadata?.right)
        return left >= 1 && left <= 9 && right >= 1 && right <= 9 && left + right <= 10
      }),
    ).toBe(true)
    expect(
      samples['add-carry-basic'].every((question) => {
        const left = Number(question.metadata?.left)
        const right = Number(question.metadata?.right)
        return left >= 1 && left <= 9 && right >= 1 && right <= 9 && left + right >= 11
      }),
    ).toBe(true)
    expect(
      samples['add-two-digit-no-carry'].every((question) => {
        const left = Number(question.metadata?.left)
        const right = Number(question.metadata?.right)
        return (
          left >= 10 &&
          left <= 99 &&
          right >= 10 &&
          right <= 99 &&
          (left % 10) + (right % 10) <= 9 &&
          Math.floor(left / 10) + Math.floor(right / 10) <= 9
        )
      }),
    ).toBe(true)
    expect(
      samples['add-two-digit-carry'].every((question) => {
        const left = Number(question.metadata?.left)
        const right = Number(question.metadata?.right)
        return (
          left >= 10 && left <= 99 && right >= 10 && right <= 99 && (left % 10) + (right % 10) >= 10
        )
      }),
    ).toBe(true)
    expect(
      samples['add-three-digit'].every((question) => {
        const left = Number(question.metadata?.left)
        const right = Number(question.metadata?.right)
        return left >= 100 && left <= 999 && right >= 100 && right <= 999
      }),
    ).toBe(true)
  })

  it('keeps generated choices unique and includes close mistakes', () => {
    const choices = generateChoices(56, 7, 8, () => 0.2)
    expect(new Set(choices).size).toBe(4)
    expect(choices).toContain(56)
    expect(choices.some((choice) => [49, 54, 63, 64].includes(choice))).toBe(true)
  })

  it('generates addition choices with common mistakes and unique answers', () => {
    const choices = generateAdditionChoices(85, 27, 58, createSeededRandom(27))
    expect(new Set(choices).size).toBe(4)
    expect(choices).toContain(85)
    expect(choices).toContain(75)
    expect(choices.some((choice) => [95, 84, 86, 58].includes(choice))).toBe(true)

    const question = generateAdditionFactQuestion(
      'add-two-digit-carry',
      27,
      58,
      createSeededRandom(58),
    )
    expect(question.id).toBe(makeAdditionFactId('add-two-digit-carry', 27, 58))
    expect(question.choices).toContain(85)
  })

  it('generates subtraction questions that match all six area rules and stay positive', () => {
    const samples = Object.fromEntries(
      subtractionAreas.map((area, areaIndex) => [
        area.id,
        Array.from({ length: 45 }, (_, sampleIndex) =>
          generateSubtractionQuestion(area.id, {
            rng: createSeededRandom(7000 + areaIndex * 100 + sampleIndex),
          }),
        ),
      ]),
    )

    const isPositive = (question: ReturnType<typeof generateSubtractionQuestion>) =>
      Number(question.metadata?.left) - Number(question.metadata?.right) >= 1

    expect(Object.values(samples).flat().every(isPositive)).toBe(true)
    expect(
      samples['sub-within-9'].every((question) => {
        const left = Number(question.metadata?.left)
        const right = Number(question.metadata?.right)
        return left >= 2 && left <= 9 && right >= 1 && right < left
      }),
    ).toBe(true)
    expect(
      samples['sub-within-10'].every((question) => {
        const left = Number(question.metadata?.left)
        const right = Number(question.metadata?.right)
        return left >= 2 && left <= 10 && right >= 1 && right < left
      }),
    ).toBe(true)
    expect(
      samples['sub-borrow-basic'].every((question) => {
        const left = Number(question.metadata?.left)
        const right = Number(question.metadata?.right)
        return left >= 11 && left <= 18 && right >= 1 && right <= 9 && left % 10 < right
      }),
    ).toBe(true)
    expect(
      samples['sub-two-digit-no-borrow'].every((question) => {
        const left = Number(question.metadata?.left)
        const right = Number(question.metadata?.right)
        return (
          left >= 10 &&
          left <= 99 &&
          right >= 10 &&
          right <= 99 &&
          left > right &&
          left % 10 >= right % 10 &&
          Math.floor(left / 10) >= Math.floor(right / 10)
        )
      }),
    ).toBe(true)
    expect(
      samples['sub-two-digit-borrow'].every((question) => {
        const left = Number(question.metadata?.left)
        const right = Number(question.metadata?.right)
        return (
          left >= 10 &&
          left <= 99 &&
          right >= 10 &&
          right <= 99 &&
          left > right &&
          left % 10 < right % 10
        )
      }),
    ).toBe(true)
    expect(
      samples['sub-three-digit'].every((question) => {
        const left = Number(question.metadata?.left)
        const right = Number(question.metadata?.right)
        return left >= 100 && left <= 999 && right >= 100 && right <= 999 && left > right
      }),
    ).toBe(true)
    expect(hasCascadingBorrow(304, 176)).toBe(true)
  })

  it('generates subtraction choices with borrow mistakes and unique answers', () => {
    const choices = generateSubtractionChoices(49, 73, 24, createSeededRandom(73))
    expect(new Set(choices).size).toBe(4)
    expect(choices).toContain(49)
    expect(choices.some((choice) => [51, 39, 48, 50].includes(choice))).toBe(true)

    const question = generateSubtractionQuestion('sub-two-digit-borrow', {
      rng: createSeededRandom(130),
    })
    expect(question.id.startsWith('sub:sub-two-digit-borrow:')).toBe(true)
    expect(question.choices).toContain(question.answer)
  })

  it('generates division questions for all three areas and formats remainder answers', () => {
    const samples = Object.fromEntries(
      divisionAreas.map((area, areaIndex) => [
        area.id,
        Array.from({ length: 40 }, (_, sampleIndex) =>
          generateDivisionQuestion(area.id, {
            rng: createSeededRandom(9000 + areaIndex * 100 + sampleIndex),
          }),
        ),
      ]),
    )

    expect(
      samples['divide-no-remainder'].every((question) => {
        const left = Number(question.metadata?.left)
        const right = Number(question.metadata?.right)
        return right >= 1 && right <= 9 && left % right === 0 && Number(question.answer) >= 1
      }),
    ).toBe(true)
    expect(
      samples['divide-with-remainder'].every((question) => {
        const left = Number(question.metadata?.left)
        const right = Number(question.metadata?.right)
        const quotient = Math.floor(left / right)
        const remainder = left % right
        return (
          right >= 2 &&
          right <= 9 &&
          quotient >= 1 &&
          quotient <= 9 &&
          remainder >= 1 &&
          remainder < right &&
          isRemainderAnswerValue(question.answer)
        )
      }),
    ).toBe(true)
    expect(
      samples['divide-large'].every((question) => {
        const left = Number(question.metadata?.left)
        const right = Number(question.metadata?.right)
        const remainder = left % right
        return (
          left >= 10 &&
          left <= 99 &&
          right >= 2 &&
          right <= 9 &&
          remainder >= 0 &&
          remainder < right
        )
      }),
    ).toBe(true)

    const question = generateDivisionFactQuestion(
      'divide-with-remainder',
      13,
      4,
      createSeededRandom(134),
    )
    expect(question.id).toBe(makeDivisionFactId('divide-with-remainder', 13, 4))
    expect(question.answer).toEqual({
      kind: 'remainder',
      quotient: 3,
      remainder: 1,
    })
    expect(formatAnswerValue(question.answer)).toBe('3あまり1')
    expect(
      isCorrectAnswer(question, {
        kind: 'remainder',
        quotient: 3,
        remainder: 1,
      }),
    ).toBe(true)
    expect(
      isCorrectAnswer(question, {
        kind: 'remainder',
        quotient: 2,
        remainder: 5,
      }),
    ).toBe(false)
  })

  it('generates division choices with unique remainder sets and impossible remainders as mistakes', () => {
    const choices = generateDivisionChoices(3, 1, 4, createSeededRandom(131))
    expect(new Set(choices.map(formatAnswerValue)).size).toBe(4)
    expect(choices).toContainEqual({
      kind: 'remainder',
      quotient: 3,
      remainder: 1,
    })
    expect(choices.some((choice) => isRemainderAnswerValue(choice) && choice.remainder >= 4)).toBe(
      true,
    )
  })

  it('generates missing-factor questions with consistent answers', () => {
    const question = generateMissingFactorQuestion(6, 7, { rng: () => 0.2 })
    expect(question.prompt).toContain('□')
    expect(question.prompt).toContain('42')
    expect(question.answer).toBe(6)
    expect(new Set(question.choices).size).toBe(4)
    expect(question.choices).toContain(6)
    expect(question.metadata?.missingFactor).toBe(true)
  })

  it('checks numeric and full-width answers', () => {
    const question = generateMultiplicationQuestion({
      stage: 3,
      rng: () => 0.4,
    })
    expect(isCorrectAnswer(question, String(question.answer))).toBe(true)
    expect(isCorrectAnswer({ ...question, answer: 12 }, '１２')).toBe(true)
  })

  it('prioritizes review facts in adaptive generation', () => {
    const weak = createFactProgress(8, 9)
    const question = generateAdaptiveMultiplicationQuestion(
      {
        [weak.id]: {
          ...weak,
          correctCount: 1,
          incorrectCount: 4,
          averageResponseTimeMs: 6000,
          nextReviewAt: '2025-12-31T00:00:00.000Z',
        },
      },
      { rng: () => 0.1 },
    )
    expect(question.id).toBe('8x9')
  })

  it('generates advanced square and pi questions with choices', () => {
    const square = generateAdvancedQuestion('square', () => 0.2)
    const pi = generateAdvancedQuestion('pi', () => 0.2)
    const development = generateAdvancedQuestion('development', () => 0.2)
    expect(square.category).toBe('multiplication-square')
    expect(pi.category).toBe('pi-multiplication')
    expect(square.choices).toContain(square.answer)
    expect(pi.choices).toContain(pi.answer)
    expect(development.choices).toContain(development.answer)
  })
})

describe('scoring and rewards', () => {
  it('calculates score, combo, and fast-tap guard', () => {
    expect(calculateSpeedBonus(399)).toBe(0)
    const next = applyAnswerToScore({ score: 0, combo: 4, maxCombo: 4 }, true, 1000)
    expect(next.combo).toBe(5)
    expect(next.maxCombo).toBe(5)
    expect(next.score).toBeGreaterThan(100)
    expect(applyAnswerToScore(next, false, 2000).combo).toBe(0)
  })

  it('calculates coins, exp, and titles', () => {
    const results = Array.from({ length: 10 }, (_, index) =>
      result({ questionId: `2x${(index % 9) + 1}` }),
    )
    expect(calculateCoins(results, 10)).toBeGreaterThan(0)
    expect(calculateExp(results)).toBeGreaterThan(80)

    const save = createDefaultSaveData()
    const summary: GameSessionSummary = {
      id: 'test',
      mode: 'speed',
      totalQuestions: 10,
      correctCount: 10,
      accuracy: 100,
      averageResponseTimeMs: 2500,
      maxCombo: 10,
      score: 1500,
      earnedCoins: 36,
      earnedExp: 100,
      newTitles: [],
      bestUpdated: false,
      weakFacts: [],
      masteredFacts: [],
      results,
      finishedAt: '2026-01-01T00:00:00.000Z',
    }
    expect(judgeNewTitles(summary, save)).toContain('くくファイター')
  })

  it('scales earned exp with question difficulty without changing coins', () => {
    const easy = result({ questionId: '2x1', difficulty: 1 })
    const hard = result({ questionId: '7x8', difficulty: 5 })
    expect(calculateExp([hard])).toBeGreaterThan(calculateExp([easy]))
    expect(calculateExp([easy, hard])).toBe(20)
    expect(calculateCoins([easy, hard], 2)).toBe(6)
  })

  it('calculates level progress around level boundaries', () => {
    expect(expProgressToNextLevel(79)).toMatchObject({
      level: 1,
      remainingExp: 1,
      percent: 99,
    })
    expect(expProgressToNextLevel(80)).toMatchObject({
      level: 2,
      remainingExp: 240,
      percent: 0,
    })
  })

  it('builds level-up animation steps across level boundaries', () => {
    expect(buildExpProgressAnimationSteps(40, 6)).toEqual([
      expect.objectContaining({
        level: 1,
        fromPercent: 50,
        toPercent: 57,
        leveledUp: false,
      }),
    ])

    const steps = buildExpProgressAnimationSteps(79, 10)
    expect(steps).toHaveLength(2)
    expect(steps[0]).toMatchObject({
      level: 1,
      fromPercent: 99,
      toPercent: 100,
      leveledUp: true,
    })
    expect(steps[1]).toMatchObject({
      level: 2,
      fromPercent: 0,
      leveledUp: false,
    })

    const multiLevel = buildExpProgressAnimationSteps(79, 1000)
    expect(multiLevel.filter((step) => step.leveledUp).length).toBeGreaterThan(1)
    expect(multiLevel.at(-1)?.toPercent).toBeGreaterThan(0)
  })
})

describe('mastery, review, missions, and storage', () => {
  it('updates mastery without treating one streak as complete mastery', () => {
    let progress = createFactProgress(7, 8)
    progress = updateFactProgress(progress, result())
    progress = updateFactProgress(progress, result({ answeredAt: '2026-01-02T00:00:00.000Z' }))
    expect(progress.correctCount).toBe(2)
    expect(progress.masteryLevel).toBeLessThan(5)
    expect(progress.nextReviewAt).toBeTruthy()
  })

  it('extracts weak facts by accuracy and response time', () => {
    const weak = createFactProgress(6, 7)
    const strong = createFactProgress(2, 3)
    const facts = {
      [weak.id]: {
        ...weak,
        correctCount: 1,
        incorrectCount: 4,
        averageResponseTimeMs: 5000,
      },
      [strong.id]: {
        ...strong,
        correctCount: 5,
        incorrectCount: 0,
        averageResponseTimeMs: 1000,
      },
    }
    expect(getWeakFacts(facts, 1)[0]?.id).toBe('6x7')
  })

  it('registers visible nigate monsters only from wrong answers', () => {
    const slowCorrect = {
      ...createFactProgress(7, 8),
      correctCount: 2,
      incorrectCount: 0,
      averageResponseTimeMs: 7000,
      masteryLevel: 2 as const,
      recentResults: [
        result({ correct: true, responseTimeMs: 7200 }),
        result({ correct: true, responseTimeMs: 6800 }),
      ],
    }
    const wrong = {
      ...createFactProgress(6, 7),
      correctCount: 0,
      incorrectCount: 1,
      averageResponseTimeMs: 1300,
      masteryLevel: 1 as const,
      recentResults: [
        result({
          correct: false,
          questionId: '6x7',
          expectedAnswer: 42,
          givenAnswer: 41,
        }),
      ],
    }
    expect(isMonsterFact(slowCorrect)).toBe(false)
    expect(isMonsterFact(wrong)).toBe(true)
  })

  it('overcomes nigate monsters with three correct answers across another day', () => {
    let progress = createFactProgress(6, 7)
    progress = updateFactProgress(
      progress,
      result({
        questionId: '6x7',
        expectedAnswer: 42,
        givenAnswer: 41,
        correct: false,
        answeredAt: '2026-01-01T09:00:00.000Z',
      }),
    )
    progress = updateFactProgress(
      progress,
      result({
        questionId: '6x7',
        expectedAnswer: 42,
        givenAnswer: 42,
        correct: true,
        responseTimeMs: 9000,
        answeredAt: '2026-01-01T10:00:00.000Z',
      }),
    )
    progress = updateFactProgress(
      progress,
      result({
        questionId: '6x7',
        expectedAnswer: 42,
        givenAnswer: 42,
        correct: true,
        responseTimeMs: 9000,
        answeredAt: '2026-01-01T11:00:00.000Z',
      }),
    )
    expect(isMonsterOvercome(progress)).toBe(false)
    progress = updateFactProgress(
      progress,
      result({
        questionId: '6x7',
        expectedAnswer: 42,
        givenAnswer: 42,
        correct: true,
        responseTimeMs: 9000,
        answeredAt: '2026-01-02T09:00:00.000Z',
      }),
    )
    expect(isMonsterOvercome(progress)).toBe(true)
    expect(isMonsterFact(progress)).toBe(false)
  })

  it('shows nigate overcome progress messages', () => {
    let remainingOnly = createFactProgress(6, 7)
    remainingOnly = updateFactProgress(
      remainingOnly,
      result({
        questionId: '6x7',
        expectedAnswer: 42,
        givenAnswer: 41,
        correct: false,
        answeredAt: '2026-01-01T09:00:00.000Z',
      }),
    )
    remainingOnly = updateFactProgress(
      remainingOnly,
      result({
        questionId: '6x7',
        expectedAnswer: 42,
        givenAnswer: 42,
        correct: true,
        answeredAt: '2026-01-02T09:00:00.000Z',
      }),
    )
    expect(getMonsterOvercomeProgress(remainingOnly).message).toBe('あと 2かいで こくふく！')

    let nextDayOnly = createFactProgress(7, 8)
    nextDayOnly = updateFactProgress(
      nextDayOnly,
      result({
        questionId: '7x8',
        expectedAnswer: 56,
        givenAnswer: 54,
        correct: false,
        answeredAt: '2026-01-01T09:00:00.000Z',
      }),
    )
    for (let index = 0; index < 3; index += 1) {
      nextDayOnly = updateFactProgress(
        nextDayOnly,
        result({
          questionId: '7x8',
          expectedAnswer: 56,
          givenAnswer: 56,
          correct: true,
          answeredAt: `2026-01-01T1${index}:00:00.000Z`,
        }),
      )
    }
    expect(getMonsterOvercomeProgress(nextDayOnly).message).toBe('また あした も といてみよう！')

    let both = createFactProgress(8, 8)
    both = updateFactProgress(
      both,
      result({
        questionId: '8x8',
        expectedAnswer: 64,
        givenAnswer: 63,
        correct: false,
        answeredAt: '2026-01-01T09:00:00.000Z',
      }),
    )
    both = updateFactProgress(
      both,
      result({
        questionId: '8x8',
        expectedAnswer: 64,
        givenAnswer: 64,
        correct: true,
        answeredAt: '2026-01-01T10:00:00.000Z',
      }),
    )
    expect(getMonsterOvercomeProgress(both).message).toBe(
      'あと 2かい、また あしたも といてみよう！',
    )

    let overcome = nextDayOnly
    overcome = updateFactProgress(
      overcome,
      result({
        questionId: '7x8',
        expectedAnswer: 56,
        givenAnswer: 56,
        correct: true,
        answeredAt: '2026-01-02T09:00:00.000Z',
      }),
    )
    expect(getMonsterOvercomeProgress(overcome).message).toBeNull()
  })

  it('re-applies stale time-only monster cleanup from v8 to v12', () => {
    const timeOnly = {
      ...createFactProgress(8, 8),
      correctCount: 2,
      incorrectCount: 0,
      averageResponseTimeMs: 6200,
      masteryLevel: 2 as const,
      recentResults: [
        result({
          questionId: '8x8',
          expectedAnswer: 64,
          givenAnswer: 64,
          correct: true,
          responseTimeMs: 6400,
        }),
        result({
          questionId: '8x8',
          expectedAnswer: 64,
          givenAnswer: 64,
          correct: true,
          responseTimeMs: 6000,
        }),
      ],
    }
    const wrong = {
      ...createFactProgress(7, 8),
      correctCount: 0,
      incorrectCount: 1,
      averageResponseTimeMs: 1200,
      masteryLevel: 1 as const,
      recentResults: [
        result({
          questionId: '7x8',
          expectedAnswer: 56,
          givenAnswer: 54,
          correct: false,
        }),
      ],
    }
    const v8Save = {
      ...createDefaultSaveData(),
      version: 8,
      progress: {
        ...createDefaultSaveData().progress,
        facts: {
          [timeOnly.id]: timeOnly,
          [wrong.id]: wrong,
        },
      },
    }
    const migrated = migrateSaveData(v8Save)
    expect(migrated.version).toBe(15)
    expect(migrated.progress.facts[timeOnly.id]).toBeUndefined()
    expect(migrated.progress.facts[wrong.id]).toBeTruthy()
  })

  it('generates daily missions and migrates save data', () => {
    const save = createDefaultSaveData()
    expect(save.version).toBe(15)
    expect(save.settings.dailyBudgetMinutes).toBe(10)
    expect(save.settings.schoolMode2Enabled).toBe(true)
    expect(generateDailyMissions(save, new Date('2026-01-01')).length).toBe(3)
    const migrated = migrateSaveData({ version: 1 })
    expect(migrated.version).toBe(15)
    expect(migrated.settings.dailyBudgetMinutes).toBe(10)
    expect(migrated.settings.schoolMode2Enabled).toBe(true)
    expect(migrated.player).toBeNull()
    expect(migrated.tutorial.homeSeen).toBe(false)
    expect(migrated.progress.bossProgress).toEqual({})
    expect(migrated.progress.ownedUfos).toEqual([])
    expect(migrated.progress.equippedUfoId).toBeNull()
    expect(migrated.progress.equippedBuddyId).toBeNull()
    expect(migrated.progress.speedSettings.selectedStages).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(migrated.progress.rocketBestDistance).toBe(0)
    expect(migrated.progress.rocketBadges).toEqual([])
    expect(migrated.progress.collectionRecords).toEqual([])
    expect(migrated.progress.ownedTreasureItems).toEqual([])
    expect(Object.keys(migrated.progress.treasureKeys)).toHaveLength(5)
  })

  it('migrates legacy addition rocket titles to dedicated title names', () => {
    const oldTitle = 'ろけっとぱいろっと'
    const newTitle = 'たしざんロケットパイロット'
    const v13Save: SaveData = {
      ...createSaveWithPlayer(),
      version: 13,
      player: {
        ...createSaveWithPlayer().player!,
        titles: ['はじめのいっぽ', oldTitle],
        currentTitle: oldTitle,
      },
      progress: {
        ...createSaveWithPlayer().progress,
        collectionRecords: [
          {
            id: collectionRecordId('title', titleRecordId(oldTitle)),
            acquiredAt: '2026-01-05T00:00:00.000Z',
            method: 'がくしゅうリザルト',
          },
        ],
      },
    }

    const migrated = migrateSaveData(v13Save)
    expect(migrated.version).toBe(15)
    expect(migrated.player?.titles).toContain(titleRecordId(newTitle))
    expect(migrated.player?.titles).not.toContain(oldTitle)
    expect(migrated.player?.currentTitle).toBe(titleRecordId(newTitle))
    expect(migrated.progress.collectionRecords).toContainEqual({
      id: collectionRecordId('title', titleRecordId(newTitle)),
      acquiredAt: '2026-01-05T00:00:00.000Z',
      method: 'がくしゅうリザルト',
    })
    expect(migrated.progress.collectionRecords).not.toContainEqual(
      expect.objectContaining({
        id: collectionRecordId('title', titleRecordId(oldTitle)),
      }),
    )
  })

  it('counts title book progress from existing title definitions', () => {
    const bossTitle = bosses[0].rewards.normal.title
    const save: SaveData = {
      ...createSaveWithPlayer(),
      player: {
        ...createSaveWithPlayer().player!,
        titles: ['はじめのいっぽ', bossTitle],
        currentTitle: bossTitle,
      },
      progress: {
        ...createSaveWithPlayer().progress,
        collectionRecords: [
          {
            id: collectionRecordId('title', titleRecordId(bossTitle)),
            acquiredAt: '2026-01-02T00:00:00.000Z',
            method: 'ボスバトル',
          },
        ],
      },
    }
    const progress = calculateBookProgress(save)
    expect(getTitleDefinitions().map((title) => title.label)).toContain(bossTitle)
    expect(progress.tabs.titles.total).toBe(getTitleDefinitions().length)
    expect(progress.tabs.titles.owned).toBe(2)
  })

  it('tracks daily active usage with idle, background, session accumulation, and midnight reset', () => {
    const morning = new Date('2026-01-01T09:00:00')
    const usage = createDailyUsageState(morning)
    const firstSession = addActiveUsage(usage, 90_000, morning)
    const secondSession = addActiveUsage(firstSession, 30_000, morning)
    expect(secondSession.usedMs).toBe(120_000)
    expect(isRewardBudgetReached(10, secondSession)).toBe(false)
    expect(isRewardBudgetReached(0, { ...secondSession, usedMs: 999_999 })).toBe(false)

    expect(
      shouldCountActiveUsage({
        visible: true,
        focused: true,
        lastActivityAt: 1_000,
        now: 50_000,
      }),
    ).toBe(true)
    expect(
      shouldCountActiveUsage({
        visible: true,
        focused: true,
        lastActivityAt: 1_000,
        now: 70_000,
      }),
    ).toBe(false)
    expect(
      shouldCountActiveUsage({
        visible: false,
        focused: true,
        lastActivityAt: 69_000,
        now: 70_000,
      }),
    ).toBe(false)
    expect(
      shouldCountActiveUsage({
        visible: true,
        focused: false,
        lastActivityAt: 69_000,
        now: 70_000,
      }),
    ).toBe(false)

    const nextDay = normalizeDailyUsageState(secondSession, new Date('2026-01-02T00:01:00'))
    expect(nextDay.usedMs).toBe(0)
    expect(nextDay.date).toBe('2026-01-02')

    const futureDated = normalizeDailyUsageState(
      { date: '2026-01-03', usedMs: 45_000, noticeShownDate: null },
      new Date('2026-01-02T10:00:00'),
    )
    expect(futureDated.usedMs).toBe(45_000)
    expect(futureDated.date).toBe('2026-01-03')
  })

  it('pauses coins and exp after the daily budget while preserving records', () => {
    const save = createSaveWithPlayer()
    const summary: GameSessionSummary = {
      id: 'budget-test',
      mode: 'advanced',
      totalQuestions: 3,
      correctCount: 3,
      accuracy: 100,
      averageResponseTimeMs: 1200,
      maxCombo: 3,
      score: 400,
      earnedCoins: 30,
      earnedExp: 60,
      newTitles: [],
      bestUpdated: false,
      weakFacts: [],
      masteredFacts: [],
      details: {
        advancedCategoryRates: ['平方数 100%'],
      },
      results: [
        result({
          questionId: 'square-11',
          prompt: '11 × 11',
          expectedAnswer: 121,
          givenAnswer: 121,
          difficulty: 4,
        }),
        result({
          questionId: 'square-12',
          prompt: '12 × 12',
          expectedAnswer: 144,
          givenAnswer: 144,
          difficulty: 4,
        }),
        result({
          questionId: 'square-13',
          prompt: '13 × 13',
          expectedAnswer: 169,
          givenAnswer: 169,
          difficulty: 4,
        }),
      ],
      finishedAt: '2026-01-04T00:00:00.000Z',
    }
    const applied = applySessionResult(save, summary, {
      rewardBudgetPaused: true,
    })
    expect(applied.summary.earnedCoins).toBe(0)
    expect(applied.summary.earnedExp).toBe(0)
    expect(applied.summary.details?.rewardBudgetPaused).toBe(true)
    expect(applied.save.player?.coins).toBe(0)
    expect(applied.save.player?.exp).toBe(0)
    expect(applied.save.progress.categoryCorrect['multiplication-square']).toBe(3)
    expect(applied.save.progress.collectionRecords).toContainEqual(
      expect.objectContaining({
        id: collectionRecordId('advanced-monster', 'square-2'),
      }),
    )
  })

  it('keeps daily usage outside save-data backups and shows the budget notice once', () => {
    const reached = {
      date: '2026-01-01',
      usedMs: 600_000,
      noticeShownDate: null,
    }
    expect(shouldShowDailyBudgetNotice(10, reached)).toBe(true)
    expect(
      shouldShowDailyBudgetNotice(10, {
        ...reached,
        noticeShownDate: '2026-01-01',
      }),
    ).toBe(false)
    expect(
      applyRewardBudgetToSummary(
        {
          id: 'budget-summary',
          mode: 'speed',
          totalQuestions: 1,
          correctCount: 1,
          accuracy: 100,
          averageResponseTimeMs: 1000,
          maxCombo: 1,
          score: 100,
          earnedCoins: 4,
          earnedExp: 8,
          newTitles: [],
          bestUpdated: false,
          weakFacts: [],
          masteredFacts: [],
          results: [result({ questionId: '2x2' })],
          finishedAt: '2026-01-01T00:00:00.000Z',
        },
        true,
      ),
    ).toMatchObject({
      earnedCoins: 0,
      earnedExp: 0,
      details: {
        rewardBudgetPaused: true,
      },
    })
    const backup = JSON.stringify(createDefaultSaveData())
    expect(backup).not.toContain(DAILY_USAGE_STORAGE_KEY)
    expect(backup).not.toContain('usedMs')
    expect(backup).not.toContain('noticeShownDate')
  })

  it('tapers practice rewards for mastered facts while keeping beginner facts full', () => {
    const save = createSaveWithPlayer()
    const mastered = {
      ...createFactProgress(2, 2),
      correctCount: 7,
      consecutiveCorrect: 4,
      averageResponseTimeMs: 2200,
      masteryLevel: 5 as const,
    }
    const developing = {
      ...createFactProgress(3, 4),
      correctCount: 3,
      consecutiveCorrect: 2,
      averageResponseTimeMs: 3600,
      masteryLevel: 3 as const,
    }
    const facts = {
      [mastered.id]: mastered,
      [developing.id]: developing,
    }
    expect(classifySchoolMastery(undefined)).toBe('beginner')
    expect(classifySchoolMastery(developing)).toBe('developing')
    expect(rewardScaleForFact(mastered)).toBe(0.2)

    const summary: GameSessionSummary = {
      id: 'school-mode-2',
      mode: 'learn',
      totalQuestions: 1,
      correctCount: 1,
      accuracy: 100,
      averageResponseTimeMs: 1000,
      maxCombo: 1,
      score: 100,
      earnedCoins: 10,
      earnedExp: 30,
      newTitles: [],
      bestUpdated: false,
      weakFacts: [],
      masteredFacts: [],
      results: [result({ questionId: '2x2', difficulty: 2 })],
      finishedAt: '2026-01-01T00:00:00.000Z',
    }

    const tapered = applySessionResult(
      {
        ...save,
        progress: {
          ...save.progress,
          facts,
        },
      },
      summary,
    )
    expect(tapered.summary.earnedCoins).toBe(2)
    expect(tapered.summary.earnedExp).toBe(6)
    expect(tapered.summary.details?.schoolRewardScalePercent).toBe(20)

    const beginner = applySessionResult(save, {
      ...summary,
      id: 'school-mode-2-beginner',
      results: [result({ questionId: '7x8', difficulty: 5 })],
    })
    expect(beginner.summary.earnedCoins).toBe(10)
    expect(beginner.summary.earnedExp).toBe(30)
  })

  it('records addition progress and grants coins and exp through the existing result flow', () => {
    const save = createSaveWithPlayer()
    const question = generateAdditionFactQuestion('add-within-10', 4, 5, createSeededRandom(405))
    const summary: GameSessionSummary = {
      id: 'addition-learn',
      mode: 'learn',
      totalQuestions: 1,
      correctCount: 1,
      accuracy: 100,
      averageResponseTimeMs: 1000,
      maxCombo: 1,
      score: 100,
      earnedCoins: 12,
      earnedExp: 24,
      newTitles: [],
      bestUpdated: false,
      weakFacts: [],
      masteredFacts: [],
      results: [
        result({
          questionId: question.id,
          prompt: question.prompt,
          expectedAnswer: 9,
          givenAnswer: 9,
          difficulty: question.difficulty,
        }),
      ],
      finishedAt: '2026-01-01T00:00:00.000Z',
    }

    const applied = applySessionResult(save, summary)
    const progress = applied.save.progress.facts[question.id]
    expect(applied.save.player?.coins).toBe(12)
    expect(applied.save.player?.exp).toBe(24)
    expect(progress).toMatchObject({
      id: question.id,
      operation: 'addition',
      areaId: 'add-within-10',
      left: 4,
      right: 5,
      correctCount: 1,
    })
    expect(applied.save.progress.facts['4x5']).toBeUndefined()
    expect(applied.save.progress.categoryCorrect['addition:add-within-10']).toBe(1)
    expect(countCorrectForStages(applied.save, [4])).toBe(0)
  })

  it('applies school reward tapering to mastered addition facts', () => {
    const save = createSaveWithPlayer()
    const addFactId = makeAdditionFactId('add-within-10', 4, 5)
    const masteredAddition = {
      ...createFactProgress(4, 5, {
        id: addFactId,
        operation: 'addition',
        areaId: 'add-within-10',
      }),
      correctCount: 7,
      consecutiveCorrect: 4,
      averageResponseTimeMs: 1800,
      masteryLevel: 5 as const,
    }
    const summary: GameSessionSummary = {
      id: 'addition-tapered',
      mode: 'learn',
      totalQuestions: 1,
      correctCount: 1,
      accuracy: 100,
      averageResponseTimeMs: 1000,
      maxCombo: 1,
      score: 100,
      earnedCoins: 10,
      earnedExp: 30,
      newTitles: [],
      bestUpdated: false,
      weakFacts: [],
      masteredFacts: [],
      results: [
        result({
          questionId: addFactId,
          prompt: '4 + 5',
          expectedAnswer: 9,
          givenAnswer: 9,
          difficulty: 1,
        }),
      ],
      finishedAt: '2026-01-01T00:00:00.000Z',
    }

    const tapered = applySessionResult(
      {
        ...save,
        progress: {
          ...save.progress,
          facts: {
            [addFactId]: masteredAddition,
          },
        },
      },
      summary,
    )
    expect(tapered.summary.earnedCoins).toBe(2)
    expect(tapered.summary.earnedExp).toBe(6)
    expect(tapered.summary.details?.schoolRewardScalePercent).toBe(20)
    expect(tapered.save.progress.monsterBook).not.toContain(addFactId)
  })

  it('records subtraction progress and grants coins and exp through the existing result flow', () => {
    const save = createSaveWithPlayer()
    const question = generateSubtractionQuestion('sub-within-10', {
      rng: createSeededRandom(510),
    })
    const expectedAnswer = Number(question.answer)
    const summary: GameSessionSummary = {
      id: 'subtraction-learn',
      mode: 'learn',
      totalQuestions: 1,
      correctCount: 1,
      accuracy: 100,
      averageResponseTimeMs: 1000,
      maxCombo: 1,
      score: 100,
      earnedCoins: 12,
      earnedExp: 24,
      newTitles: [],
      bestUpdated: false,
      weakFacts: [],
      masteredFacts: [],
      results: [
        result({
          questionId: question.id,
          prompt: question.prompt,
          expectedAnswer,
          givenAnswer: expectedAnswer,
          difficulty: question.difficulty,
        }),
      ],
      finishedAt: '2026-01-01T00:00:00.000Z',
    }

    const applied = applySessionResult(save, summary)
    const progress = applied.save.progress.facts[question.id]
    expect(applied.save.player?.coins).toBe(12)
    expect(applied.save.player?.exp).toBe(24)
    expect(progress).toMatchObject({
      id: question.id,
      operation: 'subtraction',
      areaId: 'sub-within-10',
      correctCount: 1,
    })
    expect(applied.save.progress.categoryCorrect['subtraction:sub-within-10']).toBe(1)
    expect(countCorrectForStages(applied.save, [4])).toBe(0)
  })

  it('applies school reward tapering to mastered subtraction facts', () => {
    const save = createSaveWithPlayer()
    const subFactId = makeSubtractionFactId('sub-within-10', 9, 4)
    const masteredSubtraction = {
      ...createFactProgress(9, 4, {
        id: subFactId,
        operation: 'subtraction',
        areaId: 'sub-within-10',
      }),
      correctCount: 7,
      consecutiveCorrect: 4,
      averageResponseTimeMs: 1800,
      masteryLevel: 5 as const,
    }
    const summary: GameSessionSummary = {
      id: 'subtraction-tapered',
      mode: 'learn',
      totalQuestions: 1,
      correctCount: 1,
      accuracy: 100,
      averageResponseTimeMs: 1000,
      maxCombo: 1,
      score: 100,
      earnedCoins: 10,
      earnedExp: 30,
      newTitles: [],
      bestUpdated: false,
      weakFacts: [],
      masteredFacts: [],
      results: [
        result({
          questionId: subFactId,
          prompt: '9 - 4',
          expectedAnswer: 5,
          givenAnswer: 5,
          difficulty: 1,
        }),
      ],
      finishedAt: '2026-01-01T00:00:00.000Z',
    }

    const tapered = applySessionResult(
      {
        ...save,
        progress: {
          ...save.progress,
          facts: {
            [subFactId]: masteredSubtraction,
          },
        },
      },
      summary,
    )
    expect(tapered.summary.earnedCoins).toBe(2)
    expect(tapered.summary.earnedExp).toBe(6)
    expect(tapered.summary.details?.schoolRewardScalePercent).toBe(20)
    expect(tapered.save.progress.monsterBook).not.toContain(subFactId)
  })

  it('keeps full practice rewards when school mode 2 is off', () => {
    const mastered = {
      ...createFactProgress(2, 2),
      correctCount: 7,
      consecutiveCorrect: 4,
      averageResponseTimeMs: 2200,
      masteryLevel: 5 as const,
    }
    const save = {
      ...createSaveWithPlayer(),
      settings: {
        ...createSaveWithPlayer().settings,
        schoolMode2Enabled: false,
      },
      progress: {
        ...createSaveWithPlayer().progress,
        facts: {
          [mastered.id]: mastered,
        },
      },
    }
    const summary: GameSessionSummary = {
      id: 'school-mode-2-off',
      mode: 'learn',
      totalQuestions: 1,
      correctCount: 1,
      accuracy: 100,
      averageResponseTimeMs: 1000,
      maxCombo: 1,
      score: 100,
      earnedCoins: 10,
      earnedExp: 30,
      newTitles: [],
      bestUpdated: false,
      weakFacts: [],
      masteredFacts: [],
      results: [result({ questionId: '2x2', difficulty: 2 })],
      finishedAt: '2026-01-01T00:00:00.000Z',
    }
    const applied = applySessionResult(save, summary)
    expect(applied.summary.earnedCoins).toBe(10)
    expect(applied.summary.earnedExp).toBe(30)
    expect(applied.summary.details?.schoolRewardScalePercent).toBeUndefined()
  })

  it('biases adaptive practice toward unmastered facts and returns easier facts after misses', () => {
    let seed = 12345
    const rng = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296
      return seed / 4294967296
    }
    const facts = Object.fromEntries(
      Array.from({ length: 9 }, (_, index) => {
        const right = index + 1
        const fact = createFactProgress(7, right)
        return [
          fact.id,
          {
            ...fact,
            correctCount: right === 8 ? 0 : 8,
            consecutiveCorrect: right === 8 ? 0 : 5,
            averageResponseTimeMs: right === 8 ? 0 : 2200,
            masteryLevel: right === 8 ? (0 as const) : (5 as const),
          },
        ]
      }),
    )
    const selected = Array.from({ length: 120 }, () =>
      selectAdaptiveMultiplicationFact({
        facts,
        stages: [7],
        rng,
      }),
    )
    const unmasteredCount = selected.filter((fact) => fact.left === 7 && fact.right === 8).length
    expect(unmasteredCount).toBeGreaterThan(40)

    const easier = selectAdaptiveMultiplicationFact({
      facts,
      stages: [7],
      recentIncorrectCount: 2,
      rng: () => 0,
    })
    expect(easier.difficulty).toBeLessThanOrEqual(2)
  })

  it('keeps addition weak facts distinct from multiplication facts and adapts within addition areas', () => {
    const save = createSaveWithPlayer()
    const addFactId = makeAdditionFactId('add-carry-basic', 8, 7)
    const summary: GameSessionSummary = {
      id: 'addition-weak',
      mode: 'learn',
      totalQuestions: 2,
      correctCount: 0,
      accuracy: 0,
      averageResponseTimeMs: 2500,
      maxCombo: 0,
      score: 0,
      earnedCoins: 0,
      earnedExp: 4,
      newTitles: [],
      bestUpdated: false,
      weakFacts: [],
      masteredFacts: [],
      results: [
        result({
          questionId: addFactId,
          prompt: '8 + 7',
          expectedAnswer: 15,
          givenAnswer: 14,
          correct: false,
          difficulty: 3,
        }),
        result({
          questionId: '8x7',
          prompt: '8 × 7',
          expectedAnswer: 56,
          givenAnswer: 54,
          correct: false,
          difficulty: 5,
        }),
      ],
      finishedAt: '2026-01-01T00:00:00.000Z',
    }

    const applied = applySessionResult(save, summary)
    expect(applied.save.progress.facts[addFactId]).toMatchObject({
      operation: 'addition',
      areaId: 'add-carry-basic',
      incorrectCount: 1,
    })
    expect(applied.save.progress.facts['8x7']).toMatchObject({
      operation: 'multiplication',
      incorrectCount: 1,
    })
    expect(getWeakFacts(applied.save.progress.facts, 5).map((fact) => fact.id)).toEqual(
      expect.arrayContaining([addFactId, '8x7']),
    )

    const selected = selectAdaptiveAdditionFact({
      facts: applied.save.progress.facts,
      areaId: 'add-carry-basic',
      recentIncorrectCount: 2,
      rng: () => 0,
    })
    expect(selected.areaId).toBe('add-carry-basic')
    expect(selected.difficulty).toBeLessThanOrEqual(2)
  })

  it('keeps subtraction weak facts distinct and adapts within subtraction areas', () => {
    const save = createSaveWithPlayer()
    const subFactId = makeSubtractionFactId('sub-borrow-basic', 13, 8)
    const summary: GameSessionSummary = {
      id: 'subtraction-weak',
      mode: 'learn',
      totalQuestions: 2,
      correctCount: 0,
      accuracy: 0,
      averageResponseTimeMs: 2500,
      maxCombo: 0,
      score: 0,
      earnedCoins: 0,
      earnedExp: 4,
      newTitles: [],
      bestUpdated: false,
      weakFacts: [],
      masteredFacts: [],
      results: [
        result({
          questionId: subFactId,
          prompt: '13 - 8',
          expectedAnswer: 5,
          givenAnswer: 6,
          correct: false,
          difficulty: 3,
        }),
        result({
          questionId: '8x7',
          prompt: '8 × 7',
          expectedAnswer: 56,
          givenAnswer: 54,
          correct: false,
          difficulty: 5,
        }),
      ],
      finishedAt: '2026-01-01T00:00:00.000Z',
    }

    const applied = applySessionResult(save, summary)
    expect(applied.save.progress.facts[subFactId]).toMatchObject({
      operation: 'subtraction',
      areaId: 'sub-borrow-basic',
      incorrectCount: 1,
    })
    expect(applied.save.progress.facts['8x7']).toMatchObject({
      operation: 'multiplication',
      incorrectCount: 1,
    })
    expect(getWeakFacts(applied.save.progress.facts, 5).map((fact) => fact.id)).toEqual(
      expect.arrayContaining([subFactId, '8x7']),
    )

    const selected = selectAdaptiveSubtractionFact({
      facts: applied.save.progress.facts,
      areaId: 'sub-borrow-basic',
      recentIncorrectCount: 2,
      rng: () => 0,
    })
    expect(selected.areaId).toBe('sub-borrow-basic')
    expect(selected.difficulty).toBeLessThanOrEqual(2)
  })

  it('keeps division weak facts distinct and adapts within division areas', () => {
    const save = createSaveWithPlayer()
    const divideFactId = makeDivisionFactId('divide-with-remainder', 13, 4)
    const summary: GameSessionSummary = {
      id: 'division-weak',
      mode: 'learn',
      totalQuestions: 2,
      correctCount: 0,
      accuracy: 0,
      averageResponseTimeMs: 2500,
      maxCombo: 0,
      score: 0,
      earnedCoins: 0,
      earnedExp: 4,
      newTitles: [],
      bestUpdated: false,
      weakFacts: [],
      masteredFacts: [],
      results: [
        result({
          questionId: divideFactId,
          prompt: '13 ÷ 4',
          expectedAnswer: { kind: 'remainder', quotient: 3, remainder: 1 },
          givenAnswer: { kind: 'remainder', quotient: 2, remainder: 5 },
          correct: false,
          difficulty: 4,
        }),
        result({
          questionId: '8x7',
          prompt: '8 × 7',
          expectedAnswer: 56,
          givenAnswer: 54,
          correct: false,
          difficulty: 5,
        }),
      ],
      finishedAt: '2026-01-01T00:00:00.000Z',
    }

    const applied = applySessionResult(save, summary)
    expect(applied.save.progress.facts[divideFactId]).toMatchObject({
      operation: 'division',
      areaId: 'divide-with-remainder',
      incorrectCount: 1,
    })
    expect(applied.save.progress.facts['8x7']).toMatchObject({
      operation: 'multiplication',
      incorrectCount: 1,
    })
    expect(getWeakFacts(applied.save.progress.facts, 5).map((fact) => fact.id)).toEqual(
      expect.arrayContaining([divideFactId, '8x7']),
    )

    const selected = selectAdaptiveDivisionFact({
      facts: applied.save.progress.facts,
      areaId: 'divide-with-remainder',
      recentIncorrectCount: 2,
      rng: () => 0,
    })
    expect(selected.areaId).toBe('divide-with-remainder')
    expect(selected.difficulty).toBeLessThanOrEqual(3)
  })

  it('validates ship and character names and migrates legacy saves with defaults', () => {
    expect(normalizeShipNameInput('あいうえおか')).toBe('あいうえお')
    expect(normalizeCharacterNameInput('スター号')).toBe('スター号')
    expect(validateShipName('スター')).toBeNull()
    expect(validateShipName('abc')).toBeNull()
    expect(validateShipName('あいうえおか')).toBe('なまえは　5もじまでだよ')
    expect(validateShipName('うんこ')).toBe('そのなまえは　つかえないよ')
    expect(containsBannedWord('だいおうんこ')).toBe(true)
    expect(containsBannedWord('バカごう')).toBe(true)

    const legacyPlayer = { ...createSaveWithPlayer().player! }
    const legacy = {
      ...createSaveWithPlayer(),
      version: 7,
      player: legacyPlayer,
    }
    delete (legacy.player as Record<string, unknown>).shipName
    delete (legacy.player as Record<string, unknown>).characterName
    const migrated = migrateSaveData(legacy)
    expect(migrated.version).toBe(15)
    expect(migrated.player?.shipName).toBe('くくっち')
    expect(migrated.player?.characterName).toBe('くくっち')
  })

  it('limits character and ship name changes to once every seven days', () => {
    const changedAt = Date.parse('2026-06-17T00:00:00.000+09:00')
    const state = recordNameChange({}, 'ship', changedAt)
    expect(canChangeName(state, 'ship', changedAt + NAME_CHANGE_COOLDOWN_MS - 1)).toBe(false)
    expect(canChangeName(state, 'ship', changedAt + NAME_CHANGE_COOLDOWN_MS)).toBe(true)
    expect(canChangeName(state, 'character', changedAt)).toBe(true)
    expect(formatNameCooldownMessage(state, 'ship', changedAt + 1000)).toContain(
      'つぎに かえられるのは',
    )
  })
  it('migrates v4 save data into v12 and removes time-only monsters', () => {
    const timeOnly = {
      ...createFactProgress(8, 8),
      correctCount: 2,
      incorrectCount: 0,
      averageResponseTimeMs: 6200,
      masteryLevel: 2 as const,
      recentResults: [
        result({
          questionId: '8x8',
          expectedAnswer: 64,
          givenAnswer: 64,
          correct: true,
          responseTimeMs: 6400,
        }),
        result({
          questionId: '8x8',
          expectedAnswer: 64,
          givenAnswer: 64,
          correct: true,
          responseTimeMs: 6000,
        }),
      ],
    }
    const wrong = {
      ...createFactProgress(7, 8),
      correctCount: 0,
      incorrectCount: 1,
      averageResponseTimeMs: 1200,
      masteryLevel: 1 as const,
      recentResults: [
        result({
          questionId: '7x8',
          expectedAnswer: 56,
          givenAnswer: 54,
          correct: false,
        }),
      ],
    }
    const v4Save = {
      ...createDefaultSaveData(),
      version: 4,
      progress: {
        ...createDefaultSaveData().progress,
        facts: {
          [timeOnly.id]: timeOnly,
          [wrong.id]: wrong,
        },
      },
    }
    const migrated = migrateSaveData(v4Save)
    expect(migrated.version).toBe(15)
    expect(migrated.progress.speedSettings.durationSeconds).toBe(30)
    expect(migrated.progress.speedSettings.selectedStages).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(migrated.progress.rocketBestDistance).toBe(0)
    expect(migrated.progress.rocketBadges).toEqual([])
    expect(migrated.progress.collectionRecords).toEqual([])
    expect(migrated.progress.ownedTreasureItems).toEqual([])
    expect(migrated.progress.treasureKeys.bronze.count).toBe(0)
    expect(migrated.progress.facts[timeOnly.id]).toBeUndefined()
    expect(migrated.progress.facts[wrong.id]).toBeTruthy()
  })

  it('unlocks high-grade companions from existing category progress and records new ones', () => {
    const firstSquare = advancedMonsterDefinitions.find((monster) => monster.id === 'square-2')
    expect(firstSquare).toBeTruthy()
    if (!firstSquare) {
      return
    }
    expect(isAdvancedMonsterOwned({}, firstSquare)).toBe(false)
    expect(isAdvancedMonsterOwned({ 'multiplication-square': 3 }, firstSquare)).toBe(true)
    expect(newlyOwnedAdvancedMonsters({}, { 'multiplication-square': 3 })).toContain(firstSquare)

    const save = createSaveWithPlayer()
    const results = Array.from({ length: 3 }, (_, index) =>
      result({
        questionId: `square-${11 + index}`,
        prompt: `${11 + index} × ${11 + index}`,
        expectedAnswer: (11 + index) ** 2,
        givenAnswer: (11 + index) ** 2,
        difficulty: 6,
      }),
    )
    const summary: GameSessionSummary = {
      id: 'advanced-square-test',
      mode: 'advanced',
      totalQuestions: results.length,
      correctCount: results.length,
      accuracy: 100,
      averageResponseTimeMs: 1200,
      maxCombo: 3,
      score: 300,
      earnedCoins: 9,
      earnedExp: 54,
      newTitles: [],
      bestUpdated: false,
      weakFacts: [],
      masteredFacts: [],
      results,
      finishedAt: '2026-01-03T00:00:00.000Z',
    }
    const applied = applySessionResult(save, summary)
    expect(applied.save.version).toBe(15)
    expect(applied.save.progress.categoryCorrect['multiplication-square']).toBe(3)
    expect(applied.save.progress.collectionRecords).toContainEqual(
      expect.objectContaining({
        id: collectionRecordId('advanced-monster', firstSquare.id),
        acquiredAt: summary.finishedAt,
      }),
    )
  })

  it('opens treasure chests deterministically with rarity bands and no duplicate while pool remains', () => {
    const first = openTreasureChest({
      chestId: 'rainbow-chest',
      ownedItemIds: [],
      rng: createSeededRandom(123),
      openedAt: '2026-01-03T00:00:00.000Z',
    })
    const repeat = openTreasureChest({
      chestId: 'rainbow-chest',
      ownedItemIds: [],
      rng: createSeededRandom(123),
      openedAt: '2026-01-03T00:00:00.000Z',
    })
    expect(first.item?.id).toBe(repeat.item?.id)
    expect(first.item?.rarity).toBeGreaterThanOrEqual(3)
    expect(first.item?.rarity).toBeLessThanOrEqual(4)
    expect(first.item).toBeTruthy()

    const next = openTreasureChest({
      chestId: 'rainbow-chest',
      ownedItemIds: first.item ? [first.item.id] : [],
      rng: createSeededRandom(123),
    })
    expect(next.duplicate).toBe(false)
    expect(next.poolExhausted).toBe(false)
    expect(next.item?.id).not.toBe(first.item?.id)
    expect(next.convertedCoins).toBe(0)
  })

  it('converts to fixed coins when a chest rarity pool is exhausted', () => {
    const rainbowPoolIds = getTreasurePoolForChest('rainbow-chest').map((item) => item.id)
    const exhausted = openTreasureChest({
      chestId: 'rainbow-chest',
      ownedItemIds: rainbowPoolIds,
      rng: createSeededRandom(999),
    })
    expect(exhausted.item).toBeNull()
    expect(exhausted.poolExhausted).toBe(true)
    expect(exhausted.convertedCoins).toBe(110)
  })

  it('can award the treasure-only buddy from rainbow-or-higher chests', () => {
    const rainbowPoolIds = getTreasurePoolForChest('rainbow-chest').map((item) => item.id)
    const reward = openTreasureChest({
      chestId: 'rainbow-chest',
      ownedItemIds: rainbowPoolIds,
      ownedBuddyIds: [],
      includeBuddyRewards: true,
      rng: createSeededRandom(1),
      openedAt: '2026-01-03T00:00:00.000Z',
    })
    expect(reward.item).toBeNull()
    expect(reward.buddyId).toBe('rainbow-star')
    expect(reward.buddyName).toBe('にじほし')
    expect(reward.poolExhausted).toBe(false)

    const effectReward = openTreasureChest({
      chestId: 'rainbow-chest',
      ownedItemIds: rainbowPoolIds,
      ownedBuddyIds: ['rainbow-star'],
      ownedEffectIds: [],
      includeBuddyRewards: true,
      includeEffectRewards: true,
      rng: createSeededRandom(1),
    })
    expect(effectReward.item).toBeNull()
    expect(effectReward.buddyId).toBeNull()
    expect(effectReward.effectId).toBe(rainbowAuraEffectId)
    expect(effectReward.effectName).toBe('にじオーラ')
    expect(effectReward.poolExhausted).toBe(false)

    const exhausted = openTreasureChest({
      chestId: 'rainbow-chest',
      ownedItemIds: rainbowPoolIds,
      ownedBuddyIds: ['rainbow-star'],
      ownedEffectIds: [rainbowAuraEffectId],
      includeBuddyRewards: true,
      includeEffectRewards: true,
      rng: createSeededRandom(1),
    })
    expect(exhausted.poolExhausted).toBe(true)
    expect(exhausted.convertedCoins).toBe(110)
  })

  it('defines key and chest mapping without misses', () => {
    expect(keyTypes).toHaveLength(5)
    expect(treasureChestTypes).toHaveLength(5)
    for (const key of keyTypes) {
      expect(canKeyOpenChest(key.id, key.chestId)).toBe(true)
    }
    expect(canKeyOpenChest('bronze', 'star-chest')).toBe(false)
    expect(treasureItems).toHaveLength(20)
    expect(treasureChestTypes.map((chest) => chest.rarityRange)).toEqual([
      [1, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 4],
    ])
    expect(treasureChestTypes.map((chest) => chest.exhaustedCoins)).toEqual([20, 40, 70, 110, 160])
  })

  it('keeps treasure rarity balanced as five themes by four rarities', () => {
    const themes = ['star', 'space', 'sparkle', 'creature', 'sweets'] as const
    const rarities = [1, 2, 3, 4] as const
    for (const rarity of rarities) {
      expect(treasureItems.filter((item) => item.rarity === rarity)).toHaveLength(5)
    }
    for (const theme of themes) {
      for (const rarity of rarities) {
        expect(
          treasureItems.filter((item) => item.theme === theme && item.rarity === rarity),
        ).toHaveLength(1)
      }
    }
    expect(new Set(getTreasurePoolForChest('star-chest').map((item) => item.theme))).toEqual(
      new Set(themes),
    )
  })

  it('sets the final rocket badge milestone to 920m', () => {
    expect(rocketBadges.at(-1)).toMatchObject({
      id: 'rocket-cosmos',
      distance: 920,
    })
  })

  it('calculates book collection progress by tab and overall', () => {
    const save = createSaveWithPlayer()
    const withCollection: SaveData = {
      ...save,
      progress: {
        ...save.progress,
        monsterBook: ['2x2'],
        ownedTreasureItems: [
          {
            id: treasureItems[0].id,
            acquiredAt: '2026-01-03T00:00:00.000Z',
            method: 'どうのたからばこから入手',
          },
        ],
        treasureKeys: {
          ...save.progress.treasureKeys,
          bronze: { count: 1, firstAcquiredAt: '2026-01-03T00:00:00.000Z' },
        },
      },
    }
    const progress = calculateBookProgress(withCollection)
    expect(progress.tabs.monsters.owned).toBe(1)
    expect(progress.tabs.buddies.owned).toBe(1)
    expect(progress.tabs.buddies.total).toBe(93)
    expect(progress.tabs.collection.owned).toBe(2)
    expect(progress.tabs.collection.total).toBe(25)
    expect(progress.overall.owned).toBeGreaterThanOrEqual(3)
  })

  it('lists overcome monsters and owned buddy records as selectable buddies', () => {
    const save = createSaveWithPlayer()
    const withBuddies: SaveData = {
      ...save,
      progress: {
        ...save.progress,
        monsterBook: ['2x3'],
        collectionRecords: [
          {
            id: collectionRecordId('monster', '2x3'),
            acquiredAt: '2026-01-03T00:00:00.000Z',
            method: 'にがてをこくふく',
          },
          {
            id: collectionRecordId('buddy', 'star-jelly'),
            acquiredAt: '2026-01-04T00:00:00.000Z',
            method: 'ショップ',
          },
        ],
      },
    }
    expect(getOwnedBuddySelections(withBuddies).map((buddy) => buddy.id)).toEqual([
      monsterBuddySelectionId(2, 3),
      dedicatedBuddySelectionId('star-jelly'),
    ])
  })

  it('validates shop prices and tier unlock rules', () => {
    const coreShopItems = shopItems.filter((item) => item.no <= 20)
    expect(coreShopItems).toHaveLength(20)
    expect(suitShopItems).toHaveLength(5)
    expect(shopBuddyDefinitions).toHaveLength(11)
    expect(shopItems).toHaveLength(45)
    const prices = coreShopItems.map((item) => item.price)
    expect(prices.at(0)).toBe(50)
    expect(prices.at(-1)).toBe(10000)
    expect(prices.filter((price) => price > 0)).toHaveLength(20)
    expect(Math.max(...prices)).toBe(10000)
    expect(isShopTier2Unlocked(coreShopItems.slice(0, 9).map((item) => item.id))).toBe(false)
    expect(isShopTier2Unlocked(coreShopItems.slice(0, 10).map((item) => item.id))).toBe(true)
    expect(suitShopItems.map((item) => item.price)).toEqual([200, 250, 300, 350, 400])
    expect(suitShopItems.every((item) => item.kind === 'suit' && getShopItemTier(item) === 1)).toBe(
      true,
    )
    expect(shopBuddyDefinitions.every((buddy) => buddy.source === 'shop')).toBe(true)
    expect(phase15EffectItemIds).toHaveLength(12)
    expect(shopEffectItemIds).toHaveLength(7)
    expect(treasureEffectItemIds).toEqual([rainbowAuraEffectId])
    expect(shopItems.filter((item) => item.kind === 'effect')).toHaveLength(12)
    expect(
      shopEffectItemIds.map((itemId) => shopItems.find((item) => item.id === itemId)?.price),
    ).toEqual([300, 350, 400, 350, 500, 500, 500])
    expect(shopItems.find((item) => item.id === rainbowAuraEffectId)?.availableInShop).toBe(false)
    expect(shopItems.find((item) => item.id === galaxySwirlEffectId)?.availableInShop).toBe(false)
    expect(shopItems.find((item) => item.id === addPlusBurstEffectId)?.availableInShop).toBe(false)
    expect(
      shopItems.find((item) => item.id === subScatterLightEffectId)?.rewardOrigin,
    ).toBeUndefined()
    expect(shopItems.find((item) => item.id === subMinusFlashEffectId)?.rewardOrigin).toBe('sub')
    expect(shopItems.find((item) => item.id === subMinusFlashEffectId)?.availableInShop).toBe(false)
    expect(
      shopItems.find((item) => item.id === divideSplitLightEffectId)?.rewardOrigin,
    ).toBeUndefined()
    expect(shopItems.find((item) => item.id === divideFlashEffectId)?.rewardOrigin).toBe('divide')
    expect(shopItems.find((item) => item.id === divideFlashEffectId)?.availableInShop).toBe(false)
  })

  it('maps equipped shop items to home ship visual layers', () => {
    expect(shopItems.every((item) => item.visual.layer && item.visual.variant)).toBe(true)
    const visuals = getHomeShipVisuals([
      'green-cape',
      'rainbow-suit',
      'rocket-helmet',
      'planet-view',
      'crystal-desk',
      'luna-pet',
      'comet-burst',
    ])
    expect(visuals).toEqual({
      wear: 'rainbow-suit',
      hat: 'rocket-helmet',
      window: 'planet-view',
      furniture: 'crystal-desk',
      buddy: 'luna-pet',
      effect: 'aura-ring',
    })
  })

  it('builds the Phase 15-3 home preview from six ordered layers', () => {
    expect(homeShipPreviewLayers).toEqual(['window', 'ufo', 'body', 'hat', 'buddy', 'effect'])
    const preview = getHomeShipPreviewVisuals(
      ['rainbow-suit', 'rocket-helmet', 'planet-view', 'crystal-desk', 'luna-pet', 'comet-burst'],
      'special',
    )

    expect(preview).toEqual({
      window: 'planet-view',
      wear: 'rainbow-suit',
      ufo: 'special',
      hat: 'rocket-helmet',
      buddy: 'luna-pet',
      effect: 'aura-ring',
    })
    expect('furniture' in preview).toBe(false)
  })

  it('selects effect performance fallback from measured frame rate', () => {
    expect(chooseEffectPerformanceMode({ frameIntervalsMs: [16, 17, 16] })).toBe('rich')
    expect(chooseEffectPerformanceMode({ frameIntervalsMs: [40, 42, 45] })).toBe('low')
    expect(
      chooseEffectPerformanceMode({
        frameIntervalsMs: [16, 17, 16],
        prefersReducedMotion: true,
      }),
    ).toBe('static')
  })

  it('reflects equipped preview item switches without changing save structure', () => {
    const withBackground = equipShopItem(['blue-neon-room', 'star-cap'], 'planet-view')
    expect(getHomeShipPreviewVisuals(withBackground).window).toBe('planet-view')

    const withHat = equipShopItem(withBackground, 'rocket-helmet')
    expect(getHomeShipPreviewVisuals(withHat).hat).toBe('rocket-helmet')
    expect(withHat).toContain('planet-view')
    expect(withHat).toContain('rocket-helmet')
    expect(withHat).not.toContain('star-cap')
  })

  it('keeps one equipped shop item per home equipment slot', () => {
    const equipped = equipShopItem(
      equipShopItem(['green-cape', 'star-cap', 'starry-seat'], 'rainbow-suit'),
      'pico-pet',
    )
    expect(equipped).toContain('rainbow-suit')
    expect(equipped).toContain('star-cap')
    expect(equipped).toContain('starry-seat')
    expect(equipped).toContain('pico-pet')
    expect(equipped).not.toContain('green-cape')
    expect(getEquippedItemForSlot(equipped, 'wear')?.id).toBe('rainbow-suit')
    expect(getEquippedItemForSlot(equipped, 'hat')?.id).toBe('star-cap')
    expect(getEquippedItemForSlot(equipped, 'room')?.id).toBe('starry-seat')
    expect(getEquippedItemForSlot(equipped, 'buddy')?.id).toBe('pico-pet')
  })

  it('aggregates custom inventory across shop, bosses, buddies, and titles', () => {
    const save = createSaveWithPlayer()
    save.player = {
      ...save.player!,
      level: 12,
      titles: ['はじめのいっぽ', 'れんぞくせいかい'],
      currentTitle: 'れんぞくせいかい',
    }
    const ufo = getUfoForBoss('boss-stage-2')
    expect(ufo).toBeDefined()
    save.progress.ownedItems = [
      'basic-room',
      'planet-view',
      'rocket-helmet',
      'rainbow-suit',
      'pico-pet',
    ]
    save.progress.equippedItems = ['planet-view', 'rocket-helmet', 'rainbow-suit', 'pico-pet']
    save.progress.ownedUfos = [ufo!.id]
    save.progress.equippedUfoId = ufo!.id
    save.progress.monsterBook = ['2x3']
    save.progress.equippedBuddyId = monsterBuddySelectionId(2, 3)
    save.progress.collectionRecords = [
      {
        id: collectionRecordId('monster', '2x3'),
        acquiredAt: '2026-01-02T00:00:00.000Z',
        method: 'にがてをこくふく',
      },
      {
        id: collectionRecordId('buddy', 'star-jelly'),
        acquiredAt: '2026-01-03T00:00:00.000Z',
        method: 'ショップ',
      },
      {
        id: collectionRecordId('title', titleRecordId('れんぞくせいかい')),
        acquiredAt: '2026-01-04T00:00:00.000Z',
        method: 'がくしゅうリザルト',
      },
    ]

    const tabs = buildCustomInventory(save)
    expect(tabs.map((tab) => tab.id)).toEqual([
      'window',
      'ufo',
      'hat',
      'suit',
      'buddy',
      'effect',
      'title',
    ])
    expect(
      tabs.find((tab) => tab.id === 'window')?.entries.find((entry) => entry.id === 'planet-view')
        ?.selected,
    ).toBe(true)
    expect(
      tabs.find((tab) => tab.id === 'ufo')?.entries.find((entry) => entry.id === ufo!.id)?.selected,
    ).toBe(true)
    expect(
      tabs.find((tab) => tab.id === 'suit')?.entries.find((entry) => entry.id === 'rainbow-suit')
        ?.selected,
    ).toBe(true)
    const buddyTab = tabs.find((tab) => tab.id === 'buddy')
    expect(
      buddyTab?.entries.find((entry) => entry.id === monsterBuddySelectionId(2, 3))?.selected,
    ).toBe(true)
    expect(
      buddyTab?.entries.find((entry) => entry.id === dedicatedBuddySelectionId('star-jelly'))
        ?.owned,
    ).toBe(true)
    expect(buddyTab?.entries.some((entry) => entry.label === '？？？')).toBe(true)
    expect(
      tabs.find((tab) => tab.id === 'title')?.entries.find((entry) => entry.selected)?.label,
    ).toBe('れんぞくせいかい')

    const multiplyTabs = buildCustomInventory(save, 'multiply')
    const addTabs = buildCustomInventory(save, 'add')
    const multiplyUfoTab = multiplyTabs.find((tab) => tab.id === 'ufo')
    const multiplyBuddyTab = multiplyTabs.find((tab) => tab.id === 'buddy')
    const multiplyEffectTab = multiplyTabs.find((tab) => tab.id === 'effect')
    const multiplyTitleTab = multiplyTabs.find((tab) => tab.id === 'title')
    expect(
      tabs.find((tab) => tab.id === 'window')?.entries.find((entry) => entry.id === 'planet-view')
        ?.origin,
    ).toBe('all')
    expect(
      tabs.find((tab) => tab.id === 'ufo')?.entries.find((entry) => entry.id === ufo!.id)?.origin,
    ).toBe('multiply')
    expect(
      tabs
        .find((tab) => tab.id === 'buddy')
        ?.entries.find((entry) => entry.id === dedicatedBuddySelectionId('star-jelly'))?.origin,
    ).toBe('all')
    expect(
      tabs.find((tab) => tab.id === 'effect')?.entries.find((entry) => entry.id === 'comet-ship')
        ?.origin,
    ).toBe('all')
    expect(
      tabs
        .find((tab) => tab.id === 'effect')
        ?.entries.find((entry) => entry.id === addGatherLightEffectId)?.origin,
    ).toBe('all')
    expect(
      tabs
        .find((tab) => tab.id === 'effect')
        ?.entries.find((entry) => entry.id === galaxySwirlEffectId)?.origin,
    ).toBe('multiply')
    expect(
      multiplyTabs
        .find((tab) => tab.id === 'window')
        ?.entries.some((entry) => entry.id === 'planet-view'),
    ).toBe(false)
    expect(multiplyUfoTab?.entries).toHaveLength(
      ufoDefinitions.filter((entry) => (entry.origin ?? 'multiply') === 'multiply').length,
    )
    expect(multiplyUfoTab?.entries.find((entry) => entry.id === ufo!.id)?.origin).toBe('multiply')
    expect(
      multiplyBuddyTab?.entries.find((entry) => entry.id === monsterBuddySelectionId(2, 3))?.origin,
    ).toBe('multiply')
    expect(
      multiplyBuddyTab?.entries.some(
        (entry) => entry.id === dedicatedBuddySelectionId('star-jelly'),
      ),
    ).toBe(false)
    expect(
      multiplyEffectTab?.entries.find((entry) => entry.id === galaxySwirlEffectId)?.origin,
    ).toBe('multiply')
    expect(multiplyEffectTab?.entries.some((entry) => entry.id === 'comet-ship')).toBe(false)
    expect(multiplyTitleTab?.entries.length).toBeGreaterThan(0)
    expect(multiplyTitleTab?.entries.every((entry) => entry.origin === 'multiply')).toBe(true)
    expect(addTabs.find((tab) => tab.id === 'ufo')?.entries.map((entry) => entry.id)).toEqual([
      additionPlusRingUfoId,
      additionDoubleDomeUfoId,
      additionSunriseUfoId,
    ])
    expect(addTabs.find((tab) => tab.id === 'buddy')?.entries).toHaveLength(18)
    expect(
      addTabs
        .find((tab) => tab.id === 'effect')
        ?.entries.find((entry) => entry.id === addPlusBurstEffectId)?.origin,
    ).toBe('add')
    expect(
      addTabs.find((tab) => tab.id === 'title')?.entries.some((entry) => entry.origin === 'add'),
    ).toBe(true)
    const subTabs = buildCustomInventory(save, 'subtract')
    expect(subTabs.find((tab) => tab.id === 'ufo')?.entries.map((entry) => entry.id)).toEqual([
      subtractionMinusRingUfoId,
      subtractionSplitUfoId,
      subtractionSunsetUfoId,
    ])
    expect(subTabs.find((tab) => tab.id === 'buddy')?.entries).toHaveLength(18)
    expect(
      subTabs
        .find((tab) => tab.id === 'effect')
        ?.entries.find((entry) => entry.id === subMinusFlashEffectId)?.origin,
    ).toBe('sub')
    expect(
      subTabs
        .find((tab) => tab.id === 'effect')
        ?.entries.some((entry) => entry.id === subScatterLightEffectId),
    ).toBe(false)
    expect(
      subTabs.find((tab) => tab.id === 'title')?.entries.some((entry) => entry.origin === 'sub'),
    ).toBe(true)
    const divideTabs = buildCustomInventory(save, 'divide')
    expect(divideTabs.find((tab) => tab.id === 'ufo')?.entries.map((entry) => entry.id)).toEqual([
      divisionRingUfoId,
      divisionQuarterUfoId,
      divisionNebulaUfoId,
    ])
    expect(divideTabs.find((tab) => tab.id === 'buddy')?.entries).toHaveLength(12)
    expect(
      divideTabs
        .find((tab) => tab.id === 'effect')
        ?.entries.find((entry) => entry.id === divideFlashEffectId)?.origin,
    ).toBe('divide')
    expect(
      divideTabs
        .find((tab) => tab.id === 'effect')
        ?.entries.some((entry) => entry.id === divideSplitLightEffectId),
    ).toBe(false)
    expect(
      divideTabs
        .find((tab) => tab.id === 'title')
        ?.entries.some((entry) => entry.origin === 'divide'),
    ).toBe(true)
    expect(getHomeShipPreviewVisuals(save.progress.equippedItems).window).toBe('planet-view')
  })

  it('keeps custom reward origins extensible beyond the visible star filters', () => {
    expect(customStarFilterOrder).toEqual(['all', 'add', 'subtract', 'multiply', 'divide'])
    expect(customRewardOrigins).toEqual([
      'all',
      'add',
      'sub',
      'subtract',
      'multiply',
      'divide',
      'decimal',
      'fraction',
    ])
    expect(matchesCustomStarFilter('divide', 'all')).toBe(true)
    expect(matchesCustomStarFilter('divide', 'multiply')).toBe(false)
    expect(matchesCustomStarFilter('multiply', 'multiply')).toBe(true)
    expect(matchesCustomStarFilter('sub', 'subtract')).toBe(true)
  })

  it('unlocks level icons every five levels without changing save data', () => {
    expect(levelIconDefinitions.map((icon) => icon.unlockLevel)).toEqual([
      5, 10, 15, 20, 25, 30, 35, 40,
    ])
    expect(getUnlockedLevelIcons(4)).toHaveLength(0)
    expect(getUnlockedLevelIcons(5).map((icon) => icon.id)).toEqual(['level-star'])
    expect(getUnlockedLevelIcons(12).map((icon) => icon.id)).toEqual(['level-star', 'level-moon'])
    expect(getLevelIconUnlocksBetween(4, 10).map((icon) => icon.id)).toEqual([
      'level-star',
      'level-moon',
    ])
  })

  it('defines the starter name icons as SVG motifs instead of emoji', () => {
    expect(playerIcons.map((icon) => icon.id)).toEqual(['たまご', 'ほし', 'はな', 'そら'])
    expect(playerIcons.every((icon) => !Object.prototype.hasOwnProperty.call(icon, 'emoji'))).toBe(
      true,
    )
    expect(playerIcons.every((icon) => icon.motif && icon.colors.base && icon.colors.accent)).toBe(
      true,
    )
    expect(globalCss).toContain('.player-icon-badge-svg')
  })

  it('uses the actual overcome condition in the weak fact hint text', () => {
    expect(weakFactHintText).toBe('べつの日に また せいかいすると きえるよ')
    expect(weakFactHintText).not.toContain('れんぞく')
  })

  it('keeps debug menu hidden until the fifth version tap and full-opens collections', () => {
    let tapCount = 0
    for (let index = 0; index < 4; index += 1) {
      const next = nextDebugTapState(tapCount)
      tapCount = next.count
      expect(next.opened).toBe(false)
    }
    const opened = nextDebugTapState(tapCount)
    expect(opened.opened).toBe(true)
    expect(opened.count).toBe(0)
    expect(isDebugPasswordValid('wrong-password')).toBe(false)
    expect(isDebugPasswordValid(debugMenuPassword)).toBe(true)

    const save = createSaveWithPlayer()
    const fullOpen = fullOpenDebugSaveData(save, '2026-01-05T00:00:00.000Z')
    expect(shopItems.every((item) => fullOpen.progress.ownedItems.includes(item.id))).toBe(true)
    expect(
      buddyDefinitions.every((buddy) =>
        fullOpen.progress.collectionRecords.some(
          (record) => record.id === collectionRecordId('buddy', buddy.id),
        ),
      ),
    ).toBe(true)
    expect(
      treasureItems.every((item) =>
        fullOpen.progress.ownedTreasureItems.some((record) => record.id === item.id),
      ),
    ).toBe(true)
    expect(bossLimitedItems.every((item) => fullOpen.progress.bossItems.includes(item.id))).toBe(
      true,
    )
    expect(
      advancedMonsterDefinitions.every(
        (monster) =>
          fullOpen.progress.collectionRecords.some(
            (record) => record.id === collectionRecordId('advanced-monster', monster.id),
          ) && isAdvancedMonsterOwned(fullOpen.progress.categoryCorrect, monster),
      ),
    ).toBe(true)
    expect(
      additionMonsterDefinitions.every((monster) =>
        isAdditionMonsterOwned(fullOpen.progress.categoryCorrect, monster),
      ),
    ).toBe(true)
    expect(
      subtractionMonsterDefinitions.every((monster) =>
        isSubtractionMonsterOwned(fullOpen.progress.categoryCorrect, monster),
      ),
    ).toBe(true)
    expect(
      divisionMonsterDefinitions.every((monster) =>
        isDivisionMonsterOwned(fullOpen.progress.categoryCorrect, monster),
      ),
    ).toBe(true)
    expect(
      [additionPlusRingUfoId, additionDoubleDomeUfoId, additionSunriseUfoId].every((ufoId) =>
        fullOpen.progress.ownedUfos.includes(ufoId),
      ),
    ).toBe(true)
    expect(
      [subtractionMinusRingUfoId, subtractionSplitUfoId, subtractionSunsetUfoId].every((ufoId) =>
        fullOpen.progress.ownedUfos.includes(ufoId),
      ),
    ).toBe(true)
    expect(
      [divisionRingUfoId, divisionQuarterUfoId, divisionNebulaUfoId].every((ufoId) =>
        fullOpen.progress.ownedUfos.includes(ufoId),
      ),
    ).toBe(true)
    expect(fullOpen.progress.ownedItems).toContain(addPlusBurstEffectId)
    expect(fullOpen.progress.ownedItems).toContain(subMinusFlashEffectId)
    expect(fullOpen.progress.ownedItems).toContain(divideFlashEffectId)
    expect(
      additionRocketDifficulties.every((difficulty) =>
        fullOpen.player?.titles.includes(titleRecordId(difficulty.title)),
      ),
    ).toBe(true)
    expect(
      subtractionRocketDifficulties.every((difficulty) =>
        fullOpen.player?.titles.includes(titleRecordId(difficulty.title)),
      ),
    ).toBe(true)
    expect(
      divisionRocketDifficulties.every((difficulty) =>
        fullOpen.player?.titles.includes(titleRecordId(difficulty.title)),
      ),
    ).toBe(true)
    expect(keyTypes.every((key) => (fullOpen.progress.treasureKeys[key.id]?.count ?? 0) >= 5)).toBe(
      true,
    )
    expect(fullOpen.progress.monsterBook).toHaveLength(81)

    const leveled = setDebugLevel(save, 12)
    expect(leveled.player?.level).toBe(12)
    expect(leveled.player?.exp).toBe(expRequiredForLevel(12))

    const withKeys = addAllDebugKeys(save, 5, '2026-01-05T00:00:00.000Z')
    expect(keyTypes.every((key) => withKeys.progress.treasureKeys[key.id]?.count === 5)).toBe(true)
  })

  it('builds distinct title emblems by rarity', () => {
    const common = getTitleEmblemDefinition('はじめのいっぽ')
    const bossNormal = getTitleEmblemDefinition(bosses[0].rewards.normal.title)
    const bossFast = getTitleEmblemDefinition(bosses[0].rewards.fast.title)
    const final = getTitleEmblemDefinition(allGekimuzuTitle)

    expect(common.rarity).toBe('common')
    expect(bossNormal.rarity).toBe('common')
    expect(bossFast.rarity).toBe('epic')
    expect(final.rarity).toBe('legendary')
    expect(
      new Set([common.family, bossNormal.family, bossFast.family, final.family]).size,
    ).toBeGreaterThan(1)
  })

  it('defines all kuku readings as split hiragana parts and hides answers', () => {
    const values = Object.values(kukuReadings)
    expect(values).toHaveLength(81)
    expect(Object.keys(kukuReadings)).toContain('1x1')
    expect(Object.keys(kukuReadings)).toContain('9x9')
    for (const reading of values) {
      expect(reading.question).toMatch(/^[ぁ-んー\s]+$/)
      expect(reading.answer).toMatch(/^[ぁ-んー\s]+$/)
    }
    expect(formatKukuReading(2, 3, false)).toBe('にさんが ？')
    expect(formatKukuReading(2, 3, true)).toBe('にさんが ろく')
  })

  it('unlocks bosses and higher difficulties in order', () => {
    expect(bossDifficulties.gekimuzu.timeLimitSeconds).toBe(1.8)
    const boss = bosses.find((candidate) => candidate.id === 'boss-stage-2')
    expect(boss).toBeTruthy()
    if (!boss) {
      return
    }
    const save = createDefaultSaveData()
    expect(isBossUnlocked(boss, save)).toBe(false)
    const unlockedSave = {
      ...save,
      progress: {
        ...save.progress,
        facts: {
          '2x1': { ...createFactProgress(2, 1), correctCount: 20 },
        },
      },
    }
    expect(isBossUnlocked(boss, unlockedSave)).toBe(true)
    expect(isDifficultyUnlocked(boss, 'hard', unlockedSave)).toBe(false)
    const withPlayer = {
      ...createSaveWithPlayer(),
      progress: unlockedSave.progress,
    }
    const cleared = applyBossClearReward(withPlayer, boss.id, 'normal', 12000).save
    expect(getDifficultyProgress(cleared, boss.id, 'normal').cleared).toBe(true)
    expect(isDifficultyUnlocked(boss, 'hard', cleared)).toBe(true)
    expect(isDifficultyUnlocked(boss, 'gekimuzu', cleared)).toBe(false)
    const hardCleared = applyBossClearReward(cleared, boss.id, 'hard', 11000).save
    const fastCleared = applyBossClearReward(hardCleared, boss.id, 'fast', 9000).save
    expect(isDifficultyUnlocked(boss, 'gekimuzu', fastCleared)).toBe(true)
  })

  it('calculates remaining correct answers for locked bosses', () => {
    const boss = bosses.find((candidate) => candidate.id === 'boss-stage-3')
    const allBoss = bosses.find((candidate) => candidate.id === 'boss-all-kuku')
    expect(boss).toBeTruthy()
    expect(allBoss).toBeTruthy()
    if (!boss || !allBoss) {
      return
    }
    const save = createDefaultSaveData()
    expect(remainingQuestionsToUnlockBoss(boss, save)).toBe(20)
    const withTenCorrect = {
      ...save,
      progress: {
        ...save.progress,
        facts: {
          '3x1': { ...createFactProgress(3, 1), correctCount: 10 },
        },
      },
    }
    expect(remainingQuestionsToUnlockBoss(boss, withTenCorrect)).toBe(10)
    const withNineteenCorrect = {
      ...save,
      progress: {
        ...save.progress,
        facts: {
          '3x1': { ...createFactProgress(3, 1), correctCount: 19 },
        },
      },
    }
    expect(remainingQuestionsToUnlockBoss(boss, withNineteenCorrect)).toBe(1)
    const unlocked = {
      ...save,
      progress: {
        ...save.progress,
        facts: {
          '3x1': { ...createFactProgress(3, 1), correctCount: 20 },
        },
      },
    }
    expect(remainingQuestionsToUnlockBoss(boss, unlocked)).toBeNull()
    expect(remainingQuestionsToUnlockBoss(allBoss, save)).toBeNull()
  })

  it('grants upper treasure keys on first gekimuzu boss clears', () => {
    const basicBoss = bosses.find((candidate) => candidate.id === 'boss-stage-2')
    const allBoss = bosses.find((candidate) => candidate.id === 'boss-all-kuku')
    const advancedBoss = bosses.find((candidate) => candidate.id === 'boss-square')
    expect(basicBoss).toBeTruthy()
    expect(allBoss).toBeTruthy()
    expect(advancedBoss).toBeTruthy()
    if (!basicBoss || !allBoss || !advancedBoss) {
      return
    }

    expect(keyRewardsForBossClear(basicBoss, 'gekimuzu', true)).toEqual(['rainbow'])
    expect(keyRewardsForBossClear(allBoss, 'gekimuzu', true)).toEqual(['star'])
    expect(keyRewardsForBossClear(advancedBoss, 'gekimuzu', true)).toEqual(['star'])
    expect(keyRewardsForBossClear(basicBoss, 'fast', true)).toEqual([])
    expect(keyRewardsForBossClear(basicBoss, 'gekimuzu', false)).toEqual([])

    const save = createSaveWithPlayer()
    const cleared = applyBossClearReward(
      save,
      basicBoss.id,
      'gekimuzu',
      8000,
      '2026-01-02T00:00:00.000Z',
    ).save
    expect(cleared.progress.treasureKeys.rainbow.count).toBe(1)
    expect(cleared.progress.treasureKeys.rainbow.firstAcquiredAt).toBe('2026-01-02T00:00:00.000Z')
    const repeated = applyBossClearReward(
      cleared,
      basicBoss.id,
      'gekimuzu',
      7600,
      '2026-01-03T00:00:00.000Z',
    ).save
    expect(repeated.progress.treasureKeys.rainbow.count).toBe(1)
  })

  it('unlocks high-grade boss categories independently', () => {
    const squareBoss = bosses.find((boss) => boss.id === 'boss-square')
    const piBoss = bosses.find((boss) => boss.id === 'boss-pi')
    const developmentBoss = bosses.find((boss) => boss.id === 'boss-development')
    expect(squareBoss).toBeTruthy()
    expect(piBoss).toBeTruthy()
    expect(developmentBoss).toBeTruthy()
    if (!squareBoss || !piBoss || !developmentBoss) {
      return
    }

    const squareOnly = {
      ...createDefaultSaveData(),
      progress: {
        ...createDefaultSaveData().progress,
        categoryCorrect: {
          'multiplication-square': 20,
          'pi-multiplication': 0,
          development: 0,
        },
      },
    }
    expect(isBossUnlocked(squareBoss, squareOnly)).toBe(true)
    expect(isBossUnlocked(piBoss, squareOnly)).toBe(false)
    expect(isBossUnlocked(developmentBoss, squareOnly)).toBe(false)
    expect(remainingQuestionsToUnlockBoss(piBoss, squareOnly)).toBe(20)

    const piOnly = {
      ...squareOnly,
      progress: {
        ...squareOnly.progress,
        categoryCorrect: {
          'multiplication-square': 0,
          'pi-multiplication': 20,
          development: 0,
        },
      },
    }
    expect(isBossUnlocked(squareBoss, piOnly)).toBe(false)
    expect(isBossUnlocked(piBoss, piOnly)).toBe(true)
    expect(isBossUnlocked(developmentBoss, piOnly)).toBe(false)

    const developmentOnly = {
      ...squareOnly,
      progress: {
        ...squareOnly.progress,
        categoryCorrect: {
          'multiplication-square': 0,
          'pi-multiplication': 0,
          development: 20,
        },
      },
    }
    expect(isBossUnlocked(squareBoss, developmentOnly)).toBe(false)
    expect(isBossUnlocked(piBoss, developmentOnly)).toBe(false)
    expect(isBossUnlocked(developmentBoss, developmentOnly)).toBe(true)
  })

  it('resets legacy high-grade boss clears and rewards during v12 migration', () => {
    const legacy = createSaveWithPlayer()
    const squareTitle = bosses.find((boss) => boss.id === 'boss-square')?.rewards.normal.title ?? ''
    const squareItem = 'boss-square-normal-item'
    const migrated = migrateSaveData({
      ...legacy,
      version: 9,
      player: legacy.player
        ? {
            ...legacy.player,
            titles: [...legacy.player.titles, squareTitle, 'すべてをしるもの'],
            currentTitle: squareTitle,
          }
        : legacy.player,
      progress: {
        ...legacy.progress,
        bossProgress: {
          'boss-square': {
            bossId: 'boss-square',
            difficulties: {
              normal: {
                cleared: true,
                clearCount: 1,
                firstClearedAt: '2026-01-01T00:00:00.000Z',
                bestTimeMs: 8000,
              },
            },
          },
          'boss-development': {
            bossId: 'boss-development',
            difficulties: {
              normal: {
                cleared: true,
                clearCount: 1,
                firstClearedAt: '2026-01-01T00:00:00.000Z',
                bestTimeMs: 8000,
              },
            },
          },
        },
        bossItems: [squareItem, 'boss-development-normal-item'],
        ownedUfos: ['boss-square-ufo', 'boss-development-ufo', specialUfoId],
        equippedUfoId: 'boss-square-ufo',
        collectionRecords: [
          {
            id: collectionRecordId('boss-item', squareItem),
            acquiredAt: '2026-01-01T00:00:00.000Z',
            method: '旧平方数ボス',
          },
          {
            id: collectionRecordId('title', titleRecordId(squareTitle)),
            acquiredAt: '2026-01-01T00:00:00.000Z',
            method: '旧平方数ボス',
          },
          {
            id: collectionRecordId('ufo', 'boss-development-ufo'),
            acquiredAt: '2026-01-01T00:00:00.000Z',
            method: 'はってんボス',
          },
        ],
      },
    })

    expect(migrated.version).toBe(15)
    expect(migrated.progress.bossProgress['boss-square']).toBeUndefined()
    expect(migrated.progress.bossProgress['boss-development']).toBeTruthy()
    expect(migrated.progress.bossItems).not.toContain(squareItem)
    expect(migrated.progress.bossItems).toContain('boss-development-normal-item')
    expect(migrated.progress.ownedUfos).not.toContain('boss-square-ufo')
    expect(migrated.progress.ownedUfos).not.toContain(specialUfoId)
    expect(migrated.progress.ownedUfos).toContain('boss-development-ufo')
    expect(migrated.progress.equippedUfoId).toBe('boss-development-ufo')
    expect(migrated.player?.titles).not.toContain(titleRecordId(squareTitle))
    expect(migrated.player?.titles).not.toContain(titleRecordId('すべてをしるもの'))
    expect(migrated.progress.collectionRecords).not.toContainEqual(
      expect.objectContaining({
        id: collectionRecordId('boss-item', squareItem),
      }),
    )
    expect(migrated.progress.collectionRecords).toContainEqual(
      expect.objectContaining({
        id: collectionRecordId('ufo', 'boss-development-ufo'),
      }),
    )
  })

  it('does not re-run the legacy high-grade boss reset for v10 saves', () => {
    const legacy = createSaveWithPlayer()
    const migrated = migrateSaveData({
      ...legacy,
      version: 10,
      progress: {
        ...legacy.progress,
        bossProgress: {
          'boss-square': {
            bossId: 'boss-square',
            difficulties: {
              normal: {
                cleared: true,
                clearCount: 1,
                firstClearedAt: '2026-01-01T00:00:00.000Z',
                bestTimeMs: 8000,
              },
            },
          },
        },
      },
    })
    expect(migrated.version).toBe(15)
    expect(migrated.progress.bossProgress['boss-square']).toBeTruthy()
  })

  it('grants fixed boss rewards only on first clear', () => {
    const boss = bosses[0]
    let save: SaveData = createSaveWithPlayer()
    const first = applyBossClearReward(save, boss.id, 'normal', 10000)
    save = first.save
    const second = applyBossClearReward(save, boss.id, 'normal', 9000)
    expect(first.firstClear).toBe(true)
    expect(first.rewardItemIds).toEqual([boss.rewards.normal.itemId])
    expect(first.rewardTitles).toContain(boss.rewards.normal.title)
    expect(first.save.progress.collectionRecords).toContainEqual(
      expect.objectContaining({
        id: collectionRecordId('boss-item', boss.rewards.normal.itemId ?? ''),
      }),
    )
    expect(second.firstClear).toBe(false)
    expect(second.rewardItemIds).toEqual([])
    expect(second.rewardTitles).toEqual([])
  })

  it('grants fixed UFO rewards only on first gekimuzu clear', () => {
    const boss = bosses[0]
    const ufo = getUfoForBoss(boss.id)
    expect(ufo).toBeTruthy()
    if (!ufo) {
      return
    }
    let save: SaveData = createSaveWithPlayer()
    const first = applyBossClearReward(save, boss.id, 'gekimuzu', 8000)
    save = first.save
    const second = applyBossClearReward(save, boss.id, 'gekimuzu', 7000)
    expect(first.firstClear).toBe(true)
    expect(first.rewardUfoIds).toEqual([ufo.id])
    expect(first.rewardTitles).toContain(boss.rewards.gekimuzu.title)
    expect(first.save.progress.ownedUfos).toContain(ufo.id)
    expect(first.save.progress.collectionRecords).toContainEqual(
      expect.objectContaining({
        id: collectionRecordId('ufo', ufo.id),
      }),
    )
    expect(second.firstClear).toBe(false)
    expect(second.rewardUfoIds).toEqual([])
  })

  it('defines addition monsters and counts them in the book', () => {
    expect(additionMonsterDefinitions).toHaveLength(18)
    expect(additionMonsterDefinitions.every((monster) => monster.origin === 'add')).toBe(true)
    const save = createSaveWithPlayer()
    save.progress.categoryCorrect = {
      [additionAreaCorrectKey('add-within-9')]: 20,
    }
    expect(
      additionMonsterDefinitions.filter((monster) =>
        isAdditionMonsterOwned(save.progress.categoryCorrect, monster),
      ),
    ).toHaveLength(3)
    const progress = calculateBookProgress(save)
    expect(progress.tabs.monsters.total).toBeGreaterThanOrEqual(18)
    expect(progress.tabs.monsters.owned).toBeGreaterThanOrEqual(3)
  })

  it('grants addition boss UFOs, effects, and titles with add origin custom entries', () => {
    const addCarryBoss = bosses.find((boss) => boss.id === 'boss-add-carry-basic')
    const addEffectBoss = bosses.find((boss) => boss.id === 'boss-add-two-digit-no-carry')
    expect(addCarryBoss).toBeTruthy()
    expect(addEffectBoss).toBeTruthy()
    if (!addCarryBoss || !addEffectBoss) {
      return
    }
    const save = createSaveWithPlayer()
    save.progress.categoryCorrect = {
      [additionAreaCorrectKey('add-carry-basic')]: 20,
      [additionAreaCorrectKey('add-two-digit-no-carry')]: 20,
    }
    expect(isBossUnlocked(addCarryBoss, save)).toBe(true)
    const carryClear = applyBossClearReward(save, addCarryBoss.id, 'normal', 9000)
    expect(carryClear.rewardUfoIds).toEqual([additionPlusRingUfoId])
    expect(carryClear.rewardTitles).toContain(addCarryBoss.rewards.normal.title)
    expect(carryClear.save.progress.ownedUfos).toContain(additionPlusRingUfoId)

    const effectClear = applyBossClearReward(carryClear.save, addEffectBoss.id, 'normal', 9000)
    expect(effectClear.rewardEffectIds).toEqual([addPlusBurstEffectId])
    expect(effectClear.save.progress.ownedItems).toContain(addPlusBurstEffectId)
    expect(effectClear.save.progress.collectionRecords).toContainEqual(
      expect.objectContaining({
        id: collectionRecordId('effect', addPlusBurstEffectId),
      }),
    )

    const addTabs = buildCustomInventory(effectClear.save, 'add')
    expect(
      addTabs
        .find((tab) => tab.id === 'ufo')
        ?.entries.find((entry) => entry.id === additionPlusRingUfoId)?.owned,
    ).toBe(true)
    expect(
      addTabs
        .find((tab) => tab.id === 'effect')
        ?.entries.find((entry) => entry.id === addPlusBurstEffectId)?.owned,
    ).toBe(true)
  })

  it('grants addition master and legend titles separately from legacy all-gekimuzu rewards', () => {
    const additionBosses = bosses.filter((boss) => boss.group === 'addition')
    expect(additionBosses).toHaveLength(6)
    let save: SaveData = createSaveWithPlayer()
    for (const boss of additionBosses) {
      save = applyBossClearReward(save, boss.id, 'normal', 8000).save
    }
    expect(save.player?.titles).toContain(titleRecordId(additionMasterTitle))
    for (const boss of additionBosses) {
      save = applyBossClearReward(save, boss.id, 'hard', 8000).save
      save = applyBossClearReward(save, boss.id, 'fast', 8000).save
      save = applyBossClearReward(save, boss.id, 'gekimuzu', 8000).save
    }
    expect(save.player?.titles).toContain(titleRecordId(additionLegendTitle))
    expect(save.progress.ownedUfos).not.toContain(specialUfoId)
    expect(save.progress.ownedItems).not.toContain(galaxySwirlEffectId)
  })

  it('defines subtraction monsters and counts them in the book', () => {
    expect(subtractionMonsterDefinitions).toHaveLength(18)
    expect(subtractionMonsterDefinitions.every((monster) => monster.origin === 'sub')).toBe(true)
    const save = createSaveWithPlayer()
    save.progress.categoryCorrect = {
      [subtractionAreaCorrectKey('sub-within-9')]: 20,
    }
    expect(
      subtractionMonsterDefinitions.filter((monster) =>
        isSubtractionMonsterOwned(save.progress.categoryCorrect, monster),
      ),
    ).toHaveLength(3)
    const progress = calculateBookProgress(save)
    expect(progress.tabs.monsters.total).toBeGreaterThan(additionMonsterDefinitions.length)
  })

  it('grants subtraction boss UFOs, effects, and titles with sub origin custom entries', () => {
    const subBorrowBoss = bosses.find((boss) => boss.id === 'boss-sub-borrow-basic')
    const subEffectBoss = bosses.find((boss) => boss.id === 'boss-sub-two-digit-no-borrow')
    expect(subBorrowBoss).toBeDefined()
    expect(subEffectBoss).toBeDefined()
    const save = createSaveWithPlayer()
    save.progress.categoryCorrect = {
      [subtractionAreaCorrectKey('sub-borrow-basic')]: 20,
      [subtractionAreaCorrectKey('sub-two-digit-no-borrow')]: 20,
    }

    const borrowClear = applyBossClearReward(save, subBorrowBoss!.id, 'normal', 9000)
    expect(borrowClear.rewardUfoIds).toEqual([subtractionMinusRingUfoId])
    expect(borrowClear.rewardTitles).toContain(subBorrowBoss!.rewards.normal.title)
    expect(borrowClear.save.progress.ownedUfos).toContain(subtractionMinusRingUfoId)

    const effectClear = applyBossClearReward(borrowClear.save, subEffectBoss!.id, 'normal', 9000)
    expect(effectClear.rewardEffectIds).toEqual([subMinusFlashEffectId])
    expect(effectClear.save.progress.ownedItems).toContain(subMinusFlashEffectId)
    expect(effectClear.save.progress.collectionRecords).toContainEqual(
      expect.objectContaining({
        id: collectionRecordId('effect', subMinusFlashEffectId),
      }),
    )

    const subTabs = buildCustomInventory(effectClear.save, 'subtract')
    expect(
      subTabs
        .find((tab) => tab.id === 'ufo')
        ?.entries.find((entry) => entry.id === subtractionMinusRingUfoId)?.owned,
    ).toBe(true)
    expect(
      subTabs
        .find((tab) => tab.id === 'effect')
        ?.entries.find((entry) => entry.id === subMinusFlashEffectId)?.owned,
    ).toBe(true)
  })

  it('grants subtraction master and legend titles separately from legacy all-gekimuzu rewards', () => {
    const subtractionBosses = bosses.filter((boss) => boss.group === 'subtraction')
    expect(subtractionBosses).toHaveLength(6)
    let save: SaveData = createSaveWithPlayer()
    for (const boss of subtractionBosses) {
      save = applyBossClearReward(save, boss.id, 'normal', 8000).save
    }
    expect(save.player?.titles).toContain(titleRecordId(subtractionMasterTitle))
    for (const boss of subtractionBosses) {
      save = applyBossClearReward(save, boss.id, 'hard', 8000).save
      save = applyBossClearReward(save, boss.id, 'fast', 8000).save
      save = applyBossClearReward(save, boss.id, 'gekimuzu', 8000).save
    }
    expect(save.player?.titles).toContain(titleRecordId(subtractionLegendTitle))
    expect(save.progress.ownedUfos).not.toContain(specialUfoId)
    expect(save.progress.ownedItems).not.toContain(galaxySwirlEffectId)
  })

  it('defines division monsters and counts them in the book', () => {
    expect(divisionMonsterDefinitions).toHaveLength(12)
    expect(divisionMonsterDefinitions.every((monster) => monster.origin === 'divide')).toBe(true)
    const save = createSaveWithPlayer()
    save.progress.categoryCorrect = {
      [divisionAreaCorrectKey('divide-no-remainder')]: 20,
    }
    expect(
      divisionMonsterDefinitions.filter((monster) =>
        isDivisionMonsterOwned(save.progress.categoryCorrect, monster),
      ),
    ).toHaveLength(4)
    const progress = calculateBookProgress(save)
    expect(progress.tabs.monsters.total).toBeGreaterThan(
      additionMonsterDefinitions.length + subtractionMonsterDefinitions.length,
    )
  })

  it('grants division boss UFOs, effects, and titles with divide origin custom entries', () => {
    const divideRingBoss = bosses.find((boss) => boss.id === 'boss-divide-no-remainder')
    const divideEffectBoss = bosses.find((boss) => boss.id === 'boss-divide-with-remainder')
    expect(divideRingBoss).toBeDefined()
    expect(divideEffectBoss).toBeDefined()
    const save = createSaveWithPlayer()
    save.progress.categoryCorrect = {
      [divisionAreaCorrectKey('divide-no-remainder')]: 20,
      [divisionAreaCorrectKey('divide-with-remainder')]: 20,
    }

    const ringClear = applyBossClearReward(save, divideRingBoss!.id, 'normal', 9000)
    expect(ringClear.rewardUfoIds).toEqual([divisionRingUfoId])
    expect(ringClear.rewardTitles).toContain(divideRingBoss!.rewards.normal.title)
    expect(ringClear.save.progress.ownedUfos).toContain(divisionRingUfoId)

    const effectClear = applyBossClearReward(ringClear.save, divideEffectBoss!.id, 'normal', 9000)
    expect(effectClear.rewardUfoIds).toEqual([divisionQuarterUfoId])
    expect(effectClear.rewardEffectIds).toEqual([divideFlashEffectId])
    expect(effectClear.save.progress.ownedItems).toContain(divideFlashEffectId)
    expect(effectClear.save.progress.collectionRecords).toContainEqual(
      expect.objectContaining({
        id: collectionRecordId('effect', divideFlashEffectId),
      }),
    )

    const divideTabs = buildCustomInventory(effectClear.save, 'divide')
    expect(
      divideTabs
        .find((tab) => tab.id === 'ufo')
        ?.entries.find((entry) => entry.id === divisionRingUfoId)?.owned,
    ).toBe(true)
    expect(
      divideTabs
        .find((tab) => tab.id === 'ufo')
        ?.entries.find((entry) => entry.id === divisionQuarterUfoId)?.owned,
    ).toBe(true)
    expect(
      divideTabs
        .find((tab) => tab.id === 'effect')
        ?.entries.find((entry) => entry.id === divideFlashEffectId)?.owned,
    ).toBe(true)
  })

  it('grants division master and legend titles separately from legacy all-gekimuzu rewards', () => {
    const divisionBosses = bosses.filter((boss) => boss.group === 'division')
    expect(divisionBosses).toHaveLength(3)
    let save: SaveData = createSaveWithPlayer()
    for (const boss of divisionBosses) {
      save = applyBossClearReward(save, boss.id, 'normal', 8000).save
    }
    expect(save.player?.titles).toContain(titleRecordId(divisionMasterTitle))
    for (const boss of divisionBosses) {
      save = applyBossClearReward(save, boss.id, 'hard', 8000).save
      save = applyBossClearReward(save, boss.id, 'fast', 8000).save
      save = applyBossClearReward(save, boss.id, 'gekimuzu', 8000).save
    }
    expect(save.player?.titles).toContain(titleRecordId(divisionLegendTitle))
    expect(save.progress.ownedUfos).not.toContain(specialUfoId)
    expect(save.progress.ownedItems).not.toContain(galaxySwirlEffectId)
  })

  it('generates addition questions in speed and play helpers', () => {
    const speedQuestion = createSpeedQuestion({
      planet: 'add',
      selectedAreas: ['add-within-9'],
    })
    expect(speedQuestion.id.startsWith('add:add-within-9:')).toBe(true)
    const playQuestion = createMiniQuestion({ planet: 'add' })
    expect(playQuestion.id.startsWith('add:')).toBe(true)
    expect(playQuestion.category.startsWith('addition-')).toBe(true)
  })

  it('generates subtraction questions in speed and play helpers', () => {
    const speedQuestion = createSpeedQuestion({
      planet: 'subtract',
      selectedAreas: ['sub-within-9'],
    })
    expect(speedQuestion.id.startsWith('sub:sub-within-9:')).toBe(true)
    expect(Number(speedQuestion.answer)).toBeGreaterThanOrEqual(1)
    const playQuestion = createMiniQuestion({ planet: 'subtract' })
    expect(playQuestion.id.startsWith('sub:')).toBe(true)
    expect(playQuestion.category.startsWith('subtraction-')).toBe(true)
    expect(Number(playQuestion.answer)).toBeGreaterThanOrEqual(1)
  })

  it('generates division questions in speed and play helpers', () => {
    const speedQuestion = createSpeedQuestion({
      planet: 'divide',
      selectedAreas: ['divide-with-remainder'],
    })
    expect(speedQuestion.id.startsWith('divide:divide-with-remainder:')).toBe(true)
    expect(isRemainderAnswerValue(speedQuestion.answer)).toBe(true)
    const playQuestion = createMiniQuestion({
      planet: 'divide',
      divisionRocketDifficulty: 'normal',
    })
    expect(playQuestion.id.startsWith('divide:')).toBe(true)
    expect(playQuestion.category.startsWith('division-')).toBe(true)
  })

  it('splits addition rocket questions into three difficulty ranges', () => {
    const easyQuestion = createMiniQuestion({
      planet: 'add',
      additionRocketDifficulty: 'easy',
      rng: () => 0.99,
    })
    expect(Number(easyQuestion.metadata?.left)).toBeLessThanOrEqual(9)
    expect(Number(easyQuestion.metadata?.right)).toBeLessThanOrEqual(9)

    const normalQuestion = createMiniQuestion({
      planet: 'add',
      additionRocketDifficulty: 'normal',
      rng: () => 0.99,
    })
    expect(Number(normalQuestion.metadata?.left)).toBeLessThanOrEqual(99)
    expect(Number(normalQuestion.metadata?.right)).toBeLessThanOrEqual(99)

    const hardQuestion = createMiniQuestion({
      planet: 'add',
      additionRocketDifficulty: 'hard',
      rng: () => 0.99,
    })
    expect(Number(hardQuestion.metadata?.left)).toBeGreaterThanOrEqual(100)
    expect(Number(hardQuestion.metadata?.right)).toBeGreaterThanOrEqual(100)
    expect(additionRocketDifficulties.map((difficulty) => difficulty.title)).toEqual([
      'たしざんロケットビギナー',
      'たしざんロケットパイロット',
      'たしざんロケットキャプテン',
    ])
    for (const difficulty of additionRocketDifficulties) {
      const rawSummary = buildSessionSummary({
        id: `rocket-${difficulty.id}`,
        mode: 'rocket',
        maxCombo: 14,
        score: 100,
        results: Array.from({ length: 14 }, () =>
          result({
            questionId: 'add:add-within-9:1+1',
            prompt: '1 + 1',
            expectedAnswer: 2,
          }),
        ),
        finishedAt: '2026-01-05T00:00:00.000Z',
      })
      const summary: GameSessionSummary = {
        ...rawSummary,
        details: {
          planet: 'add',
          additionRocketDifficulty: difficulty.id,
        },
      }
      expect(judgeNewTitles(summary, createSaveWithPlayer())).toContain(difficulty.title)
    }
  })

  it('splits subtraction rocket questions into three difficulty ranges and titles', () => {
    const easyQuestion = createMiniQuestion({
      planet: 'subtract',
      subtractionRocketDifficulty: 'easy',
      rng: () => 0.99,
    })
    expect(Number(easyQuestion.metadata?.left)).toBeLessThanOrEqual(18)
    expect(Number(easyQuestion.metadata?.right)).toBeLessThanOrEqual(9)
    expect(Number(easyQuestion.answer)).toBeGreaterThanOrEqual(1)

    const normalQuestion = createMiniQuestion({
      planet: 'subtract',
      subtractionRocketDifficulty: 'normal',
      rng: () => 0.99,
    })
    expect(Number(normalQuestion.metadata?.left)).toBeLessThanOrEqual(99)
    expect(Number(normalQuestion.metadata?.right)).toBeLessThanOrEqual(99)
    expect(Number(normalQuestion.answer)).toBeGreaterThanOrEqual(1)

    const hardQuestion = createMiniQuestion({
      planet: 'subtract',
      subtractionRocketDifficulty: 'hard',
      rng: () => 0.99,
    })
    expect(Number(hardQuestion.metadata?.left)).toBeGreaterThanOrEqual(100)
    expect(Number(hardQuestion.metadata?.right)).toBeGreaterThanOrEqual(100)
    expect(Number(hardQuestion.answer)).toBeGreaterThanOrEqual(1)
    expect(subtractionRocketDifficulties.map((difficulty) => difficulty.title)).toEqual([
      'ひきざんろけっとびぎなー',
      'ひきざんろけっとぱいろっと',
      'ひきざんろけっときゃぷてん',
    ])
    for (const difficulty of subtractionRocketDifficulties) {
      const rawSummary = buildSessionSummary({
        id: `sub-rocket-${difficulty.id}`,
        mode: 'rocket',
        maxCombo: 14,
        score: 100,
        results: Array.from({ length: 14 }, () =>
          result({
            questionId: 'sub:sub-within-9:5-2',
            prompt: '5 - 2',
            expectedAnswer: 3,
          }),
        ),
        finishedAt: '2026-01-05T00:00:00.000Z',
      })
      const summary: GameSessionSummary = {
        ...rawSummary,
        details: {
          planet: 'subtract',
          subtractionRocketDifficulty: difficulty.id,
        },
      }
      expect(judgeNewTitles(summary, createSaveWithPlayer())).toContain(difficulty.title)
    }
  })

  it('splits division rocket questions into three difficulty ranges and titles', () => {
    const easyQuestion = createMiniQuestion({
      planet: 'divide',
      divisionRocketDifficulty: 'easy',
      rng: () => 0.99,
    })
    expect(Number(easyQuestion.metadata?.right)).toBeGreaterThanOrEqual(1)
    expect(Number(easyQuestion.metadata?.right)).toBeLessThanOrEqual(9)
    expect(Number(easyQuestion.metadata?.remainder)).toBe(0)
    expect(isRemainderAnswerValue(easyQuestion.answer)).toBe(false)

    const normalQuestion = createMiniQuestion({
      planet: 'divide',
      divisionRocketDifficulty: 'normal',
      rng: () => 0.99,
    })
    expect(Number(normalQuestion.metadata?.right)).toBeGreaterThanOrEqual(2)
    expect(Number(normalQuestion.metadata?.right)).toBeLessThanOrEqual(9)
    expect(Number(normalQuestion.metadata?.remainder)).toBeGreaterThanOrEqual(1)
    expect(Number(normalQuestion.metadata?.remainder)).toBeLessThan(
      Number(normalQuestion.metadata?.right),
    )
    expect(isRemainderAnswerValue(normalQuestion.answer)).toBe(true)

    const hardQuestion = createMiniQuestion({
      planet: 'divide',
      divisionRocketDifficulty: 'hard',
      rng: () => 0.99,
    })
    expect(Number(hardQuestion.metadata?.left)).toBeGreaterThanOrEqual(10)
    expect(Number(hardQuestion.metadata?.left)).toBeLessThanOrEqual(99)
    expect(Number(hardQuestion.metadata?.right)).toBeGreaterThanOrEqual(2)
    expect(Number(hardQuestion.metadata?.right)).toBeLessThanOrEqual(9)

    for (const difficulty of divisionRocketDifficulties) {
      const rawSummary = buildSessionSummary({
        id: `divide-rocket-${difficulty.id}`,
        mode: 'rocket',
        maxCombo: 14,
        score: 100,
        results: Array.from({ length: 14 }, () =>
          result({
            questionId: 'divide:divide-with-remainder:13/4',
            prompt: '13 ÷ 4',
            expectedAnswer: { kind: 'remainder', quotient: 3, remainder: 1 },
          }),
        ),
        finishedAt: '2026-01-05T00:00:00.000Z',
      })
      const summary: GameSessionSummary = {
        ...rawSummary,
        details: {
          planet: 'divide',
          divisionRocketDifficulty: difficulty.id,
        },
      }
      expect(judgeNewTitles(summary, createSaveWithPlayer())).toContain(difficulty.title)
    }
  })

  it('caps level icon previews in settings CSS', () => {
    expect(globalCss).toContain('.settings-level-icon')
    expect(globalCss).toContain('max-width: 80px')
    expect(globalCss).toContain('max-height: 80px')
  })

  it('grants the all-gekimuzu reward once when the final boss clears', () => {
    const legacyBosses = bosses.filter(
      (boss) =>
        boss.group !== 'addition' && boss.group !== 'subtraction' && boss.group !== 'division',
    )
    const finalBoss = legacyBosses[legacyBosses.length - 1]
    let save: SaveData = createSaveWithPlayer()
    for (const boss of legacyBosses.slice(0, -1)) {
      save = applyBossClearReward(save, boss.id, 'gekimuzu', 8000).save
    }
    expect(save.progress.ownedUfos).not.toContain(specialUfoId)

    const finalClear = applyBossClearReward(save, finalBoss.id, 'gekimuzu', 8000)
    expect(finalClear.grandReward).toBe(true)
    expect(finalClear.rewardUfoIds).toContain(specialUfoId)
    expect(finalClear.rewardEffectIds).toContain(galaxySwirlEffectId)
    expect(finalClear.rewardTitles).not.toContain(allGekimuzuTitle)
    expect(finalClear.save.player?.titles).not.toContain(titleRecordId(allGekimuzuTitle))
    expect(finalClear.save.progress.ownedUfos).toContain(specialUfoId)
    expect(finalClear.save.progress.ownedItems).toContain(galaxySwirlEffectId)
    expect(finalClear.save.progress.collectionRecords).toContainEqual(
      expect.objectContaining({
        id: collectionRecordId('ufo', specialUfoId),
      }),
    )
    expect(finalClear.save.progress.collectionRecords).toContainEqual(
      expect.objectContaining({
        id: collectionRecordId('effect', galaxySwirlEffectId),
      }),
    )

    const repeat = applyBossClearReward(finalClear.save, finalBoss.id, 'gekimuzu', 7000)
    expect(repeat.grandReward).toBe(false)
    expect(repeat.rewardUfoIds).toEqual([])
    expect(repeat.rewardEffectIds).toEqual([])
  })

  it('grants the final title only after all completion conditions are met', () => {
    const acquiredAt = '2026-01-05T00:00:00.000Z'
    const monsterBook = createMultiplicationFactPool({
      stages: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    }).map((fact) => `${fact.left}x${fact.right}`)
    const bossProgress = Object.fromEntries(
      bosses.map((boss) => [
        boss.id,
        {
          bossId: boss.id,
          difficulties: {
            normal: {
              cleared: true,
              clearCount: 1,
              firstClearedAt: acquiredAt,
              bestTimeMs: 1000,
            },
            hard: {
              cleared: true,
              clearCount: 1,
              firstClearedAt: acquiredAt,
              bestTimeMs: 1000,
            },
            fast: {
              cleared: true,
              clearCount: 1,
              firstClearedAt: acquiredAt,
              bestTimeMs: 1000,
            },
            gekimuzu: {
              cleared: true,
              clearCount: 1,
              firstClearedAt: acquiredAt,
              bestTimeMs: 1000,
            },
          },
        },
      ]),
    )
    const otherTitles = getTitleDefinitions()
      .map((title) => title.label)
      .filter((title) => title !== allGekimuzuTitle)
    const save: SaveData = {
      ...createSaveWithPlayer(),
      player: {
        ...createSaveWithPlayer().player!,
        titles: otherTitles,
      },
      progress: {
        ...createSaveWithPlayer().progress,
        monsterBook,
        categoryCorrect: {
          'multiplication-square': 40,
          'pi-multiplication': 40,
          development: 40,
        },
        bossProgress,
        ownedItems: shopItems
          .filter((item) => ['window', 'hat', 'wear', 'effect'].includes(item.visual.layer))
          .map((item) => item.id),
        ownedUfos: ufoDefinitions.map((ufo) => ufo.id),
        collectionRecords: [
          ...buddyDefinitions.map((buddy) => ({
            id: collectionRecordId('buddy', buddy.id),
            acquiredAt,
            method: 'test',
          })),
          ...advancedMonsterDefinitions.map((monster) => ({
            id: collectionRecordId('advanced-monster', monster.id),
            acquiredAt,
            method: 'test',
          })),
        ],
      },
    }

    expect(canGrantFinalTitle(save)).toBe(true)
    const granted = grantFinalTitleIfEarned(save, acquiredAt)
    expect(granted.granted).toBe(true)
    expect(granted.save.player?.titles).toContain(titleRecordId(allGekimuzuTitle))
    expect(granted.save.progress.collectionRecords).toContainEqual(
      expect.objectContaining({
        id: collectionRecordId('title', titleRecordId(allGekimuzuTitle)),
      }),
    )
    expect(grantFinalTitleIfEarned(granted.save, acquiredAt).granted).toBe(false)

    const missingItem: SaveData = {
      ...save,
      progress: {
        ...save.progress,
        ownedItems: [],
      },
    }
    expect(canGrantFinalTitle(missingItem)).toBe(false)
  })
})
