'use client'

import * as React from 'react'
import { ImportAnalyzerV2 as ImportAnalyzer } from '@/components/import-analyzer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileSpreadsheet, 
  Upload, 
  History,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Download,
  RefreshCw,
  Database,
  FileText,
  Users,
  BarChart3
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Types pour l'historique d'import
interface ImportHistory {
  id: string
  date: Date
  filename: string
  totalRows: number
  imported: number
  skipped: number
  errors: number
  status: 'success' | 'partial' | 'failed'
  user?: string
}

// Statistiques globales
interface ImportStats {
  totalImports: number
  totalProspects: number
  successRate: number
  lastImport?: Date
  topSources: { source: string; count: number }[]
}

export default function ImportPage() {
  const [history, setHistory] = React.useState<ImportHistory[]>([])
  const [stats, setStats] = React.useState<ImportStats | null>(null)
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()

  // Charger l'historique et les stats
  React.useEffect(() => {
    loadHistory()
    loadStats()
  }, [])

  const loadHistory = async () => {
    try {
      // Simuler le chargement de l'historique
      // À remplacer par votre API
      const mockHistory: ImportHistory[] = [
        {
          id: '1',
          date: new Date('2024-01-20'),
          filename: 'hotels_maurice.xlsx',
          totalRows: 178,
          imported: 165,
          skipped: 10,
          errors: 3,
          status: 'success',
          user: 'Admin'
        },
        {
          id: '2',
          date: new Date('2024-01-18'),
          filename: 'pharmacies.csv',
          totalRows: 45,
          imported: 43,
          skipped: 2,
          errors: 0,
          status: 'success',
          user: 'Admin'
        },
        {
          id: '3',
          date: new Date('2024-01-15'),
          filename: 'assurances_2024.xlsx',
          totalRows: 89,
          imported: 75,
          skipped: 10,
          errors: 4,
          status: 'partial',
          user: 'Commercial'
        }
      ]
      setHistory(mockHistory)
    } catch (error) {
      console.error('Erreur chargement historique:', error)
    }
  }

  const loadStats = async () => {
    try {
      // Simuler le chargement des stats
      // À remplacer par votre API
      const mockStats: ImportStats = {
        totalImports: 23,
        totalProspects: 1456,
        successRate: 92,
        lastImport: new Date('2024-01-20'),
        topSources: [
          { source: 'hotels', count: 450 },
          { source: 'pharmacies', count: 320 },
          { source: 'assurances', count: 280 },
          { source: 'banques', count: 180 },
          { source: 'autres', count: 226 }
        ]
      }
      setStats(mockStats)
    } catch (error) {
      console.error('Erreur chargement stats:', error)
    }
  }

  const handleImportComplete = () => {
    loadHistory()
    loadStats()
    toast({
      title: 'Import terminé',
      description: 'Les données ont été importées avec succès'
    })
  }

  const downloadSampleFiles = () => {
    // Créer un zip avec plusieurs templates
    const templates = {
      'template_general.csv': `Nom,Secteur,Ville,Contact,Téléphone,Email,Budget,Notes
"Exemple Entreprise","autre","Port Louis","Jean Dupont","+230 5123 4567","contact@exemple.mu","Rs 100k","Prospect à contacter"`,
      
      'template_hotels.csv': `Nom commercial,Adresse,Téléphone,Email,Personne de contact
"Hotel Paradise","Belle Mare, Flacq","+230 402 1234","info@paradise.mu","Direction"`,
      
      'template_pharmacies.csv': `Nom,Type,Responsable,Telephone,Adresse
"Pharmacie Centrale","Pharmacie","Dr Patel","57123456","Royal Road, Curepipe"`
    }
    
    // Pour simplifier, on télécharge juste le premier
    const content = templates['template_general.csv']
    const blob = new Blob([content], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'templates_import.csv'
    link.click()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Centre d'Import de Données</h1>
          <p className="text-muted-foreground mt-2">
            Importez et analysez vos fichiers de prospects pour l'île Maurice
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadSampleFiles}>
            <Download className="mr-2 h-4 w-4" />
            Templates
          </Button>
          <ImportAnalyzer onImportComplete={handleImportComplete} />
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Imports</p>
                  <p className="text-2xl font-bold">{stats.totalImports}</p>
                </div>
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Prospects Importés</p>
                  <p className="text-2xl font-bold">{stats.totalProspects}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taux de Succès</p>
                  <p className="text-2xl font-bold text-green-600">{stats.successRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Dernier Import</p>
                  <p className="text-sm font-medium">
                    {stats.lastImport?.toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <History className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs principales */}
      <Tabs defaultValue="recent" className="w-full">
        <TabsList>
          <TabsTrigger value="recent">Imports Récents</TabsTrigger>
          <TabsTrigger value="sources">Sources de Données</TabsTrigger>
          <TabsTrigger value="guide">Guide d'Import</TabsTrigger>
        </TabsList>

        {/* Tab: Imports Récents */}
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Imports</CardTitle>
              <CardDescription>
                Derniers fichiers importés dans le système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{item.filename}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.date.toLocaleDateString('fr-FR')} • Par {item.user}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-medium">{item.totalRows} lignes</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="default" className="text-xs">
                            ✓ {item.imported}
                          </Badge>
                          {item.skipped > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              ⊘ {item.skipped}
                            </Badge>
                          )}
                          {item.errors > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              ✗ {item.errors}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {item.status === 'success' && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      {item.status === 'partial' && (
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                      )}
                      {item.status === 'failed' && (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>
                ))}
                
                {history.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun import récent
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Sources de Données */}
        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Répartition par Source</CardTitle>
              <CardDescription>
                Distribution des prospects importés par type de source
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.topSources && (
                <div className="space-y-4">
                  {stats.topSources.map((source) => (
                    <div key={source.source}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium capitalize">
                          {source.source}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {source.count} prospects
                        </span>
                      </div>
                      <Progress 
                        value={(source.count / stats.totalProspects) * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Formats Supportés</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="text-sm">Excel (.xlsx, .xls)</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">CSV (.csv)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span className="text-sm">JSON (.json)</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Limites</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <p>• Maximum 10,000 lignes par import</p>
                  <p>• Taille maximale du fichier: 10 MB</p>
                  <p>• Import par batch de 100 lignes</p>
                  <p>• Détection automatique des doublons</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Guide */}
        <TabsContent value="guide" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Guide d'Import Étape par Étape</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Préparer vos données</h4>
                    <p className="text-sm text-muted-foreground">
                      Assurez-vous que votre fichier contient les colonnes essentielles: 
                      Nom, Contact (email ou téléphone), Ville ou Adresse.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Analyser le fichier</h4>
                    <p className="text-sm text-muted-foreground">
                      L'outil analyse automatiquement la structure de vos données 
                      et détecte le type de fichier (hôtels, pharmacies, etc.).
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Configurer le mapping</h4>
                    <p className="text-sm text-muted-foreground">
                      Associez les colonnes de votre fichier aux champs du CRM. 
                      Le système suggère automatiquement les correspondances.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Valider et importer</h4>
                    <p className="text-sm text-muted-foreground">
                      Vérifiez l'aperçu des données transformées, 
                      gérez les doublons et lancez l'import.
                    </p>
                  </div>
                </div>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Conseil:</strong> Commencez avec un petit échantillon 
                  de données pour tester le mapping avant d'importer un fichier complet.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Colonnes Recommandées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-semibold mb-1">Obligatoires</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Nom de l'entreprise</li>
                    <li>• Contact (email ou tél)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-1">Recommandées</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Ville ou Adresse</li>
                    <li>• Secteur d'activité</li>
                    <li>• Personne de contact</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-1">Optionnelles</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Budget</li>
                    <li>• Site web</li>
                    <li>• Notes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
