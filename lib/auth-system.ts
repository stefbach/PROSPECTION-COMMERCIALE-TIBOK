// lib/auth-system.ts
// Ce fichier contient uniquement la logique métier TypeScript (pas de JSX)

import { UserRole } from './commercial-system'

// ===== PERMISSIONS =====

export const PERMISSIONS = {
  // Gestion des prospects
  PROSPECT_VIEW: 'prospect.view',
  PROSPECT_CREATE: 'prospect.create',
  PROSPECT_EDIT: 'prospect.edit',
  PROSPECT_DELETE: 'prospect.delete',
  PROSPECT_ASSIGN: 'prospect.assign',
  PROSPECT_EXPORT: 'prospect.export',
  
  // Gestion des commerciaux
  COMMERCIAL_VIEW: 'commercial.view',
  COMMERCIAL_CREATE: 'commercial.create',
  COMMERCIAL_EDIT: 'commercial.edit',
  COMMERCIAL_DELETE: 'commercial.delete',
  COMMERCIAL_STATS: 'commercial.stats',
  
  // Gestion des plannings
  PLANNING_VIEW_OWN: 'planning.view.own',
  PLANNING_VIEW_ALL: 'planning.view.all',
  PLANNING_EDIT_OWN: 'planning.edit.own',
  PLANNING_EDIT_ALL: 'planning.edit.all',
  PLANNING_VALIDATE: 'planning.validate',
  
  // Gestion des déplacements
  DEPLACEMENT_VIEW_OWN: 'deplacement.view.own',
  DEPLACEMENT_VIEW_ALL: 'deplacement.view.all',
  DEPLACEMENT_SUBMIT: 'deplacement.submit',
  DEPLACEMENT_VALIDATE: 'deplacement.validate',
  
  // Import/Export
  IMPORT_DATA: 'import.data',
  EXPORT_DATA: 'export.data',
  
  // Rapports
  REPORT_VIEW_OWN: 'report.view.own',
  REPORT_VIEW_ALL: 'report.view.all',
  REPORT_CREATE: 'report.create',
  
  // Administration
  ADMIN_ACCESS: 'admin.access',
  ADMIN_SETTINGS: 'admin.settings',
  ADMIN_USERS: 'admin.users',
  
  // IA
  IA_PLANNING: 'ia.planning',
  IA_OVERRIDE: 'ia.override'
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

// ===== RÔLES ET LEURS PERMISSIONS =====

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    // Accès total
    ...Object.values(PERMISSIONS)
  ],
  
  manager: [
    // Prospects
    PERMISSIONS.PROSPECT_VIEW,
    PERMISSIONS.PROSPECT_CREATE,
    PERMISSIONS.PROSPECT_EDIT,
    PERMISSIONS.PROSPECT_ASSIGN,
    PERMISSIONS.PROSPECT_EXPORT,
    
    // Commerciaux
    PERMISSIONS.COMMERCIAL_VIEW,
    PERMISSIONS.COMMERCIAL_EDIT,
    PERMISSIONS.COMMERCIAL_STATS,
    
    // Planning
    PERMISSIONS.PLANNING_VIEW_ALL,
    PERMISSIONS.PLANNING_EDIT_ALL,
    PERMISSIONS.PLANNING_VALIDATE,
    
    // Déplacements
    PERMISSIONS.DEPLACEMENT_VIEW_ALL,
    PERMISSIONS.DEPLACEMENT_VALIDATE,
    
    // Rapports
    PERMISSIONS.REPORT_VIEW_ALL,
    PERMISSIONS.REPORT_CREATE,
    
    // IA
    PERMISSIONS.IA_PLANNING,
    PERMISSIONS.IA_OVERRIDE,
    
    // Import/Export
    PERMISSIONS.IMPORT_DATA,
    PERMISSIONS.EXPORT_DATA
  ],
  
  commercial: [
    // Prospects (limités)
    PERMISSIONS.PROSPECT_VIEW,
    PERMISSIONS.PROSPECT_CREATE,
    PERMISSIONS.PROSPECT_EDIT,
    
    // Planning personnel
    PERMISSIONS.PLANNING_VIEW_OWN,
    PERMISSIONS.PLANNING_EDIT_OWN,
    
    // Déplacements personnels
    PERMISSIONS.DEPLACEMENT_VIEW_OWN,
    PERMISSIONS.DEPLACEMENT_SUBMIT,
    
    // Rapports personnels
    PERMISSIONS.REPORT_VIEW_OWN,
    
    // IA (consultation)
    PERMISSIONS.IA_PLANNING
  ]
}

// ===== FONCTIONS UTILITAIRES =====

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission))
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission))
}

export function canAccessRoute(role: UserRole, route: string): boolean {
  const routePermissions: Record<string, Permission[]> = {
    '/admin': [PERMISSIONS.ADMIN_ACCESS],
    '/admin/commerciaux': [PERMISSIONS.COMMERCIAL_VIEW, PERMISSIONS.ADMIN_USERS],
    '/admin/prospects': [PERMISSIONS.PROSPECT_VIEW, PERMISSIONS.PROSPECT_ASSIGN],
    '/admin/planning': [PERMISSIONS.PLANNING_VIEW_ALL, PERMISSIONS.IA_OVERRIDE],
    '/admin/deplacements': [PERMISSIONS.DEPLACEMENT_VIEW_ALL, PERMISSIONS.DEPLACEMENT_VALIDATE],
    '/admin/rapports': [PERMISSIONS.REPORT_VIEW_ALL, PERMISSIONS.REPORT_CREATE],
    '/admin/settings': [PERMISSIONS.ADMIN_SETTINGS],
    
    '/commercial': [PERMISSIONS.PLANNING_VIEW_OWN],
    '/commercial/prospects': [PERMISSIONS.PROSPECT_VIEW],
    '/commercial/planning': [PERMISSIONS.PLANNING_VIEW_OWN],
    '/commercial/deplacements': [PERMISSIONS.DEPLACEMENT_VIEW_OWN],
    '/commercial/activite': [PERMISSIONS.REPORT_VIEW_OWN],
    
    '/import': [PERMISSIONS.IMPORT_DATA],
    '/export': [PERMISSIONS.EXPORT_DATA]
  }
  
  const requiredPermissions = routePermissions[route]
  if (!requiredPermissions) return true // Route publique
  
  return hasAnyPermission(role, requiredPermissions)
}

// ===== MIDDLEWARE DE PROTECTION =====

export async function checkAuth(request: Request): Promise<{
  authenticated: boolean
  user?: {
    id: string
    email: string
    role: UserRole
    commercialId?: string
  }
  error?: string
}> {
  // Ici, implémenter la vérification du token JWT ou session
  // Pour l'instant, on simule
  
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) {
    return {
      authenticated: false,
      error: 'Token manquant'
    }
  }
  
  // Simuler la validation du token
  // En production, décoder et vérifier le JWT
  
  return {
    authenticated: true,
    user: {
      id: 'user-123',
      email: 'admin@crm.mu',
      role: 'admin'
    }
  }
}

// ===== TYPES POUR LE CONTEXTE AUTH =====

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  commercialId?: string
}

export interface AuthContextType {
  user: AuthUser | null
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean
  canAccessRoute: (route: string) => boolean
}

// ===== AUDIT LOG =====

export interface AuditLog {
  id: string
  userId: string
  userEmail: string
  action: string
  entity: string
  entityId?: string
  details?: any
  ip?: string
  timestamp: Date
}

export async function logAction(params: {
  userId: string
  userEmail: string
  action: string
  entity: string
  entityId?: string
  details?: any
  ip?: string
}): Promise<void> {
  const log: AuditLog = {
    id: `audit-${Date.now()}`,
    ...params,
    timestamp: new Date()
  }
  
  // Sauvegarder en base de données
  console.log('Audit log:', log)
  
  // En production, envoyer à votre API
  // await fetch('/api/audit', {
  //   method: 'POST',
  //   body: JSON.stringify(log)
  // })
}

// ===== TYPES D'ACTIONS AUDITÉES =====

export const AUDIT_ACTIONS = {
  // Authentification
  LOGIN: 'auth.login',
  LOGOUT: 'auth.logout',
  LOGIN_FAILED: 'auth.login.failed',
  
  // Prospects
  PROSPECT_CREATE: 'prospect.create',
  PROSPECT_UPDATE: 'prospect.update',
  PROSPECT_DELETE: 'prospect.delete',
  PROSPECT_ASSIGN: 'prospect.assign',
  PROSPECT_STATUS_CHANGE: 'prospect.status.change',
  
  // Commerciaux
  COMMERCIAL_CREATE: 'commercial.create',
  COMMERCIAL_UPDATE: 'commercial.update',
  COMMERCIAL_DELETE: 'commercial.delete',
  COMMERCIAL_ACTIVATE: 'commercial.activate',
  COMMERCIAL_DEACTIVATE: 'commercial.deactivate',
  
  // Planning
  PLANNING_CREATE: 'planning.create',
  PLANNING_UPDATE: 'planning.update',
  PLANNING_VALIDATE: 'planning.validate',
  PLANNING_REJECT: 'planning.reject',
  
  // Déplacements
  DEPLACEMENT_SUBMIT: 'deplacement.submit',
  DEPLACEMENT_VALIDATE: 'deplacement.validate',
  DEPLACEMENT_REJECT: 'deplacement.reject',
  
  // Import/Export
  DATA_IMPORT: 'data.import',
  DATA_EXPORT: 'data.export',
  
  // Paramètres
  SETTINGS_UPDATE: 'settings.update',
  PERMISSION_CHANGE: 'permission.change'
} as const

// ===== RATE LIMITING =====

interface RateLimitConfig {
  windowMs: number  // Fenêtre de temps en ms
  maxRequests: number  // Nombre max de requêtes
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'auth.login': { windowMs: 15 * 60 * 1000, maxRequests: 5 },  // 5 tentatives par 15 min
  'data.import': { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // 10 imports par heure
  'data.export': { windowMs: 60 * 60 * 1000, maxRequests: 20 }, // 20 exports par heure
  'api.default': { windowMs: 60 * 1000, maxRequests: 100 }      // 100 requêtes par minute
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(userId: string, action: string): {
  allowed: boolean
  remaining: number
  resetTime: number
} {
  const config = RATE_LIMITS[action] || RATE_LIMITS['api.default']
  const key = `${userId}:${action}`
  const now = Date.now()
  
  const current = rateLimitStore.get(key)
  
  if (!current || current.resetTime < now) {
    // Nouvelle fenêtre
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    })
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs
    }
  }
  
  if (current.count >= config.maxRequests) {
    // Limite atteinte
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime
    }
  }
  
  // Incrémenter le compteur
  current.count++
  rateLimitStore.set(key, current)
  
  return {
    allowed: true,
    remaining: config.maxRequests - current.count,
    resetTime: current.resetTime
  }
}
