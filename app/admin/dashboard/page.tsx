'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  TrendingUp, 
  MapPin,
  Euro,
  Calendar,
  BarChart3,
  Settings,
  UserPlus,
  FileSpreadsheet,
  Navigation,
  DollarSign,
  Target,
  Activity,
  Award,
  Briefcase,
  Car,
  Clock,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone
} from 'lucide-react'
import { Commercial, CommercialStats, Affectation, COMMERCIAL_CONFIG } from '@/lib/commercial-system'
import { MAURITIUS_CONFIG } from '@/lib/mauritius-config'
import { useToast } from '@/hooks/use-toast'

// Données mockées pour démonstration
const mockCommerciaux: Commercial[] = [
  {
    id: '1',
    userId: 'user1',
    nom: 'Martin',
    prenom: 'Jean',
    email: 'jean.martin@crm.mu',
    telephone: '+230 5123 4567',
    adresse: {
      rue: '10 Rue La Bourdonnais',
      ville: 'Port Louis',
      district: 'port-louis',
      codePostal: '11328'
    },
    dateEmbauche: new Date('2023-01-15'),
    statut: 'actif',
    vehicule: {
      type: 'personnel',
      marque: 'Toyota',
      modele: 'Yaris',
      immatriculation: 'AA 1234',
      tauxKm: 25
    },
    zones: ['port-louis', 'plaines-wilhems', 'moka'],
    secteurs: ['hotel', 'restaurant', 'retail'],
    objectifs: {
      mensuel: { ca: 500000, nouveauxClients: 10, rdv: 40 },
      annuel: { ca: 6000000, nouveauxClients: 120 }
    },
    stats: {
      periode: 'mois',
      caGenere: 425000,
      caEnCours: 180000,
      nombreProspects: 45,
      nombreClients: 8,
      tauxConversion: 17.8,
      rdvEffectues: 32,
      rdvPlanifies: 8,
      appelsEffectues: 156,
      emailsEnvoyes: 89,
      kmParcourus: 1250,
      indemnitesKm: 31250,
      tempsRoute: 1875,
      scorePerformance: 78,
      ranking: 2
    }
  },
  {
    id: '2',
    userId: 'user2',
    nom: 'Dupont',
    prenom: 'Marie',
    email: 'marie.dupont@crm.mu',
    telephone: '+230 5234 5678',
    adresse: {
      rue: '25 Avenue des Flamboyants',
      ville: 'Grand Baie',
      district: 'riviere-du-rempart',
      codePostal: '30510'
    },
    dateEmbauche: new Date('2022-06-01'),
    statut: 'actif',
    vehicule: {
      type: 'societe',
      marque: 'Nissan',
      modele: 'Qashqai',
      immatriculation: 'CO 5678',
      tauxKm: 25
    },
    zones: ['riviere-du-rempart', 'pamplemousses'],
    secteurs: ['hotel', 'clinique', 'assurance'],
    objectifs: {
      mensuel: { ca: 600000, nouveauxClients: 12, rdv: 45 },
      annuel: { ca: 7200000, nouveauxClients: 144 }
    },
    stats: {
      periode: 'mois',
      caGenere: 580000,
      caEnCours: 220000,
      nombreProspects: 52,
      nombreClients: 11,
      tauxConversion: 21.2,
      rdvEffectues: 38,
      rdvPlanifies: 12,
      appelsEffectues: 178,
      emailsEnvoyes: 102,
      kmParcourus: 980,
      indemnitesKm: 24500,
      tempsRoute: 1470,
      scorePerformance: 89,
      ranking: 1
    }
  }
]

export default function AdminDashboard() {
  const [commerciaux, setCommerciaux] = React.useState<Commercial[]>(mockCommerciaux)
  const [selectedCommercial, setSelectedCommercial] = React.useState<Commercial | null>(null)
  const [showCreateForm, setShowCreateForm] = React.useState(false)
  const [affectationMode, setAffectationMode] = React.useState(false)
  const { toast } = useToast()

  // Calculer les statistiques globales
  const statsGlobales = React.useMemo(() => {
    const total = commerciaux.reduce((acc, com) => ({
      caTotal: acc.caTotal + (com.stats?.caGenere || 0),
      clientsTotal: acc.clientsTotal + (com.stats?.nombreClients || 0),
      prospectsTotal: acc.prospectsTotal + (com.stats?.nombreProspects || 0),
      kmTotal: acc.kmTotal + (com.stats?.kmParcourus || 0),
      indemnitesTotal: acc.indemnitesTotal + (com.stats?.indemnitesKm || 0)
    }), {
      caTotal: 0,
      clientsTotal: 0,
      prospectsTotal: 0,
      kmTotal: 0,
      indemnitesTotal: 0
    })

    return {
      ...total,
      tauxConversionMoyen: commerciaux.length > 0 
        ? commerciaux.reduce((sum, c) => sum + (c.stats?.tauxConversion || 0), 0) / commerciaux.length
        : 0
    }
  }, [commerciaux])

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Admin</h1>
          <p className="text-muted-foreground mt-2">
            Gestion de l'équipe commerciale et supervision des performances
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Nouveau Commercial
          </Button>
        </div>
      </div>

      {/* KPIs Globaux */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CA Total</p>
                <p className="text-2xl font-bold">
                  Rs {(statsGlobales.caTotal / 1000).toFixed(0)}k
                </p>
                <p className="text-xs text-green-600">+12% vs mois dernier</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clients</p>
                <p className="text-2xl font-bold">{statsGlobales.clientsTotal}</p>
                <p className="text-xs text-green-600">+{commerciaux.length * 2} ce mois</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Prospects</p>
                <p className="text-2xl font-bold">{statsGlobales.prospectsTotal}</p>
                <p className="text-xs text-blue-600">{commerciaux.length * 15} actifs</p>
              </div>
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taux Conv.</p>
                <p className="text-2xl font-bold">
                  {statsGlobales.tauxConversionMoyen.toFixed(1)}%
                </p>
                <p className="text-xs text-orange-600">Objectif: 25%</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Indemnités</p>
                <p className="text-2xl font-bold">
                  Rs {(statsGlobales.indemnitesTotal / 1000).toFixed(0)}k
                </p>
                <p className="text-xs text-muted-foreground">
                  {statsGlobales.kmTotal} km
                </p>
              </div>
              <Car className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principales */}
      <Tabs defaultValue="commerciaux" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="commerciaux">
            <Users className="mr-2 h-4 w-4" />
            Commerciaux
          </TabsTrigger>
          <TabsTrigger value="performances">
            <BarChart3 className="mr-2 h-4 w-4" />
            Performances
          </TabsTrigger>
          <TabsTrigger value="planning">
            <Calendar className="mr-2 h-4 w-4" />
            Planning IA
          </TabsTrigger>
          <TabsTrigger value="deplacements">
            <Navigation className="mr-2 h-4 w-4" />
            Déplacements
          </TabsTrigger>
        </TabsList>

        {/* Tab: Commerciaux */}
        <TabsContent value="commerciaux" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Équipe Commerciale</CardTitle>
              <CardDescription>
                {commerciaux.length} commerciaux actifs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {commerciaux.map((commercial) => (
                  <div key={commercial.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {commercial.prenom[0]}{commercial.nom[0]}
                        </div>
                        <div>
                          <p className="font-semibold">
                            {commercial.prenom} {commercial.nom}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {commercial.email}
                          </p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {commercial.telephone}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {commercial.adresse.ville}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Car className="h-3 w-3" />
                              {commercial.vehicule?.marque} {commercial.vehicule?.modele}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold">
                            Rs {((commercial.stats?.caGenere || 0) / 1000).toFixed(0)}k
                          </p>
                          <p className="text-xs text-muted-foreground">CA ce mois</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-2xl font-bold">
                            {commercial.stats?.nombreClients || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">Clients</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-2xl font-bold">
                            {commercial.stats?.tauxConversion?.toFixed(0) || 0}%
                          </p>
                          <p className="text-xs text-muted-foreground">Conversion</p>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center gap-1">
                            {commercial.stats?.ranking === 1 && (
                              <Award className="h-5 w-5 text-yellow-500" />
                            )}
                            <p className="text-2xl font-bold">
                              #{commercial.stats?.ranking || '-'}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">Ranking</p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedCommercial(commercial)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Zones et secteurs */}
                    <div className="mt-4 pt-4 border-t flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Zones:</span>
                        {commercial.zones.map(zone => (
                          <Badge key={zone} variant="outline" className="text-xs">
                            {MAURITIUS_CONFIG.districts[zone].label}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Secteurs:</span>
                        {commercial.secteurs.slice(0, 3).map(secteur => (
                          <Badge key={secteur} variant="secondary" className="text-xs">
                            {MAURITIUS_CONFIG.secteurs[secteur].icon}
                            {MAURITIUS_CONFIG.secteurs[secteur].label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {/* Objectifs */}
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">CA Mensuel</span>
                          <span className="text-xs font-medium">
                            {((commercial.stats?.caGenere || 0) / commercial.objectifs.mensuel.ca * 100).toFixed(0)}%
                          </span>
                        </div>
                        <Progress 
                          value={(commercial.stats?.caGenere || 0) / commercial.objectifs.mensuel.ca * 100} 
                          className="h-2"
                        />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Nouveaux Clients</span>
                          <span className="text-xs font-medium">
                            {commercial.stats?.nombreClients || 0}/{commercial.objectifs.mensuel.nouveauxClients}
                          </span>
                        </div>
                        <Progress 
                          value={(commercial.stats?.nombreClients || 0) / commercial.objectifs.mensuel.nouveauxClients * 100} 
                          className="h-2"
                        />
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">RDV</span>
                          <span className="text-xs font-medium">
                            {commercial.stats?.rdvEffectues || 0}/{commercial.objectifs.mensuel.rdv}
                          </span>
                        </div>
                        <Progress 
                          value={(commercial.stats?.rdvEffectues || 0) / commercial.objectifs.mensuel.rdv * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Performances */}
        <TabsContent value="performances" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {commerciaux
                    .sort((a, b) => (b.stats?.caGenere || 0) - (a.stats?.caGenere || 0))
                    .map((com, index) => (
                      <div key={com.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-white
                            ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-300'}`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{com.prenom} {com.nom}</p>
                            <p className="text-xs text-muted-foreground">
                              Score: {com.stats?.scorePerformance}/100
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">Rs {((com.stats?.caGenere || 0) / 1000).toFixed(0)}k</p>
                          <p className="text-xs text-muted-foreground">
                            {com.stats?.tauxConversion?.toFixed(1)}% conv.
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activité Globale</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">RDV effectués</span>
                    <span className="font-bold">
                      {commerciaux.reduce((sum, c) => sum + (c.stats?.rdvEffectues || 0), 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Appels</span>
                    <span className="font-bold">
                      {commerciaux.reduce((sum, c) => sum + (c.stats?.appelsEffectues || 0), 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Emails</span>
                    <span className="font-bold">
                      {commerciaux.reduce((sum, c) => sum + (c.stats?.emailsEnvoyes || 0), 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Km parcourus</span>
                    <span className="font-bold">
                      {statsGlobales.kmTotal.toLocaleString()} km
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Planning IA */}
        <TabsContent value="planning" className="space-y-4">
          <Alert>
            <Activity className="h-4 w-4" />
            <AlertDescription>
              Le système IA optimise automatiquement les circuits de vos commerciaux 
              en fonction de la priorité des prospects, de leur localisation et des objectifs.
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardHeader>
              <CardTitle>Planning Optimisé par IA</CardTitle>
              <CardDescription>
                Suggestions d'optimisation pour aujourd'hui
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {commerciaux.map((com) => (
                  <div key={com.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-medium">{com.prenom} {com.nom}</p>
                        <p className="text-sm text-muted-foreground">
                          Circuit optimisé pour {com.zones.length} zones
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Score IA: 85/100
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-green-50 rounded">
                        <p className="text-2xl font-bold text-green-600">-15%</p>
                        <p className="text-xs text-muted-foreground">Économie km</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded">
                        <p className="text-2xl font-bold text-blue-600">-45min</p>
                        <p className="text-xs text-muted-foreground">Temps gagné</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded">
                        <p className="text-2xl font-bold text-purple-600">8</p>
                        <p className="text-xs text-muted-foreground">RDV optimaux</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        Valider le planning
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        Voir les détails
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Déplacements */}
        <TabsContent value="deplacements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Suivi des Déplacements</CardTitle>
              <CardDescription>
                Validation des indemnités kilométriques
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4 p-4 bg-muted rounded">
                  <div>
                    <p className="text-sm text-muted-foreground">Total km ce mois</p>
                    <p className="text-xl font-bold">{statsGlobales.kmTotal}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Indemnités totales</p>
                    <p className="text-xl font-bold">Rs {statsGlobales.indemnitesTotal.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">À valider</p>
                    <p className="text-xl font-bold text-orange-600">12</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Moyenne/commercial</p>
                    <p className="text-xl font-bold">
                      {Math.round(statsGlobales.kmTotal / commerciaux.length)} km
                    </p>
                  </div>
                </div>
                
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-2 text-sm">Commercial</th>
                      <th className="text-left p-2 text-sm">Date</th>
                      <th className="text-left p-2 text-sm">Trajet</th>
                      <th className="text-left p-2 text-sm">Distance</th>
                      <th className="text-left p-2 text-sm">Indemnité</th>
                      <th className="text-left p-2 text-sm">Statut</th>
                      <th className="text-left p-2 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2">Jean Martin</td>
                      <td className="p-2">20/01/2024</td>
                      <td className="p-2 text-sm">Port Louis → Grand Baie</td>
                      <td className="p-2">45 km</td>
                      <td className="p-2">Rs 1,125</td>
                      <td className="p-2">
                        <Badge variant="secondary" className="text-xs">À valider</Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-7">
                            Valider
                          </Button>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Marie Dupont</td>
                      <td className="p-2">20/01/2024</td>
                      <td className="p-2 text-sm">Grand Baie → Pamplemousses</td>
                      <td className="p-2">30 km</td>
                      <td className="p-2">Rs 750</td>
                      <td className="p-2">
                        <Badge variant="default" className="text-xs">Validé</Badge>
                      </td>
                      <td className="p-2">
                        <Button size="sm" variant="ghost" className="h-7">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
