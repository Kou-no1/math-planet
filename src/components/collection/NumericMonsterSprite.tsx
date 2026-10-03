import { memo } from 'react'
import { numericPalette, type NumericMonsterDefinition } from '../../data/numericRewards'
import type { BossDefinition } from '../../data/bosses'

export const NumericMonsterSprite = memo(function NumericMonsterSprite({
  monster,
  locked = false,
  className = '',
  boss = false,
}: {
  monster: Pick<NumericMonsterDefinition, 'name' | 'variant' | 'origin'>
  locked?: boolean
  className?: string
  boss?: boolean
}) {
  const colors = locked
    ? {
        base: '#536174',
        outline: '#243347',
        shadow: '#3c4b60',
        highlight: '#8e9aad',
        accent: '#8e9aad',
      }
    : numericPalette[monster.origin]
  const cells = []
  for (let y = 2; y < 13; y++)
    for (let x = 2; x < 13; x++) {
      const crystal = Math.abs(x - 7) + Math.abs(y - 7) <= 5 + (monster.variant === 3 ? 1 : 0)
      const pieces =
        x >= 3 && x <= 11 && y >= 3 && y <= 11 && x !== 7 && y !== 7 && !(x === 3 && y === 3)
      if (monster.origin === 'decimal' ? crystal : pieces) cells.push({ x, y })
    }
  return (
    <svg
      className={`monster-pixel-sprite numeric-monster-sprite ${boss ? 'numeric-boss-sprite' : ''} ${className}`}
      viewBox="0 0 120 128"
      role="img"
      aria-label={locked ? '未取得のなかま' : monster.name}
      shapeRendering="crispEdges"
    >
      {cells.map(({ x, y }) => (
        <rect
          key={`${x}-${y}`}
          x={x * 8}
          y={y * 8}
          width="8"
          height="8"
          fill={y > 9 ? colors.shadow : x < 6 && y < 6 ? colors.highlight : colors.base}
          stroke={colors.outline}
          strokeWidth="0.5"
        />
      ))}
      {monster.origin === 'decimal' ? (
        <>
          <rect x="48" y="24" width="8" height="8" fill={colors.accent} />
          <path d="M40 40H72M40 48H64M40 56H72" stroke={colors.accent} strokeWidth="4" />
        </>
      ) : (
        <path d="M56 24V96M24 56H96" stroke={colors.accent} strokeWidth="4" />
      )}
      {!locked ? (
        <>
          <rect x="40" y="64" width="8" height="8" fill={colors.outline} />
          <rect x="72" y="64" width="8" height="8" fill={colors.outline} />
          <path d="M48 88H72" stroke={colors.outline} strokeWidth="5" />
        </>
      ) : null}
      {boss ? (
        <path
          d="M32 24V8L48 16L60 4L72 16L88 8V24Z"
          fill={colors.accent}
          stroke={colors.outline}
          strokeWidth="3"
        />
      ) : null}
      <text x="60" y="123" textAnchor="middle" fontSize="12" fill={colors.accent}>
        {monster.origin === 'decimal'
          ? `0.${monster.variant}`
          : `${monster.variant}/${monster.variant + 1}`}
      </text>
    </svg>
  )
})

export function NumericBossSprite({
  boss,
  locked = false,
  className = '',
  compact = false,
}: {
  boss: BossDefinition
  locked?: boolean
  className?: string
  compact?: boolean
}) {
  return (
    <NumericMonsterSprite
      monster={{
        name: boss.label,
        variant: ((boss.no - 28) % 3) + 1,
        origin: boss.group === 'fraction' ? 'fraction' : 'decimal',
      }}
      locked={locked}
      boss
      className={`${compact ? 'compact' : ''} ${className}`}
    />
  )
}
