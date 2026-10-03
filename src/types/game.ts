export type LearningLevel = 'first' | 'practicing' | 'challenge' | 'advanced'

export type ArithmeticOperation =
  | 'multiplication' | 'addition' | 'subtraction' | 'division' | 'decimal' | 'fraction'

export type QuestionCategory =
  | 'multiplication-basic'
  | 'multiplication-square'
  | 'pi-multiplication'
  | 'addition-within-9'
  | 'addition-within-10'
  | 'addition-carry-basic'
  | 'addition-two-digit-no-carry'
  | 'addition-two-digit-carry'
  | 'addition-three-digit'
  | 'subtraction-within-9'
  | 'subtraction-within-10'
  | 'subtraction-borrow-basic'
  | 'subtraction-two-digit-no-borrow'
  | 'subtraction-two-digit-borrow'
  | 'subtraction-three-digit'
  | 'division-no-remainder'
  | 'division-with-remainder'
  | 'division-large'
  | 'decimal-add-tenths'
  | 'decimal-subtract-tenths'
  | 'decimal-add-hundredths'
  | 'decimal-subtract-hundredths'
  | 'decimal-multiply-integer'
  | 'decimal-divide-integer'
  | 'fraction-add-same'
  | 'fraction-subtract-same'
  | 'fraction-add-unlike'
  | 'fraction-subtract-unlike'
  | 'two-digit-times-one-digit'
  | 'two-digit-times-two-digit'
  | 'divisors'
  | 'multiples'
  | 'prime'
  | 'gcd'
  | 'lcm'

export type AnswerMode = 'choice' | 'input'
export type RemainderAnswerValue = {
  kind: 'remainder'
  quotient: number
  remainder: number
}
export type DecimalAnswerValue = { kind: 'decimal'; value: string }
export type FractionAnswerValue = { kind: 'fraction'; numerator: number; denominator: number }
export type AnswerValue = number | string | RemainderAnswerValue | DecimalAnswerValue | FractionAnswerValue
export type GameMode =
  | 'learn'
  | 'speed'
  | 'review'
  | 'battle'
  | 'boss'
  | 'treasure'
  | 'rocket'
  | 'advanced'

export type Question = {
  id: string
  category: QuestionCategory
  prompt: string
  answer: AnswerValue
  choices?: AnswerValue[]
  explanation?: string
  difficulty: number
  metadata?: Record<string, unknown>
}

export type AnswerResult = {
  questionId: string
  prompt: string
  expectedAnswer: AnswerValue
  givenAnswer: AnswerValue
  correct: boolean
  difficulty?: number
  hintUsed?: boolean
  responseTimeMs: number
  answeredAt: string
}

export type MultiplicationFactProgress = {
  id: string
  operation?: ArithmeticOperation
  areaId?: string
  left: number
  right: number
  correctCount: number
  incorrectCount: number
  consecutiveCorrect: number
  averageResponseTimeMs: number
  bestResponseTimeMs: number | null
  lastAnsweredAt: string | null
  nextReviewAt: string | null
  masteryLevel: 0 | 1 | 2 | 3 | 4 | 5
  firstIncorrectAt?: string | null
  overcomeAt?: string | null
  recentResults: AnswerResult[]
}

export type GameSessionSummary = {
  id: string
  mode: GameMode
  totalQuestions: number
  correctCount: number
  accuracy: number
  averageResponseTimeMs: number
  maxCombo: number
  score: number
  earnedCoins: number
  earnedExp: number
  newTitles: string[]
  bestUpdated: boolean
  weakFacts: MultiplicationFactProgress[]
  masteredFacts: MultiplicationFactProgress[]
  details?: Record<string, number | string | boolean | string[] | null>
  results: AnswerResult[]
  finishedAt: string
}

export type ScoreState = {
  score: number
  combo: number
  maxCombo: number
}

export type DailyMission = {
  id: string
  label: string
  kind: 'correct-count' | 'stage-practice' | 'area-practice' | 'combo' | 'speed-play'
  operation?: ArithmeticOperation
  areaId?: string
  stage?: number
  target: number
  progress: number
  completed: boolean
}
