import {
  DAILY_USAGE_STORAGE_KEY,
  createDailyUsageState,
  normalizeDailyUsageState,
  type DailyUsageState,
} from '../game-engine/school/dailyUsage'

export type DailyUsageRepository = {
  load: () => DailyUsageState
  save: (state: DailyUsageState) => void
  clear: () => void
}

export function createLocalStorageDailyUsageRepository(
  storage?: Storage,
): DailyUsageRepository {
  const target = () => storage ?? window.localStorage
  return {
    load: () => {
      try {
        const raw = target().getItem(DAILY_USAGE_STORAGE_KEY)
        if (!raw) return createDailyUsageState()
        return normalizeDailyUsageState(JSON.parse(raw))
      } catch (error) {
        console.error('日次使用時間の読み込みに失敗しました', error)
        return createDailyUsageState()
      }
    },
    save: (state) => {
      try { target().setItem(DAILY_USAGE_STORAGE_KEY, JSON.stringify(state)) }
      catch { /* Keep the current session's budget active when persistence is unavailable. */ }
    },
    clear: () => {
      try { target().removeItem(DAILY_USAGE_STORAGE_KEY) } catch { /* No storage permission. */ }
    },
  }
}
