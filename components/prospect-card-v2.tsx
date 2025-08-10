// components/prospect-card-v2.tsx
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  MapPin, Phone, Mail, Globe, Star, 
  CheckCircle, AlertCircle, Building,
  Facebook, Instagram, Linkedin
} from 'lucide-react'

export function ProspectCardV2({ prospect, onStatusChange }) {
  const statutConfig = MAURITIUS_CONFIG.statuts[prospect.statut]
  const secteurConfig = MAURITIUS_CONFIG.secteurs[prospect.secteur]
  
  // Couleur selon le score de qualité
  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50'
    if (score >= 40) return 'text-orange-600 bg-orange-50'
    return 'text-red-600 bg-red-50'
  }
  
  return (
    <Card className="transition-all hover:shadow-xl border-2">
      <CardContent className="p-6">
        {/* Header avec badges */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{secteurConfig?.icon}</span>
              <h3 className="text-lg font-bold">{prospect.nom}</h3>
            </div>
            
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">{secteurConfig?.label}</Badge>
              {prospect.priority && (
                <Badge className={getQualityColor(prospect.quality_score || 0)}>
                  {prospect.priority}
                </Badge>
              )}
              {prospect.business_status === 'OPERATIONAL' && (
                <Badge variant="success">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Opérationnel
                </Badge>
              )}
            </div>
          </div>
          
          <Badge className={`${statutConfig.color}`}>
            {statutConfig.label}
          </Badge>
        </div>
        
        {/* Score de qualité */}
        {prospect.quality_score !== undefined && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span>Qualité des données</span>
              <span className="font-bold">{prospect.quality_score}%</span>
            </div>
            <Progress value={prospect.quality_score} className="h-2" />
          </div>
        )}
        
        {/* Google Rating */}
        {prospect.rating && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-yellow-50 rounded">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="font-bold">{prospect.rating}/5</span>
            <span className="text-sm text-gray-600">
              ({prospect.reviews_count} avis)
            </span>
          </div>
        )}
        
        {/* Localisation avec GPS */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-sm">{prospect.ville}, {prospect.district}</span>
            {prospect.has_valid_coordinates ? (
              <Badge variant="success" className="text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                GPS
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />
                Sans GPS
              </Badge>
            )}
          </div>
          
          {prospect.adresse && (
            <div className="text-xs text-gray-600 ml-6">
              {prospect.adresse}
            </div>
          )}
        </div>
        
        {/* Contacts multiples */}
        <div className="space-y-2 mb-4">
          {prospect.telephone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="text-sm">{prospect.telephone}</span>
              {prospect.telephone_2 && (
                <Badge variant="outline" className="text-xs">+1</Badge>
              )}
            </div>
          )}
          
          {prospect.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-sm truncate">{prospect.email}</span>
              {prospect.emails_additionnels?.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  +{prospect.emails_additionnels.length}
                </Badge>
              )}
            </div>
          )}
          
          {prospect.website && (
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-500" />
              <a 
                href={prospect.website} 
                target="_blank" 
                className="text-sm text-blue-600 hover:underline truncate"
              >
                {prospect.website}
              </a>
            </div>
          )}
        </div>
        
        {/* Réseaux sociaux */}
        {(prospect.facebook || prospect.instagram || prospect.linkedin) && (
          <div className="flex gap-2 mb-4">
            {prospect.facebook && (
              <a href={prospect.facebook} target="_blank">
                <Facebook className="w-5 h-5 text-blue-600" />
              </a>
            )}
            {prospect.instagram && (
              <a href={prospect.instagram} target="_blank">
                <Instagram className="w-5 h-5 text-pink-600" />
              </a>
            )}
            {prospect.linkedin && (
              <a href={prospect.linkedin} target="_blank">
                <Linkedin className="w-5 h-5 text-blue-700" />
              </a>
            )}
          </div>
        )}
        
        {/* Zone commerciale */}
        {prospect.zone_commerciale && (
          <div className="p-2 bg-gray-50 rounded text-xs mb-4">
            <span className="font-semibold">Zone: </span>
            {prospect.zone_commerciale}
          </div>
        )}
        
        {/* Actions */}
        <div className="grid grid-cols-3 gap-2">
          <Button 
            size="sm" 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => window.location.href = `tel:${prospect.telephone}`}
          >
            <Phone className="h-4 w-4" />
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => window.location.href = `mailto:${prospect.email}`}
          >
            <Mail className="h-4 w-4" />
          </Button>
          
          {prospect.google_maps_url && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => window.open(prospect.google_maps_url, '_blank')}
            >
              <MapPin className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
