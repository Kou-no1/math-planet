import type { MultiplicationFactProgress } from '../types/game'
import type { CollectionRecord, PlayerData, ProgressData } from '../types/save'
import type { OnboardingInput, SaveData } from '../types/save'
import { allGekimuzuTitle, bosses, bossLimitedItems, legendaryBossTitle } from '../data/bosses'
import { defaultSpeedStages, speedDurations } from '../data/factDifficulty'
import { keyTypes } from '../data/keys'
import {
  coerceCharacterName,
  coerceShipName,
  defaultCharacterName,
  defaultShipName,
} from '../data/shipName'
import { specialUfoId } from '../data/ufos'
import { collectionRecordId } from '../game-engine/collection/collectionRecords'
import { isMultiplicationFactProgress } from '../game-engine/questions/factIds'
import { DEFAULT_DAILY_BUDGET_MINUTES } from '../game-engine/school/dailyUsage'
import { DEFAULT_SCHOOL_MODE_2_ENABLED } from '../game-engine/school/schoolMode2'
import { titleRecordId } from '../game-engine/rewards/titles'
import { isMonsterOvercome } from '../game-engine/review/weakFacts'

export const SAVE_DATA_VERSION = 15
const LEGACY_ADVANCED_BOSS_RESET_VERSION = 10
const ADDITION_ROCKET_TITLE_MIGRATION_VERSION = 14
const additionRocketTitleMigrationEntries = [
  ['ろけっとびぎなー', 'たしざんロケットビギナー'],
  ['ろけっとぱいろっと', 'たしざんロケットパイロット'],
  ['ろけっときゃぷてん', 'たしざんロケットキャプテン'],
] as const
const additionRocketTitleMigrationMap = new Map<string, string>(additionRocketTitleMigrationEntries)

const legacyAdvancedBossIds = ['boss-square', 'boss-pi'] as const
const legacyAdvancedBossIdSet = new Set<string>(legacyAdvancedBossIds)
const legacyAdvancedBossTitles = new Set<string>([
  ...bosses
    .filter((boss) => legacyAdvancedBossIdSet.has(boss.id))
    .flatMap((boss) => Object.values(boss.rewards).map((reward) => reward.title)),
  legendaryBossTitle,
  allGekimuzuTitle,
])
const legacyAdvancedBossItemIds = new Set(
  bossLimitedItems
    .filter((item) => legacyAdvancedBossIdSet.has(item.bossId))
    .map((item) => item.id),
)
const legacyAdvancedUfoIds = new Set([
  ...legacyAdvancedBossIds.map((bossId) => `${bossId}-ufo`),
  specialUfoId,
])
const legacyAdvancedCollectionRecordIds = new Set<string>([
  ...legacyAdvancedBossIds.map((bossId) => collectionRecordId('ufo', `${bossId}-ufo`)),
  collectionRecordId('ufo', specialUfoId),
  ...Array.from(legacyAdvancedBossItemIds).map((itemId) => collectionRecordId('boss-item', itemId)),
  ...Array.from(legacyAdvancedBossTitles).flatMap((title) => [
    collectionRecordId('title', title),
    collectionRecordId('title', titleRecordId(title)),
  ]),
])

function shouldRemoveTimeOnlyMonsterFact(fact: MultiplicationFactProgress): boolean {
  const attempts = fact.correctCount + fact.incorrectCount
  return (
    isMultiplicationFactProgress(fact) &&
    attempts >= 2 &&
    fact.incorrectCount === 0 &&
    fact.masteryLevel < 4 &&
    fact.averageResponseTimeMs >= 4800
  )
}

function cleanTimeOnlyMonsterFacts(
  facts: Record<string, MultiplicationFactProgress>,
): Record<string, MultiplicationFactProgress> {
  return Object.fromEntries(
    Object.entries(facts).filter(([, fact]) => !shouldRemoveTimeOnlyMonsterFact(fact)),
  )
}

function defaultTreasureKeys(): SaveData['progress']['treasureKeys'] {
  return Object.fromEntries(keyTypes.map((key) => [key.id, { count: 0, firstAcquiredAt: null }]))
}

function normalizeTreasureKeys(
  keys: Partial<SaveData['progress']['treasureKeys']> | undefined,
): SaveData['progress']['treasureKeys'] {
  return Object.fromEntries(
    keyTypes.map((key) => {
      const current = keys?.[key.id]
      return [
        key.id,
        {
          count: Math.max(0, current?.count ?? 0),
          firstAcquiredAt: current?.firstAcquiredAt ?? null,
        },
      ]
    }),
  )
}

function normalizeCollectionRecords(records: CollectionRecord[] | undefined): CollectionRecord[] {
  return Array.isArray(records)
    ? records.filter((record) => record.id && record.acquiredAt && record.method)
    : []
}

function normalizePlayer(player: SaveData['player'] | undefined | null): SaveData['player'] {
  if (!player) {
    return null
  }
  const partialPlayer = player as Partial<PlayerData>
  return {
    ...player,
    shipName: coerceShipName(partialPlayer.shipName),
    characterName: coerceCharacterName(partialPlayer.characterName),
  }
}

function migrateAdditionRocketTitle(title: string): string {
  return additionRocketTitleMigrationMap.get(title) ?? title
}

function uniqueTitles(titles: string[]): string[] {
  return Array.from(new Set(titles))
}

function migrateAdditionRocketTitlePlayer(player: SaveData['player']): SaveData['player'] {
  if (!player) {
    return player
  }
  return {
    ...player,
    titles: uniqueTitles(player.titles.map(migrateAdditionRocketTitle)),
    currentTitle: migrateAdditionRocketTitle(player.currentTitle),
  }
}

function migrateAdditionRocketTitleRecord(record: CollectionRecord): CollectionRecord {
  const migrated = additionRocketTitleMigrationEntries.find(
    ([oldTitle]) => record.id === collectionRecordId('title', titleRecordId(oldTitle)),
  )
  if (!migrated) {
    return record
  }
  const [oldTitle, newTitle] = migrated
  return {
    ...record,
    id: collectionRecordId('title', titleRecordId(newTitle)),
    method: record.method.replace(oldTitle, newTitle),
  }
}

function migrateAdditionRocketTitleRecords(records: CollectionRecord[]): CollectionRecord[] {
  const byId = new Map<string, CollectionRecord>()
  for (const record of records.map(migrateAdditionRocketTitleRecord)) {
    if (!byId.has(record.id)) {
      byId.set(record.id, record)
    }
  }
  return Array.from(byId.values())
}

function migrateAdditionRocketTitleProgress(progress: ProgressData): ProgressData {
  return {
    ...progress,
    collectionRecords: migrateAdditionRocketTitleRecords(progress.collectionRecords),
  }
}

function maybeMigrateAdditionRocketTitlePlayer(
  player: SaveData['player'],
  shouldMigrate: boolean,
): SaveData['player'] {
  return shouldMigrate ? migrateAdditionRocketTitlePlayer(player) : player
}

function maybeMigrateAdditionRocketTitleProgress(
  progress: ProgressData,
  shouldMigrate: boolean,
): ProgressData {
  return shouldMigrate ? migrateAdditionRocketTitleProgress(progress) : progress
}

function resetLegacyAdvancedBossPlayer(player: SaveData['player']): SaveData['player'] {
  if (!player) {
    return player
  }
  const titles = player.titles.filter((title) => !legacyAdvancedBossTitles.has(title))
  return {
    ...player,
    titles,
    currentTitle: legacyAdvancedBossTitles.has(player.currentTitle)
      ? (titles.at(-1) ?? 'はじめのいっぽ')
      : player.currentTitle,
  }
}

function resetLegacyAdvancedBossProgress(progress: ProgressData): ProgressData {
  const bossProgress = { ...progress.bossProgress }
  for (const bossId of legacyAdvancedBossIds) {
    delete bossProgress[bossId]
  }
  const ownedUfos = progress.ownedUfos.filter((ufoId) => !legacyAdvancedUfoIds.has(ufoId))
  return {
    ...progress,
    bossProgress,
    bossItems: progress.bossItems.filter((itemId) => !legacyAdvancedBossItemIds.has(itemId)),
    ownedUfos,
    equippedUfoId:
      progress.equippedUfoId && legacyAdvancedUfoIds.has(progress.equippedUfoId)
        ? (ownedUfos[0] ?? null)
        : progress.equippedUfoId,
    collectionRecords: progress.collectionRecords.filter(
      (record) => !legacyAdvancedCollectionRecordIds.has(record.id),
    ),
  }
}

function maybeResetLegacyAdvancedBossPlayer(
  player: SaveData['player'],
  shouldReset: boolean,
): SaveData['player'] {
  return shouldReset ? resetLegacyAdvancedBossPlayer(player) : player
}

function maybeResetLegacyAdvancedBossProgress(
  progress: ProgressData,
  shouldReset: boolean,
): ProgressData {
  return shouldReset ? resetLegacyAdvancedBossProgress(progress) : progress
}

export function createDefaultSaveData(): SaveData {
  return {
    version: SAVE_DATA_VERSION,
    player: null,
    settings: {
      soundEnabled: true,
      speechEnabled: true,
      reduceMotion: false,
      dailyBudgetMinutes: DEFAULT_DAILY_BUDGET_MINUTES,
      schoolMode2Enabled: DEFAULT_SCHOOL_MODE_2_ENABLED,
      practiceQuestionCount: 9,
      practiceAnswerMode: 'choice',
    },
    progress: {
      facts: {},
      history: [],
      bests: {},
      missions: [],
      missionDate: null,
      monsterBook: [],
      categoryCorrect: {},
      bossProgress: {},
      bossItems: [],
      ownedUfos: [],
      equippedUfoId: null,
      ownedItems: ['basic-room'],
      equippedItems: ['basic-room'],
      equippedBuddyId: null,
      speedSettings: {
        selectedStages: [...defaultSpeedStages],
        durationSeconds: speedDurations[0],
      },
      rocketBestDistance: 0,
      rocketBadges: [],
      collectionRecords: [],
      ownedTreasureItems: [],
      treasureKeys: defaultTreasureKeys(),
    },
    tutorial: {
      homeSeen: false,
      modeTipsSeen: [],
    },
  }
}

export function createPlayerFromOnboarding(input: OnboardingInput): SaveData {
  const now = new Date().toISOString()
  const firstTitle = titleRecordId('はじめのいっぽ')
  const defaults = createDefaultSaveData()
  return {
    ...defaults,
    player: {
      nickname: input.nickname.trim() || 'くくとも',
      icon: input.icon,
      shipName: defaultShipName,
      characterName: defaultCharacterName,
      learningLevel: input.learningLevel,
      level: 1,
      exp: 0,
      coins: 0,
      titles: [firstTitle],
      currentTitle: firstTitle,
      createdAt: now,
      lastPlayedAt: now,
    },
    settings: {
      soundEnabled: input.soundEnabled,
      speechEnabled: true,
      reduceMotion: false,
      dailyBudgetMinutes: DEFAULT_DAILY_BUDGET_MINUTES,
      schoolMode2Enabled: DEFAULT_SCHOOL_MODE_2_ENABLED,
      practiceQuestionCount: 9,
      practiceAnswerMode: 'choice',
    },
    progress: {
      ...defaults.progress,
      collectionRecords: [
        {
          id: collectionRecordId('title', titleRecordId(firstTitle)),
          acquiredAt: now,
          method: '初回設定',
        },
      ],
    },
  }
}

function normalizeLegacySaveData(raw: unknown): SaveData {
  if (!raw || typeof raw !== 'object') {
    return createDefaultSaveData()
  }

  const candidate = raw as Partial<SaveData>
  const defaults = createDefaultSaveData()
  const shouldResetLegacyAdvancedBosses =
    (candidate.version ?? 0) < LEGACY_ADVANCED_BOSS_RESET_VERSION
  const shouldMigrateAdditionRocketTitles =
    (candidate.version ?? 0) < ADDITION_ROCKET_TITLE_MIGRATION_VERSION
  if (candidate.version === SAVE_DATA_VERSION) {
    return {
      ...defaults,
      ...candidate,
      player: maybeMigrateAdditionRocketTitlePlayer(
        maybeResetLegacyAdvancedBossPlayer(
          normalizePlayer(candidate.player),
          shouldResetLegacyAdvancedBosses,
        ),
        shouldMigrateAdditionRocketTitles,
      ),
      progress: maybeMigrateAdditionRocketTitleProgress(
        maybeResetLegacyAdvancedBossProgress(
          {
            ...defaults.progress,
            ...candidate.progress,
            facts: cleanTimeOnlyMonsterFacts(candidate.progress?.facts ?? {}),
            categoryCorrect: candidate.progress?.categoryCorrect ?? {},
            bossProgress: candidate.progress?.bossProgress ?? {},
            bossItems: candidate.progress?.bossItems ?? [],
            ownedUfos: candidate.progress?.ownedUfos ?? [],
            equippedUfoId: candidate.progress?.equippedUfoId ?? null,
            equippedBuddyId: candidate.progress?.equippedBuddyId ?? null,
            speedSettings: {
              ...defaults.progress.speedSettings,
              ...candidate.progress?.speedSettings,
              selectedStages:
                candidate.progress?.speedSettings?.selectedStages ??
                defaults.progress.speedSettings.selectedStages,
              durationSeconds:
                candidate.progress?.speedSettings?.durationSeconds ??
                defaults.progress.speedSettings.durationSeconds,
            },
            rocketBestDistance: candidate.progress?.rocketBestDistance ?? 0,
            rocketBadges: candidate.progress?.rocketBadges ?? [],
            collectionRecords: normalizeCollectionRecords(candidate.progress?.collectionRecords),
            ownedTreasureItems: candidate.progress?.ownedTreasureItems ?? [],
            treasureKeys: normalizeTreasureKeys(candidate.progress?.treasureKeys),
          },
          shouldResetLegacyAdvancedBosses,
        ),
        shouldMigrateAdditionRocketTitles,
      ),
      settings: {
        ...defaults.settings,
        ...candidate.settings,
      },
      tutorial: {
        ...defaults.tutorial,
        ...candidate.tutorial,
      },
    }
  }

  return {
    ...defaults,
    ...candidate,
    version: SAVE_DATA_VERSION,
    player: maybeMigrateAdditionRocketTitlePlayer(
      maybeResetLegacyAdvancedBossPlayer(
        normalizePlayer(candidate.player),
        shouldResetLegacyAdvancedBosses,
      ),
      shouldMigrateAdditionRocketTitles,
    ),
    progress: maybeMigrateAdditionRocketTitleProgress(
      maybeResetLegacyAdvancedBossProgress(
        {
          ...defaults.progress,
          ...candidate.progress,
          facts: cleanTimeOnlyMonsterFacts(candidate.progress?.facts ?? {}),
          categoryCorrect: candidate.progress?.categoryCorrect ?? {},
          bossProgress: candidate.progress?.bossProgress ?? {},
          bossItems: candidate.progress?.bossItems ?? [],
          ownedUfos: candidate.progress?.ownedUfos ?? [],
          equippedUfoId: candidate.progress?.equippedUfoId ?? null,
          equippedBuddyId: candidate.progress?.equippedBuddyId ?? null,
          speedSettings: {
            ...defaults.progress.speedSettings,
            ...candidate.progress?.speedSettings,
            selectedStages:
              candidate.progress?.speedSettings?.selectedStages ??
              defaults.progress.speedSettings.selectedStages,
            durationSeconds:
              candidate.progress?.speedSettings?.durationSeconds ??
              defaults.progress.speedSettings.durationSeconds,
          },
          rocketBestDistance: candidate.progress?.rocketBestDistance ?? 0,
          rocketBadges: candidate.progress?.rocketBadges ?? [],
          collectionRecords: normalizeCollectionRecords(candidate.progress?.collectionRecords),
          ownedTreasureItems: candidate.progress?.ownedTreasureItems ?? [],
          treasureKeys: normalizeTreasureKeys(candidate.progress?.treasureKeys),
        },
        shouldResetLegacyAdvancedBosses,
      ),
      shouldMigrateAdditionRocketTitles,
    ),
    settings: {
      ...defaults.settings,
      ...candidate.settings,
    },
    tutorial: {
      ...defaults.tutorial,
      ...candidate.tutorial,
    },
  }
}

export function migrateSaveData(raw: unknown): SaveData {
  const save = normalizeLegacySaveData(raw)
  const oldVersion = raw && typeof raw === 'object' ? ((raw as Partial<SaveData>).version ?? 0) : 0
  const sharedTitle = 'おおきいかずこまんだー'
  const subtractionTitle = titleRecordId('おおひきこまんだー')
  const subtractionCleared =
    save.progress.bossProgress['boss-sub-three-digit']?.difficulties.normal?.cleared === true
  const additionCleared =
    save.progress.bossProgress['boss-add-three-digit']?.difficulties.normal?.cleared === true
  const titleIds = (title: string): string[] => {
    if (oldVersion < 15 && title === sharedTitle && subtractionCleared) {
      return additionCleared ? [titleRecordId(sharedTitle), subtractionTitle] : [subtractionTitle]
    }
    return [titleRecordId(title)]
  }
  const facts = Object.fromEntries(
    Object.entries(save.progress.facts).map(([id, fact]) => {
      const wrong = fact.recentResults.filter((result) => !result.correct).at(-1)
      const knownOvercome =
        isMonsterOvercome(fact) ||
        (fact.incorrectCount > 0 && save.progress.monsterBook.includes(id))
      return [
        id,
        {
          ...fact,
          firstIncorrectAt:
            fact.firstIncorrectAt ??
            wrong?.answeredAt ??
            (fact.incorrectCount > 0 ? fact.lastAnsweredAt : null),
          overcomeAt: fact.overcomeAt ?? (knownOvercome ? fact.lastAnsweredAt : null),
        },
      ]
    }),
  )
  const records = new Map<string, CollectionRecord>()
  for (const record of save.progress.collectionRecords) {
    const ids = record.id.startsWith('title:')
      ? titleIds(record.id.slice('title:'.length)).map((id) => collectionRecordId('title', id))
      : [record.id]
    for (const id of ids) {
      const existing = records.get(id)
      if (!existing || record.acquiredAt < existing.acquiredAt) records.set(id, { ...record, id })
    }
  }
  return {
    ...save,
    version: SAVE_DATA_VERSION,
    player: save.player
      ? {
          ...save.player,
          titles: Array.from(new Set(save.player.titles.flatMap(titleIds))),
          currentTitle: titleIds(save.player.currentTitle)[0],
        }
      : null,
    settings: {
      ...save.settings,
      practiceQuestionCount: [5, 9, 15].includes(save.settings.practiceQuestionCount)
        ? save.settings.practiceQuestionCount
        : 9,
      practiceAnswerMode: save.settings.practiceAnswerMode === 'input' ? 'input' : 'choice',
    },
    progress: {
      ...save.progress,
      facts,
      collectionRecords: [...records.values()],
      history: save.progress.history.map((entry) => ({
        ...entry,
        planet: entry.planet ?? 'legacy',
      })),
      bests: Object.fromEntries(
        Object.entries(save.progress.bests).map(([key, value]) => [
          key.startsWith('[') || key.startsWith('legacy:') ? key : `legacy:${key}`,
          value,
        ]),
      ),
    },
  }
}

export function parseSaveData(text: string): SaveData {
  const raw: unknown = JSON.parse(text)
  const object = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value)
  const invalid = () => { throw new Error('セーブデータの形式が正しくありません') }
  if (!object(raw) || !Number.isInteger(raw.version) || Number(raw.version) < 1) invalid()
  const candidate = raw as Record<string, unknown>
  if (Number(candidate.version) > SAVE_DATA_VERSION) {
    throw new Error('新しいバージョンの記録です。元のデータを保護しています。')
  }
  if (!object(candidate.progress) || !object(candidate.settings) ||
      !(candidate.player === null || object(candidate.player))) invalid()

  // Check supplied legacy fields before normalization can silently discard them.
  function checkShape(value: unknown, sample: unknown) {
    if (Array.isArray(sample)) {
      if (!Array.isArray(value)) invalid()
    } else if (object(sample)) {
      if (!object(value)) invalid()
      for (const [key, expected] of Object.entries(sample)) {
        if (key in (value as Record<string, unknown>)) checkShape((value as Record<string, unknown>)[key], expected)
      }
    } else if (sample !== null && typeof value !== typeof sample) invalid()
    else if (typeof value === 'number' && (!Number.isFinite(value) || value < 0)) invalid()
  }
  checkShape(candidate, createDefaultSaveData())
  if (object(candidate.player)) {
    const player = candidate.player
    for (const field of ['nickname', 'icon', 'currentTitle', 'createdAt']) {
      if (typeof player[field] !== 'string') invalid()
    }
    for (const field of ['level', 'coins', 'exp']) {
      if (typeof player[field] !== 'number' || !Number.isFinite(player[field]) || Number(player[field]) < 0) invalid()
    }
    if (!Array.isArray(player.titles) || player.titles.some((title) => typeof title !== 'string')) invalid()
  }
  const progress = candidate.progress as Record<string, unknown>
  for (const field of ['monsterBook', 'bossItems', 'ownedUfos', 'ownedItems', 'equippedItems', 'rocketBadges']) {
    if (field in progress && (!Array.isArray(progress[field]) ||
        (progress[field] as unknown[]).some((id) => typeof id !== 'string'))) invalid()
  }
  for (const field of ['history', 'missions', 'collectionRecords', 'ownedTreasureItems']) {
    if (field in progress && (!Array.isArray(progress[field]) ||
        (progress[field] as unknown[]).some((entry) => !object(entry) || typeof entry.id !== 'string'))) invalid()
  }
  for (const field of ['facts', 'bests', 'bossProgress', 'treasureKeys']) {
    if (!(field in progress)) continue
    if (!object(progress[field])) invalid()
    for (const entry of Object.values(progress[field] as Record<string, unknown>)) {
      if (!object(entry)) invalid()
      if (field === 'facts' && object(entry)) {
        for (const key of ['correctCount', 'incorrectCount', 'masteryLevel', 'averageResponseTimeMs']) {
          if (typeof entry[key] !== 'number' || !Number.isFinite(entry[key]) || Number(entry[key]) < 0) invalid()
        }
        if ('recentResults' in entry && (!Array.isArray(entry.recentResults) ||
            entry.recentResults.some((result) => !object(result) || typeof result.correct !== 'boolean'))) invalid()
      }
      if (field === 'bossProgress' && object(entry) && !object(entry.difficulties)) invalid()
    }
  }
  return migrateSaveData(candidate)
}
