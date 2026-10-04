import { APP_BASE } from './config'
import { dismissInstallReminder } from './preferences'

declare const __PWA_BUILD_ID__: string
export const PWA_BUILD_ID = __PWA_BUILD_ID__

export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
export type PwaState = {
  installAvailable: boolean
  installed: boolean
  standalone: boolean
  offlineReady: boolean
  updateAvailable: boolean
  error: string | null
}
let state: PwaState = {
  installAvailable: false,
  installed: false,
  standalone: false,
  offlineReady: false,
  updateAvailable: false,
  error: null,
}
let installEvent: InstallPromptEvent | null = null
let registration: ServiceWorkerRegistration | null = null
let started = false
let updating = false
const listeners = new Set<() => void>()
const publish = (next: Partial<PwaState>) => {
  state = { ...state, ...next }
  for (const listener of listeners) listener()
}
export const getPwaState = () => state
export const subscribePwa = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  )
}

export function captureInstallPrompt(event: InstallPromptEvent): void {
  event.preventDefault()
  const standalone = isStandalone()
  installEvent = standalone ? null : event
  publish({ installAvailable: !standalone, standalone })
}

export async function requestInstall(): Promise<
  'accepted' | 'dismissed' | 'unavailable' | 'failed'
> {
  const event = installEvent
  if (!event || isStandalone()) return 'unavailable'
  // The browser event is one-use, including when the user declines it.
  installEvent = null
  publish({ installAvailable: false })
  try {
    await event.prompt()
    return (await event.userChoice).outcome
  } catch {
    return 'failed'
  }
}

type WorkerReply = { allowed?: boolean; count?: number; ready?: boolean }
export function askWorker(
  worker: ServiceWorker,
  type: string,
): Promise<WorkerReply> {
  return new Promise((resolve) => {
    const channel = new MessageChannel()
    const timer = window.setTimeout(() => {
      channel.port1.close()
      resolve({})
    }, 3000)
    channel.port1.onmessage = (event: MessageEvent<WorkerReply>) => {
      clearTimeout(timer)
      channel.port1.close()
      resolve(event.data ?? {})
    }
    try {
      worker.postMessage({ type }, [channel.port2])
    } catch {
      clearTimeout(timer)
      channel.port1.close()
      resolve({})
    }
  })
}

export function safeUpdateLocation(
  pathname: string,
  saveError: string | null,
  modalOpen: boolean,
): boolean {
  return pathname === '/home' && !saveError && !modalOpen
}

export async function applyPwaUpdate(
  canUpdate: () => boolean,
  flushSave: () => boolean,
): Promise<string | null> {
  if (updating || !canUpdate()) return 'ホームに もどってから こうしんしてね。'
  const worker = registration?.waiting
  if (!worker) return 'まだ こうしんできません。あとで ためしてね。'
  updating = true
  try {
    const check = await askWorker(worker, 'PWA_CAN_UPDATE')
    if (check.allowed !== true)
      return 'ほかの「けいさんのほし」のタブやアプリを とじてね。わからないときは すべてとじて、つぎにひらこう。'
    if (!canUpdate() || !flushSave())
      return 'きろくを ほぞんできません。バックアップしてから ためしてね。'
    // Check again in the worker immediately before activation. Never reload other clients.
    const activated = new Promise<boolean>((resolve) => {
      const onState = () => {
        if (worker.state === 'activated' || worker.state === 'redundant') {
          worker.removeEventListener('statechange', onState)
          clearTimeout(timer)
          resolve(worker.state === 'activated')
        }
      }
      const timer = window.setTimeout(() => {
        worker.removeEventListener('statechange', onState)
        resolve(false)
      }, 10000)
      worker.addEventListener('statechange', onState)
    })
    const result = await askWorker(worker, 'PWA_ACTIVATE_IF_ALONE')
    if (result.allowed !== true) return 'ほかのタブを とじてから ためしてね。'
    if (await activated) {
      if (canUpdate() && flushSave()) window.location.reload()
      else
        return 'こうしんのじゅんびができました。きろくをほぞんして、つぎにひらいてね。'
    } else
      return 'こうしんをかくにんできませんでした。いまのタブは そのままつかえます。'
    return null
  } finally {
    updating = false
  }
}

export function startPwa(): void {
  if (started) return
  started = true
  document.documentElement.dataset.pwaBuild = PWA_BUILD_ID
  publish({ standalone: isStandalone() })
  window.addEventListener('beforeinstallprompt', (event) =>
    captureInstallPrompt(event as InstallPromptEvent),
  )
  window.addEventListener('appinstalled', () => {
    installEvent = null
    dismissInstallReminder()
    publish({
      installAvailable: false,
      standalone: isStandalone(),
      installed: true,
    })
  })
  window
    .matchMedia('(display-mode: standalone)')
    .addEventListener('change', () => publish({ standalone: isStandalone() }))
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  navigator.serviceWorker
    .register(`${APP_BASE}sw.js`, { scope: APP_BASE, updateViaCache: 'none' })
    .then(async (next) => {
      registration = next
      const refresh = async () => {
        publish({ updateAvailable: !!next.waiting })
        if (next.active)
          publish({
            offlineReady:
              (await askWorker(next.active, 'PWA_CACHE_STATUS')).ready === true,
          })
      }
      next.addEventListener('updatefound', () => {
        next.installing?.addEventListener('statechange', () => {
          void refresh()
        })
      })
      await navigator.serviceWorker.ready
      await refresh()
      // Checking does not activate a waiting worker or reload a page.
      window.addEventListener('online', () => {
        void next.update().catch(() => {})
        void refresh()
      })
      window.addEventListener('focus', () => {
        void next.update().catch(() => {})
        void refresh()
      })
      window.addEventListener('offline', () => {
        void refresh()
      })
    })
    .catch(() =>
      publish({
        error:
          'オフラインのじゅんびができませんでした。オンラインでは あそべます。',
      }),
    )
}
