export type OperationRewardOrigin =
  | 'add'
  | 'sub'
  | 'subtract'
  | 'multiply'
  | 'divide'
  | 'decimal'
  | 'fraction'

export type RewardOrigin = 'all' | OperationRewardOrigin

export type VisibleStarFilter = 'all' | 'add' | 'subtract' | 'multiply' | 'divide' | 'decimal' | 'fraction'
