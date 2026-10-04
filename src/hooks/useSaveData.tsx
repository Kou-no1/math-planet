import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { refreshMissionsIfNeeded } from '../game-engine/missions/missions'
import { createLocalStorageSaveRepository } from '../repositories/saveRepository'
import type { SaveData } from '../types/save'

type SaveDataContextValue = {
  saveData: SaveData
  setSaveData: (next: SaveData) => void
  updateSaveData: (updater: (current: SaveData) => SaveData) => void
  resetSaveData: () => void
  saveError: string | null
  originalSave: string | null
  flushSave: () => boolean
  restoreSaveData: (next: SaveData) => boolean
}

const SaveDataContext = createContext<SaveDataContextValue | null>(null)

const repository = createLocalStorageSaveRepository()

export function SaveDataProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => repository.loadState())
  const [saveData, setSaveDataState] = useState(() =>
    refreshMissionsIfNeeded(initial.data),
  )
  const [saveError, setSaveError] = useState<string | null>(initial.error)
  const currentRef = useRef(saveData)
  const [originalSave, setOriginalSave] = useState(
    initial.error ? initial.original : null,
  )
  const flushSave = useCallback(() => {
    try {
      repository.save(currentRef.current)
      setSaveError(null)
      return true
    } catch {
      setSaveError(
        'ほぞんできませんでした。いまのきろくを バックアップしてね。',
      )
      return false
    }
  }, [])

  const setSaveData = useCallback(
    (next: SaveData) => {
      const refreshed = refreshMissionsIfNeeded(next)
      currentRef.current = refreshed
      setSaveDataState(refreshed)
      flushSave()
    },
    [flushSave],
  )

  const updateSaveData = useCallback(
    (updater: (current: SaveData) => SaveData) => {
      setSaveData(updater(currentRef.current))
    },
    [setSaveData],
  )

  const restoreSaveData = useCallback((next: SaveData) => {
    const refreshed = refreshMissionsIfNeeded(next)
    try {
      repository.restore(refreshed)
      currentRef.current = refreshed
      setSaveDataState(refreshed)
      setSaveError(null)
      setOriginalSave(null)
      return true
    } catch {
      setSaveError(
        'ひきつぎをほぞんできませんでした。もとのきろくは そのままです。',
      )
      return false
    }
  }, [])

  const resetSaveData = useCallback(() => {
    try {
      repository.clear()
      const next = refreshMissionsIfNeeded(repository.load())
      currentRef.current = next
      setSaveDataState(next)
      setSaveError(null)
      setOriginalSave(null)
    } catch {
      setSaveError('きろくをけせませんでした。')
    }
  }, [])

  const value = useMemo(
    () => ({
      saveData,
      setSaveData,
      updateSaveData,
      resetSaveData,
      saveError,
      originalSave,
      flushSave,
      restoreSaveData,
    }),
    [
      resetSaveData,
      saveData,
      setSaveData,
      updateSaveData,
      saveError,
      originalSave,
      flushSave,
      restoreSaveData,
    ],
  )

  return (
    <SaveDataContext.Provider value={value}>
      {children}
    </SaveDataContext.Provider>
  )
}

export function useSaveData(): SaveDataContextValue {
  const value = useContext(SaveDataContext)
  if (!value) {
    throw new Error('useSaveData must be used inside SaveDataProvider')
  }
  return value
}
