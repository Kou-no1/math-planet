import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { appLaunchUrl, APP_BASE } from '../pwa/config'
import {
  captureInstallPrompt,
  getPwaState,
  requestInstall,
  safeUpdateLocation,
  startPwa,
  type InstallPromptEvent,
} from '../pwa/client'
import {
  createLocalStorageSaveRepository,
  PRE_RESTORE_BACKUP_KEY,
  STORAGE_KEY,
} from '../repositories/saveRepository'
import { createLocalStorageDailyUsageRepository } from '../repositories/dailyUsageRepository'
import {
  createDefaultSaveData,
  createPlayerFromOnboarding,
  parseSaveData,
} from '../storage/saveData'
import { SaveDataProvider } from '../hooks/useSaveData'
import { BackupPanel } from '../components/common/BackupPanel'
import { PwaHomePanel, InstallHelp } from '../pwa/PwaPanel'

function exampleSave() {
  return createPlayerFromOnboarding({
    nickname: 'みらい',
    icon: 'たまご',
    learningLevel: 'first',
    soundEnabled: false,
  })
}
beforeEach(() => {
  window.localStorage.clear()
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
})

describe('PWA capabilities and update gates', () => {
  it('keeps a stable, sanitized application identity without onboarding/hash/query', () => {
    expect(APP_BASE).toBe('/math-planet/')
    expect(appLaunchUrl('https://manabitane.jp')).toBe(
      'https://manabitane.jp/math-planet/',
    )
  })
  it('uses the captured browser install event only once, including cancellation', async () => {
    const event = new Event('beforeinstallprompt', {
      cancelable: true,
    }) as InstallPromptEvent
    event.prompt = vi.fn().mockResolvedValue(undefined)
    event.userChoice = Promise.resolve({ outcome: 'dismissed' })
    captureInstallPrompt(event)
    expect(event.defaultPrevented).toBe(true)
    expect(await requestInstall()).toBe('dismissed')
    expect(await requestInstall()).toBe('unavailable')
    expect(event.prompt).toHaveBeenCalledTimes(1)
  })
  it('does not infer native install support from a browser name', async () => {
    render(<InstallHelp />)
    expect(
      screen.queryByRole('button', { name: 'ホーム画面に追加する' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText(/外部ブラウザへ必ず切り替わるものではありません/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/自動で引き継がれるとは限りません/),
    ).toBeInTheDocument()
  })
  it('only permits an unobstructed saved home, never play, result or onboarding', () => {
    expect(safeUpdateLocation('/home', null, false)).toBe(true)
    for (const path of [
      '/learn',
      '/speed',
      '/result',
      '/onboarding',
      '/settings',
    ])
      expect(safeUpdateLocation(path, null, false)).toBe(false)
    expect(safeUpdateLocation('/home', 'full', false)).toBe(false)
    expect(safeUpdateLocation('/home', null, true)).toBe(false)
  })
  it('has no automatic first-run card and offers a small card after practice', () => {
    const data = exampleSave()
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    const first = render(
      <SaveDataProvider>
        <PwaHomePanel safe />
      </SaveDataProvider>,
    )
    expect(screen.queryByTestId('install-reminder')).not.toBeInTheDocument()
    first.unmount()
    data.progress.history.push({
      id: 'test',
      mode: 'learn',
      correctCount: 5,
      totalQuestions: 5,
      averageResponseTimeMs: 1000,
      score: 100,
      playedAt: new Date().toISOString(),
    })
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    render(
      <SaveDataProvider>
        <PwaHomePanel safe />
      </SaveDataProvider>,
    )
    expect(screen.getByTestId('install-reminder')).toBeInTheDocument()
  })
  it('does not offer an automatic reminder or native install in standalone mode', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true })),
    )
    const event = new Event('beforeinstallprompt') as InstallPromptEvent
    event.prompt = vi.fn()
    captureInstallPrompt(event)
    const data = exampleSave()
    data.progress.history.push({
      id: 'test',
      mode: 'learn',
      correctCount: 5,
      totalQuestions: 5,
      averageResponseTimeMs: 1000,
      score: 100,
      playedAt: new Date().toISOString(),
    })
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    render(
      <SaveDataProvider>
        <PwaHomePanel safe />
      </SaveDataProvider>,
    )
    expect(screen.queryByTestId('install-reminder')).not.toBeInTheDocument()
    expect(await requestInstall()).toBe('unavailable')
    expect(event.prompt).not.toHaveBeenCalled()
  })
  it('does not confuse an installed app with the current standalone display mode', () => {
    startPwa()
    window.dispatchEvent(new Event('appinstalled'))
    expect(getPwaState().installed).toBe(true)
    expect(getPwaState().standalone).toBe(false)
    expect(getPwaState().installAvailable).toBe(false)
  })
  it('suppresses the reminder seven days without modifying the save schema; denied storage suppresses this session', async () => {
    vi.resetModules()
    const prefs = await import('../pwa/preferences')
    const storage = {
      setItem: vi.fn(),
      getItem: () =>
        JSON.stringify({
          dismissedUntil: 1000 + prefs.INSTALL_REMINDER_DELAY_MS,
        }),
    }
    expect(prefs.installReminderAllowed(1000, storage)).toBe(false)
    expect(
      prefs.installReminderAllowed(
        1000 + prefs.INSTALL_REMINDER_DELAY_MS,
        storage,
      ),
    ).toBe(true)
    prefs.dismissInstallReminder(1000, {
      setItem: () => {
        throw new Error('denied')
      },
    })
    expect(
      prefs.installReminderAllowed(1000 + prefs.INSTALL_REMINDER_DELAY_MS),
    ).toBe(false)
    expect(createDefaultSaveData().version).toBe(15)
  })
})

describe('protected storage and backup', () => {
  it('catches getItem exceptions before any write is attempted', () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new DOMException('denied', 'SecurityError')
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    } as unknown as Storage
    const repo = createLocalStorageSaveRepository(storage)
    expect(repo.loadState().error).toBeTruthy()
    expect(() => repo.save(exampleSave())).toThrow()
    expect(storage.setItem).not.toHaveBeenCalled()
  })
  it.each([
    '{broken',
    'null',
    '[]',
    '{}',
    '{"version":15}',
    JSON.stringify({ ...exampleSave(), version: 99 }),
  ])('leaves an unreadable/future original untouched: %s', (raw) => {
    window.localStorage.setItem(STORAGE_KEY, raw)
    const repo = createLocalStorageSaveRepository()
    expect(repo.loadState().error).toBeTruthy()
    expect(() => repo.save(exampleSave())).toThrow()
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(raw)
  })
  it('handles denied getters, reads and quota without overwriting a recovered original', () => {
    const getter = vi
      .spyOn(window, 'localStorage', 'get')
      .mockImplementation(() => {
        throw new DOMException('denied', 'SecurityError')
      })
    const repo = createLocalStorageSaveRepository()
    expect(repo.loadState().error).toBeTruthy()
    expect(createLocalStorageDailyUsageRepository().load().usedMs).toBe(0)
    getter.mockRestore()
    const original = JSON.stringify(exampleSave())
    window.localStorage.setItem(STORAGE_KEY, original)
    expect(() => repo.save(createDefaultSaveData())).toThrow()
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(original)
  })
  it('does not overwrite a newer record written by a second tab', () => {
    const repo = createLocalStorageSaveRepository()
    repo.load()
    const other = JSON.stringify(exampleSave())
    window.localStorage.setItem(STORAGE_KEY, other)
    expect(() => repo.save(createDefaultSaveData())).toThrow(/別のタブ/)
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(other)
  })
  it('allows an explicit validated restore and retains the exact original separately', () => {
    window.localStorage.setItem(STORAGE_KEY, '{broken')
    const repo = createLocalStorageSaveRepository()
    repo.load()
    repo.restore(exampleSave())
    expect(window.localStorage.getItem(PRE_RESTORE_BACKUP_KEY)).toBe('{broken')
    expect(repo.load().player?.nickname).toBe('みらい')
  })
  it.each([
    {
      ...exampleSave(),
      progress: { ...exampleSave().progress, history: [null] },
    },
    {
      ...exampleSave(),
      progress: {
        ...exampleSave().progress,
        facts: { bad: { recentResults: 'not-array' } },
      },
    },
    { ...exampleSave(), settings: { soundEnabled: 'yes' } },
    { ...exampleSave(), player: { ...exampleSave().player, titles: [null] } },
  ])(
    'rejects malformed nested backup before any migration/restore write',
    (data) => {
      expect(() => parseSaveData(JSON.stringify(data))).toThrow()
    },
  )
  it('validates import before asking for overwrite confirmation', async () => {
    const user = userEvent.setup()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const raw = JSON.stringify(exampleSave())
    window.localStorage.setItem(STORAGE_KEY, raw)
    render(
      <SaveDataProvider>
        <BackupPanel />
      </SaveDataProvider>,
    )
    await user.type(screen.getByLabelText('貼り付け用セーブデータ'), 'not-json')
    await user.click(screen.getByRole('button', { name: 'データをひきつぐ' }))
    expect(confirm).not.toHaveBeenCalled()
    expect(screen.getByRole('status')).toHaveTextContent(
      'もとのデータは変えていません',
    )
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(raw)
    confirm.mockRestore()
  })
})
