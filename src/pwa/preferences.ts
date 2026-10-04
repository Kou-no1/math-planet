export const INSTALL_PREFERENCE_KEY = 'keisan-no-hoshi-pwa-install-v1'
export const INSTALL_REMINDER_DELAY_MS = 7 * 24 * 60 * 60 * 1000
let dismissedInSession = false

export function installReminderAllowed(
  now = Date.now(),
  storage?: Pick<Storage, 'getItem'>,
): boolean {
  if (dismissedInSession) return false
  try {
    const value: unknown = JSON.parse(
      (storage ?? window.localStorage).getItem(INSTALL_PREFERENCE_KEY) ?? '{}',
    )
    const until =
      value && typeof value === 'object' && 'dismissedUntil' in value
        ? value.dismissedUntil
        : 0
    return typeof until !== 'number' || !Number.isFinite(until) || now >= until
  } catch {
    return true
  }
}

export function dismissInstallReminder(
  now = Date.now(),
  storage?: Pick<Storage, 'setItem'>,
): void {
  dismissedInSession = true
  try {
    ;(storage ?? window.localStorage).setItem(
      INSTALL_PREFERENCE_KEY,
      JSON.stringify({ dismissedUntil: now + INSTALL_REMINDER_DELAY_MS }),
    )
  } catch {
    /* This session remains dismissed even when storage is blocked. */
  }
}
