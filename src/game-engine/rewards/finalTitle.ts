import { advancedMonsterDefinitions, isAdvancedMonsterOwned } from '../../data/advancedMonsters'
import { allGekimuzuTitle, bosses } from '../../data/bosses'
import { buddyDefinitions } from '../../data/buddies'
import { shopItems } from '../../data/shopItems'
import { ufoDefinitions } from '../../data/ufos'
import type { SaveData } from '../../types/save'
import {
  addCollectionRecords,
  collectionRecordId,
  getCollectionRecord,
} from '../collection/collectionRecords'
import { createMultiplicationFactPool } from '../questions/factDifficulty'
import { getTitleDefinitions, grantPlayerTitles, hasTitle, titleRecordId } from './titles'

const customShopLayers = new Set(['window', 'hat', 'wear', 'effect'])

export function hasAllOtherTitlesForFinalTitle(save: SaveData): boolean {
  return getTitleDefinitions()
    .filter((title) => title.label !== allGekimuzuTitle)
    .every((title) => hasTitle(save.player, title.id))
}

export function hasAllCustomItemsForFinalTitle(save: SaveData): boolean {
  const ownedItems = new Set([...save.progress.ownedItems, ...save.progress.equippedItems])
  const ownedUfos = new Set(save.progress.ownedUfos)
  const hasShopItems = shopItems
    .filter((item) => customShopLayers.has(item.visual.layer))
    .every((item) => ownedItems.has(item.id))
  const hasUfos = ufoDefinitions.every((ufo) => ownedUfos.has(ufo.id))
  const hasBuddies = buddyDefinitions.every((buddy) =>
    Boolean(getCollectionRecord(save.progress.collectionRecords, 'buddy', buddy.id)),
  )
  return hasShopItems && hasUfos && hasBuddies
}

export function hasAllMonstersForFinalTitle(save: SaveData): boolean {
  const monsterBook = new Set(save.progress.monsterBook)
  const hasBasicMonsters = createMultiplicationFactPool({
    stages: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  }).every((fact) => monsterBook.has(`${fact.left}x${fact.right}`))
  const hasAdvancedMonsters = advancedMonsterDefinitions.every(
    (monster) =>
      isAdvancedMonsterOwned(save.progress.categoryCorrect, monster) ||
      Boolean(getCollectionRecord(save.progress.collectionRecords, 'advanced-monster', monster.id)),
  )
  return hasBasicMonsters && hasAdvancedMonsters
}

export function hasAllBossesForFinalTitle(save: SaveData): boolean {
  return bosses.every(
    (boss) => save.progress.bossProgress[boss.id]?.difficulties.gekimuzu?.cleared === true,
  )
}

export function canGrantFinalTitle(save: SaveData): boolean {
  if (!save.player || hasTitle(save.player, allGekimuzuTitle)) {
    return false
  }
  return (
    hasAllOtherTitlesForFinalTitle(save) &&
    hasAllCustomItemsForFinalTitle(save) &&
    hasAllMonstersForFinalTitle(save) &&
    hasAllBossesForFinalTitle(save)
  )
}

export function grantFinalTitleIfEarned(
  save: SaveData,
  acquiredAt = new Date().toISOString(),
  method = 'さいごのコンプリート',
): { save: SaveData; granted: boolean } {
  if (!canGrantFinalTitle(save) || !save.player) {
    return { save, granted: false }
  }
  const titleRecord = collectionRecordId('title', titleRecordId(allGekimuzuTitle))
  return {
    granted: true,
    save: {
      ...save,
      player: grantPlayerTitles(save.player, [allGekimuzuTitle]),
      progress: {
        ...save.progress,
        collectionRecords: addCollectionRecords(
          save.progress.collectionRecords.filter((record) => record.id !== titleRecord),
          [
            {
              kind: 'title',
              id: titleRecordId(allGekimuzuTitle),
              acquiredAt,
              method,
            },
          ],
        ),
      },
    },
  }
}
