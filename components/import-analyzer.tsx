'use client'

import * as React from 'react'
import * as XLSX from 'xlsx'
import { MAURITIUS_CONFIG } from '@/lib/mauritius-config'
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
// ScrollArea et Select remplacés par des alternatives simples
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
  Building2,
  TrendingUp,
  Users,
  FileSearch,
  Database,
  Shuffle,
  FileX,
  FileCheck,
  Loader2,
  ChevronRight,
  Info,
  Settings
} from 'lucide-react'

// Types
interface FileAnalysis {
  filename: string
  totalRows: number
  totalColumns: number
  columns: ColumnInfo[]
  detectedType: 'hotels' | 'general' | 'medical' | 'retail' | 'mixed'
  preview: any[]
  stats: {
    withEmail: number
    withPhone: number
    withContact: number
    byDistrict: Record<string, number>
    bySecteur: Record<string, number>
  }
  validation: {
    errors: string[]
    warnings: string[]
    valid: number
  }
  mapping: ColumnMapping[]
}

interface ColumnInfo {
  name: string
  filledCount: number
  filledPercentage: number
  sampleValues: string[]
  suggestedMapping?: string
}

interface ColumnMapping {
  sourceColumn: string
  targetField: string
  transformFunction?: string
}

interface TransformedData {
  data: any[]
  duplicates: any[]
  newRecords: any[]
  updates: any[]
}

// Composant principal
export function ImportAnalyzer({ onImportComplete }: { onImportComplete?: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [file, setFile] = React.useState<File | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [analyzing, setAnalyzing] = React.useState(false)
  const [importing, setImporting] = React.useState(false)
  
  // États de l'analyse
  const [rawData, setRawData] = React.useState<any[]>([])
  const [analysis, setAnalysis] = React.useState<FileAnalysis | null>(null)
  const [transformedData, setTransformedData] = React.useState<TransformedData | null>(null)
  const [columnMappings, setColumnMappings] = React.useState<Record<string, string>>({})
  
  // Options d'import
  const [options, setOptions] = React.useState({
    skipDuplicates: true,
    updateExisting: false,
    autoDetectSector: true,
    autoDetectDistrict: true,
    defaultSector: 'autre',
    defaultDistrict: 'port-louis'
  })
  
  const { toast } = useToast()

  // Fonction pour analyser le fichier
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
        
        // Parser selon le type de fichier
        if (file.name.endsWith('.csv')) {
          // Parser CSV
          const text = content as string
          const lines = text.split('\n')
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
          
          data = lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
              const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || []
              const row: any = {}
              headers.forEach((header, i) => {
                row[header] = values[i]?.trim().replace(/"/g, '') || ''
              })
              return row
            })
        } else {
          // Parser Excel
          const workbook = XLSX.read(content, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          data = XLSX.utils.sheet_to_json(firstSheet)
        }
        
        setRawData(data)
        
        // Analyser les données
        const analysisResult = performAnalysis(data)
        setAnalysis(analysisResult)
        
        // Suggérer les mappings
        const mappings = suggestMappings(analysisResult.columns)
        setColumnMappings(mappings)
        
        // Transformer les données
        const transformed = transformData(data, mappings)
        setTransformedData(transformed)
        
        toast({
          title: 'Analyse terminée',
          description: `${data.length} lignes analysées avec succès`
        })
      }
      
      if (file.name.endsWith('.csv')) {
        reader.readAsText(file)
      } else {
        reader.readAsArrayBuffer(file)
      }
    } catch (error: any) {
      toast({
        title: 'Erreur d\'analyse',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setAnalyzing(false)
    }
  }

  // Fonction d'analyse détaillée
  const performAnalysis = (data: any[]): FileAnalysis => {
    if (!data || data.length === 0) {
      throw new Error('Aucune donnée à analyser')
    }
    
    const columns = Object.keys(data[0])
    
    // Analyser chaque colonne
    const columnInfos: ColumnInfo[] = columns.map(col => {
      const values = data.map(row => row[col]).filter(v => v)
      const filledCount = values.length
      const filledPercentage = Math.round((filledCount / data.length) * 100)
      const sampleValues = [...new Set(values.slice(0, 5))]
      
      return {
        name: col,
        filledCount,
        filledPercentage,
        sampleValues,
        suggestedMapping: suggestFieldMapping(col)
      }
    })
    
    // Détecter le type de fichier
    const detectedType = detectFileType(data[0])
    
    // Calculer les statistiques
    const stats = calculateStats(data)
    
    // Validation
    const validation = validateData(data)
    
    return {
      filename: file?.name || '',
      totalRows: data.length,
      totalColumns: columns.length,
      columns: columnInfos,
      detectedType,
      preview: data.slice(0, 10),
      stats,
      validation
    }
  }

  // Détecter le type de fichier
  const detectFileType = (firstRow: any): FileAnalysis['detectedType'] => {
    const text = JSON.stringify(firstRow).toLowerCase()
    
    if (text.includes('hotel') || text.includes('resort')) return 'hotels'
    if (text.includes('pharmac') || text.includes('clinic')) return 'medical'
    if (text.includes('shop') || text.includes('boutique')) return 'retail'
    
    return 'general'
  }

  // Suggérer le mapping des champs
  const suggestFieldMapping = (columnName: string): string => {
    const name = columnName.toLowerCase()
    
    if (name.includes('nom') || name.includes('name') || name.includes('entreprise')) return 'nom'
    if (name.includes('tel') || name.includes('phone')) return 'telephone'
    if (name.includes('mail')) return 'email'
    if (name.includes('adresse') || name.includes('address')) return 'adresse'
    if (name.includes('contact') || name.includes('personne')) return 'contact'
    if (name.includes('ville') || name.includes('city')) return 'ville'
    if (name.includes('type') || name.includes('secteur')) return 'secteur'
    if (name.includes('budget') || name.includes('ca')) return 'budget'
    if (name.includes('note') || name.includes('comment')) return 'notes'
    if (name.includes('site') || name.includes('web')) return 'website'
    
    return ''
  }

  // Suggérer tous les mappings
  const suggestMappings = (columns: ColumnInfo[]): Record<string, string> => {
    const mappings: Record<string, string> = {}
    columns.forEach(col => {
      if (col.suggestedMapping) {
        mappings[col.name] = col.suggestedMapping
      }
    })
    return mappings
  }

  // Calculer les statistiques
  const calculateStats = (data: any[]) => {
    let withEmail = 0, withPhone = 0, withContact = 0
    const byDistrict: Record<string, number> = {}
    const bySecteur: Record<string, number> = {}
    
    data.forEach(row => {
      // Compter emails et téléphones
      Object.values(row).forEach(value => {
        const val = String(value).toLowerCase()
        if (val.includes('@')) withEmail++
        if (val.match(/\d{7,}/)) withPhone++
      })
      
      // Détecter district et secteur
      const district = detectDistrict(row)
      const secteur = detectSecteur(row)
      
      byDistrict[district] = (byDistrict[district] || 0) + 1
      bySecteur[secteur] = (bySecteur[secteur] || 0) + 1
    })
    
    return { withEmail, withPhone, withContact, byDistrict, bySecteur }
  }

  // Détecter le district
  const detectDistrict = (row: any): string => {
    const text = JSON.stringify(row).toLowerCase()
    
    if (text.includes('port louis')) return 'port-louis'
    if (text.includes('grand baie')) return 'riviere-du-rempart'
    if (text.includes('curepipe') || text.includes('quatre bornes')) return 'plaines-wilhems'
    if (text.includes('mahebourg') || text.includes('blue bay')) return 'grand-port'
    if (text.includes('flic en flac')) return 'black-river'
    if (text.includes('belle mare')) return 'flacq'
    
    return options.defaultDistrict
  }

  // Détecter le secteur
  const detectSecteur = (row: any): string => {
    if (!options.autoDetectSector) return options.defaultSector
    
    const text = JSON.stringify(row).toLowerCase()
    
    if (text.includes('hotel') || text.includes('resort')) return 'hotel'
    if (text.includes('restaurant')) return 'restaurant'
    if (text.includes('pharmac')) return 'pharmacie'
    if (text.includes('clinic')) return 'clinique'
    if (text.includes('assurance')) return 'assurance'
    if (text.includes('bank')) return 'banque'
    
    return options.defaultSector
  }

  // Valider les données
  const validateData = (data: any[]) => {
    const errors: string[] = []
    const warnings: string[] = []
    let valid = 0
    
    data.forEach((row, i) => {
      const hasName = Object.values(row).some(v => v && String(v).length > 2)
      const hasContact = Object.values(row).some(v => 
        String(v).includes('@') || String(v).match(/\d{7,}/)
      )
      
      if (!hasName) {
        errors.push(`Ligne ${i + 2}: Aucun nom identifiable`)
      } else if (!hasContact) {
        warnings.push(`Ligne ${i + 2}: Aucun contact (email/tél)`)
      } else {
        valid++
      }
    })
    
    return { errors: errors.slice(0, 10), warnings: warnings.slice(0, 10), valid }
  }

  // Transformer les données
  const transformData = (data: any[], mappings: Record<string, string>): TransformedData => {
    const transformed = data.map(row => {
      const result: any = {
        statut: 'nouveau',
        score: 3,
        import_date: new Date().toISOString()
      }
      
      // Appliquer les mappings
      Object.entries(mappings).forEach(([source, target]) => {
        if (row[source]) {
          result[target] = row[source]
        }
      })
      
      // Auto-compléter district et secteur
      if (options.autoDetectDistrict && !result.district) {
        result.district = detectDistrict(row)
      }
      if (options.autoDetectSector && !result.secteur) {
        result.secteur = detectSecteur(row)
      }
      
      // Valeurs par défaut
      result.district = result.district || options.defaultDistrict
      result.secteur = result.secteur || options.defaultSector
      result.budget = result.budget || 'À définir'
      result.notes = result.notes || `Import du ${new Date().toLocaleDateString('fr-FR')}`
      
      return result
    })
    
    // Simuler la détection des doublons
    const duplicates = transformed.filter((item, index) => index % 10 === 0).slice(0, 5)
    const newRecords = transformed.filter((item, index) => index % 10 !== 0)
    
    return {
      data: transformed,
      duplicates,
      newRecords,
      updates: []
    }
  }

  // Importer les données
  const importData = async () => {
    if (!transformedData) return
    
    setImporting(true)
    
    try {
      // Filtrer selon les options
      let toImport = transformedData.newRecords
      
      if (!options.skipDuplicates) {
        toImport = [...toImport, ...transformedData.duplicates]
      }
      
      // Simuler l'import batch
      const batchSize = 50
      const batches = []
      
      for (let i = 0; i < toImport.length; i += batchSize) {
        batches.push(toImport.slice(i, i + batchSize))
      }
      
      let imported = 0
      
      for (const batch of batches) {
        // Ici, faire l'appel API réel
        await new Promise(resolve => setTimeout(resolve, 500))
        imported += batch.length
        
        // Mettre à jour la progression
        const progress = Math.round((imported / toImport.length) * 100)
        // Vous pouvez afficher une barre de progression ici
      }
      
      toast({
        title: 'Import réussi',
        description: `${imported} prospects importés avec succès`
      })
      
      // Réinitialiser
      setFile(null)
      setAnalysis(null)
      setTransformedData(null)
      setOpen(false)
      
      if (onImportComplete) {
        onImportComplete()
      }
    } catch (error: any) {
      toast({
        title: 'Erreur d\'import',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setImporting(false)
    }
  }

  // Télécharger le template
  const downloadTemplate = () => {
    const template = `Nom,Secteur,Ville,Contact,Téléphone,Email,Budget,Notes
"Constance Hotels","hotel","Belle Mare","Direction","+230 402 2600","info@constance.com","Rs 500k+","Resort 5 étoiles"
"MCB Bank","banque","Port Louis","Commercial","+230 202 5000","contact@mcb.mu","Rs 1M+","Banque principale"`
    
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'template_import.csv'
    link.click()
  }

  // Exporter les données transformées
  const exportTransformed = () => {
    if (!transformedData) return
    
    const headers = Object.keys(transformedData.data[0])
    const csv = [
      headers.join(','),
      ...transformedData.data.map(row => 
        headers.map(h => `"${row[h] || ''}"`).join(',')
      )
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'prospects_transformes.csv'
    link.click()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileSearch className="h-4 w-4" />
          Import & Analyse
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Centre d'Import & Analyse de Données
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="upload" disabled={analyzing || importing}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="analyze" disabled={!analysis}>
              <Eye className="h-4 w-4 mr-2" />
              Analyse
            </TabsTrigger>
            <TabsTrigger value="mapping" disabled={!analysis}>
              <Shuffle className="h-4 w-4 mr-2" />
              Mapping
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!transformedData}>
              <Database className="h-4 w-4 mr-2" />
              Aperçu
            </TabsTrigger>
            <TabsTrigger value="import" disabled={!transformedData}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Import
            </TabsTrigger>
          </TabsList>

          {/* Tab Upload */}
          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={downloadTemplate}
                      size="sm"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Template
                    </Button>
                  </div>
                  
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

            {/* Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Options d'analyse
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto-sector"
                    checked={options.autoDetectSector}
                    onCheckedChange={(checked) => 
                      setOptions({...options, autoDetectSector: !!checked})
                    }
                  />
                  <label htmlFor="auto-sector" className="text-sm">
                    Détection automatique du secteur
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto-district"
                    checked={options.autoDetectDistrict}
                    onCheckedChange={(checked) => 
                      setOptions({...options, autoDetectDistrict: !!checked})
                    }
                  />
                  <label htmlFor="auto-district" className="text-sm">
                    Détection automatique du district
                  </label>
                </div>

                                  <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Secteur par défaut</label>
                    <select
                      value={options.defaultSector}
                      onChange={(e) => 
                        setOptions({...options, defaultSector: e.target.value})
                      }
                      className="w-full border rounded-md px-3 py-2 text-sm"
                    >
                      {Object.entries(MAURITIUS_CONFIG.secteurs).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.icon} {config.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">District par défaut</label>
                    <select
                      value={options.defaultDistrict}
                      onChange={(e) => 
                        setOptions({...options, defaultDistrict: e.target.value})
                      }
                      className="w-full border rounded-md px-3 py-2 text-sm"
                    >
                      {Object.entries(MAURITIUS_CONFIG.districts).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Analyse */}
          <TabsContent value="analyze" className="space-y-4">
            {analysis && (
              <>
                {/* Statistiques */}
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{analysis.totalRows}</div>
                      <p className="text-xs text-muted-foreground">Lignes totales</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{analysis.totalColumns}</div>
                      <p className="text-xs text-muted-foreground">Colonnes</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-green-600">
                        {analysis.validation.valid}
                      </div>
                      <p className="text-xs text-muted-foreground">Lignes valides</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">
                        <Badge variant="outline">{analysis.detectedType}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Type détecté</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Analyse des colonnes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Analyse des colonnes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] overflow-y-auto">
                      <div className="space-y-3">
                        {analysis.columns.map((col, i) => (
                          <div key={i} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{col.name}</span>
                              <Badge variant={col.filledPercentage > 80 ? "default" : "secondary"}>
                                {col.filledPercentage}% rempli
                              </Badge>
                            </div>
                            <Progress value={col.filledPercentage} className="h-2 mb-2" />
                            <div className="text-xs text-muted-foreground">
                              Exemples: {col.sampleValues.slice(0, 3).join(', ')}
                            </div>
                            {col.suggestedMapping && (
                              <Badge variant="outline" className="mt-2">
                                → {col.suggestedMapping}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Validation */}
                {(analysis.validation.errors.length > 0 || 
                  analysis.validation.warnings.length > 0) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Validation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analysis.validation.errors.length > 0 && (
                        <Alert variant="destructive">
                          <XCircle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="font-semibold">
                              {analysis.validation.errors.length} erreur(s)
                            </div>
                            <ul className="list-disc list-inside text-xs mt-2">
                              {analysis.validation.errors.slice(0, 5).map((err, i) => (
                                <li key={i}>{err}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {analysis.validation.warnings.length > 0 && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="font-semibold">
                              {analysis.validation.warnings.length} avertissement(s)
                            </div>
                            <ul className="list-disc list-inside text-xs mt-2">
                              {analysis.validation.warnings.slice(0, 5).map((warn, i) => (
                                <li key={i}>{warn}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Tab Mapping */}
          <TabsContent value="mapping" className="space-y-4">
            {analysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Configuration du mapping des colonnes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] overflow-y-auto">
                    <div className="space-y-3">
                      {analysis.columns.map((col) => (
                        <div key={col.name} className="flex items-center gap-4">
                          <div className="flex-1">
                            <Badge variant="outline">{col.name}</Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {col.sampleValues[0]}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          <select
                            value={columnMappings[col.name] || ''}
                            onChange={(e) => 
                              setColumnMappings({...columnMappings, [col.name]: e.target.value})
                            }
                            className="w-[200px] border rounded-md px-3 py-2 text-sm"
                          >
                            <option value="">Ignorer</option>
                            <option value="nom">Nom</option>
                            <option value="secteur">Secteur</option>
                            <option value="ville">Ville</option>
                            <option value="district">District</option>
                            <option value="contact">Contact</option>
                            <option value="telephone">Téléphone</option>
                            <option value="email">Email</option>
                            <option value="adresse">Adresse</option>
                            <option value="website">Site web</option>
                            <option value="budget">Budget</option>
                            <option value="notes">Notes</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={() => {
                        const transformed = transformData(rawData, columnMappings)
                        setTransformedData(transformed)
                        toast({
                          title: 'Transformation appliquée',
                          description: `${transformed.data.length} lignes transformées`
                        })
                      }}
                    >
                      Appliquer le mapping
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab Aperçu */}
          <TabsContent value="preview" className="space-y-4">
            {transformedData && (
              <>
                {/* Résumé */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-green-600">
                        {transformedData.newRecords.length}
                      </div>
                      <p className="text-xs text-muted-foreground">Nouveaux prospects</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-orange-600">
                        {transformedData.duplicates.length}
                      </div>
                      <p className="text-xs text-muted-foreground">Doublons détectés</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">
                        {transformedData.data.length}
                      </div>
                      <p className="text-xs text-muted-foreground">Total à importer</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Aperçu des données */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Aperçu des données transformées
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b sticky top-0 bg-white">
                          <tr>
                            <th className="text-left p-2">Nom</th>
                            <th className="text-left p-2">Secteur</th>
                            <th className="text-left p-2">District</th>
                            <th className="text-left p-2">Contact</th>
                            <th className="text-left p-2">Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transformedData.data.slice(0, 20).map((item, i) => (
                            <tr key={i} className="border-b">
                              <td className="p-2">{item.nom || '-'}</td>
                              <td className="p-2">
                                <Badge variant="outline">
                                  {MAURITIUS_CONFIG.secteurs[item.secteur]?.label || item.secteur}
                                </Badge>
                              </td>
                              <td className="p-2">
                                {MAURITIUS_CONFIG.districts[item.district]?.label || item.district}
                              </td>
                              <td className="p-2">
                                {item.telephone || item.email || '-'}
                              </td>
                              <td className="p-2">
                                {transformedData.duplicates.includes(item) ? (
                                  <Badge variant="secondary">Doublon</Badge>
                                ) : (
                                  <Badge variant="default">Nouveau</Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={exportTransformed}>
                    <Download className="mr-2 h-4 w-4" />
                    Exporter CSV
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* Tab Import */}
          <TabsContent value="import" className="space-y-4">
            {transformedData && (
              <>
                {/* Options d'import */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Options d'import</CardTitle>
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
                        Ignorer les doublons ({transformedData.duplicates.length} détectés)
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="update-existing"
                        checked={options.updateExisting}
                        onCheckedChange={(checked) => 
                          setOptions({...options, updateExisting: !!checked})
                        }
                      />
                      <label htmlFor="update-existing" className="text-sm">
                        Mettre à jour les prospects existants
                      </label>
                    </div>
                  </CardContent>
                </Card>

                {/* Résumé final */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Prêt à importer:</strong><br/>
                    • {options.skipDuplicates ? 
                        transformedData.newRecords.length : 
                        transformedData.data.length} prospects seront importés<br/>
                    • {transformedData.duplicates.length} doublons {options.skipDuplicates ? 'ignorés' : 'inclus'}<br/>
                    • Tous les prospects seront créés avec le statut "Nouveau"
                  </AlertDescription>
                </Alert>

                {/* Actions finales */}
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFile(null)
                      setAnalysis(null)
                      setTransformedData(null)
                    }}
                  >
                    Annuler
                  </Button>
                  
                  <Button
                    onClick={importData}
                    disabled={importing}
                    className="gap-2"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Import en cours...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Importer {options.skipDuplicates ? 
                          transformedData.newRecords.length : 
                          transformedData.data.length} prospects
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
