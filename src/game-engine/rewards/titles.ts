import type { GameSessionSummary } from '../../types/game'
import type { PlayerData, SaveData } from '../../types/save'
import { parseFactId } from '../questions/factIds'
import {
  allGekimuzuTitle,
  additionLegendTitle,
  additionMasterTitle,
  bosses,
  divisionLegendTitle,
  divisionMasterTitle,
  legendaryBossTitle,
  subtractionLegendTitle,
  subtractionMasterTitle,
} from '../../data/bosses'
import { additionRocketDifficulties } from '../../data/additionRocket'
import { divisionRocketDifficulties } from '../../data/divisionRocket'
import { subtractionRocketDifficulties } from '../../data/subtractionRocket'
import type { RewardOrigin } from '../../types/rewardOrigin'
import { numericMasterTitle } from '../../data/numericRewards'
import { numericRocketDifficulties } from '../../data/numericRocket'
import { isNumericPlanetId } from '../../data/numericAreas'

type TitleRule = {
  id: string
  label: string
  description: string
  origin?: RewardOrigin
  canEarn: (summary: GameSessionSummary, save: SaveData) => boolean
}

export type TitleDefinition = {
  id: string
  label: string
  description: string
  method: string
  origin?: RewardOrigin
}

export type TitleEmblemRarity = 'common' | 'rare' | 'epic' | 'legendary'

export type TitleEmblemFamily =
  | 'starter'
  | 'streak'
  | 'boss-basic'
  | 'boss-advanced'
  | 'boss-addition'
  | 'boss-subtraction'
  | 'boss-division'
  | 'master'
  | 'legendary'

export type TitleEmblemDefinition = {
  family: TitleEmblemFamily
  rarity: TitleEmblemRarity
  motif: string
  primary: string
  secondary: string
  accent: string
}

function hasAdditionResult(summary: GameSessionSummary): boolean {
  return summary.results.some((result) => result.questionId.startsWith('add:'))
}

function hasSubtractionResult(summary: GameSessionSummary): boolean {
  return summary.results.some((result) => result.questionId.startsWith('sub:'))
}

function hasDivisionResult(summary: GameSessionSummary): boolean {
  return summary.results.some((result) => result.questionId.startsWith('divide:'))
}

function hasOnlyMultiplicationResults(summary: GameSessionSummary): boolean {
  return (
    summary.results.length > 0 &&
    summary.results.every(
      (result) => parseFactId(result.questionId)?.operation === 'multiplication',
    )
  )
}

function maxCorrectComboForAdditionArea(summary: GameSessionSummary, areaId: string): number {
  let combo = 0
  let maxCombo = 0
  for (const result of summary.results) {
    if (result.correct && result.questionId.startsWith(`add:${areaId}:`)) {
      combo += 1
      maxCombo = Math.max(maxCombo, combo)
    } else {
      combo = 0
    }
  }
  return maxCombo
}

function maxCorrectComboForSubtractionArea(summary: GameSessionSummary, areaId: string): number {
  let combo = 0
  let maxCombo = 0
  for (const result of summary.results) {
    if (result.correct && result.questionId.startsWith(`sub:${areaId}:`)) {
      combo += 1
      maxCombo = Math.max(maxCombo, combo)
    } else {
      combo = 0
    }
  }
  return maxCombo
}

function maxCorrectComboForDivisionArea(summary: GameSessionSummary, areaId: string): number {
  let combo = 0
  let maxCombo = 0
  for (const result of summary.results) {
    if (result.correct && result.questionId.startsWith(`divide:${areaId}:`)) {
      combo += 1
      maxCombo = Math.max(maxCombo, combo)
    } else {
      combo = 0
    }
  }
  return maxCombo
}

export const titleRules: TitleRule[] = [
  ...(['decimal', 'fraction'] as const).flatMap((planet): TitleRule[] => [
    { id: `${planet}-first-step`, label: `${planet === 'decimal' ? '小数' : '分数'}のたまご`, description: 'この星で初めて問題を解いたしるし', origin: planet,
      canEarn: (summary) => summary.results.some((result) => result.questionId.startsWith(`${planet}:`)) },
    { id: `${planet}-no-miss`, label: `${planet === 'decimal' ? '小数' : '分数'}のせいびし`, description: 'この星で10問以上を全問正解したしるし', origin: planet,
      canEarn: (summary) => summary.totalQuestions >= 10 && summary.accuracy === 100 && summary.results.every((result) => result.questionId.startsWith(`${planet}:`)) },
    ...numericRocketDifficulties(planet).map((difficulty): TitleRule => ({ id: `${planet}-rocket-${difficulty.id}`, label: difficulty.title, description: `${difficulty.label}のロケットをクリアしたしるし`, origin: planet,
      canEarn: (summary) => summary.mode === 'rocket' && summary.details?.planet === planet && summary.details?.numericRocketDifficulty === difficulty.id && summary.totalQuestions >= 14 })),
  ]),
  {
    id: 'first-step',
    origin: 'all',
    label: 'はじめのいっぽ',
    description: 'くくっちといっしょに学びはじめたしるし',
    canEarn: (summary) => summary.totalQuestions > 0,
  },
  {
    id: 'no-miss-10',
    origin: 'all',
    label: 'れんぞくせいかい',
    description: '10もん以上をまちがえずにこたえたしるし',
    canEarn: (summary) => summary.totalQuestions >= 10 && summary.accuracy === 100,
  },
  {
    id: 'speed-beginner',
    label: 'かけざんビギナー',
    description: 'テンポよく正解できたしるし',
    canEarn: (summary) =>
      hasOnlyMultiplicationResults(summary) &&
      summary.totalQuestions >= 5 &&
      summary.accuracy >= 80 &&
      summary.averageResponseTimeMs <= 5000,
  },
  {
    id: 'kuku-fighter',
    label: 'くくファイター',
    description: 'すばやく正解をかさねたしるし',
    canEarn: (summary) =>
      hasOnlyMultiplicationResults(summary) &&
      summary.totalQuestions >= 8 &&
      summary.accuracy >= 80 &&
      summary.averageResponseTimeMs <= 4000,
  },
  {
    id: 'combo-5',
    origin: 'all',
    label: 'ごれんぞくスター',
    description: '5れんぞく正解をきめたしるし',
    canEarn: (summary) => summary.maxCombo >= 5,
  },
  {
    id: 'addition-first-step',
    label: 'たしざんのたまご',
    description: 'たしざんのほしではじめてもんだいをといたしるし',
    origin: 'add',
    canEarn: (summary) => hasAdditionResult(summary),
  },
  {
    id: 'addition-carry-30-combo',
    label: 'くりあがりちょうじん',
    description: 'くりあがりのたしざんを30もんれんぞくでせいかいしたしるし',
    origin: 'add',
    canEarn: (summary) => maxCorrectComboForAdditionArea(summary, 'add-carry-basic') >= 30,
  },
  ...additionRocketDifficulties.map((difficulty) => ({
    id: `addition-rocket-${difficulty.id}`,
    label: difficulty.title,
    description: `${difficulty.label}のろけっとをくりあしたしるし`,
    origin: 'add' as const,
    canEarn: (summary: GameSessionSummary) =>
      summary.mode === 'rocket' &&
      summary.details?.planet === 'add' &&
      summary.details?.additionRocketDifficulty === difficulty.id &&
      summary.totalQuestions >= 14,
  })),
  {
    id: 'subtraction-first-step',
    label: 'ひきざんのたまご',
    description: 'ひきざんのほしではじめてもんだいをといたしるし',
    origin: 'sub',
    canEarn: (summary) => hasSubtractionResult(summary),
  },
  {
    id: 'subtraction-borrow-30-combo',
    label: 'くりさがりちょうじん',
    description: 'くりさがりのひきざんを30もんれんぞくでせいかいしたしるし',
    origin: 'sub',
    canEarn: (summary) => maxCorrectComboForSubtractionArea(summary, 'sub-borrow-basic') >= 30,
  },
  ...subtractionRocketDifficulties.map((difficulty) => ({
    id: `subtraction-rocket-${difficulty.id}`,
    label: difficulty.title,
    description: `${difficulty.label}のろけっとをくりあしたしるし`,
    origin: 'sub' as const,
    canEarn: (summary: GameSessionSummary) =>
      summary.mode === 'rocket' &&
      summary.details?.planet === 'subtract' &&
      summary.details?.subtractionRocketDifficulty === difficulty.id &&
      summary.totalQuestions >= 14,
  })),
  {
    id: 'division-first-step',
    label: 'わりざんのたまご',
    description: 'わりざんの星ではじめて問題を解いたしるし',
    origin: 'divide',
    canEarn: (summary) => hasDivisionResult(summary),
  },
  {
    id: 'division-remainder-30-combo',
    label: 'あまりはかせ',
    description: 'あまりのあるわりざんを30問連続で正解したしるし',
    origin: 'divide',
    canEarn: (summary) => maxCorrectComboForDivisionArea(summary, 'divide-with-remainder') >= 30,
  },
  ...divisionRocketDifficulties.map((difficulty) => ({
    id: `division-rocket-${difficulty.id}`,
    label: difficulty.title,
    description: `${difficulty.label}のロケットをクリアしたしるし`,
    origin: 'divide' as const,
    canEarn: (summary: GameSessionSummary) =>
      summary.mode === 'rocket' &&
      summary.details?.planet === 'divide' &&
      summary.details?.divisionRocketDifficulty === difficulty.id &&
      summary.totalQuestions >= 14,
  })),
]

export function titleRecordId(title: string): string {
  return (
    getTitleDefinitions().find(
      (definition) => definition.id === title || definition.label === title,
    )?.id ?? title
  )
}

export function titleLabel(title: string | null | undefined): string {
  return (
    getTitleDefinitions().find((definition) => definition.id === title)?.label ??
    title ??
    'はじめのいっぽ'
  )
}

export function hasTitle(player: PlayerData | null, title: string): boolean {
  const id = titleRecordId(title)
  return Boolean(player?.titles.some((owned) => titleRecordId(owned) === id))
}

export function grantPlayerTitles(player: PlayerData, titles: string[]): PlayerData {
  return {
    ...player,
    titles: Array.from(new Set([...player.titles, ...titles].map(titleRecordId))),
    currentTitle: titleRecordId(player.currentTitle || titles[0] || 'はじめのいっぽ'),
  }
}

let titleDefinitionsCache: TitleDefinition[] | undefined

export function getTitleDefinitions(): TitleDefinition[] {
  if (titleDefinitionsCache) return titleDefinitionsCache
  const ruleDefinitions = titleRules.map((rule) => ({
    id: `rule:${rule.id}`,
    label: rule.label,
    description: rule.description,
    origin: rule.origin,
    method: 'がくしゅうリザルト',
  }))
  const bossDefinitions = bosses.flatMap((boss) =>
    Object.entries(boss.rewards).map(([difficultyId, reward]) => ({
      id: `boss:${boss.id}:${difficultyId}`,
      label: reward.title,
      origin:
        isNumericPlanetId(boss.group) ? boss.group : boss.group === 'addition'
          ? ('add' as const)
          : boss.group === 'subtraction'
            ? ('sub' as const)
            : boss.group === 'division'
              ? ('divide' as const)
              : ('multiply' as const),
      description: `${boss.label}にいどんだしるし`,
      method:
        boss.group === 'addition' || boss.group === 'subtraction' || boss.group === 'division'
          ? `${boss.label} ぼすばとる`
          : `${boss.label} ボスバトル`,
    })),
  )
  titleDefinitionsCache = [
    ...(['decimal', 'fraction'] as const).flatMap((planet) => [false, true].map((legendary) => ({
      id: `master:${planet}:${legendary ? 'gekimuzu' : 'normal'}`, label: numericMasterTitle(planet, legendary), description: `この星の全エリアボスを${legendary ? 'げきムズで' : ''}クリアしたしるし`, method: '全エリアボス', origin: planet,
    }))),
    ...ruleDefinitions,
    ...bossDefinitions,
    {
      id: 'master:multiply:fast',
      label: legendaryBossTitle,
      description: 'すべてのボスをマスターしたしるし',
      method: '全ボスさいそく',
    },
    {
      id: 'master:complete',
      label: allGekimuzuTitle,
      description: 'すべてのげきムズをこえたしるし',
      method: '全ボスげきムズ',
    },
    {
      id: 'master:add:normal',
      label: additionMasterTitle,
      description: 'たしざんの6えりあぼすをすべてたおしたしるし',
      method: 'たしざんぜんえりあぼす',
      origin: 'add' as const,
    },
    {
      id: 'master:add:gekimuzu',
      label: additionLegendTitle,
      description: 'たしざんの6えりあをげきむずでこえたしるし',
      method: 'たしざんぜんえりあげきむず',
      origin: 'add' as const,
    },
    {
      id: 'master:subtract:normal',
      label: subtractionMasterTitle,
      description: 'ひきざんの6えりあぼすをすべてたおしたしるし',
      method: 'ひきざんぜんえりあぼす',
      origin: 'sub' as const,
    },
    {
      id: 'master:subtract:gekimuzu',
      label: subtractionLegendTitle,
      description: 'ひきざんの6えりあをげきむずでこえたしるし',
      method: 'ひきざんぜんえりあげきむず',
      origin: 'sub' as const,
    },
    {
      id: 'master:divide:normal',
      label: divisionMasterTitle,
      description: 'わりざんの3エリアボスをすべてたおしたしるし',
      method: 'わりざん全エリアボス',
      origin: 'divide' as const,
    },
    {
      id: 'master:divide:gekimuzu',
      label: divisionLegendTitle,
      description: 'わりざんの3エリアをげきムズでこえたしるし',
      method: 'わりざん全エリアげきムズ',
      origin: 'divide' as const,
    },
  ]
  return titleDefinitionsCache
}

export function judgeNewTitles(summary: GameSessionSummary, save: SaveData): string[] {
  return titleRules
    .filter((rule) => !hasTitle(save.player, rule.label) && rule.canEarn(summary, save))
    .map((rule) => rule.label)
}

const bossRewardTitleMap = new Map(
  bosses.flatMap((boss) =>
    Object.entries(boss.rewards).map(([difficultyId, reward]) => [
      reward.title,
      {
        bossGroup: boss.group,
        difficultyId,
      },
    ]),
  ),
)

export function getTitleEmblemDefinition(title: string | null | undefined): TitleEmblemDefinition {
  if (!title) {
    return {
      family: 'starter',
      rarity: 'common',
      motif: '?',
      primary: '#5b6f8e',
      secondary: '#1d314f',
      accent: '#dffcff',
    }
  }

  title = titleLabel(title)
  const numericTitle = getTitleDefinitions().find((entry) => entry.label === title && isNumericPlanetId(entry.origin))
  if (numericTitle) {
    const decimal = numericTitle.origin === 'decimal'
    const legendary = title.includes('レジェンド') || title.includes('げきムズ')
    return { family: legendary ? 'legendary' : title.includes('マスター') ? 'master' : 'boss-advanced',
      rarity: legendary ? 'legendary' : title.includes('マスター') || title.includes('キャプテン') ? 'epic' : title.includes('たまご') ? 'common' : 'rare',
      motif: decimal ? '0.1' : '1/2', primary: decimal ? '#38b9be' : '#e376a4', secondary: decimal ? '#0d454e' : '#652a4d', accent: decimal ? '#f9db6c' : '#a0efcf' }
  }

  if (title === allGekimuzuTitle) {
    return {
      family: 'legendary',
      rarity: 'legendary',
      motif: '∞',
      primary: '#ffd86a',
      secondary: '#7c3aed',
      accent: '#68f4ff',
    }
  }

  if (title === legendaryBossTitle) {
    return {
      family: 'master',
      rarity: 'epic',
      motif: '王',
      primary: '#ffd86a',
      secondary: '#ff7ac8',
      accent: '#ffffff',
    }
  }

  if (title === additionMasterTitle || title === additionLegendTitle) {
    return {
      family: title === additionLegendTitle ? 'legendary' : 'master',
      rarity: title === additionLegendTitle ? 'legendary' : 'epic',
      motif: '+',
      primary: '#ffd35c',
      secondary: '#34d399',
      accent: title === additionLegendTitle ? '#ff7aa8' : '#ffffff',
    }
  }

  if (title === subtractionMasterTitle || title === subtractionLegendTitle) {
    return {
      family: title === subtractionLegendTitle ? 'legendary' : 'master',
      rarity: title === subtractionLegendTitle ? 'legendary' : 'epic',
      motif: '-',
      primary: '#ff9f5f',
      secondary: '#a8552a',
      accent: title === subtractionLegendTitle ? '#ffd166' : '#ffffff',
    }
  }

  if (title === divisionMasterTitle || title === divisionLegendTitle) {
    return {
      family: title === divisionLegendTitle ? 'legendary' : 'master',
      rarity: title === divisionLegendTitle ? 'legendary' : 'epic',
      motif: '÷',
      primary: '#9fd3ff',
      secondary: '#6750d8',
      accent: title === divisionLegendTitle ? '#ffd166' : '#ffffff',
    }
  }

  const bossReward = bossRewardTitleMap.get(title)
  if (bossReward) {
    const isAdvanced = bossReward.bossGroup === 'advanced'
    const isAddition = bossReward.bossGroup === 'addition'
    const isSubtraction = bossReward.bossGroup === 'subtraction'
    const isDivision = bossReward.bossGroup === 'division'
    const rarityByDifficulty: Record<string, TitleEmblemRarity> = {
      normal: 'common',
      hard: 'rare',
      fast: 'epic',
      gekimuzu: 'epic',
    }
    return {
      family: isAddition
        ? 'boss-addition'
        : isSubtraction
          ? 'boss-subtraction'
          : isDivision
            ? 'boss-division'
            : isAdvanced
              ? 'boss-advanced'
              : 'boss-basic',
      rarity: rarityByDifficulty[bossReward.difficultyId] ?? 'rare',
      motif: isAddition
        ? '+'
        : isSubtraction
          ? '-'
          : isDivision
            ? '÷'
            : bossReward.difficultyId === 'gekimuzu'
              ? '★'
              : isAdvanced
                ? '◇'
                : '×',
      primary: isAddition
        ? '#ffd35c'
        : isSubtraction
          ? '#ff9f5f'
          : isDivision
            ? '#9fd3ff'
            : isAdvanced
              ? '#a78bfa'
              : '#5be9f4',
      secondary: isAddition
        ? '#34d399'
        : isSubtraction
          ? '#a8552a'
          : isDivision
            ? '#6750d8'
            : isAdvanced
              ? '#22d3ee'
              : '#4d75ff',
      accent: bossReward.difficultyId === 'normal' ? '#e8fbff' : '#ffd86a',
    }
  }

  const rule = titleRules.find((candidate) => candidate.label === title)
  if (rule?.id === 'first-step') {
    return {
      family: 'starter',
      rarity: 'common',
      motif: '✦',
      primary: '#5be9f4',
      secondary: '#1d4ed8',
      accent: '#ffffff',
    }
  }
  if (rule?.origin === 'add') {
    return {
      family: 'streak',
      rarity: rule.id === 'addition-carry-30-combo' ? 'epic' : 'common',
      motif: '+',
      primary: '#ffd35c',
      secondary: '#16a34a',
      accent: '#ffffff',
    }
  }
  if (rule?.origin === 'sub') {
    return {
      family: 'streak',
      rarity: rule.id === 'subtraction-borrow-30-combo' ? 'epic' : 'common',
      motif: '-',
      primary: '#ff9f5f',
      secondary: '#a8552a',
      accent: '#ffffff',
    }
  }
  if (rule?.origin === 'divide') {
    return {
      family: 'streak',
      rarity: rule.id === 'division-remainder-30-combo' ? 'epic' : 'common',
      motif: '÷',
      primary: '#9fd3ff',
      secondary: '#6750d8',
      accent: '#ffffff',
    }
  }
  if (rule?.id === 'combo-5' || rule?.id === 'speed-beginner') {
    return {
      family: 'streak',
      rarity: 'rare',
      motif: '⚡',
      primary: '#7dd3fc',
      secondary: '#6366f1',
      accent: '#fff7a8',
    }
  }

  return {
    family: 'streak',
    rarity: 'rare',
    motif: '★',
    primary: '#34d399',
    secondary: '#0f766e',
    accent: '#ffffff',
  }
}
