'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { FileSpreadsheet } from 'lucide-react'

type AnalyzeResult = {
  totalRows: number
  willInsert: number
  willUpdate: number
  duplicates: number
}

export function ExcelImporter() {
  const [open, setOpen] = React.useState(false)
  const [file, setFile] = React.useState<File | null>(null)
  const [analyzing, setAnalyzing] = React.useState(false)
  const [analysis, setAnalysis] = React.useState<AnalyzeResult | null>(null)
  const { toast } = useToast()

  async function analyze() {
    if (!file) return
    setAnalyzing(true)
    setAnalysis(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/import/excel?dryRun=true', { method: 'POST', body: fd })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setAnalysis(data)
      toast({ title: 'Analyse terminée', description: `${data.willInsert} nouveaux, ${data.willUpdate} MAJ` })
    } catch (e: any) {
      toast({ title: 'Erreur analyse', description: e.message })
    } finally {
      setAnalyzing(false)
    }
  }

  async function importFile() {
    if (!file) return
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/import/excel', { method: 'POST', body: fd })
      if (!res.ok) throw new Error(await res.text())
      setFile(null)
      setAnalysis(null)
      setOpen(false)
      toast({ title: 'Import réussi', description: 'Prospects importés' })
    } catch (e: any) {
      toast({ title: 'Erreur import', description: e.message })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileSpreadsheet className="mr-2" /> Importer Excel
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importer fichier Excel</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <div className="flex gap-2">
            <Button onClick={analyze} disabled={!file || analyzing}>Analyser</Button>
            <Button onClick={importFile} disabled={!file}>Importer</Button>
          </div>
          {analysis && (
            <div className="text-sm text-gray-700">
              Lignes: {analysis.totalRows} • Nouveaux: {analysis.willInsert} • Mises à jour: {analysis.willUpdate} • Doublons ignorés: {analysis.duplicates}
            </div>
          )}
          <div className="text-xs text-gray-500">
            Colonnes attendues: nom, secteur, ville, region, statut, contact, telephone, email, score, budget, notes
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
