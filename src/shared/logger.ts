/* eslint-disable no-console */

export const DEBUG_STORAGE_KEY = 'debugMode'

let debugEnabled = false

export function setDebugEnabled(enabled: boolean): void {
  debugEnabled = enabled
}

export const logger = {
  debug: (...args: any[]) => {
    if (debugEnabled) {
      console.log('[HTML Blocker] Debug:', ...args)
    }
  },
  info: (...args: any[]) => console.log('[HTML Blocker]', ...args),
  error: (...args: any[]) => console.error('[HTML Blocker]', ...args),
  warn: (...args: any[]) => console.warn('[HTML Blocker]', ...args),
}
