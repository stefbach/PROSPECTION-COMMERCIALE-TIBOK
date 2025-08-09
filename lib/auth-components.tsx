'use client'

import * as React from 'react'
import {
  Permission,
  AuthContextType,
  AuthUser,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessRoute
} from './auth-system'
import { UserRole } from './commercial-system'

// ===== CONTEXTE D'AUTHENTIFICATION =====

const AuthContext = React.createContext<AuthContextType>({
  user: null,
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
  canAccessRoute: () => false
})

// ===== PROVIDER D'AUTHENTIFICATION =====

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  
  React.useEffect(() => {
    // Charger l'utilisateur depuis le localStorage ou API
    const loadUser = async () => {
      try {
        // Simuler le chargement
        // En production, faire un appel API pour récupérer l'utilisateur
        const userData: AuthUser = {
          id: 'user-123',
          email: 'admin@crm.mu',
          role: 'admin' as UserRole
        }
        setUser(userData)
      } catch (error) {
        console.error('Erreur chargement utilisateur:', error)
      }
    }
    
    loadUser()
  }, [])
  
  const contextValue: AuthContextType = {
    user,
    hasPermission: (permission: Permission) => 
      user ? hasPermission(user.role, permission) : false,
    hasAnyPermission: (permissions: Permission[]) => 
      user ? hasAnyPermission(user.role, permissions) : false,
    hasAllPermissions: (permissions: Permission[]) => 
      user ? hasAllPermissions(user.role, permissions) : false,
    canAccessRoute: (route: string) => 
      user ? canAccessRoute(user.role, route) : false
  }
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// ===== HOOK POUR UTILISER L'AUTH =====

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider')
  }
  return context
}

// ===== COMPOSANT DE PROTECTION DE ROUTE =====

export function ProtectedRoute({ 
  children, 
  permission,
  fallback = <AccessDenied />
}: { 
  children: React.ReactNode
  permission?: Permission | Permission[]
  fallback?: React.ReactNode
}) {
  const { hasPermission, hasAnyPermission } = useAuth()
  
  const hasAccess = permission
    ? Array.isArray(permission)
      ? hasAnyPermission(permission)
      : hasPermission(permission)
    : true
  
  return hasAccess ? <>{children}</> : <>{fallback}</>
}

// ===== COMPOSANT ACCÈS REFUSÉ =====

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="text-center space-y-4">
        <div className="text-6xl">🔒</div>
        <h2 className="text-2xl font-bold text-gray-900">Accès non autorisé</h2>
        <p className="text-gray-600 max-w-md">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </p>
        <button 
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Retour
        </button>
      </div>
    </div>
  )
}

// ===== COMPOSANT CONDITIONNEL =====

export function Can({ 
  permission,
  children,
  fallback = null
}: { 
  permission: Permission | Permission[]
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { hasPermission, hasAnyPermission } = useAuth()
  
  const canShow = Array.isArray(permission)
    ? hasAnyPermission(permission)
    : hasPermission(permission)
  
  return canShow ? <>{children}</> : <>{fallback}</>
}

// ===== COMPOSANT DE CHARGEMENT AUTH =====

export function AuthLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600">Chargement...</p>
      </div>
    </div>
  )
}

// ===== GUARD POUR LES PAGES =====

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission?: Permission | Permission[]
) {
  return function AuthGuardedComponent(props: P) {
    const { user, hasPermission, hasAnyPermission } = useAuth()
    const [isLoading, setIsLoading] = React.useState(true)
    
    React.useEffect(() => {
      // Simuler un délai de vérification
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 500)
      
      return () => clearTimeout(timer)
    }, [])
    
    if (isLoading) {
      return <AuthLoading />
    }
    
    if (!user) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
          <div className="text-center space-y-4">
            <div className="text-6xl">🔐</div>
            <h2 className="text-2xl font-bold text-gray-900">Connexion requise</h2>
            <p className="text-gray-600">Veuillez vous connecter pour accéder à cette page.</p>
            <button 
              onClick={() => window.location.href = '/login'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Se connecter
            </button>
          </div>
        </div>
      )
    }
    
    if (requiredPermission) {
      const hasAccess = Array.isArray(requiredPermission)
        ? hasAnyPermission(requiredPermission)
        : hasPermission(requiredPermission)
      
      if (!hasAccess) {
        return <AccessDenied />
      }
    }
    
    return <Component {...props} />
  }
}

// ===== HOOK POUR VÉRIFIER LES PERMISSIONS =====

export function usePermission(permission: Permission | Permission[]): boolean {
  const { hasPermission, hasAnyPermission } = useAuth()
  
  return Array.isArray(permission)
    ? hasAnyPermission(permission)
    : hasPermission(permission)
}

// ===== HOOK POUR LA NAVIGATION PROTÉGÉE =====

export function useProtectedNavigation() {
  const { canAccessRoute } = useAuth()
  
  const navigateTo = React.useCallback((route: string) => {
    if (canAccessRoute(route)) {
      window.location.href = route
    } else {
      console.warn(`Navigation bloquée vers ${route}: permissions insuffisantes`)
      // Optionnellement, afficher une notification
    }
  }, [canAccessRoute])
  
  return { navigateTo, canAccessRoute }
}

// ===== COMPOSANT DE MENU AVEC PERMISSIONS =====

export function AuthorizedMenuItem({
  permission,
  href,
  children,
  className = ''
}: {
  permission?: Permission | Permission[]
  href: string
  children: React.ReactNode
  className?: string
}) {
  const { canAccessRoute } = useAuth()
  const canShow = usePermission(permission || [])
  const canNavigate = canAccessRoute(href)
  
  if (!canShow || !canNavigate) {
    return null
  }
  
  return (
    <a href={href} className={className}>
      {children}
    </a>
  )
}

// ===== EXPORT DES PERMISSIONS POUR USAGE FACILE =====

export { PERMISSIONS } from './auth-system'
