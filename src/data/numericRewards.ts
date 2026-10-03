import {
  numericAreas,
  getNumericAreaById,
  type NumericAreaId,
  type NumericPlanetId,
} from './numericAreas'
import type { BossDefinition } from './bosses'
import type { UfoDefinition } from './ufos'
import type { ShopItem } from './shopItems'
import type { SaveData } from '../types/save'

const monsterNames = [
  'めもりん',
  'すいしょうっこ',
  'くらいのせいびし',
  'ちいさなけいりょうし',
  'ぽいんたん',
  'めもりマスター',
  'ぴーすっこ',
  'わけあいっこ',
  'つうぶんたん',
  'やくぶんのせいびし',
]
const bossNames = [
  '目盛りのガーディアン',
  '水晶のキーパー',
  '百目盛りのマスター',
  '精密ラボのバロン',
  'ポイントゴーレム',
  '計量ラボのキャプテン',
  'ピースのガーディアン',
  '分けあいキーパー',
  '通分のマスター',
  '約分工房のキャプテン',
]

export const numericPalette = {
  decimal: {
    base: '#38b9be',
    outline: '#0d454e',
    shadow: '#218188',
    highlight: '#bbf5f2',
    accent: '#f9db6c',
  },
  fraction: {
    base: '#e376a4',
    outline: '#652a4d',
    shadow: '#ac496f',
    highlight: '#ffe0ed',
    accent: '#a0efcf',
  },
}

export type NumericMonsterDefinition = {
  id: string
  no: number
  areaId: NumericAreaId
  name: string
  description: string
  threshold: number
  variant: number
  origin: NumericPlanetId
}

export const numericMonsterDefinitions: NumericMonsterDefinition[] = numericAreas.flatMap(
  (area, index) =>
    [1, 2, 3].map((variant) => ({
      id: `${area.id}-monster-${variant}`,
      no: index * 3 + variant,
      areaId: area.id,
      name: `${monsterNames[index]}${['', 'ぷらす', 'りーだー'][variant - 1]}`,
      description: `${area.name}を${variant === 3 ? 20 : variant * 5}問正解すると出会えるなかま。`,
      threshold: variant === 3 ? 20 : variant * 5,
      variant,
      origin: area.generator.operation,
    })),
)

export function numericAreaCorrectKey(areaId: NumericAreaId) {
  return `${getNumericAreaById(areaId).generator.operation}:${areaId}`
}

export function isNumericMonsterOwned(
  monster: NumericMonsterDefinition,
  categoryCorrect: SaveData['progress']['categoryCorrect'],
) {
  return (categoryCorrect[numericAreaCorrectKey(monster.areaId)] ?? 0) >= monster.threshold
}

export function getNumericMonsterById(id: string | null | undefined) {
  return numericMonsterDefinitions.find((monster) => monster.id === id)
}

const ufoAreas = [
  'decimal-subtract-tenths',
  'decimal-subtract-hundredths',
  'decimal-divide-integer',
  'fraction-add-same',
  'fraction-add-unlike',
  'fraction-subtract-unlike',
] as const
const ufoNames = [
  'メジャーリング号',
  'クリスタルレンズ号',
  'プレシジョン号',
  'ピースリング号',
  'シェアドーム号',
  'ハーモニー号',
]
const variants = [
  'decimal-measure',
  'decimal-crystal',
  'decimal-precision',
  'fraction-piece',
  'fraction-share',
  'fraction-harmony',
] as const

export const numericUfoSeeds: Record<
  string,
  Pick<UfoDefinition, 'name' | 'description' | 'variant' | 'lights' | 'motif' | 'origin'>
> = Object.fromEntries(
  ufoAreas.map((areaId, index) => [
    `boss-${areaId}`,
    {
      name: ufoNames[index],
      description:
        index < 3 ? '水晶と目盛りで小数の位を確かめるUFO。' : 'ピースを分けあわせる分数工房のUFO。',
      variant: variants[index],
      lights: 6 + (index % 3) * 2,
      motif: index < 3 ? ['0.1', '0.01', '.'][index] : ['1/2', '1/3', '='][index - 3],
      origin: index < 3 ? 'decimal' : 'fraction',
    },
  ]),
)

export const numericEffectItems: ShopItem[] = (['decimal', 'fraction'] as const).flatMap(
  (planet, index) => [
    {
      id: `${planet}-light-effect`,
      no: 70 + index * 2,
      name: planet === 'decimal' ? '目盛りのひかり' : 'ピースのひかり',
      description:
        planet === 'decimal' ? '細かい目盛りにそって光が流れる。' : '等しい大きさの光が輪になる。',
      price: 500,
      emoji: planet === 'decimal' ? '0.1' : '1/2',
      kind: 'effect' as const,
      visual: { layer: 'effect' as const, variant: `${planet}-light` },
      tier: 1 as const,
      countsTowardTierUnlock: false,
      rewardOrigin: 'all' as const,
    },
    {
      id: `${planet}-burst-effect`,
      no: 71 + index * 2,
      name: planet === 'decimal' ? 'クリスタルバースト' : 'シェアフラッシュ',
      description:
        planet === 'decimal'
          ? '水晶の光が精密に広がる。'
          : 'ピースが集まって同じ大きさの輪になる。',
      price: 0,
      emoji: planet === 'decimal' ? '.' : '=',
      kind: 'effect' as const,
      visual: { layer: 'effect' as const, variant: `${planet}-burst` },
      tier: 1 as const,
      countsTowardTierUnlock: false,
      availableInShop: false,
      rewardOrigin: planet,
    },
  ],
)

export function numericMasterTitle(planet: NumericPlanetId, legendary = false) {
  return `${planet === 'decimal' ? '小数' : '分数'}${legendary ? 'レジェンド' : 'マスター'}`
}

export const numericBosses: BossDefinition[] = numericAreas.map((area, index) => ({
  id: `boss-${area.id}`,
  no: 28 + index,
  group: area.generator.operation,
  origin: area.generator.operation,
  label: bossNames[index],
  shortLabel: area.shortName,
  emoji: area.generator.operation === 'decimal' ? '0.1' : '1/2',
  description: `${area.name}の力で挑戦。累計20問正解で解放。`,
  numericAreaId: area.id,
  difficultyOverrides: {
    hard: { timeLimitSeconds: area.no >= 3 ? 15 : 10 },
    fast: { timeLimitSeconds: area.no >= 3 ? 10 : 7 },
    gekimuzu: {
      timeLimitSeconds: area.no >= 3 ? 7 : 5,
      questionCount: 10,
      hp: 10,
    },
  },
  rewards: {
    normal: {
      title: `${area.name}クリア`,
      ...(ufoAreas.some((id) => id === area.id) ? { ufoId: `boss-${area.id}-ufo` } : {}),
      ...(area.id === 'decimal-add-hundredths' || area.id === 'fraction-add-unlike'
        ? { effectId: `${area.generator.operation}-burst-effect` }
        : {}),
    },
    hard: { title: `${area.name}ハードスター` },
    fast: { title: `${area.name}スピードスター` },
    gekimuzu: { title: `${area.name}げきムズスター` },
  },
}))
