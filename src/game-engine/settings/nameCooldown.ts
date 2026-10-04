export const NAME_CHANGE_COOLDOWN_STORAGE_KEY = 'kukucchi_nameChangeCooldown'
export const NAME_CHANGE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000

export type NameChangeTarget = 'ship' | 'character'
export type NameCooldownState = Partial<Record<NameChangeTarget, string>>

type NameCooldownStorage = Pick<Storage, 'getItem' | 'setItem'>

function parseTimestamp(value: string | null | undefined): number | null {
  if (!value) {
    return null
  }
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : null
}

export function canChangeName(
  state: NameCooldownState,
  target: NameChangeTarget,
  now = Date.now(),
): boolean {
  const unlockAt = parseTimestamp(state[target])
  return unlockAt === null || unlockAt <= now
}

export function recordNameChange(
  state: NameCooldownState,
  target: NameChangeTarget,
  changedAt = Date.now(),
): NameCooldownState {
  return {
    ...state,
    [target]: new Date(changedAt + NAME_CHANGE_COOLDOWN_MS).toISOString(),
  }
}

export function remainingNameCooldownMs(
  state: NameCooldownState,
  target: NameChangeTarget,
  now = Date.now(),
): number {
  const unlockAt = parseTimestamp(state[target])
  return unlockAt === null ? 0 : Math.max(0, unlockAt - now)
}

export function formatNameCooldownMessage(
  state: NameCooldownState,
  target: NameChangeTarget,
  now = Date.now(),
): string | null {
  const unlockAt = parseTimestamp(state[target])
  if (unlockAt === null || unlockAt <= now) {
    return null
  }
  const next = new Date(unlockAt)
  return `つぎに かえられるのは ${next.getMonth() + 1}がつ${next.getDate()}にち${next.getHours()}じ です`
}

export function readNameCooldownState(storage?: NameCooldownStorage): NameCooldownState {
  try {
    const targetStorage = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined)
    if (!targetStorage) return {}
    const parsed = JSON.parse(
      targetStorage.getItem(NAME_CHANGE_COOLDOWN_STORAGE_KEY) ?? '{}',
    ) as NameCooldownState
    return {
      ship: parseTimestamp(parsed.ship) === null ? undefined : parsed.ship,
      character: parseTimestamp(parsed.character) === null ? undefined : parsed.character,
    }
  } catch {
    return {}
  }
}

export function writeNameCooldownState(
  state: NameCooldownState,
  storage?: NameCooldownStorage,
): void {
  try {
    const targetStorage = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined)
    targetStorage?.setItem(NAME_CHANGE_COOLDOWN_STORAGE_KEY, JSON.stringify(state))
  } catch { /* The in-memory cooldown still applies for this session. */ }
}
