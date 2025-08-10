'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { 
  Save, Edit, X, Upload, FileText, MessageSquare, 
  Activity, Phone, Mail, Globe, MapPin, Building,
  Calendar, DollarSign, Star, CheckCircle, AlertCircle,
  Download, Trash2, Plus, Clock, User, FileCheck
} from 'lucide-react'
import { MAURITIUS_CONFIG, type Prospect } from '@/lib/mauritius-config'

interface ProspectDetailModalProps {
  prospect: Prospect | null
  open: boolean
  onClose: () => void
  onUpdate: (updated: Prospect) => void
}

export function ProspectDetailModal({ 
  prospect, 
  open, 
  onClose, 
  onUpdate 
}: ProspectDetailModalProps) {
  const [editing, setEditing] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState('general')
  const [formData, setFormData] = React.useState<Prospect | null>(null)
  const [comments, setComments] = React.useState<any[]>([])
  const [documents, setDocuments] = React.useState<any[]>([])
  const [activities, setActivities] = React.useState<any[]>([])
  const [newComment, setNewComment] = React.useState('')
  const { toast } = useToast()

  React.useEffect(() => {
    if (prospect) {
      setFormData(prospect)
      loadComments()
      loadDocuments()
      loadActivities()
    }
  }, [prospect])

  const loadComments = async () => {
    if (!prospect?.id) return
    try {
      const res = await fetch(`/api/prospects/${prospect.id}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(data)
      }
    } catch (error) {
      console.error('Erreur chargement commentaires:', error)
    }
  }

  const loadDocuments = async () => {
    if (!prospect?.id) return
    try {
      const res = await fetch(`/api/prospects/${prospect.id}/documents`)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error('Erreur chargement documents:', error)
    }
  }

  const loadActivities = async () => {
    if (!prospect?.id) return
    try {
      const res = await fetch(`/api/prospects/${prospect.id}/activities`)
      if (res.ok) {
        const data = await res.json()
        setActivities(data)
      }
    } catch (error) {
      console.error('Erreur chargement activités:', error)
    }
  }

  const handleSave = async () => {
    if (!formData || !prospect?.id) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/prospects/${prospect.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (res.ok) {
        const updated = await res.json()
        onUpdate(updated)
        setEditing(false)
        toast({
          title: 'Fiche mise à jour',
          description: 'Les modifications ont été enregistrées'
        })
        
        // Ajouter une activité
        await addActivity('Fiche modifiée', 'status_changed')
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const addComment = async () => {
    if (!newComment.trim() || !prospect?.id) return
    
    try {
      const res = await fetch(`/api/prospects/${prospect.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: newComment,
          type: 'note'
        })
      })
      
      if (res.ok) {
        setNewComment('')
        loadComments()
        toast({
          title: 'Commentaire ajouté',
          description: 'Le commentaire a été enregistré'
        })
      }
    } catch (error) {
      console.error('Erreur ajout commentaire:', error)
    }
  }

  const uploadDocument = async (file: File) => {
    if (!prospect?.id) return
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'contrat')
    
    try {
      const res = await fetch(`/api/prospects/${prospect.id}/documents`, {
        method: 'POST',
        body: formData
      })
      
      if (res.ok) {
        loadDocuments()
        toast({
          title: 'Document uploadé',
          description: `${file.name} a été ajouté`
        })
        
        await addActivity(`Document ajouté: ${file.name}`, 'document_added')
      }
    } catch (error) {
      toast({
        title: 'Erreur upload',
        description: 'Impossible d\'uploader le document',
        variant: 'destructive'
      })
    }
  }

  const addActivity = async (description: string, type: string) => {
    if (!prospect?.id) return
    
    try {
      await fetch(`/api/prospects/${prospect.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: type,
          activity_description: description
        })
      })
      loadActivities()
    } catch (error) {
      console.error('Erreur ajout activité:', error)
    }
  }

  if (!prospect || !formData) return null

  const qualityScore = formData.quality_score || 0
  const hasGPS = formData.has_valid_coordinates

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Building className="h-6 w-6" />
                {formData.nom}
              </DialogTitle>
              <div className="flex gap-2 mt-2">
                <Badge>{MAURITIUS_CONFIG.secteurs[formData.secteur]?.label}</Badge>
                <Badge variant={formData.statut === 'signe' ? 'default' : 'secondary'}>
                  {MAURITIUS_CONFIG.statuts[formData.statut]?.label}
                </Badge>
                {formData.priority && (
                  <Badge variant={
                    formData.priority === 'Haute' ? 'destructive' : 
                    formData.priority === 'Moyenne' ? 'default' : 'secondary'
                  }>
                    Priorité {formData.priority}
                  </Badge>
                )}
                <Badge variant="outline">
                  Score qualité: {qualityScore}%
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              {!editing ? (
                <Button onClick={() => setEditing(true)} variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              ) : (
                <>
                  <Button onClick={handleSave} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </Button>
                  <Button 
                    onClick={() => {
                      setFormData(prospect)
                      setEditing(false)
                    }} 
                    variant="outline"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="commercial">Commercial</TabsTrigger>
            <TabsTrigger value="documents">
              Documents
              {documents.length > 0 && (
                <Badge className="ml-2" variant="secondary">{documents.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="comments">
              Commentaires
              {comments.length > 0 && (
                <Badge className="ml-2" variant="secondary">{comments.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(90vh-200px)] mt-4">
            {/* Tab Général */}
            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom de l'entreprise</Label>
                  <Input
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    disabled={!editing}
                  />
                </div>
                
                <div>
                  <Label>Secteur d'activité</Label>
                  <select
                    value={formData.secteur}
                    onChange={(e) => setFormData({...formData, secteur: e.target.value as any})}
                    disabled={!editing}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    {Object.entries(MAURITIUS_CONFIG.secteurs).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Type</Label>
                  <Input
                    value={formData.type || ''}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    disabled={!editing}
                  />
                </div>

                <div>
                  <Label>Catégorie</Label>
                  <Input
                    value={formData.category || ''}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    disabled={!editing}
                  />
                </div>

                <div>
                  <Label>Statut</Label>
                  <select
                    value={formData.statut}
                    onChange={(e) => setFormData({...formData, statut: e.target.value as any})}
                    disabled={!editing}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    {Object.entries(MAURITIUS_CONFIG.statuts).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Business Status</Label>
                  <select
                    value={formData.business_status || 'OPERATIONAL'}
                    onChange={(e) => setFormData({...formData, business_status: e.target.value as any})}
                    disabled={!editing}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="OPERATIONAL">Opérationnel</option>
                    <option value="CLOSED_TEMPORARILY">Fermé temporairement</option>
                    <option value="CLOSED_PERMANENTLY">Fermé définitivement</option>
                    <option value="UNKNOWN">Inconnu</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    disabled={!editing}
                    rows={3}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Notes internes</Label>
                  <Textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    disabled={!editing}
                    rows={3}
                  />
                </div>
              </div>

              {/* Métriques Google */}
              {(formData.rating || formData.reviews_count) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Métriques Google</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Note Google</Label>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="font-bold">{formData.rating}/5</span>
                        </div>
                      </div>
                      <div>
                        <Label>Nombre d'avis</Label>
                        <p className="font-bold">{formData.reviews_count}</p>
                      </div>
                      <div>
                        <Label>Photos</Label>
                        <p className="font-bold">{formData.photos_count || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab Contact */}
            <TabsContent value="contact" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Personne de contact</Label>
                  <Input
                    value={formData.contact || ''}
                    onChange={(e) => setFormData({...formData, contact: e.target.value})}
                    disabled={!editing}
                  />
                </div>

                <div>
                  <Label>Email principal</Label>
                  <Input
                    value={formData.email || ''}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    disabled={!editing}
                    type="email"
                  />
                </div>

                <div>
                  <Label>Téléphone principal</Label>
                  <Input
                    value={formData.telephone || ''}
                    onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                    disabled={!editing}
                  />
                </div>

                <div>
                  <Label>Téléphone 2</Label>
                  <Input
                    value={formData.telephone_2 || ''}
                    onChange={(e) => setFormData({...formData, telephone_2: e.target.value})}
                    disabled={!editing}
                  />
                </div>

                <div>
                  <Label>Téléphone 3</Label>
                  <Input
                    value={formData.telephone_3 || ''}
                    onChange={(e) => setFormData({...formData, telephone_3: e.target.value})}
                    disabled={!editing}
                  />
                </div>

                <div>
                  <Label>WhatsApp</Label>
                  <Input
                    value={formData.whatsapp || ''}
                    onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                    disabled={!editing}
                  />
                </div>

                <div>
                  <Label>Site web</Label>
                  <Input
                    value={formData.website || ''}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    disabled={!editing}
                  />
                </div>

                <div>
                  <Label>Facebook</Label>
                  <Input
                    value={formData.facebook || ''}
                    onChange={(e) => setFormData({...formData, facebook: e.target.value})}
                    disabled={!editing}
                  />
                </div>

                <div>
                  <Label>Instagram</Label>
                  <Input
                    value={formData.instagram || ''}
                    onChange={(e) => setFormData({...formData, instagram: e.target.value})}
                    disabled={!editing}
                  />
                </div>

                <div>
                  <Label>LinkedIn</Label>
                  <Input
                    value={formData.linkedin || ''}
                    onChange={(e) => setFormData({...formData, linkedin: e.target.value})}
                    disabled={!editing}
                  />
                </div>
              </div>

              {/* Localisation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Localisation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>District</Label>
                      <select
                        value={formData.district || ''}
                        onChange={(e) => setFormData({...formData, district: e.target.value as any})}
                        disabled={!editing}
                        className="w-full border rounded-md px-3 py-2"
                      >
                        <option value="">Sélectionner</option>
                        {Object.entries(MAURITIUS_CONFIG.districts).map(([key, config]) => (
                          <option key={key} value={key}>{config.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label>Ville</Label>
                      <Input
                        value={formData.ville || ''}
                        onChange={(e) => setFormData({...formData, ville: e.target.value})}
                        disabled={!editing}
                      />
                    </div>

                    <div>
                      <Label>Quartier</Label>
                      <Input
                        value={formData.quartier || ''}
                        onChange={(e) => setFormData({...formData, quartier: e.target.value})}
                        disabled={!editing}
                      />
                    </div>

                    <div>
                      <Label>Code postal</Label>
                      <Input
                        value={formData.code_postal || ''}
                        onChange={(e) => setFormData({...formData, code_postal: e.target.value})}
                        disabled={!editing}
                      />
                    </div>

                    <div className="col-span-2">
                      <Label>Adresse complète</Label>
                      <Textarea
                        value={formData.adresse || ''}
                        onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                        disabled={!editing}
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label>Latitude</Label>
                      <Input
                        value={formData.latitude || ''}
                        onChange={(e) => setFormData({...formData, latitude: parseFloat(e.target.value)})}
                        disabled={!editing}
                        type="number"
                      />
                    </div>

                    <div>
                      <Label>Longitude</Label>
                      <Input
                        value={formData.longitude || ''}
                        onChange={(e) => setFormData({...formData, longitude: parseFloat(e.target.value)})}
                        disabled={!editing}
                        type="number"
                      />
                    </div>

                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        {hasGPS ? (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="text-green-600">Coordonnées GPS valides</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-5 w-5 text-orange-500" />
                            <span className="text-orange-600">Coordonnées GPS manquantes</span>
                          </>
                        )}
                        {formData.google_maps_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(formData.google_maps_url!, '_blank')}
                          >
                            <MapPin className="h-4 w-4 mr-1" />
                            Voir sur Maps
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Commercial */}
            <TabsContent value="commercial" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Score prospect</Label>
                  <select
                    value={formData.score}
                    onChange={(e) => setFormData({...formData, score: parseInt(e.target.value) as any})}
                    disabled={!editing}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value={5}>★★★★★ (5/5)</option>
                    <option value={4}>★★★★☆ (4/5)</option>
                    <option value={3}>★★★☆☆ (3/5)</option>
                    <option value={2}>★★☆☆☆ (2/5)</option>
                    <option value={1}>★☆☆☆☆ (1/5)</option>
                  </select>
                </div>

                <div>
                  <Label>Budget</Label>
                  <Input
                    value={formData.budget || ''}
                    onChange={(e) => setFormData({...formData, budget: e.target.value})}
                    disabled={!editing}
                    placeholder="Rs 100k"
                  />
                </div>

                <div>
                  <Label>Zone commerciale</Label>
                  <Input
                    value={formData.zone_commerciale || ''}
                    onChange={(e) => setFormData({...formData, zone_commerciale: e.target.value})}
                    disabled={!editing}
                  />
                </div>

                <div>
                  <Label>Statut visite</Label>
                  <select
                    value={formData.statut_visite || 'À visiter'}
                    onChange={(e) => setFormData({...formData, statut_visite: e.target.value as any})}
                    disabled={!editing}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="À visiter">À visiter</option>
                    <option value="Visité">Visité</option>
                    <option value="En cours">En cours</option>
                    <option value="Reporté">Reporté</option>
                  </select>
                </div>

                <div>
                  <Label>Dernière visite</Label>
                  <Input
                    type="date"
                    value={formData.date_derniere_visite || ''}
                    onChange={(e) => setFormData({...formData, date_derniere_visite: e.target.value})}
                    disabled={!editing}
                  />
                </div>

                <div>
                  <Label>Prochain RDV</Label>
                  <Input
                    type="date"
                    value={formData.prochain_rdv || ''}
                    onChange={(e) => setFormData({...formData, prochain_rdv: e.target.value})}
                    disabled={!editing}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Notes commerciales</Label>
                  <Textarea
                    value={formData.notes_commercial || ''}
                    onChange={(e) => setFormData({...formData, notes_commercial: e.target.value})}
                    disabled={!editing}
                    rows={4}
                    placeholder="Informations sur les besoins, objections, décideurs..."
                  />
                </div>
              </div>
            </TabsContent>

            {/* Tab Documents */}
            <TabsContent value="documents" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Documents & Contrats</h3>
                <Button
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = '.pdf,.doc,.docx,.jpg,.png'
                    input.onchange = (e: any) => {
                      const file = e.target.files[0]
                      if (file) uploadDocument(file)
                    }
                    input.click()
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Uploader un document
                </Button>
              </div>

              <div className="grid gap-3">
                {documents.map((doc) => (
                  <Card key={doc.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-blue-500" />
                          <div>
                            <p className="font-medium">{doc.document_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {doc.document_type} • {doc.uploaded_by} • {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}
                            </p>
                            {doc.is_signed && (
                              <Badge variant="default" className="mt-1">
                                <FileCheck className="h-3 w-3 mr-1" />
                                Signé le {new Date(doc.signed_date).toLocaleDateString('fr-FR')}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(doc.file_url, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              if (confirm('Supprimer ce document ?')) {
                                await fetch(`/api/prospects/${prospect.id}/documents/${doc.id}`, {
                                  method: 'DELETE'
                                })
                                loadDocuments()
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {documents.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun document pour le moment
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tab Commentaires */}
            <TabsContent value="comments" className="space-y-4">
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <Textarea
                      placeholder="Ajouter un commentaire..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <Button 
                        onClick={addComment}
                        disabled={!newComment.trim()}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  {comments.map((comment) => (
                    <Card key={comment.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{comment.user_name}</span>
                            <Badge variant="outline">{comment.type}</Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(comment.created_at).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-sm">{comment.comment}</p>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {comments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun commentaire pour le moment
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Tab Timeline */}
            <TabsContent value="timeline" className="space-y-4">
              <div className="space-y-3">
                {activities.map((activity, index) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Activity className="h-5 w-5 text-blue-600" />
                      </div>
                      {index < activities.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{activity.activity_description}</span>
                        <Badge variant="outline" className="text-xs">
                          {activity.activity_type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(activity.activity_date).toLocaleString('fr-FR')}
                        <span>• {activity.performed_by}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {activities.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune activité enregistrée
                  </div>
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
