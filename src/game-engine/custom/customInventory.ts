import { getTitleDefinitions, titleRecordId } from '../rewards/titles'
import { createMultiplicationFactPool } from '../questions/factDifficulty'
import { getCollectionRecord } from '../collection/collectionRecords'
import {
  additionCorrectForArea,
  additionMonsterDefinitions,
  isAdditionMonsterOwned,
  type AdditionMonsterDefinition,
} from '../../data/additionMonsters'
import {
  isSubtractionMonsterOwned,
  subtractionCorrectForArea,
  subtractionMonsterDefinitions,
  type SubtractionMonsterDefinition,
} from '../../data/subtractionMonsters'
import {
  divisionCorrectForArea,
  divisionMonsterDefinitions,
  isDivisionMonsterOwned,
  type DivisionMonsterDefinition,
} from '../../data/divisionMonsters'
import { buddyDefinitions, buddyThemeLabels, type BuddyDefinition } from '../../data/buddies'
import {
  getEquipmentSlotForKind,
  shopItems,
  type ShopItem,
  type ShopItemVisualLayer,
} from '../../data/shopItems'
import { ufoDefinitions, type UfoDefinition } from '../../data/ufos'
import type { SaveData } from '../../types/save'
import type {
  OperationRewardOrigin,
  RewardOrigin,
  VisibleStarFilter,
} from '../../types/rewardOrigin'

export type CustomTabId = 'window' | 'ufo' | 'hat' | 'suit' | 'buddy' | 'effect' | 'title'

export type CustomEntryKind =
  | 'shop'
  | 'ufo'
  | 'monster-buddy'
  | 'addition-monster-buddy'
  | 'subtraction-monster-buddy'
  | 'division-monster-buddy'
  | 'dedicated-buddy'
  | 'title'

export type CustomOperationOrigin = OperationRewardOrigin

export type CustomRewardOrigin = RewardOrigin

export type CustomStarFilter = VisibleStarFilter

export type CustomInventoryEntry = {
  id: string
  tabId: CustomTabId
  kind: CustomEntryKind
  origin: CustomRewardOrigin
  label: string
  description: string
  owned: boolean
  selected: boolean
  method: string
  acquiredAt: string | null
  item?: ShopItem
  ufo?: UfoDefinition
  buddy?: BuddyDefinition
  monsterFact?: {
    left: number
    right: number
  }
  additionMonster?: AdditionMonsterDefinition
  subtractionMonster?: SubtractionMonsterDefinition
  divisionMonster?: DivisionMonsterDefinition
}

export type CustomInventoryTab = {
  id: CustomTabId
  label: string
  ownedCount: number
  totalCount: number
  entries: CustomInventoryEntry[]
}

const tabLabels: Record<CustomTabId, string> = {
  window: 'はいけい',
  ufo: 'UFO',
  hat: 'ぼうし',
  suit: 'スーツ',
  buddy: 'なかま',
  effect: 'エフェクト',
  title: 'しょうごう',
}

const tabOrder: CustomTabId[] = ['window', 'ufo', 'hat', 'suit', 'buddy', 'effect', 'title']

export const customStarFilterLabels: Record<CustomStarFilter, string> = {
  all: 'ぜんぶ',
  add: 'たしざん',
  subtract: 'ひきざん',
  multiply: 'かけざん',
  divide: 'わりざん',
}

export const customStarFilterOrder: CustomStarFilter[] = [
  'all',
  'add',
  'subtract',
  'multiply',
  'divide',
]

export const customRewardOrigins: CustomRewardOrigin[] = [
  'all',
  'add',
  'sub',
  'subtract',
  'multiply',
  'divide',
  'decimal',
  'fraction',
]

export function matchesCustomStarFilter(
  origin: CustomRewardOrigin,
  starFilter: CustomStarFilter,
): boolean {
  if (starFilter === 'subtract') {
    return origin === 'subtract' || origin === 'sub'
  }
  return starFilter === 'all' || origin === starFilter
}

function tabForVisualLayer(layer: ShopItemVisualLayer): CustomTabId | null {
  if (layer === 'window') {
    return 'window'
  }
  if (layer === 'hat') {
    return 'hat'
  }
  if (layer === 'wear') {
    return 'suit'
  }
  if (layer === 'effect') {
    return 'effect'
  }
  if (layer === 'buddy') {
    return 'buddy'
  }
  return null
}

function isItemSelected(save: SaveData, item: ShopItem): boolean {
  const slot = getEquipmentSlotForKind(item.kind)
  return save.progress.equippedItems.some((equippedId) => {
    const equippedItem = shopItems.find((candidate) => candidate.id === equippedId)
    return equippedItem?.id === item.id && slot.kinds.includes(equippedItem.kind)
  })
}

function shopEntries(save: SaveData): CustomInventoryEntry[] {
  const ownedItems = new Set([...save.progress.ownedItems, ...save.progress.equippedItems])
  return shopItems.flatMap((item) => {
    const tabId = item.kind === 'buddy' ? null : tabForVisualLayer(item.visual.layer)
    if (!tabId) {
      return []
    }
    const owned = ownedItems.has(item.id)
    return [
      {
        id: item.id,
        tabId,
        kind: 'shop',
        origin: item.rewardOrigin ?? (item.availableInShop === false ? 'multiply' : 'all'),
        label: item.name,
        description: item.description,
        owned,
        selected: owned && isItemSelected(save, item),
        method:
          item.availableInShop === false
            ? 'とくべつほうしゅう'
            : item.kind === 'buddy'
              ? 'ショップ'
              : `${item.price}コイン`,
        acquiredAt: null,
        item,
      } satisfies CustomInventoryEntry,
    ]
  })
}

function ufoEntries(save: SaveData): CustomInventoryEntry[] {
  const ownedUfos = new Set(save.progress.ownedUfos)
  return ufoDefinitions.map((ufo) => {
    const owned = ownedUfos.has(ufo.id)
    const record = getCollectionRecord(save.progress.collectionRecords, 'ufo', ufo.id)
    return {
      id: ufo.id,
      tabId: 'ufo',
      kind: 'ufo',
      origin: ufo.origin ?? 'multiply',
      label: ufo.name,
      description: ufo.description,
      owned,
      selected: owned && save.progress.equippedUfoId === ufo.id,
      method: record?.method ?? 'ボスげきムズ',
      acquiredAt: record?.acquiredAt ?? null,
      ufo,
    }
  })
}

function monsterBuddyEntries(save: SaveData): CustomInventoryEntry[] {
  const monsterBook = new Set(save.progress.monsterBook)
  return createMultiplicationFactPool({
    stages: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    minDifficulty: 1,
  }).map((fact) => {
    const factId = `${fact.left}x${fact.right}`
    const selectionId = `monster:${factId}`
    const owned = monsterBook.has(factId)
    const record = getCollectionRecord(save.progress.collectionRecords, 'monster', factId)
    return {
      id: selectionId,
      tabId: 'buddy',
      kind: 'monster-buddy',
      origin: 'multiply',
      label: owned ? `${fact.left} × ${fact.right}` : '？？？',
      description: owned ? 'にがてをこくふくしたなかま' : 'にがてをこくふくすると なかまになる',
      owned,
      selected: owned && save.progress.equippedBuddyId === selectionId,
      method: record?.method ?? 'にがてをこくふく',
      acquiredAt: record?.acquiredAt ?? null,
      monsterFact: { left: fact.left, right: fact.right },
    }
  })
}

function additionMonsterBuddyEntries(save: SaveData): CustomInventoryEntry[] {
  return additionMonsterDefinitions.map((monster) => {
    const selectionId = `addition-monster:${monster.id}`
    const owned = isAdditionMonsterOwned(save.progress.categoryCorrect, monster)
    const progressCount = additionCorrectForArea(save.progress.categoryCorrect, monster.areaId)
    return {
      id: selectionId,
      tabId: 'buddy',
      kind: 'addition-monster-buddy',
      origin: monster.origin,
      label: owned ? monster.name : '？？？',
      description: owned ? monster.description : `${progressCount}/${monster.threshold}もん`,
      owned,
      selected: owned && save.progress.equippedBuddyId === selectionId,
      method: owned ? `${monster.threshold}もん せいかい` : 'たしざんのほし',
      acquiredAt: null,
      additionMonster: monster,
    } satisfies CustomInventoryEntry
  })
}

function subtractionMonsterBuddyEntries(save: SaveData): CustomInventoryEntry[] {
  return subtractionMonsterDefinitions.map((monster) => {
    const selectionId = `subtraction-monster:${monster.id}`
    const owned = isSubtractionMonsterOwned(save.progress.categoryCorrect, monster)
    const progressCount = subtractionCorrectForArea(save.progress.categoryCorrect, monster.areaId)
    return {
      id: selectionId,
      tabId: 'buddy',
      kind: 'subtraction-monster-buddy',
      origin: monster.origin,
      label: owned ? monster.name : '？？？',
      description: owned ? monster.description : `${progressCount}/${monster.threshold}もん`,
      owned,
      selected: owned && save.progress.equippedBuddyId === selectionId,
      method: owned ? `${monster.threshold}もん せいかい` : 'ひきざんのほし',
      acquiredAt: null,
      subtractionMonster: monster,
    } satisfies CustomInventoryEntry
  })
}

function divisionMonsterBuddyEntries(save: SaveData): CustomInventoryEntry[] {
  return divisionMonsterDefinitions.map((monster) => {
    const selectionId = `division-monster:${monster.id}`
    const owned = isDivisionMonsterOwned(save.progress.categoryCorrect, monster)
    const progressCount = divisionCorrectForArea(save.progress.categoryCorrect, monster.areaId)
    return {
      id: selectionId,
      tabId: 'buddy',
      kind: 'division-monster-buddy',
      origin: monster.origin,
      label: owned ? monster.name : '？？？',
      description: owned ? monster.description : `${progressCount}/${monster.threshold}もん`,
      owned,
      selected: owned && save.progress.equippedBuddyId === selectionId,
      method: owned ? `${monster.threshold}もん せいかい` : 'わりざんのほし',
      acquiredAt: null,
      divisionMonster: monster,
    } satisfies CustomInventoryEntry
  })
}

function dedicatedBuddyEntries(save: SaveData): CustomInventoryEntry[] {
  return buddyDefinitions.map((buddy) => {
    const record = getCollectionRecord(save.progress.collectionRecords, 'buddy', buddy.id)
    const owned = Boolean(record)
    const selectionId = `buddy:${buddy.id}`
    return {
      id: selectionId,
      tabId: 'buddy',
      kind: 'dedicated-buddy',
      origin: 'all',
      label: owned ? buddy.name : '？？？',
      description: owned ? buddy.description : `${buddyThemeLabels[buddy.theme]}のなかま`,
      owned,
      selected: owned && save.progress.equippedBuddyId === selectionId,
      method: record?.method ?? (buddy.source === 'shop' ? 'ショップ' : 'たからばこ'),
      acquiredAt: record?.acquiredAt ?? null,
      buddy,
    }
  })
}

function titleEntries(save: SaveData): CustomInventoryEntry[] {
  const ownedTitles = new Set((save.player?.titles ?? []).map(titleRecordId))
  return getTitleDefinitions()
    .map((title) => {
      const record = getCollectionRecord(save.progress.collectionRecords, 'title', title.id)
      const owned = ownedTitles.has(title.id)
      return {
        id: title.id,
        tabId: 'title',
        kind: 'title',
        origin: title.origin ?? 'multiply',
        label: owned ? title.label : '？？？',
        description: owned ? title.description : 'まだ見つけていないしょうごう',
        owned,
        selected: owned && titleRecordId(save.player?.currentTitle ?? '') === title.id,
        method: record?.method ?? title.method,
        acquiredAt: record?.acquiredAt ?? null,
      } satisfies CustomInventoryEntry
    })
    .sort((left, right) => Number(right.owned) - Number(left.owned))
}

export function buildCustomInventory(
  save: SaveData,
  starFilter: CustomStarFilter = 'all',
): CustomInventoryTab[] {
  const entries = [
    ...shopEntries(save),
    ...ufoEntries(save),
    ...monsterBuddyEntries(save),
    ...additionMonsterBuddyEntries(save),
    ...subtractionMonsterBuddyEntries(save),
    ...divisionMonsterBuddyEntries(save),
    ...dedicatedBuddyEntries(save),
    ...titleEntries(save),
  ].filter((entry) => matchesCustomStarFilter(entry.origin, starFilter))
  return tabOrder.map((tabId) => {
    const tabEntries = entries.filter((entry) => entry.tabId === tabId)
    return {
      id: tabId,
      label: tabLabels[tabId],
      ownedCount: tabEntries.filter((entry) => entry.owned).length,
      totalCount: tabEntries.length,
      entries: tabEntries,
    }
  })
}

export function customTabLabels(): Record<CustomTabId, string> {
  return tabLabels
}
