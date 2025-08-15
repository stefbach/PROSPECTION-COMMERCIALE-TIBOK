// app/planning/page.tsx
'use client'

import { useState } from 'react'
import PlanningAdvancedSection from '@/components/sections/planning'
import Link from 'next/link'
import { 
  Calendar, Brain, Users, TrendingUp, Package, 
  Home, Menu, X, Settings, Clock, MapPin
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function PlanningPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { toast } = useToast()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'AI Dashboard', href: '/ai-dashboard', icon: Brain },
    { name: 'Planning', href: '/planning', icon: Calendar, current: true },
    { name: 'Prospects', href: '/prospects', icon: Users },
    { name: 'Performance', href: '/performance', icon: TrendingUp },
    { name: 'Produits', href: '/products', icon: Package },
  ]

  // Stats rapides (simulées - à remplacer par des vraies données)
  const quickStats = {
    today: new Date().toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    }),
    nextRdv: '10:30 - Hôtel Grand Baie',
    totalRdvs: 5,
    distance: '42 km'
  }

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
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
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
                          ? 'border-blue-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* User Profile & Actions */}
            <div className="flex items-center gap-4">
              {/* Quick Actions - Desktop */}
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/ai-dashboard">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Propositions IA
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    toast({
                      title: "📱 Appel en cours",
                      description: "Ouverture de l'application téléphone..."
                    })
                  }}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Prochain RDV
                </Button>
              </div>

              {/* User Info - Desktop */}
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Karine MOMUS</p>
                  <p className="text-xs text-gray-500">Agent Commercial</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
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
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
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
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Quick Actions - Mobile */}
            <div className="px-4 py-3 border-t space-y-2">
              <Link href="/ai-dashboard" className="block">
                <Button 
                  variant="outline" 
                  className="w-full bg-purple-50 text-purple-700 border-purple-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Voir Propositions IA
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Breadcrumb & Quick Stats */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 py-3 text-sm border-b">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              Accueil
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-blue-600 font-medium">Planning Commercial</span>
          </div>

          {/* Quick Stats Bar */}
          <div className="py-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-xs text-gray-500">Aujourd'hui</p>
                  <p className="text-sm font-medium capitalize">{quickStats.today}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-xs text-gray-500">Prochain RDV</p>
                  <p className="text-sm font-medium">{quickStats.nextRdv}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-xs text-gray-500">RDV du jour</p>
                  <p className="text-sm font-medium">{quickStats.totalRdvs} rendez-vous</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-xs text-gray-500">Distance totale</p>
                  <p className="text-sm font-medium">{quickStats.distance}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <PlanningAdvancedSection />
      </div>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              © 2024 ProspectMed Pro - Gestion Commerciale Intelligente
            </p>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                Synchronisé
              </Badge>
              <span className="text-xs text-gray-500">
                Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
