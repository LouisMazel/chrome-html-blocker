import type { Message, SiteConfig } from '../shared/types'
import { FORCE_SCROLL_CSS, INJECTED_STYLE_ID_PREFIX } from '../shared/constants'
import { DEBUG_STORAGE_KEY, logger, setDebugEnabled } from '../shared/logger'
import { clearPickerState, getConfig, getDebugMode, incrementBlockedCount, isPickerActive, savePickerResult, setPickerActive } from '../shared/storage'
import { MessageType } from '../shared/types'

let observer: MutationObserver | null = null
let activeStyleIds: Set<string> = new Set()

/**
 * Convertit un pattern Chrome en RegExp
 * Ex: "*://www.lequipe.fr/*" => RegExp("^https?://www\\.lequipe\\.fr/.*")
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
 * Trouve toutes les configurations correspondant à l'URL actuelle
 */
function findMatchingSiteConfigs(url: string, sites: SiteConfig[]): SiteConfig[] {
  const matches: SiteConfig[] = []
  for (const site of sites) {
    if (!site.enabled)
      continue

    try {
      const regex = patternToRegex(site.urlPattern)
      if (regex.test(url)) {
        matches.push(site)
      }
    }
    catch (error) {
      logger.error('Invalid pattern:', site.urlPattern, error)
    }
  }
  return matches
}

/**
 * Supprime les éléments correspondant au sélecteur
 */
function removeModals(selector: string, siteIds: string[]): void {
  const elements = document.querySelectorAll(selector)
  if (elements.length > 0) {
    logger.debug(`Removing ${elements.length} element(s) matching "${selector}"`)
    elements.forEach((el) => {
      el.remove()
    })

    // Incrémenter le compteur de stats pour chaque site concerné
    for (const siteId of siteIds) {
      incrementBlockedCount(siteId, elements.length)
    }
  }
}

/**
 * Configure le MutationObserver pour surveiller les nouveaux éléments
 */
function setupObserver(selector: string, siteIds: string[]): void {
  // Déconnecter l'observer existant si présent
  if (observer) {
    observer.disconnect()
  }

  // Créer un nouvel observer
  observer = new MutationObserver(() => {
    removeModals(selector, siteIds)
  })

  // Observer les changements dans le DOM
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })

  logger.debug('Observer started for selector:', selector)
}

/**
 * Arrête l'observer
 */
function stopObserver(): void {
  if (observer) {
    observer.disconnect()
    observer = null
    logger.debug('Observer stopped')
  }
}

// ============================================
// CSS INJECTION
// ============================================

/**
 * Génère un ID déterministe pour un <style> injecté
 */
function getStyleId(siteId: string, suffix: string): string {
  return `${INJECTED_STYLE_ID_PREFIX}${siteId}_${suffix}`
}

/**
 * Injecte un <style> dans le <head>. Idempotent.
 */
function injectStyle(id: string, css: string): void {
  if (document.getElementById(id))
    return

  const style = document.createElement('style')
  style.id = id
  style.textContent = css
  document.head.appendChild(style)
  logger.debug('Injected style:', id)
}

/**
 * Supprime un <style> injecté par ID
 */
function removeInjectedStyle(id: string): void {
  const el = document.getElementById(id)
  if (el) {
    el.remove()
    logger.debug('Removed style:', id)
  }
}

/**
 * Supprime tous les <style> injectés par l'extension
 */
function removeAllInjectedStyles(): void {
  document.querySelectorAll(`[id^="${INJECTED_STYLE_ID_PREFIX}"]`).forEach(el => el.remove())
  activeStyleIds.clear()
}

/**
 * Initialise l'extension pour la page actuelle
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
async function initialize(): Promise<void> {
  try {
    const config = await getConfig()

    // Vérifier si l'extension est activée globalement
    if (!config.enabled) {
      stopObserver()
      removeAllInjectedStyles()

      return
    }

    // Trouver toutes les configurations correspondant à cette page
    const currentUrl = globalThis.location.href
    const matchingSites = findMatchingSiteConfigs(currentUrl, config.sites)

    if (matchingSites.length === 0) {
      stopObserver()
      removeAllInjectedStyles()

      return
    }

    logger.debug(`${matchingSites.length} matching site(s) for:`, currentUrl)

    // Collecter les styles à injecter et les selectors pour element removal
    const newStyleIds = new Set<string>()
    const removeSites: { siteId: string, selector: string }[] = []

    for (const site of matchingSites) {
      // Element removal
      if (site.selector && site.selector.trim()) {
        removeSites.push({ siteId: site.id, selector: site.selector })
      }

      // Force scroll
      if (site.forceScroll) {
        const styleId = getStyleId(site.id, 'fs')
        injectStyle(styleId, FORCE_SCROLL_CSS)
        newStyleIds.add(styleId)
      }

      // Custom CSS
      if (site.customCss && site.customCss.trim()) {
        const styleId = getStyleId(site.id, 'cc')
        injectStyle(styleId, site.customCss)
        newStyleIds.add(styleId)
      }
    }

    // Cleanup : supprimer les styles qui ne sont plus actifs
    for (const oldId of activeStyleIds) {
      if (!newStyleIds.has(oldId)) {
        removeInjectedStyle(oldId)
      }
    }
    activeStyleIds = newStyleIds

    // Element removal : combiner les sélecteurs
    if (removeSites.length > 0) {
      const combinedSelector = removeSites.map(s => s.selector).join(', ')
      const siteIds = removeSites.map(s => s.siteId)
      removeModals(combinedSelector, siteIds)
      setupObserver(combinedSelector, siteIds)
    }
    else {
      stopObserver()
    }
  }
  catch (error) {
    logger.error('Initialization error:', error)
  }
}

/**
 * Écouter les changements de configuration
 */
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.config) {
    logger.debug('Configuration changed, reinitializing...')
    initialize()
  }
  if (area === 'local' && changes[DEBUG_STORAGE_KEY]) {
    setDebugEnabled(changes[DEBUG_STORAGE_KEY].newValue === true)
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

// ============================================
// ELEMENT PICKER
// ============================================

let pickerOverlay: HTMLDivElement | null = null
let pickerTooltip: HTMLDivElement | null = null
let pickerActive = false

/**
 * Filtre les classes CSS-in-JS auto-générées
 */
function isMeaningfulClass(cls: string): boolean {
  // Classes courtes suivies de majuscule/chiffre (ex: aB3kf)
  if (/^[a-z]{1,3}[A-Z0-9]/.test(cls))
    return false
  // Prefixes CSS-in-JS connus
  if (cls.startsWith('css-') || cls.startsWith('sc-') || cls.startsWith('emotion-'))
    return false
  // Classes avec underscore + hash (ex: _a3b2c1)
  if (cls.startsWith('_') && cls.length >= 6)
    return false
  // Pattern "word-hash" (ex: Button-abc123) — hyphen followed by 6+ alphanumeric
  const hyphenIdx = cls.indexOf('-')
  if (hyphenIdx > 0 && cls.length - hyphenIdx - 1 >= 6 && /^[a-z]+$/i.test(cls.slice(0, hyphenIdx)))
    return false
  return true
}

/**
 * Vérifie si un sélecteur matche exactement un élément
 */
function isUniqueSelector(selector: string): boolean {
  try {
    return document.querySelectorAll(selector).length === 1
  }
  catch {
    return false
  }
}

function tryByIdSelector(el: Element): string | null {
  if (!el.id)
    return null
  const selector = `#${CSS.escape(el.id)}`
  return isUniqueSelector(selector) ? selector : null
}

function tryByTagAndClasses(el: Element): string | null {
  const tag = el.tagName.toLowerCase()
  const classes = Array.from(el.classList).filter(isMeaningfulClass)
  if (classes.length === 0)
    return null
  const selector = `${tag}.${classes.map(c => CSS.escape(c)).join('.')}`
  return isUniqueSelector(selector) ? selector : null
}

function tryByDataAttributes(el: Element): string | null {
  const tag = el.tagName.toLowerCase()
  const dataAttrs = Array.from(el.attributes).filter(a => a.name.startsWith('data-'))
  for (const attr of dataAttrs) {
    const selector = `${tag}[${attr.name}="${CSS.escape(attr.value)}"]`
    if (isUniqueSelector(selector))
      return selector
  }
  return null
}

function tryByAncestorPath(el: Element): string | null {
  const pathParts: string[] = []
  let current: Element | null = el
  while (current && current !== document.documentElement) {
    pathParts.unshift(getSelectorPart(current))
    if (current.id) {
      const fullPath = pathParts.join(' > ')
      if (isUniqueSelector(fullPath))
        return fullPath
    }
    current = current.parentElement
  }
  return null
}

function fallbackNthPath(el: Element): string {
  const nthParts: string[] = []
  let current: Element | null = el
  while (current && current !== document.documentElement) {
    nthParts.unshift(getNthPart(current))
    const selector = nthParts.join(' > ')
    if (isUniqueSelector(selector))
      return selector
    current = current.parentElement
  }
  return nthParts.join(' > ')
}

function generateSelector(el: Element): string {
  return tryByIdSelector(el)
    ?? tryByTagAndClasses(el)
    ?? tryByDataAttributes(el)
    ?? tryByAncestorPath(el)
    ?? fallbackNthPath(el)
}

function getSelectorPart(el: Element): string {
  const tag = el.tagName.toLowerCase()
  if (el.id)
    return `#${CSS.escape(el.id)}`

  const classes = Array.from(el.classList).filter(isMeaningfulClass)
  if (classes.length > 0)
    return `${tag}.${classes.map(c => CSS.escape(c)).join('.')}`

  return tag
}

function getNthPart(el: Element): string {
  const tag = el.tagName.toLowerCase()
  if (el.id)
    return `#${CSS.escape(el.id)}`

  const parent = el.parentElement
  if (!parent)
    return tag

  const siblings = Array.from(parent.children).filter(s => s.tagName === el.tagName)
  if (siblings.length === 1)
    return tag

  const index = siblings.indexOf(el) + 1
  return `${tag}:nth-of-type(${index})`
}

function enterPickerMode(): void {
  if (pickerActive)
    return
  pickerActive = true

  // Créer l'overlay
  pickerOverlay = document.createElement('div')
  pickerOverlay.id = '__html_blocker_picker_overlay__'
  pickerOverlay.style.cssText = `
    position: fixed;
    pointer-events: none;
    border: 2px solid #667eea;
    background: rgba(102, 126, 234, 0.1);
    z-index: 2147483646;
    transition: all 0.05s ease-out;
    display: none;
    border-radius: 2px;
  `

  // Créer le tooltip
  pickerTooltip = document.createElement('div')
  pickerTooltip.id = '__html_blocker_picker_tooltip__'
  pickerTooltip.style.cssText = `
    position: fixed;
    pointer-events: none;
    background: rgba(0, 0, 0, 0.85);
    color: #fff;
    padding: 6px 10px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
    z-index: 2147483647;
    max-width: 400px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: none;
  `

  document.documentElement.appendChild(pickerOverlay)
  document.documentElement.appendChild(pickerTooltip)

  // Changer le curseur
  document.documentElement.style.cursor = 'crosshair'

  document.addEventListener('mousemove', onPickerMouseMove, true)
  document.addEventListener('click', onPickerClick, true)
  document.addEventListener('keydown', onPickerKeyDown, true)

  logger.debug('[Picker] Entered picker mode')
}

function onPickerMouseMove(e: MouseEvent): void {
  if (!pickerOverlay || !pickerTooltip)
    return

  const target = e.target as Element
  if (!target || target === pickerOverlay || target === pickerTooltip)
    return

  const rect = target.getBoundingClientRect()

  pickerOverlay.style.top = `${rect.top}px`
  pickerOverlay.style.left = `${rect.left}px`
  pickerOverlay.style.width = `${rect.width}px`
  pickerOverlay.style.height = `${rect.height}px`
  pickerOverlay.style.display = 'block'

  const selector = generateSelector(target)
  pickerTooltip.textContent = selector
  pickerTooltip.style.display = 'block'

  // Position du tooltip au-dessus ou en-dessous de l'élément
  const tooltipHeight = 30
  const gap = 8
  if (rect.top > tooltipHeight + gap) {
    pickerTooltip.style.top = `${rect.top - tooltipHeight - gap}px`
  }
  else {
    pickerTooltip.style.top = `${rect.bottom + gap}px`
  }
  pickerTooltip.style.left = `${Math.max(4, Math.min(rect.left, window.innerWidth - 300))}px`
}

function onPickerClick(e: MouseEvent): void {
  e.preventDefault()
  e.stopPropagation()
  e.stopImmediatePropagation()

  const target = e.target as Element
  if (!target || target === pickerOverlay || target === pickerTooltip)
    return

  const selector = generateSelector(target)
  logger.debug('[Picker] Selected:', selector)

  // Sauvegarder le résultat et notifier le service worker
  savePickerResult({ selector, timestamp: Date.now() }).then(() => {
    chrome.runtime.sendMessage({ type: MessageType.PICKER_DONE })
  })
  setPickerActive(false)
  exitPickerMode()
}

function onPickerKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    e.preventDefault()
    e.stopPropagation()
    logger.debug('[Picker] Cancelled')
    clearPickerState()
    exitPickerMode()
  }
}

function exitPickerMode(): void {
  pickerActive = false
  document.documentElement.style.cursor = ''

  if (pickerOverlay) {
    pickerOverlay.remove()
    pickerOverlay = null
  }
  if (pickerTooltip) {
    pickerTooltip.remove()
    pickerTooltip = null
  }

  document.removeEventListener('mousemove', onPickerMouseMove, true)
  document.removeEventListener('click', onPickerClick, true)
  document.removeEventListener('keydown', onPickerKeyDown, true)

  logger.debug('[Picker] Exited picker mode')
}

/**
 * Vérifie si le picker était actif (cas reload de page)
 */
async function checkPickerOnLoad(): Promise<void> {
  try {
    if (await isPickerActive()) {
      enterPickerMode()
    }
  }
  catch (error) {
    logger.error('[Picker] Error checking picker on load:', error)
  }
}

// Écouter les messages du popup
chrome.runtime.onMessage.addListener((message: Message) => {
  if (message.type === MessageType.ENTER_PICKER_MODE) {
    enterPickerMode()
  }
})

// Initialiser le mode debug puis l'extension
getDebugMode().then((enabled) => {
  setDebugEnabled(enabled)
  logger.debug('Content script loaded on:', globalThis.location.href)
  initialize()
  checkPickerOnLoad()
})
