import type { Message } from '../shared/types'
import { DEFAULT_CONFIG } from '../shared/constants'
import { logger } from '../shared/logger'
import { addSite, clearPickerState, getConfig, getPickerFormState, getPickerResult, saveConfig, updateSite } from '../shared/storage'
import { MessageType } from '../shared/types'

/**
 * Met à jour le badge de l'extension selon l'état activé/désactivé
 */
async function updateBadge(): Promise<void> {
  try {
    const config = await getConfig()

    if (config.enabled) {
      await chrome.action.setBadgeText({ text: 'ON' })
      await chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' })
    }
    else {
      await chrome.action.setBadgeText({ text: 'OFF' })
      await chrome.action.setBadgeBackgroundColor({ color: '#F44336' })
    }
  }
  catch (error) {
    logger.error('[Service Worker] Error updating badge:', error)
  }
}

/**
 * Initialiser la configuration par défaut lors de l'installation
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  logger.info('[Service Worker] Extension installed/updated:', details.reason)

  try {
    const config = await getConfig()

    // Si aucune config n'existe, créer la config par défaut
    if (!config || !config.sites || config.sites.length === 0) {
      logger.info('[Service Worker] Initializing default configuration')
      await saveConfig(DEFAULT_CONFIG)
    }

    // Mettre à jour le badge
    await updateBadge()
  }
  catch (error) {
    logger.error('[Service Worker] Error during installation:', error)
  }
})

/**
 * Écouter les changements de configuration pour mettre à jour le badge
 */
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.config) {
    logger.info('[Service Worker] Configuration changed')
    updateBadge()
  }
})

/**
 * Écouter les messages des content scripts
 */
/**
 * Fallback : sauvegarde directe si la popup ne peut pas se rouvrir
 */
async function autoSavePickerResult(): Promise<void> {
  const [formState, pickerResult] = await Promise.all([
    getPickerFormState(),
    getPickerResult(),
  ])

  if (!formState || !pickerResult)
    return

  const siteData = {
    name: formState.siteName || undefined,
    urlPattern: formState.urlPattern,
    selector: pickerResult.selector,
    enabled: true,
  }

  if (formState.editingSiteId) {
    await updateSite(formState.editingSiteId, siteData)
  }
  else {
    await addSite(siteData)
  }

  await clearPickerState()
  logger.info('[Service Worker] Auto-saved picker result')
}

chrome.runtime.onMessage.addListener((message: Message) => {
  if (message.type === MessageType.PICKER_DONE) {
    // Tenter de rouvrir la popup, sinon sauvegarder directement
    chrome.action.openPopup().catch(() => {
      logger.info('[Service Worker] Could not reopen popup, auto-saving')
      autoSavePickerResult()
    })
  }
})

// Mettre à jour le badge au démarrage
updateBadge()

logger.info('[Service Worker] HTML Blocker service worker initialized')
