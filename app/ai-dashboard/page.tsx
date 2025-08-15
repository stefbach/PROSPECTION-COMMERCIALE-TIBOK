// app/ai-dashboard/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Calendar, Brain, Users, TrendingUp, Package, 
  Home, Menu, X, LayoutDashboard, Settings, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'

// Import du composant AIDashboard principal
import { AIDashboard } from '@/components/ai-dashboard'

export default function AIDashboardPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { toast } = useToast()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'AI Dashboard', href: '/ai-dashboard', icon: Brain, current: true },
    { name: 'Planning', href: '/planning', icon: Calendar },
    { name: 'Prospects', href: '/prospects', icon: Users },
    { name: 'Performance', href: '/performance', icon: TrendingUp },
    { name: 'Produits', href: '/products', icon: Package },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              {/* Logo */}
              <div className="flex flex-shrink-0 items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    ProspectMed Pro
                  </span>
                </div>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`inline-flex items-center gap-2 border-b-2 px-1 pt-1 text-sm font-medium transition-colors ${
                        item.current
                          ? 'border-purple-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                      {item.name === 'AI Dashboard' && (
                        <Badge className="ml-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0">
                          <Sparkles className="h-3 w-3 mr-1" />
                          IA
                        </Badge>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* User Profile & Mobile Menu */}
            <div className="flex items-center gap-4">
              {/* User Info - Desktop */}
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Karine MOMUS</p>
                  <p className="text-xs text-gray-500">Agent Commercial</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                  KM
                </div>
              </div>

              {/* Mobile menu button */}
              <div className="flex items-center sm:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="text-gray-600"
                >
                  {mobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden bg-white border-t">
            {/* User Info - Mobile */}
            <div className="flex items-center gap-3 px-4 py-3 border-b bg-gray-50">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                KM
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Karine MOMUS</p>
                <p className="text-xs text-gray-500">Agent Commercial</p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="space-y-1 pb-3 pt-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`block border-l-4 py-3 pl-3 pr-4 text-base font-medium transition-colors ${
                      item.current
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {item.name}
                      {item.name === 'AI Dashboard' && (
                        <Badge className="ml-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0 text-xs">
                          IA
                        </Badge>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-3 text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              Accueil
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-purple-600 font-medium">AI Dashboard</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Actions Bar */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Link href="/planning">
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Voir Planning
            </Button>
          </Link>
          <Link href="/prospects">
            <Button variant="outline" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Gérer Prospects
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => {
              toast({
                title: "🔄 Synchronisation",
                description: "Les données sont synchronisées automatiquement toutes les 30 secondes"
              })
            }}
          >
            <Settings className="h-4 w-4" />
            Paramètres
          </Button>
        </div>

        {/* AI Dashboard Component */}
        <AIDashboard commercial="Karine MOMUS" />
      </div>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              © 2024 ProspectMed Pro - Powered by AI
            </p>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                Système actif
              </Badge>
              <span className="text-xs text-gray-500">
                Dernière sync: {new Date().toLocaleTimeString('fr-FR')}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
