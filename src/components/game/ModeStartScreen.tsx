import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { KukucchiCharacter } from '../character/KukucchiCharacter'

type ModeStartScreenProps = {
  title: ReactNode
  eyebrow: string
  description: string
  level: number
  backTo: string
  children?: ReactNode
  onBack?: () => void
  startLabel?: string
  onStart: () => void
}

export function ModeStartScreen({
  title,
  eyebrow,
  description,
  level,
  backTo,
  children,
  onBack,
  startLabel = 'スタート！',
  onStart,
}: ModeStartScreenProps) {
  const [countdown, setCountdown] = useState<number | null>(null)

  function startCountdown() {
    if (countdown !== null) {
      return
    }
    setCountdown(3)
    window.setTimeout(() => setCountdown(2), 700)
    window.setTimeout(() => setCountdown(1), 1400)
    window.setTimeout(() => {
      setCountdown(null)
      onStart()
    }, 2100)
  }

  return (
    <section className="mode-start-screen" aria-labelledby="mode-start-title">
      <KukucchiCharacter level={level} mood="cheer" />
      <div className="mode-start-copy">
        <p className="welcome">{eyebrow}</p>
        <h2 id="mode-start-title">{title}</h2>
        <p className="title-line">{description}</p>
      </div>
      {children ? <div className="mode-start-options">{children}</div> : null}
      <div className="mode-start-actions">
        <button
          className="primary-action speed-start-button"
          type="button"
          onClick={startCountdown}
          disabled={countdown !== null}
        >
          {countdown === null ? startLabel : countdown}
        </button>
        {onBack ? (
          <button className="secondary-action" type="button" onClick={onBack}>
            もどる
          </button>
        ) : (
          <Link className="secondary-action" to={backTo}>
            もどる
          </Link>
        )}
      </div>
    </section>
  )
}
