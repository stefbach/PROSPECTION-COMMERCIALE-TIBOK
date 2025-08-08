'use client'

import * as React from 'react'
import type { ContractFile } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Download, FileText, Plus, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function ContractsManager({
  prospectId,
  triggerLabel = 'Contrats',
}: {
  prospectId: number
  triggerLabel?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [files, setFiles] = React.useState<ContractFile[]>([])
  const [file, setFile] = React.useState<File | null>(null)
  const [fee, setFee] = React.useState<string>('0')
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()

  const load = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/contracts?prospect_id=${encodeURIComponent(prospectId)}`, { cache: 'no-store' })
      const data = await res.json()
      setFiles(Array.isArray(data) ? data : [])
    } catch (e: any) {
      toast({ title: 'Erreur', description: 'Impossible de charger les contrats.' })
    }
  }, [prospectId, toast])

  React.useEffect(() => {
    if (open) load()
  }, [open, load])

  async function upload() {
    if (!file) return
    try {
      setLoading(true)
      const fd = new FormData()
      fd.append('prospect_id', String(prospectId))
      fd.append('file', file)
      fd.append('fee_mur', fee || '0')
      const res = await fetch('/api/contracts', { method: 'POST', body: fd })
      if (!res.ok) throw new Error(await res.text())
      setFile(null)
      setFee('0')
      await load()
      toast({ title: 'Upload réussi', description: 'Contrat enregistré.' })
    } catch (e: any) {
      toast({ title: 'Erreur upload', description: e.message || 'Echec upload' })
    } finally {
      setLoading(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce contrat ?')) return
    try {
      const res = await fetch(`/api/contracts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      await load()
      toast({ title: 'Supprimé', description: 'Contrat supprimé.' })
    } catch (e: any) {
      toast({ title: 'Erreur suppression', description: e.message })
    }
  }

  async function download(id: string, name: string) {
    try {
      const res = await fetch(`/api/contracts/${id}/download`)
      if (!res.ok) throw new Error(await res.text())
      const { url } = await res.json()
      const a = document.createElement('a')
      a.href = url
      a.download = name
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (e: any) {
      toast({ title: 'Erreur téléchargement', description: e.message })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Contrats du prospect #{prospectId}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <Input type="number" placeholder="Tarif/consult. (MUR)" value={fee} onChange={(e) => setFee(e.target.value)} className="w-48" />
            <Button onClick={upload} disabled={loading || !file}>
              <Plus className="mr-2" /> Uploader
            </Button>
          </div>

          <Card>
            <CardContent className="p-0 divide-y">
              {files.length === 0 && <div className="p-4 text-sm text-gray-600">Aucun contrat</div>}
              {files.map((f) => (
                <div key={f.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="text-gray-500" />
                    <div>
                      <div className="font-medium">{f.file_name}</div>
                      <div className="text-xs text-gray-500">Tarif: {f.fee_mur ?? 0} MUR</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => download(f.id, f.file_name)}>
                      <Download className="mr-2" /> Télécharger
                    </Button>
                    <Button variant="destructive" onClick={() => remove(f.id)}>
                      <Trash2 className="mr-2" /> Supprimer
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
