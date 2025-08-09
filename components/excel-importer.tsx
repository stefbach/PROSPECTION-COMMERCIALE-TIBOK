// components/excel-importer.tsx
'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
  Users,
  Building2,
  BarChart3
} from 'lucide-react'

type ImportStats = {
  totalRows: number
  validProspects: number
  willInsert: number
  duplicates: number
  errors: number
  warnings: number
}

type PreviewData = {
  stats: ImportStats
  preview: any[]
  duplicates: string[]
  warnings: string[]
  errors: string[]
  regionDistribution: Record<string, number>
}

export function ExcelImporter({ onImportComplete }: { onImportComplete?: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [file, setFile] = React.useState<File | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [analyzing, setAnalyzing] = React.useState(false)
  const [preview, setPreview] = React.useState<PreviewData | null>(null)
  const [skipDuplicates, setSkipDuplicates] = React.useState(true)
  const [showDetails, setShowDetails] = React.useState(false)
  const { toast } = useToast()

  // Template Excel à télécharger
  const downloadTemplate = () => {
    const template = `Nom commercial,Adresse,Téléphone,Email,Code postal,Personne de contact
Hotel Example,123 Rue Example Port Louis,2301234567,contact@hotel.mu,11001,Jean Dupont
Belle Vue Resort,Coastal Road Grand Baie,2302345678,info@bellevue.mu,30525,Marie Martin`
    
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'template_import_hotels.csv'
    link.click()
  }

  // Analyser le fichier (dry run)
  const analyzeFile = async () => {
    if (!file) return
    
    setAnalyzing(true)
    setPreview(null)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch('/api/import/excel?dryRun=true', {
        method: 'POST',
        body: formData
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'analyse')
      }
      
      setPreview(data)
      
      if (data.errors && data.errors.length > 0) {
        toast({
          title: 'Erreurs détectées',
          description: `${data.errors.length} erreur(s) trouvée(s) dans le fichier`,
          variant: 'destructive'
        })
      } else {
        toast({
          title: 'Analyse terminée',
          description: `${data.stats.validProspects} prospects valides trouvés`
        })
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

  // Importer réellement les données
  const importFile = async () => {
    if (!file || !preview) return
    
    setLoading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch(`/api/import/excel?skipDuplicates=${skipDuplicates}`, {
        method: 'POST',
        body: formData
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'import')
      }
      
      toast({
        title: 'Import réussi',
        description: data.message
      })
      
      setFile(null)
      setPreview(null)
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
      setLoading(false)
    }
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setShowDetails(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Importer Excel
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importer des Hôtels depuis Excel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Zone d'upload */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => {
                      setFile(e.target.files?.[0] || null)
                      setPreview(null)
                    }}
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
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </span>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button
                    onClick={analyzeFile}
                    disabled={!file || analyzing}
                    className="flex-1"
                  >
                    {analyzing ? (
                      <>Analyse en cours...</>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Analyser le fichier
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Résultats de l'analyse */}
          {preview && (
            <>
              {/* Statistiques principales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total lignes</p>
                        <p className="text-2xl font-bold">{preview.stats.totalRows}</p>
                      </div>
                      <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">À importer</p>
                        <p className="text-2xl font-bold text-green-600">
                          {preview.stats.willInsert}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Doublons</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {preview.stats.duplicates}
                        </p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Distribution par région */}
              {preview.regionDistribution && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Distribution par région
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Object.entries(preview.regionDistribution)
                        .sort(([,a], [,b]) => b - a)
                        .map(([region, count]) => (
                          <div key={region} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="text-xs capitalize">{region.replace('-', ' ')}</span>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Avertissements et erreurs */}
              {(preview.warnings.length > 0 || preview.errors.length > 0) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      Avertissements et erreurs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {preview.errors.length > 0 && (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="font-semibold mb-1">
                            {preview.errors.length} erreur(s) bloquante(s)
                          </div>
                          <ul className="list-disc list-inside text-xs space-y-1">
                            {preview.errors.slice(0, 5).map((error, i) => (
                              <li key={i}>{error}</li>
                            ))}
                            {preview.errors.length > 5 && (
                              <li>... et {preview.errors.length - 5} autres</li>
                            )}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {preview.warnings.length > 0 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="font-semibold mb-1">
                            {preview.warnings.length} avertissement(s)
                          </div>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto"
                            onClick={() => setShowDetails(!showDetails)}
                          >
                            {showDetails ? 'Masquer' : 'Voir'} les détails
                          </Button>
                          {showDetails && (
                            <ul className="list-disc list-inside text-xs space-y-1 mt-2">
                              {preview.warnings.map((warning, i) => (
                                <li key={i}>{warning}</li>
                              ))}
                            </ul>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Aperçu des données */}
              {preview.preview && preview.preview.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      Aperçu des données ({preview.preview.length} premiers)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="border-b">
                          <tr>
                            <th className="text-left p-2">Nom</th>
                            <th className="text-left p-2">Ville</th>
                            <th className="text-left p-2">Région</th>
                            <th className="text-left p-2">Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.preview.map((item, i) => (
                            <tr key={i} className="border-b">
                              <td className="p-2 font-medium">{item.nom}</td>
                              <td className="p-2">{item.ville}</td>
                              <td className="p-2">
                                <Badge variant="outline" className="text-xs">
                                  {item.region}
                                </Badge>
                              </td>
                              <td className="p-2">
                                {'★'.repeat(item.score)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Options et actions */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="skip-duplicates"
                      checked={skipDuplicates}
                      onCheckedChange={(checked) => setSkipDuplicates(!!checked)}
                    />
                    <label
                      htmlFor="skip-duplicates"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Ignorer les doublons ({preview.stats.duplicates} détectés)
                    </label>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={reset}
                      disabled={loading}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={importFile}
                      disabled={loading || preview.errors.length > 0}
                      className="flex-1"
                    >
                      {loading ? (
                        <>Import en cours...</>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Importer {preview.stats.willInsert} hôtels
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
