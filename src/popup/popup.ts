import type { BlockingStats, SiteConfig } from '../shared/types'
import { addSite, deleteSite, getConfig, getStats, resetStats, saveConfig, updateSite } from '../shared/storage'

// Éléments DOM
const extensionToggle = document.getElementById('extensionToggle') as HTMLInputElement
const toggleLabel = document.getElementById('toggleLabel') as HTMLSpanElement
const addSiteBtn = document.getElementById('addSiteBtn') as HTMLButtonElement
const sitesList = document.getElementById('sitesList') as HTMLDivElement
const emptyState = document.getElementById('emptyState') as HTMLDivElement
const totalBlockedEl = document.getElementById('totalBlocked') as HTMLDivElement
const resetStatsBtn = document.getElementById('resetStatsBtn') as HTMLButtonElement

const editModal = document.getElementById('editModal') as HTMLDivElement
const modalTitle = document.getElementById('modalTitle') as HTMLHeadingElement
const siteForm = document.getElementById('siteForm') as HTMLFormElement
const siteNameInput = document.getElementById('siteName') as HTMLInputElement
const urlPatternInput = document.getElementById('urlPattern') as HTMLInputElement
const selectorInput = document.getElementById('selector') as HTMLInputElement
const formError = document.getElementById('formError') as HTMLDivElement
const cancelBtn = document.getElementById('cancelBtn') as HTMLButtonElement

// Modales de confirmation et alerte
const confirmModal = document.getElementById('confirmModal') as HTMLDivElement
const confirmMessage = document.getElementById('confirmMessage') as HTMLParagraphElement
const confirmOkBtn = document.getElementById('confirmOkBtn') as HTMLButtonElement
const confirmCancelBtn = document.getElementById('confirmCancelBtn') as HTMLButtonElement

const alertModal = document.getElementById('alertModal') as HTMLDivElement
const alertMessage = document.getElementById('alertMessage') as HTMLParagraphElement
const alertOkBtn = document.getElementById('alertOkBtn') as HTMLButtonElement

// Variable pour suivre l'édition
let editingSiteId: string | null = null

/**
 * Affiche une modale de confirmation (remplace window.confirm)
 */
function showConfirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    confirmMessage.textContent = message
    confirmModal.classList.remove('hidden')

    function handleCancel(): void {
      confirmModal.classList.add('hidden')
      confirmOkBtn.removeEventListener('click', handleOk)
      confirmCancelBtn.removeEventListener('click', handleCancel)
      resolve(false)
    }

    function handleOk(): void {
      confirmModal.classList.add('hidden')
      confirmOkBtn.removeEventListener('click', handleOk)
      confirmCancelBtn.removeEventListener('click', handleCancel)
      resolve(true)
    }

    confirmOkBtn.addEventListener('click', handleOk)
    confirmCancelBtn.addEventListener('click', handleCancel)
  })
}

/**
 * Affiche une modale d'alerte (remplace window.alert)
 */
function showAlert(message: string): Promise<void> {
  return new Promise((resolve) => {
    alertMessage.textContent = message
    alertModal.classList.remove('hidden')

    function handleOk(): void {
      alertModal.classList.add('hidden')
      alertOkBtn.removeEventListener('click', handleOk)
      resolve()
    }

    alertOkBtn.addEventListener('click', handleOk)
  })
}

/**
 * Charge et affiche la configuration et les stats
 */
async function loadAndRender(): Promise<void> {
  const config = await getConfig()
  const stats = await getStats()

  // Mettre à jour le toggle global
  extensionToggle.checked = config.enabled
  toggleLabel.textContent = config.enabled ? 'Enabled' : 'Disabled'

  // Mettre à jour les stats globales
  totalBlockedEl.textContent = stats.totalBlocked.toString()

  // Afficher les sites
  renderSitesList(config.sites, stats)
}

/**
 * Affiche la liste des sites configurés
 */
function renderSitesList(sites: SiteConfig[], stats: BlockingStats): void {
  sitesList.innerHTML = ''

  if (sites.length === 0) {
    emptyState.classList.remove('hidden')
    sitesList.classList.add('hidden')
    return
  }

  emptyState.classList.add('hidden')
  sitesList.classList.remove('hidden')

  sites.forEach((site) => {
    const siteBlockedCount = stats.siteStats[site.id] || 0
    const card = createSiteCard(site, siteBlockedCount)
    sitesList.appendChild(card)
  })
}

/**
 * Crée une carte pour un site
 */
function createSiteCard(site: SiteConfig, blockedCount: number): HTMLDivElement {
  const card = document.createElement('div')
  card.className = 'site-card'

  const displayName = site.name || 'Unnamed'

  card.innerHTML = `
    <div class="site-card-header">
      <div class="site-card-title">${escapeHtml(displayName)}</div>
      <label class="switch site-toggle">
        <input type="checkbox" ${site.enabled ? 'checked' : ''} data-site-id="${site.id}">
        <span class="slider"></span>
      </label>
    </div>
    <div class="site-card-info">
      <strong>URL:</strong> ${escapeHtml(site.urlPattern)}
    </div>
    <div class="site-card-info">
      <strong>Selector:</strong> ${escapeHtml(site.selector)}
    </div>
    ${blockedCount > 0 ? `<div class="site-card-stats">${blockedCount} blocked</div>` : ''}
    <div class="site-card-buttons">
      <button class="btn-edit" data-site-id="${site.id}">Edit</button>
      <button class="btn-delete" data-site-id="${site.id}">Delete</button>
    </div>
  `

  // Toggle du site
  const toggle = card.querySelector('input[type="checkbox"]') as HTMLInputElement
  toggle.addEventListener('change', async () => {
    await handleSiteToggle(site.id, toggle.checked)
  })

  // Bouton modifier
  const editBtn = card.querySelector('.btn-edit') as HTMLButtonElement
  editBtn.addEventListener('click', () => {
    openEditModal(site)
  })

  // Bouton supprimer
  const deleteBtn = card.querySelector('.btn-delete') as HTMLButtonElement
  deleteBtn.addEventListener('click', async () => {
    if (await showConfirm(`Delete site "${displayName}"?`)) {
      await handleDeleteSite(site.id)
    }
  })

  return card
}

/**
 * Échapper les caractères HTML pour éviter l'injection
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Gère le toggle global de l'extension
 */
async function handleGlobalToggle(enabled: boolean): Promise<void> {
  try {
    const config = await getConfig()
    config.enabled = enabled
    await saveConfig(config)
    toggleLabel.textContent = enabled ? 'Enabled' : 'Disabled'
  }
  catch (error) {
    console.error('Error toggling extension:', error)
    await showAlert('Error updating extension status')
    extensionToggle.checked = !enabled
  }
}

/**
 * Gère le toggle d'un site spécifique
 */
async function handleSiteToggle(siteId: string, enabled: boolean): Promise<void> {
  try {
    await updateSite(siteId, { enabled })
  }
  catch (error) {
    console.error('Error toggling site:', error)
    await showAlert('Error updating site')
    await loadAndRender()
  }
}

/**
 * Gère la suppression d'un site
 */
async function handleDeleteSite(siteId: string): Promise<void> {
  try {
    await deleteSite(siteId)
    await loadAndRender()
  }
  catch (error) {
    console.error('Error deleting site:', error)
    await showAlert('Error deleting site')
  }
}

/**
 * Ouvre le modal pour ajouter un nouveau site
 */
function openAddModal(): void {
  editingSiteId = null
  modalTitle.textContent = 'Add Site'
  siteNameInput.value = ''
  urlPatternInput.value = ''
  selectorInput.value = ''
  formError.classList.add('hidden')
  editModal.classList.remove('hidden')
  siteNameInput.focus()
}

/**
 * Ouvre le modal pour éditer un site existant
 */
function openEditModal(site: SiteConfig): void {
  editingSiteId = site.id
  modalTitle.textContent = 'Edit Site'
  siteNameInput.value = site.name || ''
  urlPatternInput.value = site.urlPattern
  selectorInput.value = site.selector
  formError.classList.add('hidden')
  editModal.classList.remove('hidden')
  siteNameInput.focus()
}

/**
 * Ferme le modal
 */
function closeModal(): void {
  editModal.classList.add('hidden')
  editingSiteId = null
}

/**
 * Valide un pattern d'URL Chrome
 */
function validateUrlPattern(pattern: string): boolean {
  // Vérifications basiques
  if (!pattern || pattern.trim() === '') {
    return false
  }

  // Pattern Chrome valide doit contenir ://
  if (!pattern.includes('://')) {
    return false
  }

  return true
}

/**
 * Valide un sélecteur CSS
 */
function validateSelector(selector: string): boolean {
  if (!selector || selector.trim() === '') {
    return false
  }

  // Tenter de valider le sélecteur
  try {
    document.querySelector(selector)
    return true
  }
  catch {
    return false
  }
}

/**
 * Gère la soumission du formulaire
 */
async function handleFormSubmit(e: Event): Promise<void> {
  e.preventDefault()

  const name = siteNameInput.value.trim()
  const urlPattern = urlPatternInput.value.trim()
  const selector = selectorInput.value.trim()

  // Validation
  if (!validateUrlPattern(urlPattern)) {
    formError.textContent = 'Invalid URL pattern. Must contain :// (e.g., *://example.com/*)'
    formError.classList.remove('hidden')
    return
  }

  if (!validateSelector(selector)) {
    formError.textContent = 'Invalid CSS selector.'
    formError.classList.remove('hidden')
    return
  }

  try {
    if (editingSiteId) {
      // Mode édition
      await updateSite(editingSiteId, {
        name: name || undefined,
        urlPattern,
        selector,
      })
    }
    else {
      // Mode ajout
      await addSite({
        name: name || undefined,
        urlPattern,
        selector,
        enabled: true,
      })
    }

    closeModal()
    await loadAndRender()
  }
  catch (error) {
    console.error('Error saving site:', error)
    formError.textContent = 'Error saving site'
    formError.classList.remove('hidden')
  }
}

// Event Listeners
extensionToggle.addEventListener('change', () => {
  handleGlobalToggle(extensionToggle.checked)
})

addSiteBtn.addEventListener('click', openAddModal)
cancelBtn.addEventListener('click', closeModal)
siteForm.addEventListener('submit', handleFormSubmit)

// Fermer le modal en cliquant sur l'overlay
editModal.addEventListener('click', (e) => {
  if (e.target === editModal) {
    closeModal()
  }
})

// Charger la configuration au démarrage
loadAndRender()

/**
 * Gère le reset des statistiques
 */
async function handleResetStats(): Promise<void> {
  if (await showConfirm('Do you really want to reset all statistics?')) {
    try {
      await resetStats()
      await loadAndRender()
    }
    catch (error) {
      console.error('Error resetting stats:', error)
      await showAlert('Error resetting statistics')
    }
  }
}

// Écouter les changements de configuration et stats
chrome.storage.onChanged.addListener((changes, area) => {
  if ((area === 'sync' && changes.config) || (area === 'local' && changes.stats)) {
    loadAndRender()
  }
})

// Event Listener pour le reset des stats
resetStatsBtn.addEventListener('click', handleResetStats)
