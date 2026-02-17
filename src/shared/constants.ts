import type { ExtensionConfig } from './types'

export const DEFAULT_CONFIG: ExtensionConfig = {
  enabled: true,
  sites: [
    {
      id: crypto.randomUUID(),
      urlPattern: '*://www.lequipe.fr/*',
      selector: 'div.Modal[data-modal="amsBlock"]',
      enabled: true,
      name: 'L\'Équipe',
      forceScroll: true,
    },
  ],
}

export const STORAGE_KEY = 'config'

export const FORCE_SCROLL_CSS = `html, body {
  overflow: auto !important;
  position: static !important;
  height: auto !important;
}`

export const INJECTED_STYLE_ID_PREFIX = '__html_blocker_style_'
