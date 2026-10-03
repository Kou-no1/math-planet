import {
  bossDifficulties,
  allGekimuzuTitle,
  bosses,
  additionLegendTitle,
  additionMasterTitle,
  divisionLegendTitle,
  divisionMasterTitle,
  getBossById,
  getBossDifficulty,
  legendaryBossTitle,
  subtractionLegendTitle,
  subtractionMasterTitle,
} from '../../data/bosses'
import type { BossAdvancedCategory, BossDefinition } from '../../data/bosses'
import type { KeyTypeId } from '../../data/keys'
import { galaxySwirlEffectId } from '../../data/shopItems'
import { specialUfoId } from '../../data/ufos'
import { addCollectionRecords } from '../collection/collectionRecords'
import {
  isAdditionFactProgress,
  isDivisionFactProgress,
  isMultiplicationFactProgress,
  isSubtractionFactProgress,
} from '../questions/factIds'
import { grantFinalTitleIfEarned } from '../rewards/finalTitle'
import { grantPlayerTitles, hasTitle, titleRecordId } from '../rewards/titles'
import type {
  BossDifficultyId,
  BossDifficultyProgress,
  BossProgress,
  SaveData,
} from '../../types/save'

const difficultyOrder: BossDifficultyId[] = ['normal', 'hard', 'fast', 'gekimuzu']
const bossUnlockRequiredCorrect = 20

function createDifficultyProgress(): BossDifficultyProgress {
  return {
    cleared: false,
    clearCount: 0,
    firstClearedAt: null,
    bestTimeMs: null,
  }
}

export function createBossProgress(bossId: string): BossProgress {
  return {
    bossId,
    difficulties: {},
  }
}

export function getBossProgress(save: SaveData, bossId: string): BossProgress {
  return save.progress.bossProgress[bossId] ?? createBossProgress(bossId)
}

export function getDifficultyProgress(
  save: SaveData,
  bossId: string,
  difficulty: BossDifficultyId,
): BossDifficultyProgress {
  return getBossProgress(save, bossId).difficulties[difficulty] ?? createDifficultyProgress()
}

export function countCorrectForStages(save: SaveData, stages: number[]): number {
  const stageSet = new Set(stages)
  return Object.values(save.progress.facts)
    .filter((fact) => isMultiplicationFactProgress(fact) && stageSet.has(fact.left))
    .reduce((sum, fact) => sum + fact.correctCount, 0)
}

function countCorrectByCategory(save: SaveData, category: BossAdvancedCategory): number {
  if (category === 'square') {
    return save.progress.categoryCorrect['multiplication-square'] ?? 0
  }
  if (category === 'pi') {
    return save.progress.categoryCorrect['pi-multiplication'] ?? 0
  }
  return save.progress.categoryCorrect.development ?? 0
}

function countCorrectForAdditionArea(save: SaveData, areaId: string): number {
  const categoryCount = save.progress.categoryCorrect[`addition:${areaId}`]
  if (typeof categoryCount === 'number') {
    return categoryCount
  }
  return Object.values(save.progress.facts)
    .filter((fact) => isAdditionFactProgress(fact) && fact.areaId === areaId)
    .reduce((sum, fact) => sum + fact.correctCount, 0)
}

function countCorrectForSubtractionArea(save: SaveData, areaId: string): number {
  const categoryCount = save.progress.categoryCorrect[`subtraction:${areaId}`]
  if (typeof categoryCount === 'number') {
    return categoryCount
  }
  return Object.values(save.progress.facts)
    .filter((fact) => isSubtractionFactProgress(fact) && fact.areaId === areaId)
    .reduce((sum, fact) => sum + fact.correctCount, 0)
}

function countCorrectForDivisionArea(save: SaveData, areaId: string): number {
  const categoryCount = save.progress.categoryCorrect[`division:${areaId}`]
  if (typeof categoryCount === 'number') {
    return categoryCount
  }
  return Object.values(save.progress.facts)
    .filter((fact) => isDivisionFactProgress(fact) && fact.areaId === areaId)
    .reduce((sum, fact) => sum + fact.correctCount, 0)
}

function areBasicStageBossesCleared(save: SaveData): boolean {
  return bosses
    .filter((boss) => boss.group === 'basic' && boss.id !== 'boss-all-kuku')
    .every((boss) => getDifficultyProgress(save, boss.id, 'normal').cleared)
}

export function isBossUnlocked(boss: BossDefinition, save: SaveData): boolean {
  if (boss.id === 'boss-all-kuku') {
    return areBasicStageBossesCleared(save)
  }
  if (boss.group === 'advanced') {
    return boss.advancedCategory
      ? countCorrectByCategory(save, boss.advancedCategory) >= bossUnlockRequiredCorrect
      : false
  }
  if (boss.group === 'addition') {
    return boss.additionAreaId
      ? countCorrectForAdditionArea(save, boss.additionAreaId) >= bossUnlockRequiredCorrect
      : false
  }
  if (boss.group === 'subtraction') {
    return boss.subtractionAreaId
      ? countCorrectForSubtractionArea(save, boss.subtractionAreaId) >= bossUnlockRequiredCorrect
      : false
  }
  if (boss.group === 'division') {
    return boss.divisionAreaId
      ? countCorrectForDivisionArea(save, boss.divisionAreaId) >= bossUnlockRequiredCorrect
      : false
  }
  return boss.stages ? countCorrectForStages(save, boss.stages) >= bossUnlockRequiredCorrect : false
}

export function countCorrectForBossUnlock(boss: BossDefinition, save: SaveData): number | null {
  if (boss.id === 'boss-all-kuku') {
    return null
  }
  if (boss.group === 'advanced') {
    return boss.advancedCategory ? countCorrectByCategory(save, boss.advancedCategory) : null
  }
  if (boss.group === 'addition') {
    return boss.additionAreaId ? countCorrectForAdditionArea(save, boss.additionAreaId) : null
  }
  if (boss.group === 'subtraction') {
    return boss.subtractionAreaId
      ? countCorrectForSubtractionArea(save, boss.subtractionAreaId)
      : null
  }
  if (boss.group === 'division') {
    return boss.divisionAreaId ? countCorrectForDivisionArea(save, boss.divisionAreaId) : null
  }
  return boss.stages ? countCorrectForStages(save, boss.stages) : null
}

export function remainingQuestionsToUnlockBoss(
  boss: BossDefinition,
  save: SaveData,
): number | null {
  if (isBossUnlocked(boss, save)) {
    return null
  }
  const currentCorrect = countCorrectForBossUnlock(boss, save)
  if (currentCorrect === null) {
    return null
  }
  return Math.max(0, bossUnlockRequiredCorrect - currentCorrect)
}

export function isDifficultyUnlocked(
  boss: BossDefinition,
  difficulty: BossDifficultyId,
  save: SaveData,
): boolean {
  if (!isBossUnlocked(boss, save)) {
    return false
  }
  const index = difficultyOrder.indexOf(difficulty)
  if (index <= 0) {
    return true
  }
  return getDifficultyProgress(save, boss.id, difficultyOrder[index - 1]).cleared
}

export function getClearedStars(save: SaveData, bossId: string): number {
  const boss = getBossById(bossId)
  return difficultyOrder.reduce((stars, difficulty) => {
    return getDifficultyProgress(save, bossId, difficulty).cleared
      ? Math.max(
          stars,
          boss ? getBossDifficulty(boss, difficulty).stars : bossDifficulties[difficulty].stars,
        )
      : stars
  }, 0)
}

function hasAllFastClears(save: SaveData): boolean {
  return bosses
    .filter(
      (boss) =>
        boss.group !== 'addition' && boss.group !== 'subtraction' && boss.group !== 'division',
    )
    .every((boss) => getDifficultyProgress(save, boss.id, 'fast').cleared)
}

function hasAllGekimuzuClears(save: SaveData): boolean {
  return bosses
    .filter(
      (boss) =>
        boss.group !== 'addition' && boss.group !== 'subtraction' && boss.group !== 'division',
    )
    .every((boss) => getDifficultyProgress(save, boss.id, 'gekimuzu').cleared)
}

function hasAllAdditionNormalClears(save: SaveData): boolean {
  const additionBosses = bosses.filter((boss) => boss.group === 'addition')
  return (
    additionBosses.length > 0 &&
    additionBosses.every((boss) => getDifficultyProgress(save, boss.id, 'normal').cleared)
  )
}

function hasAllAdditionGekimuzuClears(save: SaveData): boolean {
  const additionBosses = bosses.filter((boss) => boss.group === 'addition')
  return (
    additionBosses.length > 0 &&
    additionBosses.every((boss) => getDifficultyProgress(save, boss.id, 'gekimuzu').cleared)
  )
}

function hasAllSubtractionNormalClears(save: SaveData): boolean {
  const subtractionBosses = bosses.filter((boss) => boss.group === 'subtraction')
  return (
    subtractionBosses.length > 0 &&
    subtractionBosses.every((boss) => getDifficultyProgress(save, boss.id, 'normal').cleared)
  )
}

function hasAllSubtractionGekimuzuClears(save: SaveData): boolean {
  const subtractionBosses = bosses.filter((boss) => boss.group === 'subtraction')
  return (
    subtractionBosses.length > 0 &&
    subtractionBosses.every((boss) => getDifficultyProgress(save, boss.id, 'gekimuzu').cleared)
  )
}

function hasAllDivisionNormalClears(save: SaveData): boolean {
  const divisionBosses = bosses.filter((boss) => boss.group === 'division')
  return (
    divisionBosses.length > 0 &&
    divisionBosses.every((boss) => getDifficultyProgress(save, boss.id, 'normal').cleared)
  )
}

function hasAllDivisionGekimuzuClears(save: SaveData): boolean {
  const divisionBosses = bosses.filter((boss) => boss.group === 'division')
  return (
    divisionBosses.length > 0 &&
    divisionBosses.every((boss) => getDifficultyProgress(save, boss.id, 'gekimuzu').cleared)
  )
}

function addTreasureKeyRewards(
  treasureKeys: SaveData['progress']['treasureKeys'],
  keyIds: KeyTypeId[],
  acquiredAt: string,
): SaveData['progress']['treasureKeys'] {
  if (keyIds.length === 0) {
    return treasureKeys
  }
  const nextTreasureKeys = { ...treasureKeys }
  for (const keyId of keyIds) {
    const current = nextTreasureKeys[keyId] ?? {
      count: 0,
      firstAcquiredAt: null,
    }
    nextTreasureKeys[keyId] = {
      count: current.count + 1,
      firstAcquiredAt: current.firstAcquiredAt ?? acquiredAt,
    }
  }
  return nextTreasureKeys
}

export function keyRewardsForBossClear(
  boss: BossDefinition,
  difficulty: BossDifficultyId,
  firstClear: boolean,
): KeyTypeId[] {
  if (!firstClear || difficulty !== 'gekimuzu') {
    return []
  }
  if (boss.group === 'advanced' || boss.id === 'boss-all-kuku') {
    return ['star']
  }
  if (boss.group === 'addition') {
    return []
  }
  if (boss.group === 'subtraction') {
    return []
  }
  if (boss.group === 'division') {
    return []
  }
  return ['rainbow']
}

export function applyBossClearReward(
  save: SaveData,
  bossId: string,
  difficulty: BossDifficultyId,
  elapsedMs: number,
  clearedAt = new Date().toISOString(),
  options: { rewardBudgetPaused?: boolean } = {},
): {
  save: SaveData
  firstClear: boolean
  rewardItemIds: string[]
  rewardUfoIds: string[]
  rewardEffectIds: string[]
  rewardTitles: string[]
  grandReward: boolean
} {
  const boss = getBossById(bossId)
  if (!boss || !save.player) {
    return {
      save,
      firstClear: false,
      rewardItemIds: [],
      rewardUfoIds: [],
      rewardEffectIds: [],
      rewardTitles: [],
      grandReward: false,
    }
  }

  const currentBossProgress = getBossProgress(save, bossId)
  const currentDifficulty = getDifficultyProgress(save, bossId, difficulty)
  const firstClear = !currentDifficulty.cleared
  const nextDifficulty: BossDifficultyProgress = {
    cleared: true,
    clearCount: currentDifficulty.clearCount + 1,
    firstClearedAt: currentDifficulty.firstClearedAt ?? clearedAt,
    bestTimeMs:
      currentDifficulty.bestTimeMs === null
        ? elapsedMs
        : Math.min(currentDifficulty.bestTimeMs, elapsedMs),
  }

  const reward = boss.rewards[difficulty]
  const rewardItemIds = firstClear && reward.itemId ? [reward.itemId] : []
  const rewardUfoIds = firstClear && reward.ufoId ? [reward.ufoId] : []
  const rewardEffectIds = firstClear && reward.effectId ? [reward.effectId] : []
  const rewardTitles = firstClear ? [reward.title] : []
  const rewardKeyIds = keyRewardsForBossClear(boss, difficulty, firstClear)
  const withDifficulty: SaveData = {
    ...save,
    player: {
      ...grantPlayerTitles(save.player, rewardTitles),
      coins: save.player.coins + (firstClear || options.rewardBudgetPaused ? 0 : 12),
    },
    progress: {
      ...save.progress,
      bossItems: Array.from(new Set([...save.progress.bossItems, ...rewardItemIds])),
      ownedUfos: Array.from(new Set([...save.progress.ownedUfos, ...rewardUfoIds])),
      ownedItems: Array.from(new Set([...save.progress.ownedItems, ...rewardEffectIds])),
      equippedUfoId: save.progress.equippedUfoId ?? rewardUfoIds[0] ?? null,
      treasureKeys: addTreasureKeyRewards(save.progress.treasureKeys, rewardKeyIds, clearedAt),
      collectionRecords: addCollectionRecords(save.progress.collectionRecords, [
        ...rewardItemIds.map((itemId) => ({
          kind: 'boss-item',
          id: itemId,
          acquiredAt: clearedAt,
          method: `${boss.label} ${getBossDifficulty(boss, difficulty).label}`,
        })),
        ...rewardUfoIds.map((ufoId) => ({
          kind: 'ufo',
          id: ufoId,
          acquiredAt: clearedAt,
          method: `${boss.label} げきムズ`,
        })),
        ...rewardEffectIds.map((effectId) => ({
          kind: 'effect',
          id: effectId,
          acquiredAt: clearedAt,
          method: `${boss.label} ${getBossDifficulty(boss, difficulty).label}`,
        })),
        ...rewardTitles.map((title) => ({
          kind: 'title',
          id: titleRecordId(title),
          acquiredAt: clearedAt,
          method: `${boss.label} ${getBossDifficulty(boss, difficulty).label}`,
        })),
      ]),
      bossProgress: {
        ...save.progress.bossProgress,
        [bossId]: {
          ...currentBossProgress,
          difficulties: {
            ...currentBossProgress.difficulties,
            [difficulty]: nextDifficulty,
          },
        },
      },
    },
  }

  const player = withDifficulty.player
  if (!player) {
    return {
      save: withDifficulty,
      firstClear,
      rewardItemIds,
      rewardUfoIds,
      rewardEffectIds,
      rewardTitles,
      grandReward: false,
    }
  }

  const shouldGrantLegendary =
    hasAllFastClears(withDifficulty) && !hasTitle(player, legendaryBossTitle)
  const withLegendary: SaveData = shouldGrantLegendary
    ? {
        ...withDifficulty,
        player: grantPlayerTitles(player, [legendaryBossTitle]),
        progress: {
          ...withDifficulty.progress,
          collectionRecords: addCollectionRecords(withDifficulty.progress.collectionRecords, [
            {
              kind: 'title',
              id: titleRecordId(legendaryBossTitle),
              acquiredAt: clearedAt,
              method: '全ボスさいそく',
            },
          ]),
        },
      }
    : withDifficulty
  const legendaryTitles = shouldGrantLegendary ? [legendaryBossTitle] : []
  const additionTitlesToGrant = [
    boss.group === 'addition' &&
    hasAllAdditionNormalClears(withLegendary) &&
    !hasTitle(withLegendary.player, additionMasterTitle)
      ? additionMasterTitle
      : null,
    boss.group === 'addition' &&
    difficulty === 'gekimuzu' &&
    hasAllAdditionGekimuzuClears(withLegendary) &&
    !hasTitle(withLegendary.player, additionLegendTitle)
      ? additionLegendTitle
      : null,
  ].filter((title): title is string => Boolean(title))
  const withAdditionTitles: SaveData =
    additionTitlesToGrant.length > 0 && withLegendary.player
      ? {
          ...withLegendary,
          player: grantPlayerTitles(withLegendary.player, additionTitlesToGrant),
          progress: {
            ...withLegendary.progress,
            collectionRecords: addCollectionRecords(
              withLegendary.progress.collectionRecords,
              additionTitlesToGrant.map((title) => ({
                kind: 'title',
                id: titleRecordId(title),
                acquiredAt: clearedAt,
                method:
                  title === additionMasterTitle
                    ? 'たしざんぜんえりあぼす'
                    : 'たしざんぜんえりあげきむず',
              })),
            ),
          },
        }
      : withLegendary

  const subtractionTitlesToGrant = [
    boss.group === 'subtraction' &&
    hasAllSubtractionNormalClears(withAdditionTitles) &&
    !hasTitle(withAdditionTitles.player, subtractionMasterTitle)
      ? subtractionMasterTitle
      : null,
    boss.group === 'subtraction' &&
    difficulty === 'gekimuzu' &&
    hasAllSubtractionGekimuzuClears(withAdditionTitles) &&
    !hasTitle(withAdditionTitles.player, subtractionLegendTitle)
      ? subtractionLegendTitle
      : null,
  ].filter((title): title is string => Boolean(title))
  const withSubtractionTitles: SaveData =
    subtractionTitlesToGrant.length > 0 && withAdditionTitles.player
      ? {
          ...withAdditionTitles,
          player: grantPlayerTitles(withAdditionTitles.player, subtractionTitlesToGrant),
          progress: {
            ...withAdditionTitles.progress,
            collectionRecords: addCollectionRecords(
              withAdditionTitles.progress.collectionRecords,
              subtractionTitlesToGrant.map((title) => ({
                kind: 'title',
                id: titleRecordId(title),
                acquiredAt: clearedAt,
                method:
                  title === subtractionMasterTitle
                    ? 'ひきざんぜんえりあぼす'
                    : 'ひきざんぜんえりあげきむず',
              })),
            ),
          },
        }
      : withAdditionTitles

  const divisionTitlesToGrant = [
    boss.group === 'division' &&
    hasAllDivisionNormalClears(withSubtractionTitles) &&
    !hasTitle(withSubtractionTitles.player, divisionMasterTitle)
      ? divisionMasterTitle
      : null,
    boss.group === 'division' &&
    difficulty === 'gekimuzu' &&
    hasAllDivisionGekimuzuClears(withSubtractionTitles) &&
    !hasTitle(withSubtractionTitles.player, divisionLegendTitle)
      ? divisionLegendTitle
      : null,
  ].filter((title): title is string => Boolean(title))
  const withDivisionTitles: SaveData =
    divisionTitlesToGrant.length > 0 && withSubtractionTitles.player
      ? {
          ...withSubtractionTitles,
          player: grantPlayerTitles(withSubtractionTitles.player, divisionTitlesToGrant),
          progress: {
            ...withSubtractionTitles.progress,
            collectionRecords: addCollectionRecords(
              withSubtractionTitles.progress.collectionRecords,
              divisionTitlesToGrant.map((title) => ({
                kind: 'title',
                id: titleRecordId(title),
                acquiredAt: clearedAt,
                method:
                  title === divisionMasterTitle
                    ? 'わりざん全エリアボス'
                    : 'わりざん全エリアげきムズ',
              })),
            ),
          },
        }
      : withSubtractionTitles

  const currentOwnedUfos = withDivisionTitles.progress.ownedUfos
  const currentOwnedItems = withDivisionTitles.progress.ownedItems
  const shouldGrantGrandReward =
    difficulty === 'gekimuzu' &&
    hasAllGekimuzuClears(withDivisionTitles) &&
    (!currentOwnedUfos.includes(specialUfoId) || !currentOwnedItems.includes(galaxySwirlEffectId))
  if (!shouldGrantGrandReward) {
    const finalTitleResult = grantFinalTitleIfEarned(withDivisionTitles, clearedAt)
    const finalTitle = finalTitleResult.granted ? allGekimuzuTitle : null
    return {
      save: finalTitleResult.save,
      firstClear,
      rewardItemIds,
      rewardUfoIds,
      rewardEffectIds,
      rewardTitles: Array.from(
        new Set([
          ...rewardTitles,
          ...legendaryTitles,
          ...additionTitlesToGrant,
          ...subtractionTitlesToGrant,
          ...divisionTitlesToGrant,
          ...(finalTitle ? [finalTitle] : []),
        ]),
      ),
      grandReward: finalTitleResult.granted,
    }
  }

  const grandPlayer = withDivisionTitles.player
  if (!grandPlayer) {
    return {
      save: withDivisionTitles,
      firstClear,
      rewardItemIds,
      rewardUfoIds,
      rewardEffectIds,
      rewardTitles: Array.from(
        new Set([
          ...rewardTitles,
          ...legendaryTitles,
          ...additionTitlesToGrant,
          ...subtractionTitlesToGrant,
          ...divisionTitlesToGrant,
        ]),
      ),
      grandReward: false,
    }
  }
  const allRewardUfos = Array.from(new Set([...rewardUfoIds, specialUfoId]))
  const withGrandReward: SaveData = {
    ...withDivisionTitles,
    progress: {
      ...withDivisionTitles.progress,
      ownedUfos: Array.from(new Set([...withDivisionTitles.progress.ownedUfos, specialUfoId])),
      ownedItems: Array.from(
        new Set([...withDivisionTitles.progress.ownedItems, galaxySwirlEffectId]),
      ),
      equippedUfoId: withDivisionTitles.progress.equippedUfoId ?? specialUfoId,
      collectionRecords: addCollectionRecords(withDivisionTitles.progress.collectionRecords, [
        {
          kind: 'ufo',
          id: specialUfoId,
          acquiredAt: clearedAt,
          method: '全ボスげきムズ',
        },
        {
          kind: 'effect',
          id: galaxySwirlEffectId,
          acquiredAt: clearedAt,
          method: '全ボスげきムズ',
        },
      ]),
    },
  }
  const finalTitleResult = grantFinalTitleIfEarned(withGrandReward, clearedAt)
  const finalTitle = finalTitleResult.granted ? allGekimuzuTitle : null
  return {
    save: finalTitleResult.save,
    firstClear,
    rewardItemIds,
    rewardUfoIds: allRewardUfos,
    rewardEffectIds: Array.from(new Set([...rewardEffectIds, galaxySwirlEffectId])),
    rewardTitles: Array.from(
      new Set([
        ...rewardTitles,
        ...legendaryTitles,
        ...additionTitlesToGrant,
        ...subtractionTitlesToGrant,
        ...divisionTitlesToGrant,
        ...(finalTitle ? [finalTitle] : []),
      ]),
    ),
    grandReward: true,
  }
}
