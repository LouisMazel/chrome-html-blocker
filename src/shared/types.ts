export interface SiteConfig {
  id: string // UUID unique
  urlPattern: string // Pattern Chrome (*://domain.com/path/*)
  selector: string // Sélecteur CSS
  enabled: boolean // Toggle par site
  name?: string // Nom optionnel
}

export interface ExtensionConfig {
  enabled: boolean // Toggle global
  sites: SiteConfig[] // Configurations sites
}

export interface StorageData {
  config: ExtensionConfig
}

// Statistiques de blocage
export interface BlockingStats {
  totalBlocked: number // Total global de modals bloquées
  siteStats: { [siteId: string]: number } // Nombre de modals bloquées par site
  lastReset?: number // Timestamp du dernier reset
}

export interface StatsStorageData {
  stats: BlockingStats
}

// Message types pour communication entre composants
export enum MessageType {
  GET_CONFIG = 'GET_CONFIG',
  UPDATE_CONFIG = 'UPDATE_CONFIG',
  TOGGLE_EXTENSION = 'TOGGLE_EXTENSION',
  ADD_SITE = 'ADD_SITE',
  UPDATE_SITE = 'UPDATE_SITE',
  DELETE_SITE = 'DELETE_SITE',
  REMOVE_MODALS = 'REMOVE_MODALS',
}

export interface Message {
  type: MessageType
  payload?: any
}
