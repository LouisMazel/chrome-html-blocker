/* eslint-disable no-console */

export const logger = {
  info: (...args: any[]) => console.log('[HTML Blocker]', ...args),
  error: (...args: any[]) => console.error('[HTML Blocker]', ...args),
  warn: (...args: any[]) => console.warn('[HTML Blocker]', ...args),
}
