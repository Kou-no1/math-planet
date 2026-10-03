import type { Question } from '../../types/game'
import { parseFactId } from '../questions/factIds'
import Fraction from 'fraction.js'
import { getNumericAreaById, isNumericAreaId } from '../../data/numericAreas'

export type CalculationHint = {
  title: string
  steps: string[]
  groups: Array<{
    label: string
    count: number
    kind: 'together' | 'remaining' | 'shared'
  }>
}

export function calculationHint(question: Question): CalculationHint | null {
  const fact = parseFactId(question.id)
  if (!fact) return null
  if (fact.numericOperands && isNumericAreaId(fact.areaId)) {
    const [a, ad, b, bd] = fact.numericOperands
    const area = getNumericAreaById(fact.areaId)
    if (area.generator.operation === 'fraction') {
      const common = Number(new Fraction(ad).lcm(bd).n)
      return { title: '同じ大きさにそろえよう', groups: [], steps: [
        `分母 ${ad} と ${bd} の最小公倍数は ${common}。`,
        `${a}/${ad} は ${a * (common / ad)}/${common}、${b}/${bd} は ${b * (common / bd)}/${common} と同じ大きさ。`,
        '分母をそろえて分子を計算し、分子と分母を同じ数でわって約分しよう。',
      ] }
    }
    return { title: '小数の位をそろえよう', groups: [], steps: area.generator.calculation === 'multiply' || area.generator.calculation === 'divide'
      ? [`小数を ${ad} 倍すると整数になる。`, '整数として計算してから、答えを同じ倍率でもとに戻そう。']
      : [`どちらも 1/${ad} のまとまりで考えよう。`, '小数点をそろえて、同じ位どうしを計算しよう。'] }
  }
  const { left, right, operation } = fact
  const places = ['1', '10', '100', '1000']
  if (operation === 'addition') {
    const steps: string[] = []
    let carry = 0
    const length = Math.max(String(left).length, String(right).length)
    for (let index = 0; index < length; index += 1) {
      const a = Math.floor(left / 10 ** index) % 10
      const b = Math.floor(right / 10 ** index) % 10
      const sum = a + b + carry
      steps.push(
        `${places[index]}のくらい: ${a} + ${b}${carry ? ' + 1' : ''} = ${sum}${sum >= 10 ? '。10を つぎのくらいへ' : ''}`,
      )
      carry = Math.floor(sum / 10)
    }
    if (carry) steps.push(`${places[length]}のくらいに ${carry}`)
    return {
      title: 'あわせて いくつ',
      steps,
      groups:
        left <= 9 && right <= 9
          ? [
              { label: 'はじめ', count: left, kind: 'together' },
              { label: 'ふえる', count: right, kind: 'remaining' },
            ]
          : [],
    }
  }
  if (operation === 'subtraction') {
    const digits = String(left).split('').reverse().map(Number)
    const steps: string[] = []
    for (let index = 0; index < digits.length; index += 1) {
      const b = Math.floor(right / 10 ** index) % 10
      if (digits[index] < b) {
        let source = index + 1
        while (source < digits.length && digits[source] === 0) {
          digits[source] = 9
          source += 1
        }
        if (source >= digits.length) return null
        digits[source] -= 1
        digits[index] += 10
        steps.push(`${places[source]}のまとまりを くずして、${places[index]}のくらいへ`)
      }
      steps.push(`${places[index]}のくらい: ${digits[index]} - ${b} = ${digits[index] - b}`)
    }
    return {
      title: 'のこりは いくつ',
      steps,
      groups:
        left <= 18
          ? [
              { label: 'のこる', count: left - right, kind: 'together' },
              { label: 'ひく', count: right, kind: 'remaining' },
            ]
          : [],
    }
  }
  if (operation === 'division' && right > 0) {
    const quotient = Math.floor(left / right)
    const remainder = left % right
    return {
      title: 'おなじかずずつ わけよう',
      steps: [
        `${left}こを ${right}つに わけると、ひとつに ${quotient}こ`,
        `${right} × ${quotient}${remainder ? ` + ${remainder}` : ''} = ${left}`,
        remainder
          ? `あまりは ${remainder}。わるかず ${right}より ちいさいね`
          : 'あまりは ありません',
      ],
      groups: [
        ...Array.from({ length: right }, (_, index) => ({
          label: `${index + 1}くみ`,
          count: quotient,
          kind: 'shared' as const,
        })),
        ...(remainder ? [{ label: 'あまり', count: remainder, kind: 'remaining' as const }] : []),
      ],
    }
  }
  return {
    title: 'おなじかずの まとまり',
    steps: [`${left}こずつを ${right}くみ`, Array.from({ length: right }, () => left).join(' + ')],
    groups: Array.from({ length: right }, (_, index) => ({
      label: `${index + 1}くみ`,
      count: left,
      kind: 'shared' as const,
    })),
  }
}
