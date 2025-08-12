// components/dialogs/rdv-dialog-enhanced.tsx
// Dialog de création de RDV avec recherche de prospects

"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  Search, X, MapPin, Phone, User, Star, Building2, 
  Calendar, Clock, AlertCircle, CheckCircle, Mail
} from 'lucide-react'

// Types
type District = 'port-louis' | 'pamplemousses' | 'riviere-du-rempart' | 'flacq' | 'grand-port' | 'savanne' | 'plaines-wilhems' | 'moka' | 'riviere-noire'
type Secteur = 'hotel' | 'restaurant' | 'clinique' | 'pharmacie' | 'supermarche' | 'entreprise' | 'ecole' | 'autre'

interface Prospect {
  id: number
  nom: string
  secteur: Secteur
  ville: string
  district: District
  statut: string
  contact?: string
  telephone?: string
  email?: string
  score: number
  budget?: string
  notes?: string
  adresse?: string
}

interface RendezVous {
  id?: number
  prospect_id: number
  prospect_nom?: string
  prospect?: Prospect
  commercial: string
  titre: string
  date_time: string
  duree_min: number
  type_visite: 'decouverte' | 'presentation' | 'negociation' | 'signature' | 'suivi'
  priorite: 'normale' | 'haute' | 'urgente'
  statut: 'planifie' | 'confirme' | 'en-cours' | 'termine' | 'annule' | 'reporte'
  notes?: string
  lieu?: string
}

interface CommercialInfo {
  nom: string
  adresse?: string
  ville?: string
  district?: District
}

// Configuration
const SECTEURS_CONFIG = {
  'hotel': { label: 'Hôtel', icon: '🏨' },
  'restaurant': { label: 'Restaurant', icon: '🍽️' },
  'clinique': { label: 'Clinique', icon: '🏥' },
  'pharmacie': { label: 'Pharmacie', icon: '💊' },
  'supermarche': { label: 'Supermarché', icon: '🛒' },
  'entreprise': { label: 'Entreprise', icon: '🏢' },
  'ecole': { label: 'École', icon: '🎓' },
  'autre': { label: 'Autre', icon: '📍' }
}

const DISTRICTS_CONFIG = {
  'port-louis': { label: 'Port Louis', color: 'blue' },
  'pamplemousses': { label: 'Pamplemousses', color: 'green' },
  'riviere-du-rempart': { label: 'Rivière du Rempart', color: 'purple' },
  'flacq': { label: 'Flacq', color: 'orange' },
  'grand-port': { label: 'Grand Port', color: 'red' },
  'savanne': { label: 'Savanne', color: 'yellow' },
  'plaines-wilhems': { label: 'Plaines Wilhems', color: 'indigo' },
  'moka': { label: 'Moka', color: 'pink' },
  'riviere-noire': { label: 'Rivière Noire', color: 'cyan' }
}

interface RdvDialogEnhancedProps {
  open: boolean
  onClose: () => void
  prospects: Prospect[]
  rdv: RendezVous | null
  onSave: (data: any) => void
  commercialInfo: CommercialInfo
}

export default function RdvDialogEnhanced({ 
  open, 
  onClose, 
  prospects, 
  rdv, 
  onSave,
  commercialInfo
}: RdvDialogEnhancedProps) {
  const { toast } = useToast()
  
  // États du formulaire
  const [form, setForm] = React.useState({
    prospect_id: 0,
    date: '',
    time: '',
    duree_min: 60,
    type_visite: 'decouverte' as const,
    priorite: 'normale' as const,
    statut: 'planifie' as const,
    commercial: '',
    notes: '',
    lieu: ''
  })

  // États pour la recherche de prospect
  const [searchQuery, setSearchQuery] = React.useState('')
  const [showProspectSearch, setShowProspectSearch] = React.useState(false)
  const [selectedProspect, setSelectedProspect] = React.useState<Prospect | null>(null)
  const [filteredProspects, setFilteredProspects] = React.useState<Prospect[]>([])
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  // Initialisation du formulaire
  React.useEffect(() => {
    if (rdv) {
      const dateTime = new Date(rdv.date_time)
      setForm({
        prospect_id: rdv.prospect_id,
        date: dateTime.toISOString().split('T')[0],
        time: dateTime.toTimeString().substring(0, 5),
        duree_min: rdv.duree_min,
        type_visite: rdv.type_visite,
        priorite: rdv.priorite,
        statut: rdv.statut,
        commercial: rdv.commercial || commercialInfo.nom || 'Commercial',
        notes: rdv.notes || '',
        lieu: rdv.lieu || ''
      })
      
      // Trouver et sélectionner le prospect
      const prospect = prospects.find(p => p.id === rdv.prospect_id)
      if (prospect) {
        setSelectedProspect(prospect)
      }
    } else {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setForm({
        prospect_id: 0,
        date: tomorrow.toISOString().split('T')[0],
        time: '10:00',
        duree_min: 60,
        type_visite: 'decouverte',
        priorite: 'normale',
        statut: 'planifie',
        commercial: commercialInfo.nom || 'Commercial',
        notes: '',
        lieu: ''
      })
      setSelectedProspect(null)
    }
  }, [rdv, commercialInfo, prospects, open])

  // Filtrer les prospects selon la recherche
  React.useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProspects(prospects.slice(0, 20)) // Limiter à 20 par défaut
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = prospects.filter(p => 
        p.nom.toLowerCase().includes(query) ||
        p.ville?.toLowerCase().includes(query) ||
        p.contact?.toLowerCase().includes(query) ||
        p.telephone?.includes(query) ||
        p.district?.toLowerCase().includes(query) ||
        SECTEURS_CONFIG[p.secteur]?.label.toLowerCase().includes(query)
      ).slice(0, 50) // Limiter à 50 résultats
      
      setFilteredProspects(filtered)
    }
  }, [searchQuery, prospects])

  // Mettre à jour le lieu quand un prospect est sélectionné
  React.useEffect(() => {
    if (selectedProspect) {
      setForm(prev => ({
        ...prev,
        prospect_id: selectedProspect.id,
        lieu: prev.lieu || selectedProspect.adresse || `${selectedProspect.ville}, ${selectedProspect.district}`,
        priorite: selectedProspect.score >= 4 ? 'haute' : selectedProspect.score >= 3 ? 'normale' : 'normale'
      }))
    }
  }, [selectedProspect])

  // Focus sur la recherche quand on ouvre
  React.useEffect(() => {
    if (showProspectSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showProspectSearch])

  function handleProspectSelect(prospect: Prospect) {
    setSelectedProspect(prospect)
    setShowProspectSearch(false)
    setSearchQuery('')
  }

  function handleSubmit() {
    if (!form.prospect_id || !form.date || !form.time) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un prospect et remplir la date/heure",
        variant: "destructive"
      })
      return
    }
    
    onSave({
      ...form,
      prospect: selectedProspect // Inclure les données complètes du prospect
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {rdv ? 'Modifier' : 'Planifier'} un rendez-vous
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Sélection du prospect avec recherche */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Prospect * {selectedProspect && !showProspectSearch && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 text-blue-600 hover:text-blue-700"
                  onClick={() => setShowProspectSearch(true)}
                >
                  Changer
                </Button>
              )}
            </label>
            
            {!selectedProspect || showProspectSearch ? (
              <div className="space-y-2">
                {/* Barre de recherche */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Rechercher par nom, ville, téléphone, secteur..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
                    disabled={!!rdv}
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2"
                      onClick={() => setSearchQuery('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Liste des prospects filtrés */}
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {filteredProspects.length > 0 ? (
                    <div className="divide-y">
                      {filteredProspects.map((prospect) => (
                        <div
                          key={prospect.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleProspectSelect(prospect)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{SECTEURS_CONFIG[prospect.secteur]?.icon}</span>
                                <span className="font-medium">{prospect.nom}</span>
                                <Badge className="text-xs" variant="outline">
                                  {SECTEURS_CONFIG[prospect.secteur]?.label}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600 mt-1 flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {prospect.ville}, {DISTRICTS_CONFIG[prospect.district]?.label}
                                </span>
                                {prospect.telephone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {prospect.telephone}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3 text-yellow-500" />
                                  {prospect.score}/5
                                </span>
                              </div>
                              {prospect.contact && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Contact: {prospect.contact}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      {searchQuery ? 
                        `Aucun prospect trouvé pour "${searchQuery}"` : 
                        'Commencez à taper pour rechercher un prospect'
                      }
                    </div>
                  )}
                </div>

                {filteredProspects.length > 0 && (
                  <p className="text-xs text-gray-500">
                    {filteredProspects.length} prospect(s) trouvé(s)
                    {prospects.length > filteredProspects.length && ` sur ${prospects.length}`}
                  </p>
                )}
              </div>
            ) : (
              /* Prospect sélectionné */
              <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{SECTEURS_CONFIG[selectedProspect.secteur]?.icon}</span>
                      <span className="font-semibold text-lg">{selectedProspect.nom}</span>
                      <Badge>{SECTEURS_CONFIG[selectedProspect.secteur]?.label}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="h-4 w-4" />
                        {selectedProspect.ville}, {DISTRICTS_CONFIG[selectedProspect.district]?.label}
                      </div>
                      {selectedProspect.telephone && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Phone className="h-4 w-4" />
                          {selectedProspect.telephone}
                        </div>
                      )}
                      {selectedProspect.contact && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <User className="h-4 w-4" />
                          {selectedProspect.contact}
                        </div>
                      )}
                      {selectedProspect.email && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Mail className="h-4 w-4" />
                          {selectedProspect.email}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-500">
                          {"★".repeat(Math.min(5, Math.max(1, selectedProspect.score)))}
                        </span>
                        <span className="text-gray-600">Score: {selectedProspect.score}/5</span>
                      </div>
                      {selectedProspect.budget && (
                        <div className="text-gray-700">
                          Budget: Rs {selectedProspect.budget}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Date et heure */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date *</label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({...form, date: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Heure *</label>
              <Input
                type="time"
                value={form.time}
                onChange={(e) => setForm({...form, time: e.target.value})}
              />
            </div>
          </div>

          {/* Type de visite et durée */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type de visite</label>
              <select
                value={form.type_visite}
                onChange={(e) => setForm({...form, type_visite: e.target.value as any})}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="decouverte">🔍 Découverte</option>
                <option value="presentation">📊 Présentation</option>
                <option value="negociation">💼 Négociation</option>
                <option value="signature">✍️ Signature</option>
                <option value="suivi">📞 Suivi</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Durée (min)</label>
              <Input
                type="number"
                value={form.duree_min}
                onChange={(e) => setForm({...form, duree_min: parseInt(e.target.value) || 60})}
                min="15"
                step="15"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Priorité</label>
              <select
                value={form.priorite}
                onChange={(e) => setForm({...form, priorite: e.target.value as any})}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="normale">🟢 Normale</option>
                <option value="haute">🟠 Haute</option>
                <option value="urgente">🔴 Urgente</option>
              </select>
            </div>
          </div>

          {/* Lieu et commercial */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Lieu</label>
              <Input
                value={form.lieu}
                onChange={(e) => setForm({...form, lieu: e.target.value})}
                placeholder="Lieu du rendez-vous"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Commercial</label>
              <Input
                value={form.commercial}
                onChange={(e) => setForm({...form, commercial: e.target.value})}
                placeholder="Nom du commercial"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({...form, notes: e.target.value})}
              rows={3}
              placeholder="Points à aborder, objectifs..."
            />
          </div>

          {/* Statut (seulement en modification) */}
          {rdv && (
            <div>
              <label className="block text-sm font-medium mb-2">Statut</label>
              <select
                value={form.statut}
                onChange={(e) => setForm({...form, statut: e.target.value as any})}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="planifie">📋 Planifié</option>
                <option value="confirme">✅ Confirmé</option>
                <option value="en-cours">⏳ En cours</option>
                <option value="termine">✔️ Terminé</option>
                <option value="annule">❌ Annulé</option>
                <option value="reporte">📅 Reporté</option>
              </select>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!form.prospect_id || !form.date || !form.time}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {rdv ? 'Enregistrer' : 'Planifier'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
