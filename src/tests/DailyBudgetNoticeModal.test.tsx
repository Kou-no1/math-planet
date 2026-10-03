import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DailyBudgetNoticeModal } from '../components/common/DailyBudgetNoticeModal'
import { DailyUsageProvider } from '../hooks/useDailyUsage'
import { SaveDataProvider } from '../hooks/useSaveData'

describe('DailyBudgetNoticeModal', () => {
  it('shows the school mode notice as a centered hiragana modal', async () => {
    const onDismiss = vi.fn()
    window.localStorage.clear()
    render(<SaveDataProvider><DailyUsageProvider><DailyBudgetNoticeModal open onDismiss={onDismiss} /></DailyUsageProvider></SaveDataProvider>)

    const dialog = screen.getByRole('dialog', { name: '10ぷん たったよ' })
    expect(dialog).toHaveClass('reward-budget-modal')
    expect(dialog.parentElement).toHaveClass('reward-budget-backdrop')
    expect(screen.getByText('このあとは コインとけいけんちは たまらないよ。')).toBeInTheDocument()
    expect(screen.queryByText(/10分|経験値/)).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'わかった' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
