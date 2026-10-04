import { describe, expect, it } from 'vitest'
import { DAILY_USAGE_STORAGE_KEY, createDailyUsageState } from '../game-engine/school/dailyUsage'
import { createLocalStorageDailyUsageRepository } from '../repositories/dailyUsageRepository'
import {
  createLocalStorageSaveRepository,
  PRE_MIGRATION_BACKUP_KEY,
} from '../repositories/saveRepository'
import { createDefaultSaveData } from '../storage/saveData'

describe('save repository', () => {
  it('saves and loads localStorage data', () => {
    window.localStorage.clear()
    const repository = createLocalStorageSaveRepository(window.localStorage)
    const save = createDefaultSaveData()
    repository.save({
      ...save,
      player: {
        nickname: 'テスト',
        icon: 'たまご',
        shipName: 'くくっち',
        characterName: 'くくっち',
        learningLevel: 'first',
        level: 1,
        exp: 0,
        coins: 3,
        titles: ['はじめのいっぽ'],
        currentTitle: 'はじめのいっぽ',
        createdAt: '2026-01-01T00:00:00.000Z',
        lastPlayedAt: null,
      },
    })
    expect(repository.load().player?.nickname).toBe('テスト')
    repository.clear()
    expect(repository.load().player).toBeNull()
  })

  it('stores daily usage in a separate non-backup localStorage key', () => {
    window.localStorage.clear()
    const saveRepository = createLocalStorageSaveRepository(window.localStorage)
    const usageRepository = createLocalStorageDailyUsageRepository(window.localStorage)
    const save = createDefaultSaveData()
    saveRepository.save(save)
    usageRepository.save({
      ...createDailyUsageState(new Date('2026-01-01T09:00:00')),
      usedMs: 600_000,
    })
    expect(window.localStorage.getItem(DAILY_USAGE_STORAGE_KEY)).toContain('usedMs')
    expect(JSON.stringify(saveRepository.load())).not.toContain('usedMs')
    expect(JSON.stringify(saveRepository.load())).not.toContain(DAILY_USAGE_STORAGE_KEY)
  })

  it('backs up the exact old save before the first migration write', () => {
    window.localStorage.clear()
    const old = { ...createDefaultSaveData(), version: 14 }
    const raw = JSON.stringify(old)
    window.localStorage.setItem('kukucchi-save-v1', raw)
    const repository = createLocalStorageSaveRepository(window.localStorage)
    const migrated = repository.load()
    repository.save(migrated)
    expect(window.localStorage.getItem(PRE_MIGRATION_BACKUP_KEY)).toBe(raw)
    repository.save(migrated)
    expect(window.localStorage.getItem(PRE_MIGRATION_BACKUP_KEY)).toBe(raw)
  })

  it('blocks automatic writes over malformed original data', () => {
    window.localStorage.clear()
    window.localStorage.setItem('kukucchi-save-v1', '{broken')
    const repository = createLocalStorageSaveRepository(window.localStorage)
    expect(repository.loadState().original).toBe('{broken')
    expect(repository.loadState().error).toBeTruthy()
    expect(() => repository.save(createDefaultSaveData())).toThrow()
    expect(window.localStorage.getItem('kukucchi-save-v1')).toBe('{broken')
    expect(repository.load().version).toBe(15)
  })
})
