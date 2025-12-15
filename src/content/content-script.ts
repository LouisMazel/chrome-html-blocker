import type { SiteConfig } from '../shared/types'
import { logger } from '../shared/logger'
import { getConfig, incrementBlockedCount } from '../shared/storage'

let observer: MutationObserver | null = null
let currentSelector: string | null = null
let currentSiteId: string | null = null

/**
 * Convertit un pattern Chrome en RegExp
 * Ex: "*://www.lequipe.fr/tv/*" => RegExp("^https?://www\\.lequipe\\.fr/tv/.*")
 */
function patternToRegex(pattern: string): RegExp {
  let regexString = pattern
    // Échapper les caractères spéciaux
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    // Remplacer * par .*
    .replace(/\*/g, '.*')

  // Gérer le préfixe de protocole
  if (regexString.startsWith('.*://')) {
    regexString = regexString.replace('.*://', 'https?://')
  }

  return new RegExp(`^${regexString}$`)
}

/**
 * Trouve la configuration correspondant à l'URL actuelle
 */
function findMatchingSiteConfig(url: string, sites: SiteConfig[]): SiteConfig | null {
  for (const site of sites) {
    if (!site.enabled)
      continue

    try {
      const regex = patternToRegex(site.urlPattern)
      if (regex.test(url)) {
        return site
      }
    }
    catch (error) {
      console.error('[Modal Blocker] Invalid pattern:', site.urlPattern, error)
    }
  }
  return null
}

/**
 * Supprime les éléments correspondant au sélecteur
 */
function removeModals(selector: string): void {
  const elements = document.querySelectorAll(selector)
  if (elements.length > 0) {
    logger.info(`Removing ${elements.length} element(s) matching "${selector}"`)
    elements.forEach((el) => {
      el.remove()
    })

    // Incrémenter le compteur de stats
    if (currentSiteId) {
      incrementBlockedCount(currentSiteId, elements.length)
    }
  }
}

/**
 * Configure le MutationObserver pour surveiller les nouveaux éléments
 */
function setupObserver(selector: string): void {
  // Déconnecter l'observer existant si présent
  if (observer) {
    observer.disconnect()
  }

  // Créer un nouvel observer
  observer = new MutationObserver(() => {
    removeModals(selector)
  })

  // Observer les changements dans le DOM
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })

  logger.info('Observer started for selector:', selector)
}

/**
 * Arrête l'observer
 */
function stopObserver(): void {
  if (observer) {
    observer.disconnect()
    observer = null
    logger.info('Observer stopped')
  }
}

/**
 * Initialise l'extension pour la page actuelle
 */
async function initialize(): Promise<void> {
  try {
    const config = await getConfig()

    // Vérifier si l'extension est activée globalement
    if (!config.enabled) {
      logger.warn('Extension is disabled globally')
      stopObserver()
      return
    }

    // Trouver la configuration correspondant à cette page
    const currentUrl = globalThis.location.href
    const siteConfig = findMatchingSiteConfig(currentUrl, config.sites)

    if (!siteConfig) {
      logger.warn('No matching configuration for:', currentUrl)
      stopObserver()
      return
    }

    logger.info('Active for:', currentUrl, 'with selector:', siteConfig.selector)

    // Si le sélecteur ou le site a changé, mettre à jour
    if (currentSelector !== siteConfig.selector || currentSiteId !== siteConfig.id) {
      currentSelector = siteConfig.selector
      currentSiteId = siteConfig.id

      // Supprimer les éléments existants
      removeModals(siteConfig.selector)

      // Configurer l'observer pour les nouveaux éléments
      setupObserver(siteConfig.selector)
    }
  }
  catch (error) {
    console.error('[HTML Blocker] Initialization error:', error)
  }
}

/**
 * Écouter les changements de configuration
 */
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.config) {
    logger.info('Configuration changed, reinitializing...')
    initialize()
  }
})

/**
 * Écouter quand la page devient visible/cachée
 */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Page cachée, arrêter l'observer pour économiser les ressources
    stopObserver()
  }
  else {
    // Page visible, réinitialiser
    initialize()
  }
})

// Initialiser au chargement de la page
initialize()
