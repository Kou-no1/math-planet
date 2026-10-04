import {
  createDefaultSaveData,
  parseSaveData,
  SAVE_DATA_VERSION,
} from '../storage/saveData'
import type { SaveData } from '../types/save'

export const STORAGE_KEY = 'kukucchi-save-v1'
export const PRE_MIGRATION_BACKUP_KEY = 'kukucchi-save-before-migration'
export const PRE_RESTORE_BACKUP_KEY = 'kukucchi-save-before-restore'

export function readPreMigrationBackup(storage?: Storage): string | null {
  try {
    return (storage ?? window.localStorage).getItem(PRE_MIGRATION_BACKUP_KEY)
  } catch {
    return null
  }
}

export type SaveLoadState = {
  data: SaveData
  error: string | null
  original: string | null
}
export type SaveRepository = {
  load: () => SaveData
  loadState: () => SaveLoadState
  save: (data: SaveData) => void
  restore: (data: SaveData) => void
  clear: () => void
}

export function createLocalStorageSaveRepository(
  storage?: Storage,
): SaveRepository {
  const target = () => storage ?? window.localStorage
  let protectedOriginal = false
  let lastSeen: string | null | undefined
  function loadState(): SaveLoadState {
    let original: string | null = null
    try {
      original = target().getItem(STORAGE_KEY)
      const data =
        original === null ? createDefaultSaveData() : parseSaveData(original)
      protectedOriginal = false
      lastSeen = original
      return { data, error: null, original }
    } catch (error) {
      protectedOriginal = true
      return {
        data: createDefaultSaveData(),
        original,
        error:
          error instanceof Error ? error.message : '記録を読みこめませんでした',
      }
    }
  }
  return {
    loadState,
    load: () => loadState().data,
    save: (data) => {
      if (protectedOriginal)
        throw new Error(
          'もとのきろくを保護しています。先にバックアップしてください。',
        )
      const store = target()
      const previous = store.getItem(STORAGE_KEY)
      if (lastSeen !== undefined && previous !== lastSeen) {
        throw new Error(
          '別のタブで記録が変わりました。上書きせずバックアップしてください。',
        )
      }
      if (previous !== null) {
        parseSaveData(previous) // Never automatically replace invalid/future records.
        if (
          Number((JSON.parse(previous) as SaveData).version) < SAVE_DATA_VERSION
        ) {
          store.setItem(PRE_MIGRATION_BACKUP_KEY, previous)
        }
      }
      const next = JSON.stringify(data)
      store.setItem(STORAGE_KEY, next)
      lastSeen = next
    },
    restore: (data) => {
      parseSaveData(JSON.stringify(data))
      const store = target()
      const previous = store.getItem(STORAGE_KEY)
      if (previous !== null) store.setItem(PRE_RESTORE_BACKUP_KEY, previous)
      const next = JSON.stringify(data)
      store.setItem(STORAGE_KEY, next)
      lastSeen = next
      protectedOriginal = false
    },
    clear: () => {
      target().removeItem(STORAGE_KEY)
      target().removeItem(PRE_MIGRATION_BACKUP_KEY)
      protectedOriginal = false
      lastSeen = null
    },
  }
}
