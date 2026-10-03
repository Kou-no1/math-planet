import type { QuestionCategory } from '../types/game'

export type NumericPlanetId = 'decimal' | 'fraction'
export type NumericCalculation = 'add' | 'subtract' | 'multiply' | 'divide'
export type NumericOperands = [number, number, number, number]
export type DecimalAreaId =
  | 'decimal-add-tenths'
  | 'decimal-subtract-tenths'
  | 'decimal-add-hundredths'
  | 'decimal-subtract-hundredths'
  | 'decimal-multiply-integer'
  | 'decimal-divide-integer'
export type FractionAreaId =
  | 'fraction-add-same'
  | 'fraction-subtract-same'
  | 'fraction-add-unlike'
  | 'fraction-subtract-unlike'
export type NumericAreaId = DecimalAreaId | FractionAreaId

export type NumericGeneratorSpec = {
  operation: NumericPlanetId
  areaId: NumericAreaId
  category: QuestionCategory
  calculation: NumericCalculation
  scale: 10 | 100
  maxCoefficient: number
  denominatorMode: 'same' | 'unlike'
}

export type NumericAreaDefinition = {
  id: NumericAreaId
  no: number
  name: string
  shortName: string
  description: string
  generator: NumericGeneratorSpec
}

function decimalArea(
  id: DecimalAreaId,
  no: number,
  name: string,
  shortName: string,
  calculation: NumericCalculation,
  scale: 10 | 100,
): NumericAreaDefinition {
  return {
    id,
    no,
    name,
    shortName,
    description:
      calculation === 'divide' ? 'わり切れる小数だけ' : `${scale === 10 ? '0.1' : '0.01'}の位まで`,
    generator: {
      operation: 'decimal',
      areaId: id,
      category: id,
      calculation,
      scale,
      maxCoefficient: scale === 10 ? 99 : 999,
      denominatorMode: 'same',
    },
  }
}

function fractionArea(
  id: FractionAreaId,
  no: number,
  name: string,
  shortName: string,
  calculation: 'add' | 'subtract',
  denominatorMode: 'same' | 'unlike',
): NumericAreaDefinition {
  return {
    id,
    no,
    name,
    shortName,
    description: denominatorMode === 'same' ? '分母は2〜12・約分しよう' : '通分してから計算しよう',
    generator: {
      operation: 'fraction',
      areaId: id,
      category: id,
      calculation,
      scale: 10,
      maxCoefficient: 12,
      denominatorMode,
    },
  }
}

export const decimalAreas: NumericAreaDefinition[] = [
  decimalArea('decimal-add-tenths', 1, '0.1のたし算', '0.1をたす', 'add', 10),
  decimalArea('decimal-subtract-tenths', 2, '0.1のひき算', '0.1をひく', 'subtract', 10),
  decimalArea('decimal-add-hundredths', 3, '0.01のたし算', '0.01をたす', 'add', 100),
  decimalArea('decimal-subtract-hundredths', 4, '0.01のひき算', '0.01をひく', 'subtract', 100),
  decimalArea('decimal-multiply-integer', 5, '小数×整数', '整数をかける', 'multiply', 100),
  decimalArea('decimal-divide-integer', 6, '小数÷整数', '整数でわる', 'divide', 100),
]

export const fractionAreas: NumericAreaDefinition[] = [
  fractionArea('fraction-add-same', 1, '同分母のたし算', '同分母をたす', 'add', 'same'),
  fractionArea('fraction-subtract-same', 2, '同分母のひき算', '同分母をひく', 'subtract', 'same'),
  fractionArea('fraction-add-unlike', 3, '異分母のたし算', '通分してたす', 'add', 'unlike'),
  fractionArea(
    'fraction-subtract-unlike',
    4,
    '異分母のひき算',
    '通分してひく',
    'subtract',
    'unlike',
  ),
]

export const numericAreas = [...decimalAreas, ...fractionAreas]
export function isNumericPlanetId(value: unknown): value is NumericPlanetId {
  return value === 'decimal' || value === 'fraction'
}
export function isNumericAreaId(value: unknown): value is NumericAreaId {
  return numericAreas.some((area) => area.id === value)
}
export function getNumericAreaById(id: NumericAreaId): NumericAreaDefinition {
  return numericAreas.find((area) => area.id === id)!
}
export function numericAreasForPlanet(planet: NumericPlanetId): NumericAreaDefinition[] {
  return planet === 'decimal' ? decimalAreas : fractionAreas
}
export const numericCalculationSymbols: Record<NumericCalculation, string> = {
  add: '+',
  subtract: '-',
  multiply: '×',
  divide: '÷',
}
