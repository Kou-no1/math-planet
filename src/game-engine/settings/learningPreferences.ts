import type { SettingsData } from '../../types/save'

export type LearningPreset = 'relaxed' | 'standard' | 'challenge'

export function applyLearningPreset(settings: SettingsData, preset: LearningPreset): SettingsData {
  return {
    ...settings,
    practiceQuestionCount: preset === 'relaxed' ? 5 : preset === 'challenge' ? 15 : 9,
    practiceAnswerMode: preset === 'challenge' ? 'input' : 'choice',
    schoolMode2Enabled: true,
  }
}

export function applyQuietPreset(settings: SettingsData): SettingsData {
  return {
    ...settings,
    soundEnabled: false,
    speechEnabled: false,
    reduceMotion: true,
  }
}
