// components/rdv-list.tsx
// Liste des RDV avec suppression fonctionnelle

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Clock, Trash2, CheckCircle, X } from 'lucide-react'

interface RDV {
  id: number
  prospect_id: number
  prospect_nom?: string
  commercial: string
  titre: string
  date_time: string
  duree_min: number
  type_visite: string
  priorite: string
  statut: string
  notes?: string
  lieu?: string
}

export function RdvList({ 
  prospectId,
  onUpdate 
}: { 
  prospectId: number
  onUpdate?: () => void
}) {
  const [rdvs, setRdvs] = React.useState<RDV[]>([])
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()

  async function loadRdvs() {
    setLoading(true)
    try {
      const res = await fetch(`/api/rdv?prospect_id=${prospectId}`)
      if (res.ok) {
        const data = await res.json()
        setRdvs(data)
        console.log(`✅ ${data.length} RDV chargés`)
      }
    } catch (error) {
      console.error('❌ Erreur chargement RDV:', error)
    } finally {
      setLoading(false)
    }
  }

  async function deleteRdv(id: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce RDV ?')) return
    
    try {
      console.log(`🗑️ Suppression RDV ${id}...`)
      
      const res = await fetch(`/api/rdv?id=${id}`, { 
        method: 'DELETE' 
      })
      
      if (res.ok) {
        toast({ 
          title: "✅ RDV supprimé",
          description: "Le rendez-vous a été supprimé avec succès"
        })
        
        // Retirer de la liste locale
        setRdvs(rdvs.filter(r => r.id !== id))
        
        // Appeler le callback si fourni
        onUpdate?.()
      } else {
        const error = await res.text()
        throw new Error(error)
      }
    } catch (error: any) {
      console.error('❌ Erreur suppression:', error)
      toast({ 
        title: "Erreur", 
        description: "Impossible de supprimer le RDV",
        variant: "destructive"
      })
    }
  }

  async function updateStatut(id: number, statut: string) {
    try {
      const res = await fetch('/api/rdv', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, statut })
      })
      
      if (res.ok) {
        toast({ 
          title: "Statut mis à jour",
          description: `RDV marqué comme ${statut}`
        })
        loadRdvs()
      }
    } catch (error) {
      toast({ 
        title: "Erreur",
        variant: "destructive"
      })
    }
  }

  React.useEffect(() => {
    loadRdvs()
  }, [prospectId])

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (rdvs.length === 0) {
    return (
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-8 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Aucun rendez-vous planifié</p>
        </CardContent>
      </Card>
    )
  }

  const getStatutColor = (statut: string) => {
    switch(statut) {
      case 'termine': return 'bg-green-100 text-green-800'
      case 'annule': return 'bg-red-100 text-red-800'
      case 'confirme': return 'bg-blue-100 text-blue-800'
      case 'reporte': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPrioriteColor = (priorite: string) => {
    switch(priorite) {
      case 'urgente': return 'bg-red-100 text-red-800'
      case 'haute': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-3">
      {rdvs.map((rdv) => {
        const isPast = new Date(rdv.date_time) < new Date()
        
        return (
          <Card key={rdv.id} className={`bg-white border-gray-200 ${isPast && rdv.statut !== 'termine' ? 'opacity-60' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(rdv.date_time).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(rdv.date_time).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span>{rdv.duree_min} min</span>
                        <span>{rdv.type_visite}</span>
                        {rdv.lieu && <span>📍 {rdv.lieu}</span>}
                      </div>
                    </div>
                  </div>
                  {rdv.notes && (
                    <p className="text-sm text-gray-600 ml-8">{rdv.notes}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className={getPrioriteColor(rdv.priorite)}>
                    {rdv.priorite}
                  </Badge>
                  
                  <Badge className={getStatutColor(rdv.statut)}>
                    {rdv.statut}
                  </Badge>
                  
                  <div className="flex gap-1 ml-2">
                    {rdv.statut !== 'termine' && rdv.statut !== 'annule' && !isPast && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateStatut(rdv.id, 'termine')}
                        title="Marquer comme terminé"
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {rdv.statut !== 'annule' && !isPast && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateStatut(rdv.id, 'annule')}
                        title="Annuler"
                        className="text-orange-600 hover:text-orange-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteRdv(rdv.id)}
                      title="Supprimer définitivement"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
