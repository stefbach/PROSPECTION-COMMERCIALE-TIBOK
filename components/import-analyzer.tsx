'use client'

import * as React from 'react'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { 
  FileSpreadsheet, 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Download,
  Eye,
  MapPin,
  Map,
  Loader2,
  ChevronRight,
  Info,
  Settings
} from 'lucide-react'
import { 
  MAURITIUS_CONFIG, 
  CITY_TO_DISTRICT_MAP, 
  SECTOR_KEYWORDS,
  type Prospect 
} from '@/lib/mauritius-config'
// ... autres imports

export function ImportAnalyzerV2({ onImportComplete }: { onImportComplete?: () => void }) {
  // ... états existants ...
  const [open, setOpen] = React.useState(false)
  const [file, setFile] = React.useState<File | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [analyzing, setAnalyzing] = React.useState(false)
  const [importing, setImporting] = React.useState(false)
  
  const [rawData, setRawData] = React.useState<any[]>([])
  const [analysis, setAnalysis] = React.useState<any>(null)
  const [transformedData, setTransformedData] = React.useState<any>(null)
  const [columnMappings, setColumnMappings] = React.useState<Record<string, string>>({})
  
  const [options, setOptions] = React.useState({
    skipDuplicates: true,
    updateExisting: false,
    autoDetectSector: true,
    autoDetectDistrict: true,
    defaultSector: 'autre',
    defaultDistrict: 'port-louis'
  })
  
  const { toast } = useToast()
  const [importMode, setImportMode] = React.useState<'standard' | 'outscraper'>('standard')
  const [gpsStats, setGpsStats] = React.useState({
    withCoordinates: 0,
    withoutCoordinates: 0,
    percentage: 0
  })

  // Fonction de détection améliorée du district
  const determineDistrict = (row: any): string => {
    // Essayer par la ville
    if (row.city && CITY_TO_DISTRICT_MAP[row.city]) {
      return CITY_TO_DISTRICT_MAP[row.city]
    }
    
    // Essayer par le quartier
    if (row.borough && row.borough !== 'None' && CITY_TO_DISTRICT_MAP[row.borough]) {
      return CITY_TO_DISTRICT_MAP[row.borough]
    }
    
    // Analyser l'adresse complète
    const address = (row.full_address || row.adresse || '').toLowerCase()
    for (const [cityName, district] of Object.entries(CITY_TO_DISTRICT_MAP)) {
      if (address.includes(cityName.toLowerCase())) {
        return district
      }
    }
    
    return options.defaultDistrict
  }

  // Identification avancée du secteur
  const identifySector = (row: any): string => {
    const searchText = [
      row.name || row.nom || '',
      row.type || '',
      row.category || '',
      row.subtypes || '',
      row.description || ''
    ].join(' ').toLowerCase()

    for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
      for (const keyword of keywords) {
        if (searchText.includes(keyword.toLowerCase())) {
          return sector
        }
      }
    }
    return 'autre'
  }

  // Calculer le score de qualité
  const calculateQualityScore = (row: any): number => {
    let score = 0
    
    // Nom (15 points)
    if (row.nom || row.name) score += 15
    
    // Coordonnées GPS (25 points)
    if (row.latitude && row.longitude) score += 25
    
    // Adresse (15 points)
    if (row.adresse || row.full_address) score += 15
    
    // Téléphone (10 points)
    if (row.telephone || row.phone) score += 10
    
    // Email (15 points)
    if (row.email || row.email_1) score += 15
    
    // Site web (10 points)
    if (row.website || row.site) score += 10
    
    // Rating Google (5 points)
    if (row.rating) score += 5
    
    // Statut opérationnel (5 points)
    if (row.business_status === 'OPERATIONAL') score += 5
    
    return Math.min(score, 100)
  }

  // Fonction de nettoyage améliorée
  const cleanAndTransformData = (data: any[]): TransformedData => {
    const transformed = data.map((row, index) => {
      // Détection du mode (Outscraper ou standard)
      const isOutscraper = !!(row.place_id || row.google_id || row.cid)
      
      // Extraction des emails multiples
      const emails: string[] = []
      if (row.email) emails.push(row.email)
      if (row.email_1) emails.push(row.email_1)
      if (row.email_2) emails.push(row.email_2)
      if (row.email_3) emails.push(row.email_3)
      
      // Extraction des téléphones multiples
      const phones: string[] = []
      if (row.phone) phones.push(row.phone)
      if (row.telephone) phones.push(row.telephone)
      if (row.phone_1) phones.push(row.phone_1)
      if (row.phone_2) phones.push(row.phone_2)
      if (row.phone_3) phones.push(row.phone_3)
      
      // Nettoyer l'adresse
      const cleanAddress = () => {
        const parts = []
        if (row.street && row.street !== 'None') {
          parts.push(row.street.replace(/^MU,?\s*/i, '').trim())
        }
        if (row.city && row.city !== 'None') parts.push(row.city)
        if (row.postal_code && row.postal_code !== 'None') parts.push(row.postal_code)
        if (row.country) parts.push(row.country)
        return parts.join(', ') || row.full_address || row.adresse || ''
      }
      
      const district = determineDistrict(row)
      const sector = identifySector(row)
      const qualityScore = calculateQualityScore(row)
      
      const result: Partial<Prospect> = {
        nom: row.name || row.nom || `Sans nom #${index + 1}`,
        secteur: sector as any,
        type: row.type || row.category || 'Établissement',
        category: row.category || row.type,
        statut: 'nouveau',
        business_status: row.business_status || 'UNKNOWN',
        
        // Localisation
        district: district as any,
        ville: row.city || row.ville || '',
        quartier: row.borough !== 'None' ? row.borough : '',
        adresse: cleanAddress(),
        adresse_originale: row.full_address || '',
        rue: row.street?.replace(/^MU,?\s*/i, '').trim() || '',
        code_postal: row.postal_code || row.code_postal || '',
        pays: row.country || 'Mauritius',
        code_pays: row.country_code || 'MU',
        
        // GPS
        latitude: row.latitude ? parseFloat(row.latitude) : undefined,
        longitude: row.longitude ? parseFloat(row.longitude) : undefined,
        has_valid_coordinates: !!(row.latitude && row.longitude),
        
        // Contacts
        contact: row.email_1_full_name || row.contact || 'Direction',
        telephone: phones[0] || '',
        telephone_2: phones[1] || '',
        telephone_3: phones[2] || '',
        email: emails[0] || '',
        emails_additionnels: emails.slice(1),
        
        // Web & Social
        website: row.site || row.website || '',
        facebook: row.facebook || '',
        instagram: row.instagram || '',
        linkedin: row.linkedin || '',
        twitter: row.twitter || '',
        whatsapp: row.whatsapp || '',
        
        // Google Data
        google_place_id: row.place_id || '',
        google_id: row.google_id || '',
        google_cid: row.cid || '',
        google_maps_url: row.location_link || '',
        rating: row.rating ? parseFloat(row.rating) : undefined,
        reviews_count: row.reviews ? parseInt(row.reviews) : 0,
        star_rating: row.range || '',
        photos_count: row.photos_count ? parseInt(row.photos_count) : 0,
        
        // Scoring
        score: 3,
        quality_score: qualityScore,
        priority: qualityScore >= 80 ? 'Haute' : qualityScore >= 60 ? 'Moyenne' : 'Basse',
        
        // Métadonnées
        budget: row.budget || 'À définir',
        notes: row.notes || `Import ${new Date().toLocaleDateString('fr-FR')}`,
        description: row.description || '',
        
        // Import info
        data_source: isOutscraper ? 'outscraper' : 'excel',
        import_date: new Date().toISOString(),
        is_verified: false,
        
        // Commercial
        zone_commerciale: `${district} - ${row.city || 'Zone'}`,
        statut_visite: 'À visiter'
      }
      
      return result
    })
    
    // Détection intelligente des doublons
    const duplicates: any[] = []
    const newRecords: any[] = []
    const seen = new Map<string, any>()
    
    transformed.forEach(item => {
      // Clé unique basée sur plusieurs critères
      const keys = [
        item.google_place_id, // Priorité 1: Google Place ID
        item.google_cid, // Priorité 2: Google CID
        `${item.nom?.toLowerCase()}_${item.ville?.toLowerCase()}`, // Priorité 3: Nom + Ville
        item.email, // Priorité 4: Email
        item.telephone // Priorité 5: Téléphone
      ].filter(Boolean)
      
      let isDuplicate = false
      for (const key of keys) {
        if (seen.has(key)) {
          duplicates.push(item)
          isDuplicate = true
          break
        }
      }
      
      if (!isDuplicate) {
        keys.forEach(key => seen.set(key, item))
        newRecords.push(item)
      }
    })
    
    // Calculer les stats GPS
    const withGPS = transformed.filter(p => p.has_valid_coordinates).length
    setGpsStats({
      withCoordinates: withGPS,
      withoutCoordinates: transformed.length - withGPS,
      percentage: Math.round((withGPS / transformed.length) * 100)
    })
    
    return {
      data: transformed,
      duplicates,
      newRecords,
      updates: []
    }
  }

  // Export KML pour Google Maps/Earth
  const exportKML = () => {
    if (!transformedData) return
    
    const dataWithGPS = transformedData.data.filter(p => p.has_valid_coordinates)
    
    if (dataWithGPS.length === 0) {
      toast({
        title: 'Aucune coordonnée GPS',
        description: 'Impossible de générer le KML sans coordonnées GPS',
        variant: 'destructive'
      })
      return
    }
    
    let kml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    kml += '<kml xmlns="http://www.opengis.net/kml/2.2">\n'
    kml += '<Document>\n'
    kml += `  <name>Prospects Maurice - ${new Date().toLocaleDateString('fr-FR')}</name>\n`
    
    // Grouper par district
    const byDistrict = dataWithGPS.reduce((acc, p) => {
      if (!acc[p.district]) acc[p.district] = []
      acc[p.district].push(p)
      return acc
    }, {} as Record<string, any[]>)
    
    Object.entries(byDistrict).forEach(([district, prospects]) => {
      kml += '  <Folder>\n'
      kml += `    <name>${district} (${prospects.length})</name>\n`
      
      prospects.forEach(p => {
        kml += '    <Placemark>\n'
        kml += `      <name>${escapeXML(p.nom)}</name>\n`
        kml += '      <description><![CDATA[\n'
        kml += `        <b>Secteur:</b> ${p.secteur}<br/>\n`
        kml += `        <b>Adresse:</b> ${p.adresse}<br/>\n`
        if (p.telephone) kml += `        <b>Tél:</b> ${p.telephone}<br/>\n`
        if (p.email) kml += `        <b>Email:</b> ${p.email}<br/>\n`
        if (p.rating) kml += `        <b>Note:</b> ${p.rating}/5 (${p.reviews_count} avis)<br/>\n`
        kml += `        <b>Qualité:</b> ${p.quality_score}%<br/>\n`
        kml += '      ]]></description>\n'
        kml += '      <Point>\n'
        kml += `        <coordinates>${p.longitude},${p.latitude},0</coordinates>\n`
        kml += '      </Point>\n'
        kml += '    </Placemark>\n'
      })
      
      kml += '  </Folder>\n'
    })
    
    kml += '</Document>\n'
    kml += '</kml>'
    
    const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `prospects_maurice_${new Date().toISOString().split('T')[0]}.kml`
    link.click()
  }

  // Fonction d'export tournée commerciale
  const exportTournee = () => {
    if (!transformedData) return
    
    // Trier par district puis par ville pour optimiser les déplacements
    const sorted = [...transformedData.data].sort((a, b) => {
      if (a.district !== b.district) {
        return a.district.localeCompare(b.district)
      }
      return (a.ville || '').localeCompare(b.ville || '')
    })
    
    const exportData = sorted.map((p, index) => ({
      'Ordre_Visite': index + 1,
      'Zone': `${p.district} - ${p.ville}`,
      'Nom': p.nom,
      'Secteur': p.secteur,
      'Adresse': p.adresse,
      'GPS': p.has_valid_coordinates ? `${p.latitude},${p.longitude}` : '',
      'Téléphone': p.telephone,
      'Email': p.email,
      'Priorité': p.priority,
      'Score_Qualité': p.quality_score,
      'Statut_Visite': p.statut_visite,
      'Notes': ''
    }))
    
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Tournée')
    XLSX.writeFile(wb, `tournee_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // Helper pour échapper XML
  const escapeXML = (str: string): string => {
    if (!str) return ''
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  // Dans la fonction importData, utiliser la nouvelle structure
  const importData = async () => {
    if (!transformedData) return
    
    setImporting(true)
    
    try {
      const toImport = options.skipDuplicates 
        ? transformedData.newRecords 
        : transformedData.data
      
      const response = await fetch('/api/import/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: toImport,
          options: {
            ...options,
            importMode,
            enrichWithGoogleData: true
          }
        })
      })
      
      if (!response.ok) throw new Error('Erreur import')
      
      const result = await response.json()
      
      toast({
        title: 'Import réussi',
        description: `✅ ${result.imported} importés, ${result.skipped} ignorés, ${gpsStats.percentage}% avec GPS`
      })
      
      // Réinitialiser et recharger
      setFile(null)
      setAnalysis(null)
      setTransformedData(null)
      setOpen(false)
      
      if (onImportComplete) {
        onImportComplete()
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* ... Trigger ... */}
      
      <DialogContent className="max-w-7xl max-h-[90vh]">
        {/* ... Header ... */}
        
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            {/* ... Tabs existants ... */}
            <TabsTrigger value="cartographie" disabled={!transformedData}>
              <Map className="h-4 w-4 mr-2" />
              Carto
            </TabsTrigger>
          </TabsList>
          
          {/* ... Autres tabs ... */}
          
          {/* Tab Cartographie */}
          <TabsContent value="cartographie" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Données GPS & Cartographie
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats GPS */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {gpsStats.withCoordinates}
                    </div>
                    <p className="text-xs text-gray-500">Avec GPS</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {gpsStats.withoutCoordinates}
                    </div>
                    <p className="text-xs text-gray-500">Sans GPS</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {gpsStats.percentage}%
                    </div>
                    <p className="text-xs text-gray-500">Couverture</p>
                  </div>
                </div>
                
                {/* Progress bar GPS */}
                <Progress value={gpsStats.percentage} className="h-3" />
                
                {/* Actions export */}
                <div className="flex gap-2">
                  <Button onClick={exportKML} variant="outline">
                    <Map className="mr-2 h-4 w-4" />
                    Export KML (Google Maps/Earth)
                  </Button>
                  
                  <Button onClick={exportTournee} variant="outline">
                    <MapPin className="mr-2 h-4 w-4" />
                    Export Tournée Commerciale
                  </Button>
                </div>
                
                {gpsStats.withoutCoordinates > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {gpsStats.withoutCoordinates} prospects sans coordonnées GPS.
                      Ils seront géocodés automatiquement après l'import.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
