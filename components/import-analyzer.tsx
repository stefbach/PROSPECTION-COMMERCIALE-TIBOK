'use client'

import * as React from 'react'
import * as XLSX from 'xlsx'
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
  Settings,
  FileSearch,
  FileCheck,
  Database,
  Shuffle
} from 'lucide-react'
import { 
  MAURITIUS_CONFIG, 
  CITY_TO_DISTRICT_MAP, 
  SECTOR_KEYWORDS,
  type Prospect 
} from '@/lib/mauritius-config'

// Types
interface TransformedData {
  data: any[]
  duplicates: any[]
  newRecords: any[]
  updates: any[]
}

// CHANGEZ ICI : ImportAnalyzer au lieu de ImportAnalyzerV2
export function ImportAnalyzer({ onImportComplete }: { onImportComplete?: () => void }) {
  // États
  const [open, setOpen] = React.useState(false)
  const [file, setFile] = React.useState<File | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [analyzing, setAnalyzing] = React.useState(false)
  const [importing, setImporting] = React.useState(false)
  
  const [rawData, setRawData] = React.useState<any[]>([])
  const [analysis, setAnalysis] = React.useState<any>(null)
  const [transformedData, setTransformedData] = React.useState<TransformedData | null>(null)
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

  // Analyser le fichier
  const analyzeFile = async () => {
    if (!file) return
    
    setAnalyzing(true)
    setAnalysis(null)
    setTransformedData(null)
    
    try {
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        const content = e.target?.result
        let data: any[] = []
        
        if (file.name.endsWith('.csv')) {
          const text = content as string
          const lines = text.split('\n')
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
          
          data = lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
              const values = line.split(',')
              const row: any = {}
              headers.forEach((header, i) => {
                row[header] = values[i]?.trim().replace(/"/g, '') || ''
              })
              return row
            })
        } else {
          const workbook = XLSX.read(content, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          data = XLSX.utils.sheet_to_json(firstSheet)
        }
        
        setRawData(data)
        
        // Analyse simple
        setAnalysis({
          filename: file.name,
          totalRows: data.length,
          totalColumns: Object.keys(data[0] || {}).length,
          columns: [],
          detectedType: 'general',
          preview: data.slice(0, 5),
          stats: {},
          validation: { errors: [], warnings: [], valid: data.length },
          mapping: []
        })
        
        // Transformation
        const transformed = cleanAndTransformData(data)
        setTransformedData(transformed)
        
        toast({
          title: 'Analyse terminée',
          description: `${data.length} lignes analysées`
        })
      }
      
      if (file.name.endsWith('.csv')) {
        reader.readAsText(file)
      } else {
        reader.readAsArrayBuffer(file)
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'analyse',
        variant: 'destructive'
      })
    } finally {
      setAnalyzing(false)
    }
  }

  // Fonction de détection améliorée du district
  const determineDistrict = (row: any): string => {
    if (row.city && CITY_TO_DISTRICT_MAP[row.city]) {
      return CITY_TO_DISTRICT_MAP[row.city]
    }
    
    if (row.borough && row.borough !== 'None' && CITY_TO_DISTRICT_MAP[row.borough]) {
      return CITY_TO_DISTRICT_MAP[row.borough]
    }
    
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
    
    if (row.nom || row.name) score += 15
    if (row.latitude && row.longitude) score += 25
    if (row.adresse || row.full_address) score += 15
    if (row.telephone || row.phone) score += 10
    if (row.email || row.email_1) score += 15
    if (row.website || row.site) score += 10
    if (row.rating) score += 5
    if (row.business_status === 'OPERATIONAL') score += 5
    
    return Math.min(score, 100)
  }

  // Fonction de nettoyage améliorée
  const cleanAndTransformData = (data: any[]): TransformedData => {
    const transformed = data.map((row, index) => {
      const isOutscraper = !!(row.place_id || row.google_id || row.cid)
      
      const emails: string[] = []
      if (row.email) emails.push(row.email)
      if (row.email_1) emails.push(row.email_1)
      if (row.email_2) emails.push(row.email_2)
      if (row.email_3) emails.push(row.email_3)
      
      const phones: string[] = []
      if (row.phone) phones.push(row.phone)
      if (row.telephone) phones.push(row.telephone)
      if (row.phone_1) phones.push(row.phone_1)
      if (row.phone_2) phones.push(row.phone_2)
      
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
      
      return {
        nom: row.name || row.nom || `Sans nom #${index + 1}`,
        secteur: sector,
        type: row.type || row.category || 'Établissement',
        category: row.category || row.type,
        statut: 'nouveau',
        business_status: row.business_status || 'UNKNOWN',
        district: district,
        ville: row.city || row.ville || '',
        quartier: row.borough !== 'None' ? row.borough : '',
        adresse: cleanAddress(),
        adresse_originale: row.full_address || '',
        latitude: row.latitude ? parseFloat(row.latitude) : undefined,
        longitude: row.longitude ? parseFloat(row.longitude) : undefined,
        has_valid_coordinates: !!(row.latitude && row.longitude),
        contact: row.email_1_full_name || row.contact || 'Direction',
        telephone: phones[0] || '',
        email: emails[0] || '',
        website: row.site || row.website || '',
        google_place_id: row.place_id || '',
        rating: row.rating ? parseFloat(row.rating) : undefined,
        reviews_count: row.reviews ? parseInt(row.reviews) : 0,
        score: 3,
        quality_score: qualityScore,
        priority: qualityScore >= 80 ? 'Haute' : qualityScore >= 60 ? 'Moyenne' : 'Basse',
        budget: row.budget || 'À définir',
        notes: row.notes || `Import ${new Date().toLocaleDateString('fr-FR')}`,
        data_source: isOutscraper ? 'outscraper' : 'excel'
      }
    })
    
    const withGPS = transformed.filter(p => p.has_valid_coordinates).length
    setGpsStats({
      withCoordinates: withGPS,
      withoutCoordinates: transformed.length - withGPS,
      percentage: Math.round((withGPS / transformed.length) * 100)
    })
    
    return {
      data: transformed,
      duplicates: [],
      newRecords: transformed,
      updates: []
    }
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

  // Export KML
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
    kml += '</Document>\n'
    kml += '</kml>'
    
    const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `prospects_maurice_${new Date().toISOString().split('T')[0]}.kml`
    link.click()
  }

  // Import des données
  const importData = async () => {
  if (!transformedData) return
  
  setImporting(true)
  
  try {
    const toImport = options.skipDuplicates 
      ? transformedData.newRecords 
      : transformedData.data
    
    let imported = 0
    let failed = 0
    
    // Importer ligne par ligne
    for (const prospect of toImport) {
      try {
        const response = await fetch('/api/prospects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prospect)
        })
        
        if (response.ok) {
          imported++
        } else {
          failed++
        }
      } catch (error) {
        failed++
      }
    }
    
    toast({
      title: 'Import terminé',
      description: `✅ ${imported} importés, ❌ ${failed} échoués`
    })
    
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
      
      if (!response.ok) throw new Error('Erreur import')
      
      const result = await response.json()
      
      toast({
        title: 'Import réussi',
        description: `${result.imported || toImport.length} importés`
      })
      
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


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileSearch className="h-4 w-4" />
          Import & Analyse
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Centre d'Import & Analyse de Données
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="analyze" disabled={!analysis}>
              <Eye className="h-4 w-4 mr-2" />
              Analyse
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!transformedData}>
              <Database className="h-4 w-4 mr-2" />
              Aperçu
            </TabsTrigger>
            <TabsTrigger value="cartographie" disabled={!transformedData}>
              <Map className="h-4 w-4 mr-2" />
              Carto
            </TabsTrigger>
          </TabsList>
          
          {/* Tab Upload */}
          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  
                  {file && (
                    <Alert>
                      <FileCheck className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <Button
                    onClick={analyzeFile}
                    disabled={!file || analyzing}
                    className="w-full"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyse en cours...
                      </>
                    ) : (
                      <>
                        <FileSearch className="mr-2 h-4 w-4" />
                        Analyser le fichier
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Analyse */}
          <TabsContent value="analyze" className="space-y-4">
            {analysis && (
              <Card>
                <CardHeader>
                  <CardTitle>Résultats de l'analyse</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{analysis.totalRows}</div>
                      <p className="text-xs text-muted-foreground">Lignes</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{analysis.totalColumns}</div>
                      <p className="text-xs text-muted-foreground">Colonnes</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{analysis.validation.valid}</div>
                      <p className="text-xs text-muted-foreground">Valides</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab Preview */}
          <TabsContent value="preview" className="space-y-4">
            {transformedData && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Aperçu des données</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      {transformedData.newRecords.length} prospects prêts à importer
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Options d'import</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="skip-duplicates"
                        checked={options.skipDuplicates}
                        onCheckedChange={(checked) => 
                          setOptions({...options, skipDuplicates: !!checked})
                        }
                      />
                      <label htmlFor="skip-duplicates" className="text-sm">
                        Ignorer les doublons
                      </label>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  onClick={importData}
                  disabled={importing}
                  className="w-full"
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Import en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Importer {transformedData.newRecords.length} prospects
                    </>
                  )}
                </Button>
              </>
            )}
          </TabsContent>
          
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
                
                <Progress value={gpsStats.percentage} className="h-3" />
                
                <Button onClick={exportKML} variant="outline" className="w-full">
                  <Map className="mr-2 h-4 w-4" />
                  Export KML (Google Maps/Earth)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
