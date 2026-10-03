import { createDefaultSaveData, migrateSaveData, SAVE_DATA_VERSION } from '../storage/saveData'
import type { SaveData } from '../types/save'

const STORAGE_KEY = 'kukucchi-save-v1'
export const PRE_MIGRATION_BACKUP_KEY = 'kukucchi-save-before-migration'

export function readPreMigrationBackup(storage: Storage = window.localStorage): string | null {
  try {
    return storage.getItem(PRE_MIGRATION_BACKUP_KEY)
  } catch {
    return null
  }
}

export type SaveRepository = {
  load: () => SaveData
  save: (data: SaveData) => void
  clear: () => void
}

export function createLocalStorageSaveRepository(
  storage: Storage = window.localStorage,
): SaveRepository {
  return {
    load: () => {
      const raw = storage.getItem(STORAGE_KEY)
      if (!raw) {
        return createDefaultSaveData()
      }
      try {
        return migrateSaveData(JSON.parse(raw))
      } catch (error) {
        console.error('セーブデータの読み込みに失敗しました', error)
        return createDefaultSaveData()
      }
    },
    save: (data) => {
      const previous = storage.getItem(STORAGE_KEY)
      if (previous) {
        let version = 0
        try {
          version = (JSON.parse(previous) as Partial<SaveData> | null)?.version ?? 0
        } catch {
          // Keep even malformed data recoverable before replacing it.
        }
        if (version < SAVE_DATA_VERSION) storage.setItem(PRE_MIGRATION_BACKUP_KEY, previous)
      }
      storage.setItem(STORAGE_KEY, JSON.stringify(data))
    },
    clear: () => {
      storage.removeItem(STORAGE_KEY)
      storage.removeItem(PRE_MIGRATION_BACKUP_KEY)
    },
  }
}
