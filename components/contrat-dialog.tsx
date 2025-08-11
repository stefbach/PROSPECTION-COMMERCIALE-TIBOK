// components/contrat-dialog.tsx
// Dialog pour créer/éditer un contrat avec upload de documents

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  FileSignature, Upload, Download, FileText, CheckCircle, 
  AlertCircle, X, Plus, DollarSign, Calendar, File,
  Paperclip, Eye, Trash2, Edit, Save
} from 'lucide-react'

interface Contrat {
  id?: number
  prospect_id: number
  prospect_nom?: string
  numero: string
  titre: string
  date_debut: string
  date_fin: string
  montant: number
  devise: string
  statut: 'brouillon' | 'envoye' | 'negocie' | 'signe' | 'actif' | 'termine' | 'annule'
  type: 'vente' | 'service' | 'maintenance' | 'location' | 'autre'
  conditions?: string
  documents?: ContratDocument[]
  created_at?: string
  updated_at?: string
}

interface ContratDocument {
  id: string
  nom: string
  type: string
  taille: number
  url?: string
  file?: File
  uploaded_at: string
}

interface ContratDialogProps {
  prospect: { id: number; nom: string; budget?: string }
  contrat?: Contrat
  onSuccess?: () => void
  children?: React.ReactNode
}

export function ContratDialog({ prospect, contrat, onSuccess, children }: ContratDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [uploadedFiles, setUploadedFiles] = React.useState<ContratDocument[]>(contrat?.documents || [])
  const [dragActive, setDragActive] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const [form, setForm] = React.useState({
    numero: contrat?.numero || `CTR-2025-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
    titre: contrat?.titre || `Contrat de service - ${prospect.nom}`,
    date_debut: contrat?.date_debut || new Date().toISOString().split('T')[0],
    date_fin: contrat?.date_fin || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    montant: contrat?.montant || parseInt(prospect.budget?.replace(/[^\d]/g, '') || '0') || 50000,
    devise: contrat?.devise || 'MUR',
    statut: contrat?.statut || 'brouillon',
    type: contrat?.type || 'service',
    conditions: contrat?.conditions || ''
  })

  // Gestion du drag & drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFiles = (files: FileList) => {
    const newFiles: ContratDocument[] = []
    
    Array.from(files).forEach(file => {
      // Vérifier le type de fichier
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Type de fichier non supporté",
          description: `${file.name} n'est pas un type de fichier accepté`,
          variant: "destructive"
        })
        return
      }
      
      // Vérifier la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: `${file.name} dépasse la limite de 10MB`,
          variant: "destructive"
        })
        return
      }
      
      const newDoc: ContratDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        nom: file.name,
        type: file.type,
        taille: file.size,
        file: file,
        uploaded_at: new Date().toISOString()
      }
      
      newFiles.push(newDoc)
    })
    
    if (newFiles.length > 0) {
      setUploadedFiles([...uploadedFiles, ...newFiles])
      toast({
        title: "Fichiers ajoutés",
        description: `${newFiles.length} fichier(s) ajouté(s) avec succès`
      })
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const removeFile = (id: string) => {
    setUploadedFiles(uploadedFiles.filter(f => f.id !== id))
    toast({
      title: "Fichier supprimé",
      description: "Le document a été retiré du contrat"
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄'
    if (type.includes('word')) return '📝'
    if (type.includes('excel') || type.includes('sheet')) return '📊'
    if (type.includes('image')) return '🖼️'
    return '📎'
  }

  async function uploadToServer(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur lors de l\'upload')
    }
    
    const result = await response.json()
    return result.url
  }

  async function saveContrat() {
    setLoading(true)
    
    try {
      // Upload des fichiers non uploadés
      const documentsWithUrls = await Promise.all(
        uploadedFiles.map(async (doc) => {
          if (!doc.url && doc.file) {
            const url = await uploadToServer(doc.file)
            return { ...doc, url, file: undefined }
          }
          return doc
        })
      )
      
      const contratData = {
        ...form,
        prospect_id: prospect.id,
        documents: documentsWithUrls
      }
      
      const url = contrat ? `/api/contrats` : '/api/contrats'
      const method = contrat ? 'PATCH' : 'POST'
      const body = contrat ? { id: contrat.id, ...contratData } : contratData
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (!res.ok) throw new Error(await res.text())
      
      toast({
        title: contrat ? "Contrat modifié" : "Contrat créé",
        description: `Le contrat ${form.numero} a été ${contrat ? 'modifié' : 'créé'} avec succès`
      })
      
      setOpen(false)
      onSuccess?.()
      
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder le contrat",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const statutColors = {
    'brouillon': 'bg-gray-100 text-gray-800',
    'envoye': 'bg-blue-100 text-blue-800',
    'negocie': 'bg-yellow-100 text-yellow-800',
    'signe': 'bg-green-100 text-green-800',
    'actif': 'bg-emerald-100 text-emerald-800',
    'termine': 'bg-gray-100 text-gray-800',
    'annule': 'bg-red-100 text-red-800'
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl text-gray-900">
            {contrat ? 'Modifier le contrat' : 'Créer un nouveau contrat'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Informations générales */}
          <Card className="bg-gray-50 border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de contrat</label>
                  <Input
                    value={form.numero}
                    onChange={(e) => setForm({...form, numero: e.target.value})}
                    className="bg-white text-gray-900 border-gray-300"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                  <select
                    value={form.statut}
                    onChange={(e) => setForm({...form, statut: e.target.value as Contrat['statut']})}
                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2"
                  >
                    <option value="brouillon">Brouillon</option>
                    <option value="envoye">Envoyé</option>
                    <option value="negocie">En négociation</option>
                    <option value="signe">Signé</option>
                    <option value="actif">Actif</option>
                    <option value="termine">Terminé</option>
                    <option value="annule">Annulé</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titre du contrat</label>
                <Input
                  value={form.titre}
                  onChange={(e) => setForm({...form, titre: e.target.value})}
                  className="bg-white text-gray-900 border-gray-300"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({...form, type: e.target.value as Contrat['type']})}
                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2"
                  >
                    <option value="vente">Vente</option>
                    <option value="service">Service</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="location">Location</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date de début</label>
                  <Input
                    type="date"
                    value={form.date_debut}
                    onChange={(e) => setForm({...form, date_debut: e.target.value})}
                    className="bg-white text-gray-900 border-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date de fin</label>
                  <Input
                    type="date"
                    value={form.date_fin}
                    onChange={(e) => setForm({...form, date_fin: e.target.value})}
                    min={form.date_debut}
                    className="bg-white text-gray-900 border-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Montant</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      value={form.montant}
                      onChange={(e) => setForm({...form, montant: parseInt(e.target.value) || 0})}
                      className="pl-10 bg-white text-gray-900 border-gray-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Devise</label>
                  <select
                    value={form.devise}
                    onChange={(e) => setForm({...form, devise: e.target.value})}
                    className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2"
                  >
                    <option value="MUR">MUR - Roupie mauricienne</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="USD">USD - Dollar US</option>
                    <option value="GBP">GBP - Livre sterling</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Conditions particulières</label>
                <Textarea
                  value={form.conditions}
                  onChange={(e) => setForm({...form, conditions: e.target.value})}
                  rows={4}
                  placeholder="Conditions spécifiques, clauses particulières..."
                  className="bg-white text-gray-900 border-gray-300"
                />
              </div>
            </CardContent>
          </Card>

          {/* Upload de documents */}
          <Card className="bg-gray-50 border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Documents contractuels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Zone de drag & drop */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileInput}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  className="hidden"
                />
                
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">
                  Glissez-déposez vos documents ici ou
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Parcourir les fichiers
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Formats acceptés: PDF, Word, Excel, Images (JPG, PNG) • Max 10MB par fichier
                </p>
              </div>

              {/* Liste des documents uploadés */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Documents attachés ({uploadedFiles.length})</h4>
                  {uploadedFiles.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getFileIcon(doc.type)}</span>
                        <div>
                          <p className="font-medium text-gray-900">{doc.nom}</p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(doc.taille)} • Ajouté le {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.url && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(doc.url, '_blank')}
                            className="bg-white text-gray-700 border-gray-300"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removeFile(doc.id)}
                          className="bg-white text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Résumé */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Montant total du contrat</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {form.devise} {form.montant.toLocaleString('fr-FR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-600">Durée</p>
                  <p className="text-lg font-semibold text-blue-900">
                    {Math.ceil((new Date(form.date_fin).getTime() - new Date(form.date_debut).getTime()) / (1000 * 60 * 60 * 24 * 30))} mois
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="bg-white text-gray-700 border-gray-300"
          >
            Annuler
          </Button>
          <Button
            onClick={saveContrat}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Enregistrement...
              </>
            ) : (
              <>
                <FileSignature className="h-4 w-4 mr-2" />
                {contrat ? 'Modifier' : 'Créer'} le contrat
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Composant pour afficher la liste des contrats
export function ContratsList({ 
  prospectId, 
  onUpdate 
}: { 
  prospectId: number
  onUpdate?: () => void 
}) {
  const [contrats, setContrats] = React.useState<Contrat[]>([])
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
      console.error('Erreur chargement contrats:', error)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    loadContrats()
  }, [prospectId])

  async function deleteContrat(id: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contrat ?')) return
    
    try {
      const res = await fetch(`/api/contrats?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({
          title: "Contrat supprimé",
          description: "Le contrat a été supprimé avec succès"
        })
        loadContrats()
        onUpdate?.()
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le contrat",
        variant: "destructive"
      })
    }
  }

  const statutColors = {
    'brouillon': 'bg-gray-100 text-gray-800',
    'envoye': 'bg-blue-100 text-blue-800',
    'negocie': 'bg-yellow-100 text-yellow-800',
    'signe': 'bg-green-100 text-green-800',
    'actif': 'bg-emerald-100 text-emerald-800',
    'termine': 'bg-gray-100 text-gray-800',
    'annule': 'bg-red-100 text-red-800'
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (contrats.length === 0) {
    return (
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-8 text-center">
          <FileSignature className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Aucun contrat enregistré</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {contrats.map((contrat) => (
        <Card key={contrat.id} className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <FileSignature className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">{contrat.titre}</p>
                    <p className="text-sm text-gray-600">
                      N° {contrat.numero} • {contrat.type}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Du {new Date(contrat.date_debut).toLocaleDateString('fr-FR')} au {new Date(contrat.date_fin).toLocaleDateString('fr-FR')}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {contrat.devise} {contrat.montant.toLocaleString('fr-FR')}
                  </span>
                  {contrat.documents && contrat.documents.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Paperclip className="h-4 w-4" />
                      {contrat.documents.length} document(s)
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge className={statutColors[contrat.statut]}>
                  {contrat.statut}
                </Badge>
                
                <div className="flex gap-1">
                  <ContratDialog
                    prospect={{ id: prospectId, nom: contrat.prospect_nom || '' }}
                    contrat={contrat}
                    onSuccess={() => {
                      loadContrats()
                      onUpdate?.()
                    }}
                  >
                    <Button size="sm" variant="outline" className="bg-white">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </ContratDialog>
                  
                  {contrat.documents && contrat.documents.length > 0 && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="bg-white"
                      onClick={() => {
                        // Afficher les documents
                        contrat.documents?.forEach(doc => {
                          if (doc.url) window.open(doc.url, '_blank')
                        })
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="bg-white text-red-600"
                    onClick={() => contrat.id && deleteContrat(contrat.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
