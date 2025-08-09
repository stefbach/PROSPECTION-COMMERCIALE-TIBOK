'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  UserPlus,
  Edit,
  Trash2,
  Mail,
  Phone,  MapPin,
  Car,
  Calendar,
  Target,
  Users,
  Building2,
  DollarSign,
  Settings,
  ChevronRight,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react'
import { Commercial, COMMERCIAL_CONFIG } from '@/lib/commercial-system'
import { MAURITIUS_CONFIG, District, Secteur } from '@/lib/mauritius-config'import { useToast } from '@/hooks/use-toast'
import { PERMISSIONS, AUDIT_ACTIONS, logAction } from '@/lib/auth-system'
import { useAuth, ProtectedRoute, Can } from '@/lib/auth-components'

interface CommercialForm {
  nom: string
  prenom: string
  email: string
  telephone: string
  adresse: {
    rue: string
    ville: string
    district: District
    codePostal: string
  }
  vehicule: {
    type: 'personnel' | 'societe'
    marque: string
    modele: string
    immatriculation: string
    tauxKm: number
  }
  zones: District[]
  secteurs: Secteur[]
  objectifs: {
    mensuel: {
      ca: number
      nouveauxClients: number
      rdv: number
    }
  }
  manager?: string
}

export default function CommerciauxManagement() {
  const { hasPermission } = useAuth()
  const { toast } = useToast()
  
  const [commerciaux, setCommerciaux] = React.useState<Commercial[]>([])
  const [showCreateDialog, setShowCreateDialog] = React.useState(false)
  const [editingCommercial, setEditingCommercial] = React.useState<Commercial | null>(null)
  const [showAffectationDialog, setShowAffectationDialog] = React.useState(false)
  const [selectedCommercialId, setSelectedCommercialId] = React.useState<string>('')
  const [loading, setLoading] = React.useState(false)
  
  // État du formulaire
  const [formData, setFormData] = React.useState<CommercialForm>({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: {
      rue: '',
      ville: '',
      district: 'port-louis',
      codePostal: ''
    },
    vehicule: {
      type: 'personnel',
      marque: '',
      modele: '',
      immatriculation: '',
      tauxKm: 25
    },
    zones: [],
    secteurs: [],
    objectifs: {
      mensuel: {
        ca: 500000,
        nouveauxClients: 10,
        rdv: 40
      }
    }
  })

  // Charger les commerciaux
  React.useEffect(() => {
    loadCommerciaux()
  }, [])

  const loadCommerciaux = async () => {
    setLoading(true)
    try {
      // Simuler le chargement depuis l'API
      // const response = await fetch('/api/commerciaux')
      // const data = await response.json()
      // setCommerciaux(data)
      
      // Pour la démo
      setCommerciaux([
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
          zones: ['port-louis', 'plaines-wilhems'],
          secteurs: ['hotel', 'restaurant'],
          objectifs: COMMERCIAL_CONFIG.objectifsDefaut
        }
      ])
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les commerciaux',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!hasPermission(PERMISSIONS.COMMERCIAL_CREATE)) {
      toast({
        title: 'Accès refusé',
        description: 'Vous n\'avez pas les permissions nécessaires',
        variant: 'destructive'
      })
      return
    }
    
    try {
      // Validation
      if (!formData.nom || !formData.prenom || !formData.email) {
        throw new Error('Veuillez remplir tous les champs obligatoires')
      }
      
      if (formData.zones.length === 0) {
        throw new Error('Veuillez sélectionner au moins une zone')
      }
      
      if (formData.secteurs.length === 0) {
        throw new Error('Veuillez sélectionner au moins un secteur')
      }
      
      // Créer le commercial
      const newCommercial: Commercial = {
        id: `com-${Date.now()}`,
        userId: `user-${Date.now()}`,
        ...formData,
        dateEmbauche: new Date(),
        statut: 'actif'
      }
      
      // Simuler l'appel API
      // await fetch('/api/commerciaux', {
      //   method: 'POST',
      //   body: JSON.stringify(newCommercial)
      // })
      
      setCommerciaux(prev => [...prev, newCommercial])
      
      toast({
        title: 'Commercial créé',
        description: `${formData.prenom} ${formData.nom} a été ajouté à l'équipe`
      })
      
      // Réinitialiser le formulaire
      setShowCreateDialog(false)
      resetForm()
      
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      adresse: {
        rue: '',
        ville: '',
        district: 'port-louis',
        codePostal: ''
      },
      vehicule: {
        type: 'personnel',
        marque: '',
        modele: '',
        immatriculation: '',
        tauxKm: 25
      },
      zones: [],
      secteurs: [],
      objectifs: {
        mensuel: {
          ca: 500000,
          nouveauxClients: 10,
          rdv: 40
        }
      }
    })
  }

  const deleteCommercial = async (id: string) => {
    if (!hasPermission(PERMISSIONS.COMMERCIAL_DELETE)) {
      toast({
        title: 'Accès refusé',
        description: 'Vous n\'avez pas les permissions pour supprimer',
        variant: 'destructive'
      })
      return
    }
    
    if (confirm('Êtes-vous sûr de vouloir supprimer ce commercial ?')) {
      setCommerciaux(prev => prev.filter(c => c.id !== id))
      toast({
        title: 'Commercial supprimé',
        description: 'Le commercial a été retiré de l\'équipe'
      })
    }
  }

  const toggleZone = (zone: District) => {
    setFormData(prev => ({
      ...prev,
      zones: prev.zones.includes(zone)
        ? prev.zones.filter(z => z !== zone)
        : [...prev.zones, zone]
    }))
  }

  const toggleSecteur = (secteur: Secteur) => {
    setFormData(prev => ({
      ...prev,
      secteurs: prev.secteurs.includes(secteur)
        ? prev.secteurs.filter(s => s !== secteur)
        : [...prev.secteurs, secteur]
    }))
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Commerciaux</h1>
          <p className="text-muted-foreground mt-2">
            Créez et gérez votre équipe commerciale
          </p>
        </div>
        
        <Button onClick={() => setShowCreateDialog(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Nouveau Commercial
        </Button>
      </div>

      {/* Liste des commerciaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {commerciaux.map((commercial) => (
          <Card key={commercial.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {commercial.prenom[0]}{commercial.nom[0]}
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {commercial.prenom} {commercial.nom}
                    </CardTitle>
                    <CardDescription>
                      {commercial.email}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={commercial.statut === 'actif' ? 'default' : 'secondary'}>
                  {commercial.statut}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Coordonnées */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{commercial.telephone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{commercial.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{commercial.adresse.ville}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Depuis {commercial.dateEmbauche.toLocaleDateString('fr-FR')}</span>
                </div>
              </div>

              {/* Véhicule */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Car className="h-4 w-4" />
                  <span className="font-medium">Véhicule:</span>
                  <span>
                    {commercial.vehicule?.marque} {commercial.vehicule?.modele} - 
                    {commercial.vehicule?.immatriculation}
                  </span>
                  <Badge variant="outline" className="ml-auto">
                    Rs {commercial.vehicule?.tauxKm}/km
                  </Badge>
                </div>
              </div>

              {/* Zones et secteurs */}
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium mb-2">Zones d'intervention:</p>
                  <div className="flex flex-wrap gap-1">
                    {commercial.zones.map(zone => (
                      <Badge key={zone} variant="outline" className="text-xs">
                        {MAURITIUS_CONFIG.districts[zone].label}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Secteurs:</p>
                  <div className="flex flex-wrap gap-1">
                    {commercial.secteurs.map(secteur => (
                      <Badge key={secteur} variant="secondary" className="text-xs">
                        {MAURITIUS_CONFIG.secteurs[secteur].icon} {MAURITIUS_CONFIG.secteurs[secteur].label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Objectifs */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-blue-50 rounded">
                  <p className="text-xs text-muted-foreground">CA/mois</p>
                  <p className="font-bold">Rs {(commercial.objectifs.mensuel.ca / 1000).toFixed(0)}k</p>
                </div>
                <div className="p-2 bg-green-50 rounded">
                  <p className="text-xs text-muted-foreground">Clients/mois</p>
                  <p className="font-bold">{commercial.objectifs.mensuel.nouveauxClients}</p>
                </div>
                <div className="p-2 bg-purple-50 rounded">
                  <p className="text-xs text-muted-foreground">RDV/mois</p>
                  <p className="font-bold">{commercial.objectifs.mensuel.rdv}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setSelectedCommercialId(commercial.id)
                    setShowAffectationDialog(true)
                  }}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Affecter prospects
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setEditingCommercial(commercial)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => deleteCommercial(commercial.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de création/édition */}
      <Dialog open={showCreateDialog || !!editingCommercial} 
              onOpenChange={(open) => {
                if (!open) {
                  setShowCreateDialog(false)
                  setEditingCommercial(null)
                  resetForm()
                }
              }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCommercial ? 'Modifier le commercial' : 'Nouveau commercial'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations personnelles */}
            <div>
              <h3 className="font-medium mb-3">Informations personnelles</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Prénom *</label>
                  <Input
                    value={formData.prenom}
                    onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Nom *</label>
                  <Input
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Téléphone *</label>
                  <Input
                    value={formData.telephone}
                    onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                    placeholder="+230 5XXX XXXX"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Adresse */}
            <div>
              <h3 className="font-medium mb-3">Adresse</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium">Rue *</label>
                  <Input
                    value={formData.adresse.rue}
                    onChange={(e) => setFormData({
                      ...formData,
                      adresse: {...formData.adresse, rue: e.target.value}
                    })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Ville *</label>
                  <Input
                    value={formData.adresse.ville}
                    onChange={(e) => setFormData({
                      ...formData,
                      adresse: {...formData.adresse, ville: e.target.value}
                    })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">District *</label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={formData.adresse.district}
                    onChange={(e) => setFormData({
                      ...formData,
                      adresse: {...formData.adresse, district: e.target.value as District}
                    })}
                  >
                    {Object.entries(MAURITIUS_CONFIG.districts).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Code postal</label>
                  <Input
                    value={formData.adresse.codePostal}
                    onChange={(e) => setFormData({
                      ...formData,
                      adresse: {...formData.adresse, codePostal: e.target.value}
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Véhicule */}
            <div>
              <h3 className="font-medium mb-3">Véhicule</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={formData.vehicule.type}
                    onChange={(e) => setFormData({
                      ...formData,
                      vehicule: {...formData.vehicule, type: e.target.value as 'personnel' | 'societe'}
                    })}
                  >
                    <option value="personnel">Personnel</option>
                    <option value="societe">Société</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Marque</label>
                  <Input
                    value={formData.vehicule.marque}
                    onChange={(e) => setFormData({
                      ...formData,
                      vehicule: {...formData.vehicule, marque: e.target.value}
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Modèle</label>
                  <Input
                    value={formData.vehicule.modele}
                    onChange={(e) => setFormData({
                      ...formData,
                      vehicule: {...formData.vehicule, modele: e.target.value}
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Immatriculation</label>
                  <Input
                    value={formData.vehicule.immatriculation}
                    onChange={(e) => setFormData({
                      ...formData,
                      vehicule: {...formData.vehicule, immatriculation: e.target.value}
                    })}
                    placeholder="AA 1234"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Taux km (Rs)</label>
                  <Input
                    type="number"
                    value={formData.vehicule.tauxKm}
                    onChange={(e) => setFormData({
                      ...formData,
                      vehicule: {...formData.vehicule, tauxKm: Number(e.target.value)}
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Zones d'intervention */}
            <div>
              <h3 className="font-medium mb-3">Zones d'intervention *</h3>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(MAURITIUS_CONFIG.districts).map(([key, config]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`zone-${key}`}
                      checked={formData.zones.includes(key as District)}
                      onCheckedChange={() => toggleZone(key as District)}
                    />
                    <label htmlFor={`zone-${key}`} className="text-sm cursor-pointer">
                      {config.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Secteurs */}
            <div>
              <h3 className="font-medium mb-3">Secteurs d'activité *</h3>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(MAURITIUS_CONFIG.secteurs).map(([key, config]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`secteur-${key}`}
                      checked={formData.secteurs.includes(key as Secteur)}
                      onCheckedChange={() => toggleSecteur(key as Secteur)}
                    />
                    <label htmlFor={`secteur-${key}`} className="text-sm cursor-pointer">
                      {config.icon} {config.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Objectifs */}
            <div>
              <h3 className="font-medium mb-3">Objectifs mensuels</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">CA (Rs)</label>
                  <Input
                    type="number"
                    value={formData.objectifs.mensuel.ca}
                    onChange={(e) => setFormData({
                      ...formData,
                      objectifs: {
                        mensuel: {...formData.objectifs.mensuel, ca: Number(e.target.value)}
                      }
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Nouveaux clients</label>
                  <Input
                    type="number"
                    value={formData.objectifs.mensuel.nouveauxClients}
                    onChange={(e) => setFormData({
                      ...formData,
                      objectifs: {
                        mensuel: {...formData.objectifs.mensuel, nouveauxClients: Number(e.target.value)}
                      }
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">RDV</label>
                  <Input
                    type="number"
                    value={formData.objectifs.mensuel.rdv}
                    onChange={(e) => setFormData({
                      ...formData,
                      objectifs: {
                        mensuel: {...formData.objectifs.mensuel, rdv: Number(e.target.value)}
                      }
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false)
                  setEditingCommercial(null)
                  resetForm()
                }}
              >
                Annuler
              </Button>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                {editingCommercial ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog d'affectation de prospects */}
      <Dialog open={showAffectationDialog} onOpenChange={setShowAffectationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Affecter des prospects</DialogTitle>
          </DialogHeader>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Sélectionnez les prospects à affecter à ce commercial. 
              Les prospects seront filtrés selon ses zones et secteurs.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4">
            {/* Liste des prospects à affecter */}
            <div className="text-center text-muted-foreground py-8">
              Interface d'affectation des prospects à implémenter
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAffectationDialog(false)}>
                Annuler
              </Button>
              <Button>
                Affecter les prospects sélectionnés
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
