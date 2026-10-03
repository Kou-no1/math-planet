import { bossLimitedItems, bosses, bossDifficultyIds } from '../../data/bosses'
import { advancedMonsterDefinitions, isAdvancedMonsterOwned } from '../../data/advancedMonsters'
import { additionMonsterDefinitions, isAdditionMonsterOwned } from '../../data/additionMonsters'
import {
  isSubtractionMonsterOwned,
  subtractionMonsterDefinitions,
} from '../../data/subtractionMonsters'
import { divisionMonsterDefinitions, isDivisionMonsterOwned } from '../../data/divisionMonsters'
import { numericMonsterDefinitions, isNumericMonsterOwned } from '../../data/numericRewards'
import { keyTypes } from '../../data/keys'
import { buddyDefinitions } from '../../data/buddies'
import { rocketBadges } from '../../data/rocketBadges'
import { treasureItems } from '../../data/treasureItems'
import { ufoDefinitions } from '../../data/ufos'
import type { SaveData } from '../../types/save'
import { createMultiplicationFactPool } from '../questions/factDifficulty'
import { getDifficultyProgress } from '../bosses/bossEngine'
import { getTitleDefinitions, titleRecordId } from '../rewards/titles'

export type BookTabId =
  | 'kukucchi'
  | 'monsters'
  | 'buddies'
  | 'ufos'
  | 'treasures'
  | 'collection'
  | 'titles'

export type BookProgressCount = {
  owned: number
  total: number
  percent: number
}

export type BookProgressSummary = {
  tabs: Record<BookTabId, BookProgressCount>
  overall: BookProgressCount
}

export const kukucchiRecordTotal = 3

function countPercent(owned: number, total: number): BookProgressCount {
  return {
    owned,
    total,
    percent: total === 0 ? 0 : Math.round((owned / total) * 100),
  }
}

export function countKukucchiRecords(save: SaveData): number {
  const level = save.player?.level ?? 1
  const milestones = [level >= 1, level >= 5, level >= 10].filter(Boolean).length
  const rocket = rocketBadges.filter((badge) => save.progress.rocketBadges.includes(badge.id),
  ).length
  return milestones + rocket
}

export function calculateBookProgress(save: SaveData): BookProgressSummary {
  const monsterTotal = createMultiplicationFactPool({
    stages: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    minDifficulty: 1,
  }).length
  const bossOwned = bosses.filter((boss) =>
    bossDifficultyIds.some(
      (difficulty) => getDifficultyProgress(save, boss.id, difficulty).cleared,
    ),
  ).length
  const advancedMonsterOwned = advancedMonsterDefinitions.filter((monster) =>
    isAdvancedMonsterOwned(save.progress.categoryCorrect, monster),
  ).length
  const additionMonsterOwned = additionMonsterDefinitions.filter((monster) =>
    isAdditionMonsterOwned(save.progress.categoryCorrect, monster),
  ).length
  const subtractionMonsterOwned = subtractionMonsterDefinitions.filter((monster) =>
    isSubtractionMonsterOwned(save.progress.categoryCorrect, monster),
  ).length
  const divisionMonsterOwned = divisionMonsterDefinitions.filter((monster) =>
    isDivisionMonsterOwned(save.progress.categoryCorrect, monster),
  ).length
  const titleDefinitions = getTitleDefinitions()
  const definedTitles = new Set(titleDefinitions.map((title) => title.id))
  const ownedTitleCount = new Set(
    (save.player?.titles ?? []).map(titleRecordId).filter((title) => definedTitles.has(title)),
  ).size
  const ownedBuddyCount = save.progress.collectionRecords.filter((record) =>
    record.id.startsWith('buddy:'),
  ).length
  const tabs: Record<BookTabId, BookProgressCount> = {
    kukucchi: countPercent(countKukucchiRecords(save), kukucchiRecordTotal + rocketBadges.length),
    monsters: countPercent(
      new Set(save.progress.monsterBook).size +
        advancedMonsterOwned +
        additionMonsterOwned +
        subtractionMonsterOwned +
        divisionMonsterOwned + numericMonsterDefinitions.filter((monster) => isNumericMonsterOwned(monster, save.progress.categoryCorrect)).length,
      monsterTotal +
        advancedMonsterDefinitions.length +
        additionMonsterDefinitions.length +
        subtractionMonsterDefinitions.length +
        divisionMonsterDefinitions.length + numericMonsterDefinitions.length,
    ),
    buddies: countPercent(
      new Set(save.progress.monsterBook).size + ownedBuddyCount,
      monsterTotal + buddyDefinitions.length,
    ),
    ufos: countPercent(new Set(save.progress.ownedUfos).size, ufoDefinitions.length),
    treasures: countPercent(
      new Set(save.progress.bossItems).size + bossOwned,
      bossLimitedItems.length + bosses.length,
    ),
    collection: countPercent(
      new Set(save.progress.ownedTreasureItems.map((item) => item.id)).size +
        keyTypes.filter((key) => (save.progress.treasureKeys[key.id]?.count ?? 0) > 0).length,
      treasureItems.length + keyTypes.length,
    ),
    titles: countPercent(ownedTitleCount, titleDefinitions.length),
  }
  const overallTotal = Object.values(tabs).reduce((sum, tab) => sum + tab.total, 0)
  const overallOwned = Object.values(tabs).reduce((sum, tab) => sum + tab.owned, 0)
  return {
    tabs,
    overall: countPercent(overallOwned, overallTotal),
  }
}
