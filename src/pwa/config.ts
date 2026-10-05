export const APP_BASE = '/math-planet/'
export const APP_NAME = 'けいさんのほし'
export const APP_THEME_COLOR = '#102b45'
export const APP_CACHE_PREFIX = 'keisan-no-hoshi-math-planet'
export const APP_ICONS = {
  favicon: 'icons/keisan-no-hoshi-v2.svg',
  small: 'icons/keisan-no-hoshi-192-v2.png',
  large: 'icons/keisan-no-hoshi-512-v2.png',
  maskable: 'icons/keisan-no-hoshi-maskable-512-v2.png',
  apple: 'icons/keisan-no-hoshi-apple-180-v2.png',
} as const

export function appLaunchUrl(origin: string): string {
  return new URL(APP_BASE, origin).href
}
