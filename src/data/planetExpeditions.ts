import type { PlanetId } from './planets'

export const planetExpeditions: Record<
  PlanetId,
  { place: string; request: string; milestone: string; complete: string }
> = {
  decimal: {
    place: '水晶の計量ラボ',
    request: '小さな目盛りを合わせて、計量装置を整えよう。',
    milestone: '計量装置',
    complete: 'すべての計量装置が整ったよ。',
  },
  fraction: {
    place: '分けあう工房',
    request: '同じ大きさに分けた材料を合わせて、工房を完成させよう。',
    milestone: '作業台',
    complete: 'すべての作業台に材料がそろったよ。',
  },
  add: {
    place: 'くさばなの おんしつ',
    request: 'たねを あわせて、はなだんを ふやそう。',
    milestone: 'はなだん',
    complete: 'すべての はなだんに たねが そろったよ。',
  },
  subtract: {
    place: 'ゆうやけの ほきゅうきち',
    request: 'つかったかずと のこりを しらべて、にもつを ととのえよう。',
    milestone: 'ほきゅうこ',
    complete: 'すべての ほきゅうこが ととのったよ。',
  },
  multiply: {
    place: 'こおりのリング はつでんしょ',
    request: 'おなじかずの そうちを ならべて、リングに あかりを ともそう。',
    milestone: 'あかり',
    complete: 'すべての あかりが ともったよ。',
  },
  divide: {
    place: 'ネビュラの はいたつこう',
    request: 'にもつを おなじかずずつ わけよう。あまりは よびこへ。',
    milestone: 'みなと',
    complete: 'すべての みなとに にもつが とどいたよ。',
  },
}
