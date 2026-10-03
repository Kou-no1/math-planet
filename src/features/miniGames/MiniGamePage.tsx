import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppShell } from '../../components/common/AppShell'
import { MathQuestion } from '../../components/game/MathValue'
import { KukucchiCharacter } from '../../components/character/KukucchiCharacter'
import { KeyIcon } from '../../components/collection/KeyIcon'
import { MonsterSprite } from '../../components/collection/MonsterSprite'
import { TreasureIcon } from '../../components/collection/TreasureIcon'
import { UfoBadge } from '../../components/collection/UfoBadge'
import { AnswerControls } from '../../components/game/AnswerControls'
import { GameFeedback } from '../../components/game/GameFeedback'
import { ModeStartScreen } from '../../components/game/ModeStartScreen'
import {
  additionRocketDifficulties,
  getAdditionRocketDifficulty,
  type AdditionRocketDifficultyId,
} from '../../data/additionRocket'
import {
  getSubtractionRocketDifficulty,
  subtractionRocketDifficulties,
  type SubtractionRocketDifficultyId,
} from '../../data/subtractionRocket'
import {
  divisionRocketDifficulties,
  getDivisionRocketDifficulty,
  type DivisionRocketDifficultyId,
} from '../../data/divisionRocket'
import { miniGameMinDifficulty } from '../../data/factDifficulty'
import { getKeyTypeById, keyForTreasureStreak, treasureChestTypes } from '../../data/keys'
import { earnedRocketBadges, rocketBadges } from '../../data/rocketBadges'
import { phase15EffectItemIds } from '../../data/shopItems'
import { rarityStars } from '../../data/treasureItems'
import { getUfoById } from '../../data/ufos'
import { addCollectionRecords } from '../../game-engine/collection/collectionRecords'
import { isCorrectAnswer } from '../../game-engine/questions/answer'
import { averageStageDifficulty } from '../../game-engine/questions/factDifficulty'
import {
  generateAdditionQuestion,
  generateDivisionQuestion,
  generateMultiplicationQuestion,
  generateSubtractionQuestion,
} from '../../game-engine/questions/questionGenerator'
import { buildSessionSummary } from '../../game-engine/rewards/rewards'
import { applyAnswerToScore } from '../../game-engine/scoring/score'
import { openTreasureChest } from '../../game-engine/treasure/treasureEngine'
import { useDailyUsage } from '../../hooks/useDailyUsage'
import { useSaveData } from '../../hooks/useSaveData'
import { playCorrectSound } from '../../services/audioService'
import { applySessionResult } from '../../services/resultService'
import type {
  AnswerResult,
  AnswerValue,
  GameMode,
  GameSessionSummary,
  Question,
  ScoreState,
} from '../../types/game'
import { createId } from '../../utils/id'
import { sessionRecordScope } from '../../game-engine/scoring/sessionRecords'
import { isNumericPlanetId } from '../../data/numericAreas'
import { numericRocketDifficulties, type NumericRocketDifficultyId } from '../../data/numericRocket'
import type { PlanetId } from '../../data/planets'
import { generateAdaptiveNumericQuestion } from '../../game-engine/questions/numeric'
import { factsWithResults } from '../../game-engine/mastery/mastery'
import { resultIncorrectStreak } from '../../game-engine/school/schoolMode2'

type MiniGameVariant = Extract<GameMode, 'battle' | 'treasure' | 'rocket'>
type MiniGamePhase = 'ready' | 'running' | 'chests'

const battleGoal = 12
const battleTimeLimitMs = 6000
const treasureGoal = 9
const rocketGoal = 14
const specialGaugeMax = 3
const allStages = [1, 2, 3, 4, 5, 6, 7, 8, 9]

const gameConfig: Record<
  MiniGameVariant,
  {
    title: string
    eyebrow: string
    heading: string
    description: string
    startDescription: string
    goal: number
    statLabel: string
    icon: string
  }
> = {
  battle: {
    title: 'もんすたーばとる',
    eyebrow: 'れんぞくで ひっさつわざ！',
    heading: 'はーとをまもってあたっく',
    description: '3ハートで、ひっさつわざをねらおう',
    startDescription: 'れんぞくせいかいでゲージをためて、ひっさつわざ！',
    goal: battleGoal,
    statLabel: 'もんすたーたいりょく',
    icon: 'VS',
  },
  treasure: {
    title: 'たからばこ',
    eyebrow: 'ゆっくりかんがえて おたからげっと',
    heading: '3もんれんぞくでかぎ',
    description: 'じかんせいげんなし。かぎでたからばこをあけよう',
    startDescription: 'あせらずせいかくに。3もんれんぞくでかぎ1ぽん！',
    goal: treasureGoal,
    statLabel: 'かぎ',
    icon: '🗝️',
  },
  rocket: {
    title: 'ろけっと',
    eyebrow: 'はやさで うちゅうのはてへ！',
    heading: 'ねんりょうをためてとおくへ',
    description: 'はやいせいかいほどぐんぐんかそく',
    startDescription: 'ねんりょうをきらさず、じぶんのきろくにちょうせん！',
    goal: rocketGoal,
    statLabel: 'きょり',
    icon: '🚀',
  },
}

export function createMiniQuestion({
  planet = 'multiply',
  stages = allStages,
  additionRocketDifficulty = 'hard',
  subtractionRocketDifficulty = 'hard',
  divisionRocketDifficulty = 'hard',
  numericRocketDifficulty = 'hard',
  facts = {}, schoolMode2Enabled = false, recentIncorrectCount = 0,
  rng = Math.random,
}: {
  planet?: PlanetId
  numericRocketDifficulty?: NumericRocketDifficultyId
  facts?: Parameters<typeof generateAdaptiveNumericQuestion>[0]
  schoolMode2Enabled?: boolean
  recentIncorrectCount?: number
  stages?: number[]
  additionRocketDifficulty?: AdditionRocketDifficultyId
  subtractionRocketDifficulty?: SubtractionRocketDifficultyId
  divisionRocketDifficulty?: DivisionRocketDifficultyId
  rng?: () => number
} = {}): Question {
  if (isNumericPlanetId(planet)) {
    const areas = numericRocketDifficulties(planet).find((entry) => entry.id === numericRocketDifficulty)!.areaIds
    return generateAdaptiveNumericQuestion(facts, areas[Math.floor(rng() * areas.length)] ?? areas[0], { rng, schoolMode2Enabled, recentIncorrectCount })
  }
  if (planet === 'add') {
    const difficulty = getAdditionRocketDifficulty(additionRocketDifficulty)
    const areaId = difficulty.areaIds[Math.floor(rng() * difficulty.areaIds.length)] ?? difficulty.areaIds[0]
    return generateAdditionQuestion(areaId, { rng })
  }
  if (planet === 'subtract') {
    const difficulty = getSubtractionRocketDifficulty(subtractionRocketDifficulty)
    const areaId = difficulty.areaIds[Math.floor(rng() * difficulty.areaIds.length)] ?? difficulty.areaIds[0]
    return generateSubtractionQuestion(areaId, { rng })
  }
  if (planet === 'divide') {
    const difficulty = getDivisionRocketDifficulty(divisionRocketDifficulty)
    const areaId = difficulty.areaIds[Math.floor(rng() * difficulty.areaIds.length)] ?? difficulty.areaIds[0]
    return generateDivisionQuestion(areaId, { rng })
  }
  return generateMultiplicationQuestion({
    answerMode: 'choice',
    stages,
    minDifficulty: miniGameMinDifficulty,
    rng,
  })
}

function stageStars(stage: number): string {
  return '★'.repeat(Math.max(1, Math.round(averageStageDifficulty(stage))))
}

function monsterFactFromQuestion(question: Question): {
  left: number
  right: number
} {
  return {
    left: Number(question.metadata?.left ?? 2),
    right: Number(question.metadata?.right ?? 1),
  }
}

export function MiniGamePage({ variant }: { variant: MiniGameVariant }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { saveData, setSaveData } = useSaveData()
  const { rewardBudgetReached } = useDailyUsage()
  const isAdditionPlanet = searchParams.get('planet') === 'add'
  const isSubtractionPlanet = searchParams.get('planet') === 'subtract'
  const isDivisionPlanet = searchParams.get('planet') === 'divide'
  const numericPlanet = isNumericPlanetId(searchParams.get('planet')) ? searchParams.get('planet') as 'decimal' | 'fraction' : null
  const operationPlanet = isAdditionPlanet || isSubtractionPlanet || isDivisionPlanet || Boolean(numericPlanet)
  const questionPlanet = numericPlanet ?? (isAdditionPlanet ? 'add' : isSubtractionPlanet ? 'subtract' : isDivisionPlanet ? 'divide' : 'multiply')
  const backTo = numericPlanet ? `/planet/${numericPlanet}` : isAdditionPlanet
    ? '/planet/add'
    : isSubtractionPlanet
      ? '/planet/subtract'
      : isDivisionPlanet
        ? '/planet/divide'
      : '/planet/multiply'
  const config = gameConfig[variant]
  const equippedUfo = getUfoById(saveData.progress.equippedUfoId)
  const [phase, setPhase] = useState<MiniGamePhase>('ready')
  const [numericRocketDifficulty, setNumericRocketDifficulty] = useState<NumericRocketDifficultyId>('easy')
  const [additionRocketDifficulty, setAdditionRocketDifficulty] =
    useState<AdditionRocketDifficultyId>('easy')
  const [subtractionRocketDifficulty, setSubtractionRocketDifficulty] =
    useState<SubtractionRocketDifficultyId>('easy')
  const [divisionRocketDifficulty, setDivisionRocketDifficulty] =
    useState<DivisionRocketDifficultyId>('easy')
  const rocketRecordKey = sessionRecordScope({
    mode: 'rocket',
    results: [],
    details: {
      planet: questionPlanet,
      ...(isAdditionPlanet ? { additionRocketDifficulty } : {}),
      ...(isSubtractionPlanet ? { subtractionRocketDifficulty } : {}),
      ...(isDivisionPlanet ? { divisionRocketDifficulty } : {}),
      ...(numericPlanet ? { numericRocketDifficulty } : {}),
    },
  }).recordKey
  const [question, setQuestion] = useState<Question>(() =>
    createMiniQuestion({
      planet: questionPlanet,
      numericRocketDifficulty,
      additionRocketDifficulty,
      subtractionRocketDifficulty,
      divisionRocketDifficulty,
    }),
  )
  const [selectedBattleStages, setSelectedBattleStages] = useState<number[]>([...allStages])
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle')
  const [results, setResults] = useState<AnswerResult[]>([])
  const [scoreState, setScoreState] = useState<ScoreState>({
    score: 0,
    combo: 0,
    maxCombo: 0,
  })
  const [hearts, setHearts] = useState(3)
  const [enemyHp, setEnemyHp] = useState(100)
  const [specialGauge, setSpecialGauge] = useState(0)
  const [specialUses, setSpecialUses] = useState(0)
  const [keys, setKeys] = useState(0)
  const [earnedKeyIds, setEarnedKeyIds] = useState<string[]>([])
  const [treasureStreak, setTreasureStreak] = useState(0)
  const [fuel, setFuel] = useState(35)
  const [distance, setDistance] = useState(0)
  const [timeLeftMs, setTimeLeftMs] = useState(battleTimeLimitMs)
  const startedAtRef = useRef(Date.now())
  const finishedRef = useRef(false)

  const attackWarning = variant === 'battle' && (results.length + 1) % 4 === 0
  const questionStages = variant === 'battle' ? selectedBattleStages : allStages
  const battleMonsterFact = questionPlanet === 'multiply' ? monsterFactFromQuestion(question) : null

  function toggleBattleStage(stage: number) {
    const exists = selectedBattleStages.includes(stage)
    const nextStages = exists
      ? selectedBattleStages.filter((candidate) => candidate !== stage)
      : [...selectedBattleStages, stage]
    if (nextStages.length === 0) {
      return
    }
    setSelectedBattleStages(nextStages.sort((left, right) => left - right))
  }

  function toggleAllBattleStages() {
    setSelectedBattleStages(selectedBattleStages.length === allStages.length ? [2] : [...allStages])
  }

  function resetRunState() {
    finishedRef.current = false
    setQuestion(
      createMiniQuestion({
        planet: questionPlanet,
        numericRocketDifficulty,
        facts: saveData.progress.facts, schoolMode2Enabled: saveData.settings.schoolMode2Enabled,
        stages: questionStages,
        additionRocketDifficulty,
        subtractionRocketDifficulty,
        divisionRocketDifficulty,
      }),
    )
    setFeedback('idle')
    setResults([])
    setScoreState({ score: 0, combo: 0, maxCombo: 0 })
    setHearts(3)
    setEnemyHp(100)
    setSpecialGauge(0)
    setSpecialUses(0)
    setKeys(0)
    setEarnedKeyIds([])
    setTreasureStreak(0)
    setFuel(35)
    setDistance(0)
    setTimeLeftMs(battleTimeLimitMs)
    startedAtRef.current = Date.now()
  }

  function startGame() {
    resetRunState()
    setPhase('running')
  }

  const nextQuestion = useCallback((completedResults = results) => {
    setQuestion(
      createMiniQuestion({
        planet: questionPlanet,
        numericRocketDifficulty,
        facts: factsWithResults(saveData.progress.facts, completedResults), schoolMode2Enabled: saveData.settings.schoolMode2Enabled, recentIncorrectCount: resultIncorrectStreak(completedResults),
        stages: questionStages,
        additionRocketDifficulty,
        subtractionRocketDifficulty,
        divisionRocketDifficulty,
      }),
    )
    setFeedback('idle')
    setTimeLeftMs(battleTimeLimitMs)
    startedAtRef.current = Date.now()
  }, [
    numericRocketDifficulty, saveData.progress.facts, saveData.settings.schoolMode2Enabled, results,
    additionRocketDifficulty,
    divisionRocketDifficulty,
    questionPlanet,
    questionStages,
    subtractionRocketDifficulty,
  ])

  const finish = useCallback(
    (
      nextResults = results,
      nextScoreState = scoreState,
      options: {
        battleEnemyHp?: number
        battleHearts?: number
        rocketDistance?: number
        specialUses?: number
        treasureBonusCoins?: number
        treasureChestLabels?: string[]
        treasureDuplicate?: boolean
        treasurePoolExhausted?: boolean
        treasureItemId?: string
        treasureItemName?: string
        treasureBuddyId?: string
        treasureBuddyName?: string | null
        treasureEffectId?: string
        treasureEffectName?: string | null
        treasureKeyIds?: string[]
        treasureKeys?: number
        treasureMethod?: string
        treasureOpenedAt?: string
      } = {},
    ) => {
      if (finishedRef.current) {
        return
      }
      finishedRef.current = true
      const finalScore =
        variant === 'rocket' ? Math.round(options.rocketDistance ?? distance) : nextScoreState.score
      const rawSummary = buildSessionSummary({
        id: createId(variant),
        mode: variant,
        maxCombo: nextScoreState.maxCombo,
        score: finalScore,
        results: nextResults,
        finishedAt: new Date().toISOString(),
      })
      const details: NonNullable<GameSessionSummary['details']> = {}
      if (operationPlanet) {
        details.planet = questionPlanet
      }
      if (isAdditionPlanet && variant === 'rocket') {
        details.additionRocketDifficulty = additionRocketDifficulty
      }
      if (isSubtractionPlanet && variant === 'rocket') {
        details.subtractionRocketDifficulty = subtractionRocketDifficulty
      }
      if (isDivisionPlanet && variant === 'rocket') {
        details.divisionRocketDifficulty = divisionRocketDifficulty
      }
      if (numericPlanet && variant === 'rocket') details.numericRocketDifficulty = numericRocketDifficulty
      if (variant === 'battle') {
        details.heartsLeft = options.battleHearts ?? hearts
        details.specialUses = options.specialUses ?? specialUses
        details.enemyHpLeft = Math.max(0, options.battleEnemyHp ?? enemyHp)
      } else if (variant === 'treasure') {
        details.keys = options.treasureKeys ?? keys
        details.openedChests = options.treasureChestLabels?.length ?? 0
        details.chestLabels = options.treasureChestLabels ?? []
        details.treasureBonusCoins = options.treasureBonusCoins ?? 0
        details.treasureDuplicate = options.treasureDuplicate ?? false
        details.treasurePoolExhausted = options.treasurePoolExhausted ?? false
        details.treasureItemName =
          options.treasureItemName ?? options.treasureBuddyName ?? options.treasureEffectName ?? null
        details.treasureItemId = options.treasureItemId ?? null
        details.treasureBuddyId = options.treasureBuddyId ?? null
        details.treasureEffectId = options.treasureEffectId ?? null
        details.treasureKeyIds = options.treasureKeyIds ?? earnedKeyIds
        details.treasureKeyNames = (options.treasureKeyIds ?? earnedKeyIds)
          .map((keyId) => getKeyTypeById(keyId)?.name)
          .filter((name): name is string => Boolean(name))
      } else {
        details.rocketDistance = Math.round(options.rocketDistance ?? distance)
      }
      const summary = {
        ...rawSummary,
        earnedCoins: rawSummary.earnedCoins + (options.treasureBonusCoins ?? 0),
        details,
      }
      const applied = applySessionResult(saveData, summary, {
        rewardBudgetPaused: rewardBudgetReached,
      })
      let nextSave = applied.save
      let nextSummary = applied.summary
      if (variant === 'rocket') {
        const finalDistance = Math.round(options.rocketDistance ?? distance)
        const reachedBadgeIds = earnedRocketBadges(finalDistance)
        const newlyEarnedBadges = reachedBadgeIds.filter(
          (badgeId) => !saveData.progress.rocketBadges.includes(badgeId),
        )
        nextSave = {
          ...nextSave,
          progress: {
            ...nextSave.progress,
            rocketBadges: Array.from(
              new Set([...saveData.progress.rocketBadges, ...reachedBadgeIds]),
            ),
            collectionRecords: addCollectionRecords(
              nextSave.progress.collectionRecords,
              newlyEarnedBadges.map((badgeId) => ({
                kind: 'rocket-badge',
                id: badgeId,
                acquiredAt: nextSummary.finishedAt,
                method: 'ロケットチャレンジ',
              })),
            ),
          },
        }
        nextSummary = {
          ...nextSummary,
          details: {
            ...nextSummary.details,
            rocketBadges: newlyEarnedBadges
              .map((badgeId) => rocketBadges.find((badge) => badge.id === badgeId)?.name)
              .filter((badgeName): badgeName is string => Boolean(badgeName)),
            nextRocketBadgeName:
              rocketBadges.find((badge) => finalDistance < badge.distance)?.name ?? null,
            nextRocketBadgeDistance:
              rocketBadges.find((badge) => finalDistance < badge.distance)?.distance ?? null,
            rocketBestUpdated: nextSummary.bestUpdated,
          },
        }
      }
      if (variant === 'treasure') {
        const openedAt = options.treasureOpenedAt ?? new Date().toISOString()
        const treasureKeyIds = options.treasureKeyIds ?? earnedKeyIds
        const nextTreasureKeys = { ...nextSave.progress.treasureKeys }
        for (const keyId of treasureKeyIds) {
          const current = nextTreasureKeys[keyId] ?? {
            count: 0,
            firstAcquiredAt: null,
          }
          nextTreasureKeys[keyId] = {
            count: current.count + 1,
            firstAcquiredAt: current.firstAcquiredAt ?? openedAt,
          }
        }
        const alreadyOwned = options.treasureItemId
          ? nextSave.progress.ownedTreasureItems.some((item) => item.id === options.treasureItemId)
          : true
        const buddyRecords = options.treasureBuddyId
          ? addCollectionRecords(nextSave.progress.collectionRecords, [
              {
                kind: 'buddy',
                id: options.treasureBuddyId,
                acquiredAt: openedAt,
                method: options.treasureMethod ?? 'たからばこから入手',
              },
            ])
          : nextSave.progress.collectionRecords
        const effectAlreadyOwned = options.treasureEffectId
          ? nextSave.progress.ownedItems.includes(options.treasureEffectId)
          : true
        const effectRecords =
          options.treasureEffectId && !effectAlreadyOwned
            ? addCollectionRecords(buddyRecords, [
                {
                  kind: 'effect',
                  id: options.treasureEffectId,
                  acquiredAt: openedAt,
                  method: options.treasureMethod ?? 'たからばこから入手',
                },
              ])
            : buddyRecords
        nextSave = {
          ...nextSave,
          progress: {
            ...nextSave.progress,
            treasureKeys: nextTreasureKeys,
            collectionRecords: effectRecords,
            ownedItems:
              options.treasureEffectId && !effectAlreadyOwned
                ? [...nextSave.progress.ownedItems, options.treasureEffectId]
                : nextSave.progress.ownedItems,
            ownedTreasureItems:
              options.treasureItemId && !alreadyOwned
                ? [
                    ...nextSave.progress.ownedTreasureItems,
                    {
                      id: options.treasureItemId,
                      acquiredAt: openedAt,
                      method: options.treasureMethod ?? 'たからばこから入手',
                    },
                  ]
                : nextSave.progress.ownedTreasureItems,
          },
        }
      }
      setSaveData(nextSave)
      navigate('/result', { state: { summary: nextSummary } })
    },
    [
      additionRocketDifficulty,
      distance,
      divisionRocketDifficulty,
      earnedKeyIds,
      numericPlanet, numericRocketDifficulty, questionPlanet,
      enemyHp,
      hearts,
      isAdditionPlanet,
      isSubtractionPlanet,
      isDivisionPlanet,
      keys,
      navigate,
      operationPlanet,
      results,
      rewardBudgetReached,
      saveData,
      scoreState,
      setSaveData,
      specialUses,
      subtractionRocketDifficulty,
      variant,
    ],
  )

  const recordAnswer = useCallback(
    (answer: AnswerValue, forceIncorrect = false) => {
      if (phase !== 'running' || feedback !== 'idle') {
        return
      }
      const responseTimeMs = Date.now() - startedAtRef.current
      const correct = !forceIncorrect && isCorrectAnswer(question, answer)
      const result: AnswerResult = {
        questionId: question.id,
        prompt: question.prompt,
        expectedAnswer: question.answer,
        givenAnswer: answer,
        correct,
        difficulty: question.difficulty,
        responseTimeMs,
        answeredAt: new Date().toISOString(),
      }
      const nextResults = [...results, result]
      const nextScoreState = applyAnswerToScore(scoreState, correct, responseTimeMs)
      setResults(nextResults)
      setScoreState(nextScoreState)
      setFeedback(correct ? 'correct' : 'incorrect')
      if (correct) {
        playCorrectSound(saveData.settings.soundEnabled)
      }

      if (variant === 'battle') {
        const nextEnemyHp = Math.max(0, enemyHp - (correct ? 12 : 0))
        const nextHearts = correct ? hearts : Math.max(0, hearts - 1)
        setEnemyHp(nextEnemyHp)
        setHearts(nextHearts)
        setSpecialGauge((current) => (correct ? Math.min(specialGaugeMax, current + 1) : 0))
        window.setTimeout(() => {
          if (nextEnemyHp <= 0 || nextHearts <= 0 || nextResults.length >= battleGoal) {
            finish(nextResults, nextScoreState, {
              battleEnemyHp: nextEnemyHp,
              battleHearts: nextHearts,
              specialUses,
            })
          } else {
            nextQuestion(nextResults)
          }
        }, 650)
        return
      }

      if (variant === 'treasure') {
        const nextStreak = correct ? treasureStreak + 1 : 0
        const earnedKey = nextStreak >= 3
        const nextKey = earnedKey ? keyForTreasureStreak(earnedKeyIds.length) : null
        setKeys((current) => current + (earnedKey ? 1 : 0))
        if (nextKey) {
          setEarnedKeyIds((current) => [...current, nextKey.id])
        }
        setTreasureStreak(earnedKey ? 0 : nextStreak)
        window.setTimeout(() => {
          if (nextResults.length >= treasureGoal) {
            setPhase('chests')
          } else {
            nextQuestion(nextResults)
          }
        }, 650)
        return
      }

      const speedBonus = correct && responseTimeMs <= 1500 ? 26 : correct && responseTimeMs <= 2500 ? 16 : 8
      const nextFuel = Math.max(0, fuel + (correct ? 8 : -12))
      const nextDistance = distance + (correct ? 40 + speedBonus : 10)
      setFuel(nextFuel)
      setDistance(nextDistance)
      window.setTimeout(() => {
        if (nextFuel <= 0 || nextResults.length >= rocketGoal) {
          finish(nextResults, nextScoreState, { rocketDistance: nextDistance })
        } else {
          nextQuestion(nextResults)
        }
      }, 650)
    },
    [
      distance,
      enemyHp,
      feedback,
      setPhase,
      finish,
      fuel,
      hearts,
      nextQuestion,
      phase,
      question,
      results,
      saveData.settings.soundEnabled,
      scoreState,
      specialUses,
      earnedKeyIds.length,
      treasureStreak,
      variant,
    ],
  )

  useEffect(() => {
    if (variant !== 'battle' || phase !== 'running' || feedback !== 'idle') {
      return undefined
    }
    const interval = window.setInterval(() => {
      const remaining = battleTimeLimitMs - (Date.now() - startedAtRef.current)
      setTimeLeftMs(Math.max(0, remaining))
      if (remaining <= 0) {
        window.clearInterval(interval)
        recordAnswer('じかんぎれ', true)
      }
    }, 100)
    return () => window.clearInterval(interval)
  }, [feedback, phase, recordAnswer, variant])

  function useSpecialAttack() {
    if (variant !== 'battle' || specialGauge < specialGaugeMax || phase !== 'running') {
      return
    }
    const nextEnemyHp = Math.max(0, enemyHp - 34)
    const nextSpecialUses = specialUses + 1
    setEnemyHp(nextEnemyHp)
    setSpecialGauge(0)
    setSpecialUses(nextSpecialUses)
    if (nextEnemyHp <= 0) {
      finish(results, scoreState, {
        battleEnemyHp: nextEnemyHp,
        battleHearts: hearts,
        specialUses: nextSpecialUses,
      })
    }
  }

  function openChest(chest: (typeof treasureChestTypes)[number]) {
    const openedAt = new Date().toISOString()
    const ownedBuddyIds = saveData.progress.collectionRecords
      .filter((record) => record.id.startsWith('buddy:'))
      .map((record) => record.id.replace(/^buddy:/, ''))
    const ownedEffectIds = saveData.progress.ownedItems.filter((itemId) =>
      phase15EffectItemIds.includes(itemId),
    )
    const reward = openTreasureChest({
      chestId: chest.id,
      ownedItemIds: saveData.progress.ownedTreasureItems.map((item) => item.id),
      ownedBuddyIds,
      ownedEffectIds,
      includeBuddyRewards: true,
      includeEffectRewards: true,
      openedAt,
    })
    finish(results, scoreState, {
      treasureBonusCoins: reward.convertedCoins,
      treasureChestLabels: [chest.name],
      treasureDuplicate: reward.duplicate,
      treasurePoolExhausted: reward.poolExhausted,
      treasureItemId: reward.item?.id,
      treasureItemName: reward.item?.name,
      treasureBuddyId: reward.buddyId ?? undefined,
      treasureBuddyName: reward.buddyName,
      treasureEffectId: reward.effectId ?? undefined,
      treasureEffectName: reward.effectName,
      treasureKeyIds: earnedKeyIds,
      treasureKeys: keys,
      treasureMethod: reward.method,
      treasureOpenedAt: openedAt,
    })
  }

  if (phase === 'ready') {
    return (
      <AppShell title={config.title} backTo={backTo} className="mode-ready-shell mini-game-ready-shell">
        <ModeStartScreen
          title={config.title}
          eyebrow={config.eyebrow}
          description={config.startDescription}
          level={saveData.player?.level ?? 1}
          backTo={backTo}
          startLabel={operationPlanet ? 'すたーと！' : undefined}
          onStart={startGame}
        >
          {variant === 'battle' ? (
            <div className="stage-select-panel" aria-label="つかうだんをえらぶ">
              <div className="start-option-header">
                <strong>つかうだん</strong>
                <button className="secondary-action compact-action" type="button" onClick={toggleAllBattleStages}>
                  ぜんぶ
                </button>
              </div>
              <div className="stage-chip-grid">
                {allStages.map((stage) => {
                  const selected = selectedBattleStages.includes(stage)
                  return (
                    <button
                      className={selected ? 'stage-chip selected' : 'stage-chip'}
                      key={stage}
                      type="button"
                      onClick={() => toggleBattleStage(stage)}
                      aria-pressed={selected}
                    >
                      <strong>{stage}のだん</strong>
                      <span>{stageStars(stage)}</span>
                    </button>
                  )
                })}
              </div>
              <p className="quiet-text">えらんだだんのモンスターだけが出るよ</p>
            </div>
          ) : null}
          {operationPlanet && variant === 'rocket' ? (
            <div className="duration-select-panel addition-rocket-difficulty-panel" aria-label="むずかしさをえらぶ">
              <strong>むずかしさ</strong>
              <div className="segmented learn-start-segmented">
                {(numericPlanet ? numericRocketDifficulties(numericPlanet) : isAdditionPlanet
                  ? additionRocketDifficulties
                  : isSubtractionPlanet
                    ? subtractionRocketDifficulties
                    : divisionRocketDifficulties).map((difficulty) => (
                  <button
                    className={
                      (numericPlanet ? numericRocketDifficulty === difficulty.id : isAdditionPlanet
                        ? additionRocketDifficulty === difficulty.id
                        : isSubtractionPlanet
                          ? subtractionRocketDifficulty === difficulty.id
                          : divisionRocketDifficulty === difficulty.id)
                        ? 'selected'
                        : ''
                    }
                    key={difficulty.id}
                    type="button"
                    onClick={() => {
                      if (numericPlanet) {
                        setNumericRocketDifficulty(difficulty.id as NumericRocketDifficultyId)
                      } else if (isAdditionPlanet) {
                        setAdditionRocketDifficulty(difficulty.id as AdditionRocketDifficultyId)
                      } else if (isSubtractionPlanet) {
                        setSubtractionRocketDifficulty(
                          difficulty.id as SubtractionRocketDifficultyId,
                        )
                      } else {
                        setDivisionRocketDifficulty(difficulty.id as DivisionRocketDifficultyId)
                      }
                    }}
                    aria-pressed={
                      numericPlanet ? numericRocketDifficulty === difficulty.id : isAdditionPlanet
                        ? additionRocketDifficulty === difficulty.id
                        : isSubtractionPlanet
                          ? subtractionRocketDifficulty === difficulty.id
                          : divisionRocketDifficulty === difficulty.id
                    }
                  >
                    {difficulty.label}
                    <small>{difficulty.description}</small>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </ModeStartScreen>
      </AppShell>
    )
  }

  if (phase === 'chests') {
    return (
      <AppShell title="たからばこ" backTo={backTo}>
        <section className="treasure-chest-stage" aria-labelledby="treasure-open-title">
          <p className="welcome">かぎ {keys}ほん</p>
          <h2 id="treasure-open-title">ひらくたからばこをえらぼう</h2>
          <p className="title-line">はずれなし。はこの色で★のめやすがわかるよ。</p>
          <div className="treasure-chest-grid">
            {treasureChestTypes.map((chest) => {
              const keyType = getKeyTypeById(chest.keyId)
              const unlocked = earnedKeyIds.includes(chest.keyId)
              return (
                <button
                  className={unlocked ? 'treasure-chest-card' : 'treasure-chest-card locked'}
                  key={chest.id}
                  type="button"
                  onClick={() => openChest(chest)}
                  disabled={!unlocked}
                >
                  <TreasureIcon locked={!unlocked} className="treasure-preview-icon" />
                  {keyType ? (
                    <KeyIcon keyType={keyType} locked={!unlocked} className="treasure-key-icon" />
                  ) : null}
                  <strong>{unlocked ? chest.name : '？？？'}</strong>
                  <small>{chest.hint}</small>
                  <small>
                    {rarityStars(chest.rarityRange[0])}〜{rarityStars(chest.rarityRange[1])}
                  </small>
                </button>
              )
            })}
          </div>
          {keys === 0 ? (
            <button className="secondary-action wide" type="button" onClick={() => finish(results, scoreState)}>
              けっかへ
            </button>
          ) : null}
        </section>
      </AppShell>
    )
  }

  const meterValue =
    variant === 'battle' ? enemyHp : variant === 'treasure' ? keys : Math.round(distance)
  const limitPercent = Math.max(0, Math.round((timeLeftMs / battleTimeLimitMs) * 100))

  return (
    <AppShell title={config.title} backTo={backTo} className="game-shell">
      <section
        className={`mission-companion mini-game-command mini-game-command-${variant}`}
        aria-label={config.title}
      >
        {variant === 'battle' && battleMonsterFact ? (
          <MonsterSprite
            left={battleMonsterFact.left}
            right={battleMonsterFact.right}
            className="mini-battle-monster"
          />
        ) : variant === 'rocket' && equippedUfo ? (
          <UfoBadge ufo={equippedUfo} compact className="mini-equipped-ufo" />
        ) : (
          <KukucchiCharacter level={saveData.player?.level ?? 1} mood="cheer" />
        )}
        <div>
          <p className="welcome">{config.eyebrow}</p>
          <h2>{config.heading}</h2>
          <p className="title-line">{config.description}</p>
        </div>
        <div className="mini-game-meter" aria-label={config.statLabel}>
          <span aria-hidden="true">{config.icon}</span>
          <strong>{meterValue}</strong>
          <small>{config.statLabel}</small>
        </div>
      </section>

      <section
        className={`game-panel mini-game-panel mini-game-panel-${variant}`}
        aria-labelledby="mini-question"
      >
        <div className="question-header">
          <span>
            {results.length}/{config.goal}
          </span>
          {variant === 'battle' ? <span>はーと {'♥'.repeat(hearts) || '0'}</span> : null}
          {variant === 'treasure' ? <span>れんぞく {treasureStreak}/3</span> : null}
          {variant === 'rocket' ? <span>ねんりょう {fuel}</span> : null}
        </div>
        {variant === 'battle' ? (
          <div className="boss-time" aria-label={`のこり ${(timeLeftMs / 1000).toFixed(1)}びょう`}>
            <span>
              {attackWarning ? 'こうげきよこく！せいかいでまもる' : 'のこり'}{' '}
              {(timeLeftMs / 1000).toFixed(1)}びょう
            </span>
            <div>
              <i style={{ width: `${limitPercent}%` }} />
            </div>
          </div>
        ) : null}
        <h2 id="mini-question" className="question-prompt">
              <MathQuestion question={question}/>
        </h2>
        <GameFeedback state={feedback} correctAnswer={question.answer} />
        {variant === 'battle' ? (
          <button
            className="secondary-action wide"
            type="button"
            onClick={useSpecialAttack}
            disabled={specialGauge < specialGaugeMax || feedback !== 'idle'}
          >
            ひっさつわざ {specialGauge}/{specialGaugeMax}
          </button>
        ) : null}
        {variant === 'rocket' ? (
          <p className="quiet-text">
            じぶんのきろく {saveData.progress.bests[rocketRecordKey]?.score ?? 0} / つぎのばっじ{' '}
            {rocketBadges.find((badge) => distance < badge.distance)?.name ?? 'ぜんぶたっせい'}
          </p>
        ) : null}
        <AnswerControls
          question={question}
          answerMode="choice"
          inputValue=""
          onInputChange={() => undefined}
          onAnswer={(answer) => recordAnswer(answer)}
          disabled={feedback !== 'idle'}
        />
      </section>
    </AppShell>
  )
}
