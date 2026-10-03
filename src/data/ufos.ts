import { bosses } from './bosses'
import type { RewardOrigin } from '../types/rewardOrigin'
import { numericUfoSeeds } from './numericRewards'

export type UfoVariant =
  | 'decimal-measure' | 'decimal-crystal' | 'decimal-precision'
  | 'fraction-piece' | 'fraction-share' | 'fraction-harmony'
  | 'stage'
  | 'all'
  | 'square'
  | 'pi'
  | 'mixed'
  | 'special'
  | 'add-plus-ring'
  | 'add-double-dome'
  | 'add-sunrise'
  | 'sub-minus-ring'
  | 'sub-split'
  | 'sub-sunset'
  | 'divide-ring'
  | 'divide-quarter'
  | 'divide-nebula'

export type UfoDefinition = {
  id: string
  no: number
  bossId: string | null
  name: string
  description: string
  variant: UfoVariant
  lights: number
  motif: string
  origin?: RewardOrigin
}

export const specialUfoId = 'ufo-special-master'
export const additionPlusRingUfoId = 'boss-add-carry-basic-ufo'
export const additionDoubleDomeUfoId = 'boss-add-two-digit-carry-ufo'
export const additionSunriseUfoId = 'boss-add-three-digit-ufo'
export const subtractionMinusRingUfoId = 'boss-sub-borrow-basic-ufo'
export const subtractionSplitUfoId = 'boss-sub-two-digit-borrow-ufo'
export const subtractionSunsetUfoId = 'boss-sub-three-digit-ufo'
export const divisionRingUfoId = 'boss-divide-no-remainder-ufo'
export const divisionQuarterUfoId = 'boss-divide-with-remainder-ufo'
export const divisionNebulaUfoId = 'boss-divide-large-ufo'

const bossUfoSeeds: Record<
  string,
  Pick<UfoDefinition, 'name' | 'description' | 'variant' | 'lights' | 'motif' | 'origin'>
> = {
  ...numericUfoSeeds,
  'boss-stage-2': {
    name: 'ツインライトごう',
    description: '2つのライトで1・2のだんをてらすUFO。',
    variant: 'stage',
    lights: 2,
    motif: '2',
  },
  'boss-stage-3': {
    name: 'さんかくムーンごう',
    description: '3つのライトと月マークのUFO。',
    variant: 'stage',
    lights: 3,
    motif: '3',
  },
  'boss-stage-4': {
    name: 'フォーライトごう',
    description: '4つのライトで四方をまもるUFO。',
    variant: 'stage',
    lights: 4,
    motif: '4',
  },
  'boss-stage-5': {
    name: 'ごほうびスターごう',
    description: '5つのライトが星みたいに光るUFO。',
    variant: 'stage',
    lights: 5,
    motif: '5',
  },
  'boss-stage-6': {
    name: 'シックスリングごう',
    description: '6つのライトと輪っかがじまんのUFO。',
    variant: 'stage',
    lights: 6,
    motif: '6',
  },
  'boss-stage-7': {
    name: 'セブンコメットごう',
    description: '7つのライトで流れ星を追いかけるUFO。',
    variant: 'stage',
    lights: 7,
    motif: '7',
  },
  'boss-stage-8': {
    name: 'エイトギャラクシーごう',
    description: '8つのライトが銀河みたいに並ぶUFO。',
    variant: 'stage',
    lights: 8,
    motif: '8',
  },
  'boss-stage-9': {
    name: 'ナインロケットごう',
    description: '9つのライトでぐんぐん進むUFO。',
    variant: 'stage',
    lights: 9,
    motif: '9',
  },
  'boss-all-kuku': {
    name: 'ぜんぶのせクラウンごう',
    description: '全九九をこえたしるしの王冠UFO。',
    variant: 'all',
    lights: 9,
    motif: '王',
  },
  'boss-square': {
    name: 'スクエアダイヤごう',
    description: '平方数のきらめきをのせたダイヤUFO。',
    variant: 'square',
    lights: 4,
    motif: '□',
  },
  'boss-pi': {
    name: 'パイくるりんごう',
    description: '3.14のうずをくるりとまとったUFO。',
    variant: 'pi',
    lights: 3,
    motif: 'π',
  },
  'boss-development': {
    name: 'はってんレインボーごう',
    description: 'ミックスと発展の色をぜんぶのせたUFO。',
    variant: 'mixed',
    lights: 9,
    motif: '虹',
  },
  'boss-add-carry-basic': {
    name: 'ぷらすりんぐごう',
    description: 'ひかる + がたのわでくりあがりをおしあげる、たしざんのうちゅうせん。',
    variant: 'add-plus-ring',
    lights: 8,
    motif: '+',
    origin: 'add',
  },
  'boss-add-two-digit-carry': {
    name: 'だぶるどーむごう',
    description: '2つのどーむがあわさった、2けたくりあがりのうちゅうせん。',
    variant: 'add-double-dome',
    lights: 10,
    motif: '++',
    origin: 'add',
  },
  'boss-add-three-digit': {
    name: 'さんらいずごう',
    description: 'あさひのようなひかりでおおきいかずをてらす、たしざんさいごのうちゅうせん。',
    variant: 'add-sunrise',
    lights: 12,
    motif: '+3',
    origin: 'add',
  },
  'boss-sub-borrow-basic': {
    name: 'まいなすりんぐごう',
    description: 'ひかる - がたのわでくりさがりをしずかにささえる、ひきざんのうちゅうせん。',
    variant: 'sub-minus-ring',
    lights: 8,
    motif: '-',
    origin: 'sub',
  },
  'boss-sub-two-digit-borrow': {
    name: 'すぷりっとごう',
    description: 'きたいがひだりとみぎにわかれる、2けたくりさがりのうちゅうせん。',
    variant: 'sub-split',
    lights: 10,
    motif: '--',
    origin: 'sub',
  },
  'boss-sub-three-digit': {
    name: 'さんせっとごう',
    description: 'ゆうひがしずむいろでおおきいかずをてらす、ひきざんさいごのうちゅうせん。',
    variant: 'sub-sunset',
    lights: 12,
    motif: '-3',
    origin: 'sub',
  },
  'boss-divide-no-remainder': {
    name: 'ディバイドリング号',
    description: '÷のリングが青紫にひかる、わりざんのUFO。',
    variant: 'divide-ring',
    lights: 8,
    motif: '÷',
    origin: 'divide',
  },
  'boss-divide-with-remainder': {
    name: 'クォーター号',
    description: '4つに分かれた機体で、あまりの山場をこえるUFO。',
    variant: 'divide-quarter',
    lights: 10,
    motif: '1/4',
    origin: 'divide',
  },
  'boss-divide-large': {
    name: 'ネビュラ号',
    description: '青紫の星雲をまとって大きいわりざんを進むUFO。',
    variant: 'divide-nebula',
    lights: 12,
    motif: '÷3',
    origin: 'divide',
  },
}

export const bossUfos: UfoDefinition[] = bosses.flatMap((boss) => {
  const seed = bossUfoSeeds[boss.id]
  if (!seed) {
    return []
  }
  return [
    {
      id: `${boss.id}-ufo`,
      no: boss.no,
      bossId: boss.id,
      ...seed,
    },
  ]
})

const legacyBossUfoCount = bosses.filter(
  (boss) => boss.group === 'basic' || boss.group === 'advanced',
).length

export const specialUfo: UfoDefinition = {
  id: specialUfoId,
  no: bossUfos.length + 1,
  bossId: null,
  name: 'にじいろレジェンドごう',
  description: `${legacyBossUfoCount}体のげきムズボスをすべてこえた特別なUFO。`,
  variant: 'special',
  lights: 12,
  motif: '虹',
  origin: 'multiply',
}

export const ufoDefinitions: UfoDefinition[] = [...bossUfos, specialUfo]

export function getUfoById(ufoId: string | null | undefined): UfoDefinition | undefined {
  if (!ufoId) {
    return undefined
  }
  return ufoDefinitions.find((ufo) => ufo.id === ufoId)
}

export function getUfoForBoss(bossId: string): UfoDefinition | undefined {
  return bossUfos.find((ufo) => ufo.bossId === bossId)
}
