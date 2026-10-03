import { buddyDefinitions, getBuddyById } from '../../data/buddies'
import { getAdditionMonsterById, isAdditionMonsterOwned } from '../../data/additionMonsters'
import {
  getSubtractionMonsterById,
  isSubtractionMonsterOwned,
} from '../../data/subtractionMonsters'
import { getDivisionMonsterById, isDivisionMonsterOwned } from '../../data/divisionMonsters'
import { getNumericMonsterById, isNumericMonsterOwned } from '../../data/numericRewards'
import type { SaveData } from '../../types/save'
import { collectionRecordId, getCollectionRecord } from './collectionRecords'

export type BuddySelection =
  | {
      type: 'monster'
      id: string
      left: number
      right: number
      label: string
      acquiredAt: string | null
      method: string
    }
  | {
      type: 'buddy'
      id: string
      buddyId: string
      label: string
      acquiredAt: string | null
      method: string
    }

export function monsterBuddySelectionId(left: number, right: number): string {
  return `monster:${left}x${right}`
}

export function dedicatedBuddySelectionId(buddyId: string): string {
  return `buddy:${buddyId}`
}

export function parseMonsterBuddySelectionId(
  selectionId: string | null | undefined,
): { left: number; right: number } | null {
  const match = selectionId?.match(/^monster:(\d+)x(\d+)$/)
  if (!match) {
    return null
  }
  return {
    left: Number(match[1]),
    right: Number(match[2]),
  }
}

export function parseDedicatedBuddySelectionId(
  selectionId: string | null | undefined,
): string | null {
  const match = selectionId?.match(/^buddy:(.+)$/)
  return match?.[1] ?? null
}

export function parseAdditionMonsterBuddySelectionId(
  selectionId: string | null | undefined,
): string | null {
  const match = selectionId?.match(/^addition-monster:(.+)$/)
  return match?.[1] ?? null
}

export function parseSubtractionMonsterBuddySelectionId(
  selectionId: string | null | undefined,
): string | null {
  const match = selectionId?.match(/^subtraction-monster:(.+)$/)
  return match?.[1] ?? null
}

export function parseDivisionMonsterBuddySelectionId(
  selectionId: string | null | undefined,
): string | null {
  const match = selectionId?.match(/^division-monster:(.+)$/)
  return match?.[1] ?? null
}

export function isDedicatedBuddyOwned(save: SaveData, buddyId: string): boolean {
  return Boolean(getCollectionRecord(save.progress.collectionRecords, 'buddy', buddyId))
}

export function isBuddySelectionOwned(save: SaveData, selectionId: string | null): boolean {
  if (selectionId?.startsWith('numeric-monster:')) {
    const definition = getNumericMonsterById(selectionId.slice('numeric-monster:'.length))
    return Boolean(definition && isNumericMonsterOwned(definition, save.progress.categoryCorrect))
  }
  if (!selectionId) {
    return true
  }
  const monster = parseMonsterBuddySelectionId(selectionId)
  if (monster) {
    return save.progress.monsterBook.includes(`${monster.left}x${monster.right}`)
  }
  const additionMonsterId = parseAdditionMonsterBuddySelectionId(selectionId)
  if (additionMonsterId) {
    const monsterDefinition = getAdditionMonsterById(additionMonsterId)
    return monsterDefinition
      ? isAdditionMonsterOwned(save.progress.categoryCorrect, monsterDefinition)
      : false
  }
  const subtractionMonsterId = parseSubtractionMonsterBuddySelectionId(selectionId)
  if (subtractionMonsterId) {
    const monsterDefinition = getSubtractionMonsterById(subtractionMonsterId)
    return monsterDefinition
      ? isSubtractionMonsterOwned(save.progress.categoryCorrect, monsterDefinition)
      : false
  }
  const divisionMonsterId = parseDivisionMonsterBuddySelectionId(selectionId)
  if (divisionMonsterId) {
    const monsterDefinition = getDivisionMonsterById(divisionMonsterId)
    return monsterDefinition
      ? isDivisionMonsterOwned(save.progress.categoryCorrect, monsterDefinition)
      : false
  }
  const buddyId = parseDedicatedBuddySelectionId(selectionId)
  return buddyId ? isDedicatedBuddyOwned(save, buddyId) : false
}

export function getOwnedBuddySelections(save: SaveData): BuddySelection[] {
  const overcomeMonsters = save.progress.monsterBook
    .map((factId) => {
      const [leftText, rightText] = factId.split('x')
      const left = Number(leftText)
      const right = Number(rightText)
      if (!left || !right) {
        return null
      }
      const record = getCollectionRecord(save.progress.collectionRecords, 'monster', factId)
      return {
        type: 'monster' as const,
        id: monsterBuddySelectionId(left, right),
        left,
        right,
        label: `${left}×${right}`,
        acquiredAt: record?.acquiredAt ?? null,
        method: record?.method ?? 'にがてをこくふく',
      }
    })
    .filter(
      (selection): selection is Extract<BuddySelection, { type: 'monster' }> =>
        selection !== null,
    )

  const dedicated = buddyDefinitions
    .filter((buddy) => isDedicatedBuddyOwned(save, buddy.id))
    .map((buddy) => {
      const record = getCollectionRecord(save.progress.collectionRecords, 'buddy', buddy.id)
      return {
        type: 'buddy' as const,
        id: dedicatedBuddySelectionId(buddy.id),
        buddyId: buddy.id,
        label: buddy.name,
        acquiredAt: record?.acquiredAt ?? null,
        method: record?.method ?? (buddy.source === 'shop' ? 'ショップ' : 'たからばこ'),
      }
    })

  return [...overcomeMonsters, ...dedicated]
}

export function coerceEquippedBuddyId(save: SaveData): string | null {
  return isBuddySelectionOwned(save, save.progress.equippedBuddyId)
    ? save.progress.equippedBuddyId
    : null
}

export function buddyCollectionRecordId(buddyId: string): string {
  return collectionRecordId('buddy', buddyId)
}

export function resolveBuddyName(buddyId: string): string {
  return getBuddyById(buddyId)?.name ?? buddyId
}
