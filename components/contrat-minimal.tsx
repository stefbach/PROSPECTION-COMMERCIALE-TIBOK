// components/contrat-minimal.tsx
// Version minimale et fonctionnelle pour les contrats

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { FileSignature, Plus, Trash2, Calendar, DollarSign } from 'lucide-react'

export function ContratMinimal({ 
  prospect,
  onSuccess 
}: { 
  prospect: { id: number; nom: string }
  onSuccess?: () => void
}) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()

  const [form, setForm] = React.useState({
    numero: `CTR-${Date.now()}`,
    titre: `Contrat - ${prospect.nom}`,
    date_debut: new Date().toISOString().split('T')[0],
    date_fin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    montant: 50000,
    statut: 'brouillon',
    type: 'service'
  })

  async function saveContrat() {
    setLoading(true)
    
    try {
      const res = await fetch('/api/contrats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          prospect_id: prospect.id,
          prospect_nom: prospect.nom,
          devise: 'MUR',
          documents: []
        })
      })
      
      if (!res.ok) throw new Error('Erreur création')
      
      toast({
        title: "Contrat créé",
        description: `${form.numero} créé avec succès`
      })
      
      setOpen(false)
      onSuccess?.()
      
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le contrat",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        <Plus className="h-4 w-4 mr-2" />
        Nouveau Contrat
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Nouveau contrat pour {prospect.nom}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Numéro</label>
              <Input
                value={form.numero}
                onChange={(e) => setForm({...form, numero: e.target.value})}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Titre</label>
              <Input
                value={form.titre}
                onChange={(e) => setForm({...form, titre: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Date début</label>
                <Input
                  type="date"
                  value={form.date_debut}
                  onChange={(e) => setForm({...form, date_debut: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Date fin</label>
                <Input
                  type="date"
                  value={form.date_fin}
                  onChange={(e) => setForm({...form, date_fin: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Montant (MUR)</label>
              <Input
                type="number"
                value={form.montant}
                onChange={(e) => setForm({...form, montant: parseInt(e.target.value) || 0})}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Statut</label>
              <select
                value={form.statut}
                onChange={(e) => setForm({...form, statut: e.target.value})}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="brouillon">Brouillon</option>
                <option value="envoye">Envoyé</option>
                <option value="signe">Signé</option>
                <option value="actif">Actif</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={saveContrat} 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Liste des contrats
export function ContratsList({ prospectId }: { prospectId: number }) {
  const [contrats, setContrats] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()

  async function loadContrats() {
    setLoading(true)
    try {
      const res = await fetch(`/api/contrats?prospect_id=${prospectId}`)
      if (res.ok) {
        const data = await res.json()
        setContrats(data)
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  async function deleteContrat(id: number) {
    if (!confirm('Supprimer ce contrat ?')) return
    
    try {
      const res = await fetch(`/api/contrats?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: "Contrat supprimé" })
        loadContrats()
      }
    } catch (error) {
      toast({ 
        title: "Erreur", 
        variant: "destructive" 
      })
    }
  }

  React.useEffect(() => {
    loadContrats()
  }, [prospectId])

  if (loading) return <div>Chargement...</div>

  if (contrats.length === 0) {
    return (
      <Card className="bg-gray-50">
        <CardContent className="p-8 text-center">
          <FileSignature className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Aucun contrat</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {contrats.map(contrat => (
        <Card key={contrat.id} className="bg-white">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{contrat.titre}</p>
                <div className="flex gap-4 text-sm text-gray-600 mt-1">
                  <span>{contrat.numero}</span>
                  <span>MUR {contrat.montant?.toLocaleString()}</span>
                  <span>{new Date(contrat.date_debut).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{contrat.statut}</Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteContrat(contrat.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
