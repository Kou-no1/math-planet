import type { AnswerMode, DailyMission, LearningLevel, MultiplicationFactProgress } from './game'
import type { PlanetId } from '../data/planets'
import type { DailyBudgetMinutes } from '../game-engine/school/dailyUsage'

export type PlayerData = {
  nickname: string
  icon: string
  shipName: string
  characterName: string
  learningLevel: LearningLevel
  level: number
  exp: number
  coins: number
  titles: string[]
  currentTitle: string
  createdAt: string
  lastPlayedAt: string | null
}

export type SettingsData = {
  soundEnabled: boolean
  speechEnabled: boolean
  reduceMotion: boolean
  dailyBudgetMinutes: DailyBudgetMinutes
  schoolMode2Enabled: boolean
  practiceQuestionCount: 5 | 9 | 15
  practiceAnswerMode: AnswerMode
}

export type BestRecord = {
  score: number
  averageResponseTimeMs: number
  accuracy: number
  achievedAt: string
}

export type GameHistoryEntry = {
  id: string
  mode: string
  correctCount: number
  totalQuestions: number
  averageResponseTimeMs: number
  score: number
  playedAt: string
  planet?: PlanetId | 'mixed' | 'legacy'
  recordKey?: string
  areaIds?: string[]
  difficultyId?: string | null
  answerMode?: AnswerMode
  durationSeconds?: number | null
  hintCount?: number
}

export type BossDifficultyId = 'normal' | 'hard' | 'fast' | 'gekimuzu'

export type BossDifficultyProgress = {
  cleared: boolean
  clearCount: number
  firstClearedAt: string | null
  bestTimeMs: number | null
}

export type BossProgress = {
  bossId: string
  difficulties: Partial<Record<BossDifficultyId, BossDifficultyProgress>>
}

export type CollectionRecord = {
  id: string
  acquiredAt: string
  method: string
}

export type KeyInventoryEntry = {
  count: number
  firstAcquiredAt: string | null
}

export type ProgressData = {
  facts: Record<string, MultiplicationFactProgress>
  history: GameHistoryEntry[]
  bests: Record<string, BestRecord>
  missions: DailyMission[]
  missionDate: string | null
  monsterBook: string[]
  categoryCorrect: Record<string, number>
  bossProgress: Record<string, BossProgress>
  bossItems: string[]
  ownedUfos: string[]
  equippedUfoId: string | null
  ownedItems: string[]
  equippedItems: string[]
  equippedBuddyId: string | null
  speedSettings: {
    selectedStages: number[]
    durationSeconds: number
  }
  rocketBestDistance: number
  rocketBadges: string[]
  collectionRecords: CollectionRecord[]
  ownedTreasureItems: CollectionRecord[]
  treasureKeys: Record<string, KeyInventoryEntry>
}

export type TutorialData = {
  homeSeen: boolean
  modeTipsSeen: string[]
}

export type SaveData = {
  version: number
  player: PlayerData | null
  progress: ProgressData
  settings: SettingsData
  tutorial: TutorialData
}

export type OnboardingInput = {
  nickname: string
  icon: string
  learningLevel: LearningLevel
  soundEnabled: boolean
}
