import type {
  AnswerResult,
  ArithmeticOperation,
  MultiplicationFactProgress,
} from '../../types/game'
import {
  getNumericAreaById, isNumericAreaId, numericCalculationSymbols,
  type NumericOperands, type NumericPlanetId,
} from '../../data/numericAreas'
import { formatNumericOperand } from './rational'

export type ParsedFactId = {
  id: string
  operation: ArithmeticOperation
  left: number
  right: number
  areaId?: string
  numericOperands?: NumericOperands
}

export function makeMultiplicationFactId(left: number, right: number): string {
  return `${left}x${right}`
}

export function makeAdditionFactId(areaId: string, left: number, right: number): string {
  return `add:${areaId}:${left}+${right}`
}

export function makeSubtractionFactId(areaId: string, left: number, right: number): string {
  return `sub:${areaId}:${left}-${right}`
}

export function makeDivisionFactId(areaId: string, left: number, right: number): string {
  return `divide:${areaId}:${left}/${right}`
}

export function makeNumericFactId(planet: NumericPlanetId, areaId: string, operands: NumericOperands): string {
  return `${planet}:${areaId}:${JSON.stringify(operands)}`
}

export function parseFactId(id: string): ParsedFactId | null {
  const numericMatch = id.match(/^(decimal|fraction):([a-z0-9-]+):(\[.*\])$/)
  if (numericMatch) {
    if (!isNumericAreaId(numericMatch[2])) return null
    const area = getNumericAreaById(numericMatch[2])
    if (area.generator.operation !== numericMatch[1]) return null
    try {
      const tuple: unknown = JSON.parse(numericMatch[3])
      if (!Array.isArray(tuple) || tuple.length !== 4 ||
        !tuple.every((value) => Number.isSafeInteger(value) && value > 0 && value <= 10000)) return null
      const operands = tuple as NumericOperands
      return {
        id, operation: area.generator.operation, areaId: area.id,
        left: operands[0], right: operands[2], numericOperands: operands,
      }
    } catch { return null }
  }
  const additionMatch = id.match(/^add:([a-z0-9-]+):(\d+)\+(\d+)$/)
  if (additionMatch) {
    return {
      id,
      operation: 'addition',
      areaId: additionMatch[1],
      left: Number(additionMatch[2]),
      right: Number(additionMatch[3]),
    }
  }

  const subtractionMatch = id.match(/^sub:([a-z0-9-]+):(\d+)-(\d+)$/)
  if (subtractionMatch) {
    return {
      id,
      operation: 'subtraction',
      areaId: subtractionMatch[1],
      left: Number(subtractionMatch[2]),
      right: Number(subtractionMatch[3]),
    }
  }

  const divisionMatch = id.match(/^divide:([a-z0-9-]+):(\d+)\/(\d+)$/)
  if (divisionMatch) {
    return {
      id,
      operation: 'division',
      areaId: divisionMatch[1],
      left: Number(divisionMatch[2]),
      right: Number(divisionMatch[3]),
    }
  }

  const multiplicationMatch = id.match(/^(\d+)x(\d+)$/)
  if (multiplicationMatch) {
    return {
      id,
      operation: 'multiplication',
      left: Number(multiplicationMatch[1]),
      right: Number(multiplicationMatch[2]),
    }
  }

  return null
}

export function factIdFromResult(result: AnswerResult): string | null {
  return parseFactId(result.questionId)?.id ?? null
}

export function factFromResult(result: AnswerResult): ParsedFactId | null {
  return parseFactId(result.questionId)
}

export function factOperationOf(fact: MultiplicationFactProgress): ArithmeticOperation | null {
  return fact.operation ?? parseFactId(fact.id)?.operation ?? null
}

export function isMultiplicationFactId(id: string): boolean {
  return parseFactId(id)?.operation === 'multiplication'
}

export function isAdditionFactId(id: string): boolean {
  return parseFactId(id)?.operation === 'addition'
}

export function isSubtractionFactId(id: string): boolean {
  return parseFactId(id)?.operation === 'subtraction'
}

export function isDivisionFactId(id: string): boolean {
  return parseFactId(id)?.operation === 'division'
}

export function isMultiplicationFactProgress(fact: MultiplicationFactProgress): boolean {
  return factOperationOf(fact) === 'multiplication'
}

export function isAdditionFactProgress(fact: MultiplicationFactProgress): boolean {
  return factOperationOf(fact) === 'addition'
}

export function isSubtractionFactProgress(fact: MultiplicationFactProgress): boolean {
  return factOperationOf(fact) === 'subtraction'
}

export function isDivisionFactProgress(fact: MultiplicationFactProgress): boolean {
  return factOperationOf(fact) === 'division'
}

export function formatFactLabel(fact: MultiplicationFactProgress | ParsedFactId): string {
  const parsed = parseFactId(fact.id)
  if (parsed?.numericOperands && isNumericAreaId(parsed.areaId)) {
    const area = getNumericAreaById(parsed.areaId)
    const [left, leftDenominator, right, rightDenominator] = parsed.numericOperands
    return `${formatNumericOperand(area.generator.operation, left, leftDenominator)} ${numericCalculationSymbols[area.generator.calculation]} ${formatNumericOperand(area.generator.operation, right, rightDenominator)}`
  }
  const operation = 'operation' in fact ? fact.operation : parseFactId(fact.id)?.operation
  if (operation === 'addition') {
    return `${fact.left} + ${fact.right}`
  }
  if (operation === 'subtraction') {
    return `${fact.left} - ${fact.right}`
  }
  if (operation === 'division') {
    return `${fact.left} ÷ ${fact.right}`
  }
  return `${fact.left} × ${fact.right}`
}
