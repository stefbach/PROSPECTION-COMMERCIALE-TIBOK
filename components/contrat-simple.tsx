// components/contrat-simple.tsx
// Solution simplifiée avec stockage Base64 dans la base de données

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  FileSignature, Upload, Download, FileText, X, Plus, 
  DollarSign, Calendar, Paperclip, Eye, Trash2
} from 'lucide-react'

interface DocumentBase64 {
  id: string
  nom: string
  type: string
  taille: number
  data: string // Base64
  uploaded_at: string
}

interface ContratSimple {
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
  documents?: DocumentBase64[]
}

export function ContratSimpleDialog({ 
  prospect, 
  contrat, 
  onSuccess, 
  children 
}: { 
  prospect: { id: number; nom: string; budget?: string }
  contrat?: ContratSimple
  onSuccess?: () => void
  children?: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [documents, setDocuments] = React.useState<DocumentBase64[]>(contrat?.documents || [])
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

  // Convertir un fichier en Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  // Gérer le drag & drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFiles(e.dataTransfer.files)
    }
  }

  const handleFiles = async (files: FileList) => {
    const newDocs: DocumentBase64[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Vérifier le type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 
                           'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Type non supporté",
          description: `${file.name} n'est pas un type accepté`,
          variant: "destructive"
        })
        continue
      }
      
      // Vérifier la taille (max 5MB pour le Base64)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: `${file.name} dépasse 5MB`,
          variant: "destructive"
        })
        continue
      }
      
      try {
        const base64 = await fileToBase64(file)
        
        newDocs.push({
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          nom: file.name,
          type: file.type,
          taille: file.size,
          data: base64,
          uploaded_at: new Date().toISOString()
        })
      } catch (error) {
        console.error('Erreur conversion Base64:', error)
        toast({
          title: "Erreur",
          description: `Impossible de traiter ${file.name}`,
          variant: "destructive"
        })
      }
    }
    
    if (newDocs.length > 0) {
      setDocuments([...documents, ...newDocs])
      toast({
        title: "Documents ajoutés",
        description: `${newDocs.length} document(s) ajouté(s)`
      })
    }
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await handleFiles(e.target.files)
    }
  }

  const removeDocument = (id: string) => {
    setDocuments(documents.filter(d => d.id !== id))
  }

  const downloadDocument = (doc: DocumentBase64) => {
    const link = document.createElement('a')
    link.href = doc.data
    link.download = doc.nom
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄'
    if (type.includes('word')) return '📝'
    if (type.includes('image')) return '🖼️'
    return '📎'
  }

  async function saveContrat() {
    setLoading(true)
    
    try {
      const contratData = {
        ...form,
        prospect_id: prospect.id,
        documents: documents
      }
      
      const url = contrat ? `/api/contrats` : '/api/contrats'
      const method = contrat ? 'PATCH' : 'POST'
      const body = contrat ? { id: contrat.id, ...contratData } : contratData
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      if (!res.ok) {
        const error = await res.text()
        throw new Error(error)
      }
      
      toast({
        title: "Succès",
        description: `Contrat ${form.numero} ${contrat ? 'modifié' : 'créé'} avec ${documents.length} document(s)`
      })
      
      setOpen(false)
      onSuccess?.()
      
    } catch (error: any) {
      console.error('Erreur sauvegarde:', error)
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le contrat",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
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
          {/* Informations du contrat */}
          <Card className="bg-gray-50 border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Informations du contrat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Numéro</label>
                  <Input
                    value={form.numero}
                    onChange={(e) => setForm({...form, numero: e.target.value})}
                    className="bg-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                  <select
                    value={form.statut}
                    onChange={(e) => setForm({...form, statut: e.target.value as any})}
                    className="w-full border border-gray-300 bg-white rounded-md px-3 py-2"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Titre</label>
                <Input
                  value={form.titre}
                  onChange={(e) => setForm({...form, titre: e.target.value})}
                  className="bg-white"
                />
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
                      className="pl-10 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({...form, type: e.target.value as any})}
                    className="w-full border border-gray-300 bg-white rounded-md px-3 py-2"
                  >
                    <option value="vente">Vente</option>
                    <option value="service">Service</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="location">Location</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date début</label>
                  <Input
                    type="date"
                    value={form.date_debut}
                    onChange={(e) => setForm({...form, date_debut: e.target.value})}
                    className="bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date fin</label>
                  <Input
                    type="date"
                    value={form.date_fin}
                    onChange={(e) => setForm({...form, date_fin: e.target.value})}
                    className="bg-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Zone d'upload simplifiée */}
          <Card className="bg-gray-50 border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Documents du contrat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
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
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="hidden"
                />
                
                <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Glissez vos fichiers ici ou
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white"
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Choisir des fichiers
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  PDF, JPG, PNG, Word • Max 5MB
                </p>
              </div>

              {/* Liste des documents */}
              {documents.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Documents ajoutés ({documents.length})
                  </p>
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 bg-white border rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getFileIcon(doc.type)}</span>
                        <div>
                          <p className="text-sm font-medium">{doc.nom}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(doc.taille)}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadDocument(doc)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeDocument(doc.id)}
                          className="text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Résumé */}
          {form.montant > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Montant total</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {form.devise} {form.montant.toLocaleString('fr-FR')}
                  </p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">
                  {documents.length} document(s)
                </Badge>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
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
