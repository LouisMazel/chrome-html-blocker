import type { BlockingStats, ExtensionConfig, PickerFormState, PickerResult, SiteConfig, StatsStorageData, StorageData } from './types'
import { DEFAULT_CONFIG, STORAGE_KEY } from './constants'
import { logger } from './logger'

const STATS_KEY = 'stats'
const PICKER_FORM_KEY = 'pickerFormState'
const PICKER_RESULT_KEY = 'pickerResult'
const PICKER_ACTIVE_KEY = 'pickerActive'

/**
 * Récupère la configuration depuis chrome.storage.sync
 * Retourne la config par défaut si aucune config n'existe
 */
export async function getConfig(): Promise<ExtensionConfig> {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEY) as StorageData
    return result.config || DEFAULT_CONFIG
  }
  catch (error) {
    logger.error('[Storage] Error getting config:', error)
    return DEFAULT_CONFIG
  }
}

/**
 * Sauvegarde la configuration complète dans chrome.storage.sync
 */
export async function saveConfig(config: ExtensionConfig): Promise<void> {
  try {
    await chrome.storage.sync.set({ [STORAGE_KEY]: config })
  }
  catch (error) {
    logger.error('[Storage] Error saving config:', error)
    throw error
  }
}

/**
 * Met à jour partiellement la configuration
 */
export async function updateConfig(updates: Partial<ExtensionConfig>): Promise<void> {
  try {
    const currentConfig = await getConfig()
    const newConfig = { ...currentConfig, ...updates }
    await saveConfig(newConfig)
  }
  catch (error) {
    logger.error('[Storage] Error updating config:', error)
    throw error
  }
}

/**
 * Ajoute une nouvelle configuration de site
 */
export async function addSite(site: Omit<SiteConfig, 'id'>): Promise<void> {
  try {
    const config = await getConfig()
    const newSite: SiteConfig = {
      ...site,
      id: crypto.randomUUID(),
    }
    config.sites.push(newSite)
    await saveConfig(config)
  }
  catch (error) {
    logger.error('[Storage] Error adding site:', error)
    throw error
  }
}

/**
 * Met à jour une configuration de site existante
 */
export async function updateSite(id: string, updates: Partial<SiteConfig>): Promise<void> {
  try {
    const config = await getConfig()
    const siteIndex = config.sites.findIndex(s => s.id === id)

    if (siteIndex === -1) {
      throw new Error(`Site with id ${id} not found`)
    }

    config.sites[siteIndex] = { ...config.sites[siteIndex], ...updates }
    await saveConfig(config)
  }
  catch (error) {
    logger.error('[Storage] Error updating site:', error)
    throw error
  }
}

/**
 * Supprime une configuration de site
 */
export async function deleteSite(id: string): Promise<void> {
  try {
    const config = await getConfig()
    config.sites = config.sites.filter(s => s.id !== id)
    await saveConfig(config)
  }
  catch (error) {
    logger.error('[Storage] Error deleting site:', error)
    throw error
  }
}

// ============================================
// GESTION DES STATISTIQUES
// ============================================

/**
 * Récupère les statistiques de blocage
 * Utilise chrome.storage.local (pas de sync car stats locales)
 */
export async function getStats(): Promise<BlockingStats> {
  try {
    const result = await chrome.storage.local.get(STATS_KEY) as StatsStorageData
    return result.stats || {
      totalBlocked: 0,
      siteStats: {},
      lastReset: Date.now(),
    }
  }
  catch (error) {
    logger.error('[Storage] Error getting stats:', error)
    return {
      totalBlocked: 0,
      siteStats: {},
      lastReset: Date.now(),
    }
  }
}

/**
 * Sauvegarde les statistiques
 */
export async function saveStats(stats: BlockingStats): Promise<void> {
  try {
    await chrome.storage.local.set({ [STATS_KEY]: stats })
  }
  catch (error) {
    logger.error('[Storage] Error saving stats:', error)
    throw error
  }
}

/**
 * Incrémente le compteur de modals bloquées pour un site
 */
export async function incrementBlockedCount(siteId: string, count: number = 1): Promise<void> {
  try {
    const stats = await getStats()
    stats.totalBlocked += count
    stats.siteStats[siteId] = (stats.siteStats[siteId] || 0) + count
    await saveStats(stats)
  }
  catch (error) {
    logger.error('[Storage] Error incrementing blocked count:', error)
  }
}

/**
 * Réinitialise les statistiques
 */
export async function resetStats(): Promise<void> {
  try {
    const stats: BlockingStats = {
      totalBlocked: 0,
      siteStats: {},
      lastReset: Date.now(),
    }
    await saveStats(stats)
  }
  catch (error) {
    logger.error('[Storage] Error resetting stats:', error)
    throw error
  }
}

// ============================================
// GESTION DU PICKER
// ============================================

export async function savePickerFormState(state: PickerFormState): Promise<void> {
  await chrome.storage.local.set({ [PICKER_FORM_KEY]: state })
}

export async function getPickerFormState(): Promise<PickerFormState | null> {
  const result = await chrome.storage.local.get(PICKER_FORM_KEY)
  return (result[PICKER_FORM_KEY] as PickerFormState) || null
}

export async function savePickerResult(result: PickerResult): Promise<void> {
  await chrome.storage.local.set({ [PICKER_RESULT_KEY]: result })
}

export async function getPickerResult(): Promise<PickerResult | null> {
  const result = await chrome.storage.local.get(PICKER_RESULT_KEY)
  return (result[PICKER_RESULT_KEY] as PickerResult) || null
}

export async function setPickerActive(active: boolean): Promise<void> {
  await chrome.storage.local.set({ [PICKER_ACTIVE_KEY]: active })
}

export async function isPickerActive(): Promise<boolean> {
  const result = await chrome.storage.local.get(PICKER_ACTIVE_KEY)
  return result[PICKER_ACTIVE_KEY] === true
}

export async function clearPickerState(): Promise<void> {
  await chrome.storage.local.remove([PICKER_FORM_KEY, PICKER_RESULT_KEY, PICKER_ACTIVE_KEY])
}
