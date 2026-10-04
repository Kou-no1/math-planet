export const APP_BASE = '/math-planet/'
export const APP_NAME = 'けいさんのほし'
export const APP_THEME_COLOR = '#102b45'
export const APP_CACHE_PREFIX = 'keisan-no-hoshi-math-planet'

export function appLaunchUrl(origin: string): string {
  return new URL(APP_BASE, origin).href
}
