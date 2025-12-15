import type { ExtensionConfig } from './types'

export const DEFAULT_CONFIG: ExtensionConfig = {
  enabled: true,
  sites: [
    {
      id: crypto.randomUUID(),
      urlPattern: '*://www.lequipe.fr/tv/*',
      selector: 'div.Modal[data-modal="amsBlock"]',
      enabled: true,
      name: 'L\'Équipe TV',
    },
  ],
}

export const STORAGE_KEY = 'config'
