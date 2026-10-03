import { useId } from 'react'
import {
  getTitleEmblemDefinition,
  titleLabel,
  type TitleEmblemRarity,
} from '../../game-engine/rewards/titles'

type TitleEmblemProps = {
  title?: string | null
  locked?: boolean
  className?: string
  label?: string
}

function frameForRarity(rarity: TitleEmblemRarity): string {
  if (rarity === 'legendary') {
    return 'M32 4 L40 12 L52 10 L54 22 L62 32 L54 42 L52 54 L40 52 L32 60 L24 52 L12 54 L10 42 L2 32 L10 22 L12 10 L24 12 Z'
  }
  if (rarity === 'epic') {
    return 'M32 5 L52 15 L56 36 C52 49 43 57 32 61 C21 57 12 49 8 36 L12 15 Z'
  }
  if (rarity === 'rare') {
    return 'M32 6 L53 19 L49 50 L32 60 L15 50 L11 19 Z'
  }
  return 'M32 6 A26 26 0 1 1 31.9 6 Z'
}

export function TitleEmblem({ title, locked = false, className, label }: TitleEmblemProps) {
  const gradientId = useId()
  const glowId = useId()
  const definition = getTitleEmblemDefinition(locked ? null : title)
  const displayMotif = locked ? '?' : definition.motif
  const ariaLabel =
    label ??
    (locked ? 'みしゅとくのしょうごう' : `${title ? titleLabel(title) : 'しょうごう'}のエンブレム`)

  return (
    <svg
      className={['title-emblem', `title-emblem-${definition.rarity}`, className]
        .filter(Boolean)
        .join(' ')}
      viewBox="0 0 64 64"
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          {definition.rarity === 'legendary' ? (
            <>
              <stop offset="0" stopColor="#68f4ff" />
              <stop offset="0.35" stopColor="#ffd86a" />
              <stop offset="0.7" stopColor="#ff7ac8" />
              <stop offset="1" stopColor="#7c3aed" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor={definition.primary} />
              <stop offset="1" stopColor={definition.secondary} />
            </>
          )}
        </linearGradient>
        <filter id={glowId} x="-45%" y="-45%" width="190%" height="190%">
          <feGaussianBlur
            stdDeviation={definition.rarity === 'common' ? '1.4' : '2.4'}
            result="blur"
          />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d={frameForRarity(definition.rarity)}
        fill={`url(#${gradientId})`}
        stroke={locked ? 'rgba(232,251,255,0.42)' : definition.accent}
        strokeWidth={definition.rarity === 'common' ? 2 : 2.6}
        filter={`url(#${glowId})`}
      />
      <path
        d="M32 13 C43 13 51 21 51 32 C51 43 43 51 32 51 C21 51 13 43 13 32 C13 21 21 13 32 13 Z"
        fill={locked ? 'rgba(7,18,37,0.62)' : 'rgba(3,14,28,0.42)'}
        stroke={locked ? 'rgba(232,251,255,0.28)' : 'rgba(255,255,255,0.5)'}
        strokeWidth="1.4"
      />
      {definition.rarity !== 'common' ? (
        <>
          <circle cx="17" cy="21" r="2.2" fill={definition.accent} opacity="0.95" />
          <circle cx="47" cy="21" r="2.2" fill={definition.accent} opacity="0.95" />
          <circle cx="32" cy="55" r="2.4" fill={definition.accent} opacity="0.82" />
        </>
      ) : null}
      {definition.rarity === 'legendary' ? (
        <>
          <path
            d="M14 43 C22 36 42 36 50 43"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            opacity="0.8"
          />
          <path
            d="M14 20 C24 27 40 27 50 20"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.5"
            opacity="0.7"
          />
        </>
      ) : null}
      <text
        x="32"
        y={displayMotif === '∞' ? '39' : '38'}
        textAnchor="middle"
        fontSize={displayMotif.length > 1 ? 18 : 24}
        fontWeight="900"
        fill={locked ? 'rgba(232,251,255,0.64)' : '#ffffff'}
        stroke="rgba(3,14,28,0.58)"
        strokeWidth="1.8"
        paintOrder="stroke"
      >
        {displayMotif}
      </text>
    </svg>
  )
}
