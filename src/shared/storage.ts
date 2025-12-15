import type { BlockingStats, ExtensionConfig, SiteConfig, StatsStorageData, StorageData } from './types'
import { DEFAULT_CONFIG, STORAGE_KEY } from './constants'

const STATS_KEY = 'stats'

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
    console.error('[Storage] Error getting config:', error)
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
    console.error('[Storage] Error saving config:', error)
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
    console.error('[Storage] Error updating config:', error)
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
    console.error('[Storage] Error adding site:', error)
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
    console.error('[Storage] Error updating site:', error)
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
    console.error('[Storage] Error deleting site:', error)
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
    console.error('[Storage] Error getting stats:', error)
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
    console.error('[Storage] Error saving stats:', error)
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
    console.error('[Storage] Error incrementing blocked count:', error)
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
    console.error('[Storage] Error resetting stats:', error)
    throw error
  }
}
