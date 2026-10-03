import { advancedMonsterDefinitions } from '../../data/advancedMonsters'
import { additionAreaCorrectKey, additionMonsterDefinitions } from '../../data/additionMonsters'
import {
  subtractionAreaCorrectKey,
  subtractionMonsterDefinitions,
} from '../../data/subtractionMonsters'
import { divisionAreaCorrectKey, divisionMonsterDefinitions } from '../../data/divisionMonsters'
import { numericAreaCorrectKey, numericMonsterDefinitions } from '../../data/numericRewards'
import { bossDifficulties, bosses, bossLimitedItems } from '../../data/bosses'
import { buddyDefinitions } from '../../data/buddies'
import { keyTypes } from '../../data/keys'
import { shopItems } from '../../data/shopItems'
import { treasureItems } from '../../data/treasureItems'
import { ufoDefinitions } from '../../data/ufos'
import { collectionRecordId, addCollectionRecords } from '../collection/collectionRecords'
import { createFactProgress } from '../mastery/mastery'
import { createMultiplicationFactPool } from '../questions/factDifficulty'
import { expRequiredForLevel } from '../rewards/rewards'
import { getTitleDefinitions, grantPlayerTitles, titleRecordId } from '../rewards/titles'
import type { SaveData, BossDifficultyProgress } from '../../types/save'

export const debugMenuTapThreshold = 5
export const debugMenuPassword = 'kukucchi-dev'

export function isDebugPasswordValid(input: string, password = debugMenuPassword): boolean {
  return input.trim() === password
}

export function nextDebugTapState(
  currentCount: number,
  threshold = debugMenuTapThreshold,
): { count: number; opened: boolean } {
  const count = currentCount + 1
  return count >= threshold ? { count: 0, opened: true } : { count, opened: false }
}

function clearedDifficultyProgress(acquiredAt: string): BossDifficultyProgress {
  return {
    cleared: true,
    clearCount: 1,
    firstClearedAt: acquiredAt,
    bestTimeMs: 1000,
  }
}

export function addDebugCoins(save: SaveData, amount: number): SaveData {
  if (!save.player) {
    return save
  }
  return {
    ...save,
    player: {
      ...save.player,
      coins: save.player.coins + amount,
    },
  }
}

export function setDebugLevel(save: SaveData, level: number): SaveData {
  if (!save.player) {
    return save
  }
  const safeLevel = Math.max(1, Math.floor(level))
  return {
    ...save,
    player: {
      ...save.player,
      level: safeLevel,
      exp: expRequiredForLevel(safeLevel),
    },
  }
}

export function addAllDebugKeys(
  save: SaveData,
  count = 5,
  acquiredAt = new Date().toISOString(),
): SaveData {
  const treasureKeys = { ...save.progress.treasureKeys }
  for (const key of keyTypes) {
    const current = treasureKeys[key.id] ?? { count: 0, firstAcquiredAt: null }
    treasureKeys[key.id] = {
      count: current.count + count,
      firstAcquiredAt: current.firstAcquiredAt ?? acquiredAt,
    }
  }
  return {
    ...save,
    progress: {
      ...save.progress,
      treasureKeys,
    },
  }
}

export function fullOpenDebugSaveData(
  save: SaveData,
  acquiredAt = new Date().toISOString(),
): SaveData {
  const facts = { ...save.progress.facts }
  const monsterBook = new Set(save.progress.monsterBook)
  for (const fact of createMultiplicationFactPool({
    stages: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  })) {
    const factId = `${fact.left}x${fact.right}`
    const current = facts[factId] ?? createFactProgress(fact.left, fact.right)
    facts[factId] = {
      ...current,
      correctCount: Math.max(current.correctCount, 5),
      consecutiveCorrect: Math.max(current.consecutiveCorrect, 5),
      averageResponseTimeMs: current.averageResponseTimeMs || 1600,
      masteryLevel: 5,
    }
    monsterBook.add(factId)
  }

  const titleDefinitions = getTitleDefinitions()
  const categoryCorrect: Record<string, number> = {
    ...save.progress.categoryCorrect,
    'multiplication-square': Math.max(
      save.progress.categoryCorrect['multiplication-square'] ?? 0,
      40,
    ),
    'pi-multiplication': Math.max(save.progress.categoryCorrect['pi-multiplication'] ?? 0, 40),
    development: Math.max(save.progress.categoryCorrect.development ?? 0, 40),
  }
  for (const monster of additionMonsterDefinitions) {
    const key = additionAreaCorrectKey(monster.areaId)
    categoryCorrect[key] = Math.max(categoryCorrect[key] ?? 0, monster.threshold)
  }
  for (const monster of subtractionMonsterDefinitions) {
    const key = subtractionAreaCorrectKey(monster.areaId)
    categoryCorrect[key] = Math.max(categoryCorrect[key] ?? 0, monster.threshold)
  }
  for (const monster of divisionMonsterDefinitions) {
    const key = divisionAreaCorrectKey(monster.areaId)
    categoryCorrect[key] = Math.max(categoryCorrect[key] ?? 0, monster.threshold)
  }
  const bossProgress = { ...save.progress.bossProgress }
  for (const monster of numericMonsterDefinitions) {
    const key = numericAreaCorrectKey(monster.areaId)
    categoryCorrect[key] = Math.max(categoryCorrect[key] ?? 0, monster.threshold)
  }
  for (const boss of bosses) {
    bossProgress[boss.id] = {
      bossId: boss.id,
      difficulties: Object.keys(bossDifficulties).reduce<
        SaveData['progress']['bossProgress'][string]['difficulties']
      >((progress, difficultyId) => {
        progress[difficultyId as keyof typeof bossDifficulties] =
          clearedDifficultyProgress(acquiredAt)
        return progress
      }, {}),
    }
  }

  const withKeys = addAllDebugKeys(
    {
      ...save,
      player: save.player
        ? grantPlayerTitles(
            save.player,
            titleDefinitions.map((title) => title.id),
          )
        : save.player,
      progress: {
        ...save.progress,
        facts,
        monsterBook: Array.from(monsterBook),
        categoryCorrect,
        bossProgress,
        bossItems: Array.from(
          new Set([...save.progress.bossItems, ...bossLimitedItems.map((item) => item.id)]),
        ),
        ownedItems: Array.from(
          new Set([...save.progress.ownedItems, ...shopItems.map((item) => item.id)]),
        ),
        ownedTreasureItems: Array.from(
          new Map(
            [
              ...save.progress.ownedTreasureItems,
              ...treasureItems.map((item) => ({
                id: item.id,
                acquiredAt,
                method: 'かいはつしゃメニュー',
              })),
            ].map((record) => [record.id, record]),
          ).values(),
        ),
        ownedUfos: Array.from(
          new Set([...save.progress.ownedUfos, ...ufoDefinitions.map((ufo) => ufo.id)]),
        ),
        collectionRecords: addCollectionRecords(save.progress.collectionRecords, [
          ...buddyDefinitions.map((buddy) => ({
            kind: 'buddy',
            id: buddy.id,
            acquiredAt,
            method: 'かいはつしゃメニュー',
          })),
          ...titleDefinitions.map((title) => ({
            kind: 'title',
            id: titleRecordId(title.label),
            acquiredAt,
            method: 'かいはつしゃメニュー',
          })),
          ...ufoDefinitions.map((ufo) => ({
            kind: 'ufo',
            id: ufo.id,
            acquiredAt,
            method: 'かいはつしゃメニュー',
          })),
          ...shopItems.map((item) => ({
            kind: item.kind === 'buddy' ? 'buddy' : item.kind === 'effect' ? 'effect' : 'shop-item',
            id: item.id,
            acquiredAt,
            method: 'かいはつしゃメニュー',
          })),
          ...treasureItems.map((item) => ({
            kind: 'treasure',
            id: item.id,
            acquiredAt,
            method: 'かいはつしゃメニュー',
          })),
          ...bossLimitedItems.map((item) => ({
            kind: 'boss-item',
            id: item.id,
            acquiredAt,
            method: 'かいはつしゃメニュー',
          })),
          ...advancedMonsterDefinitions.map((monster) => ({
            kind: 'advanced-monster',
            id: monster.id,
            acquiredAt,
            method: 'かいはつしゃメニュー',
          })),
          ...Array.from(monsterBook).map((factId) => ({
            kind: 'monster',
            id: factId,
            acquiredAt,
            method: 'かいはつしゃメニュー',
          })),
        ]),
      },
    },
    5,
    acquiredAt,
  )

  return {
    ...withKeys,
    progress: {
      ...withKeys.progress,
      collectionRecords: withKeys.progress.collectionRecords.filter(
        (record, index, records) =>
          records.findIndex((candidate) => candidate.id === record.id) === index &&
          record.id !== collectionRecordId('title', ''),
      ),
    },
  }
}
