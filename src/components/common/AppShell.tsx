import { Link, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useDailyUsage } from '../../hooks/useDailyUsage'
import { useSaveData } from '../../hooks/useSaveData'

export function AppShell({
  children,
  title,
  backTo = '/home',
  className = '',
  rightAction,
  onBack,
}: {
  children: ReactNode
  title: string
  backTo?: string
  className?: string
  rightAction?: ReactNode
  onBack?: () => void
}) {
  const location = useLocation()
  const { rewardBudgetReached } = useDailyUsage()
  const { saveError } = useSaveData()
  const showBack = location.pathname !== '/home'

  return (
    <div className={['app-shell', className].filter(Boolean).join(' ')}>
      <header className="top-bar">
        {showBack && onBack ? (
          <button className="icon-button" type="button" onClick={onBack} aria-label="もどる">
            ←
          </button>
        ) : showBack ? (
          <Link className="icon-button" to={backTo} aria-label="もどる">
            ←
          </Link>
        ) : (
          <span className="brand-mark" aria-hidden="true">
            く
          </span>
        )}
        <div className="top-bar-title">
          <h1>{title}</h1>
          {rewardBudgetReached ? (
            <span className="reward-budget-chip">きょうの ごほうびは おしまい</span>
          ) : null}
        </div>
        {rightAction ?? (
          <Link className="icon-button" to="/settings" aria-label="せってい">
            ⚙
          </Link>
        )}
      </header>
      {saveError ? (
        <p className="save-error-notice" role="alert">
          {saveError}
        </p>
      ) : null}
      <main>{children}</main>
      <footer className="site-footer">
        <p>「あったらいいのに」を、作ってる。</p>
        <p>© 2026 まなびたね All rights reserved.</p>
      </footer>
    </div>
  )
}
