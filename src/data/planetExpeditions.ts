import type { PlanetId } from './planets'

export const planetExpeditions: Record<
  PlanetId,
  { place: string; request: string; milestone: string; complete: string }
> = {
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
