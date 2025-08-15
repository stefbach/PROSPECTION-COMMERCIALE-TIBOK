'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Hotel, Star, Save, X } from 'lucide-react'

interface HotelCategoryEditorProps {
  open: boolean
  onClose: () => void
  hotel: {
    id: number
    nom: string
    categorie_hotel?: string
    nombre_chambres?: number
  }
  onUpdate: (updates: any) => Promise<void>
}

const HOTEL_CATEGORIES = [
  { value: '1*', label: '1 étoile', color: 'gray' },
  { value: '2*', label: '2 étoiles', color: 'gray' },
  { value: '3*', label: '3 étoiles', color: 'yellow' },
  { value: '4*', label: '4 étoiles', color: 'orange' },
  { value: '5*', label: '5 étoiles', color: 'red' },
  { value: 'boutique', label: 'Boutique Hôtel', color: 'purple' },
  { value: 'resort', label: 'Resort', color: 'blue' },
  { value: 'business', label: 'Business', color: 'indigo' },
  { value: 'eco', label: 'Eco-lodge', color: 'green' }
]

export default function HotelCategoryEditor({ 
  open, 
  onClose, 
  hotel, 
  onUpdate 
}: HotelCategoryEditorProps) {
  const [category, setCategory] = React.useState(hotel.categorie_hotel || '')
  const [rooms, setRooms] = React.useState(hotel.nombre_chambres || 0)
  const [saving, setSaving] = React.useState(false)
  const { toast } = useToast()

  React.useEffect(() => {
    setCategory(hotel.categorie_hotel || '')
    setRooms(hotel.nombre_chambres || 0)
  }, [hotel])

  async function handleSave() {
    setSaving(true)
    try {
      await onUpdate({
        categorie_hotel: category,
        nombre_chambres: rooms
      })
      
      toast({
        title: '✅ Hôtel mis à jour',
        description: `${hotel.nom} - ${category} ${rooms ? `(${rooms} chambres)` : ''}`
      })
      
      onClose()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour l\'hôtel',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hotel className="h-5 w-5" />
            Catégorie de l'hôtel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-lg font-semibold">{hotel.nom}</Label>
          </div>

          <div>
            <Label className="mb-3 block">Catégorie</Label>
            <div className="grid grid-cols-3 gap-2">
              {HOTEL_CATEGORIES.map(cat => (
                <Button
                  key={cat.value}
                  variant={category === cat.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategory(cat.value)}
                  className={category === cat.value ? '' : 'hover:bg-gray-50'}
                >
                  {cat.value.includes('*') && (
                    <span className="mr-1">
                      {cat.value.split('*')[0]}
                      <Star className="inline h-3 w-3 fill-current" />
                    </span>
                  )}
                  {!cat.value.includes('*') && cat.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label>Nombre de chambres</Label>
            <Input
              type="number"
              value={rooms}
              onChange={(e) => setRooms(parseInt(e.target.value) || 0)}
              placeholder="Ex: 50"
              min="0"
              className="mt-2"
            />
          </div>

          {category && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Aperçu :</strong> {hotel.nom}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{category}</Badge>
                {rooms > 0 && (
                  <Badge variant="outline">{rooms} chambres</Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            <X className="h-4 w-4 mr-1" />
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !category}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="h-4 w-4 mr-1" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
