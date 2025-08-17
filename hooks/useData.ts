// hooks/useData.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import dataStore from '@/lib/dataStore'
import { useToast } from '@/hooks/use-toast'

export function useData() {
  const [prospects, setProspects] = useState<any[]>([])
  const [rendezVous, setRendezVous] = useState<any[]>([])
  const [propositions, setPropositions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [commercialInfo, setCommercialInfoState] = useState(dataStore.getCommercialInfo())
  const { toast } = useToast()

  // Charger les prospects
  const loadProspects = useCallback(async (forceRefresh = false) => {
    setLoading(true)
    try {
      const data = await dataStore.getProspects(forceRefresh)
      setProspects(data)
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les prospects',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Charger les RDV et propositions
  const loadRdvs = useCallback(async (forceRefresh = false) => {
    setLoading(true)
    try {
      const { rdvs, propositions } = await dataStore.getRdvs(forceRefresh)
      setRendezVous(rdvs)
      setPropositions(propositions)
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les rendez-vous',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Créer un RDV
  const createRdv = useCallback(async (data: any) => {
    setLoading(true)
    try {
      const success = await dataStore.createRdv(data)
      if (success) {
        await loadRdvs(true) // Forcer le rafraîchissement
        toast({
          title: '✅ RDV créé',
          description: `Rendez-vous avec ${data.prospect_nom} planifié`
        })
      }
      return success
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le rendez-vous',
        variant: 'destructive'
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [loadRdvs, toast])

  // Modifier un RDV
  const updateRdv = useCallback(async (id: number, updates: any) => {
    setLoading(true)
    try {
      const success = await dataStore.updateRdv(id, updates)
      if (success) {
        await loadRdvs(true) // Forcer le rafraîchissement
        toast({
          title: '✅ RDV modifié',
          description: 'Les modifications ont été enregistrées'
        })
      }
      return success
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le rendez-vous',
        variant: 'destructive'
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [loadRdvs, toast])

  // Supprimer un RDV
  const deleteRdv = useCallback(async (id: number) => {
    setLoading(true)
    try {
      const success = await dataStore.deleteRdv(id)
      if (success) {
        await loadRdvs(true) // Forcer le rafraîchissement
        toast({
          title: 'RDV supprimé',
          description: 'Le rendez-vous a été supprimé'
        })
      }
      return success
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le rendez-vous',
        variant: 'destructive'
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [loadRdvs, toast])

  // Sauvegarder les infos commerciales
  const setCommercialInfo = useCallback((info: any) => {
    dataStore.saveCommercialInfo(info)
    setCommercialInfoState(info)
    toast({
      title: '✅ Informations sauvegardées',
      description: 'Votre profil a été mis à jour'
    })
  }, [toast])

  // Charger les données initiales
  useEffect(() => {
    loadProspects()
    loadRdvs()
  }, [loadProspects, loadRdvs])

  // Rafraîchissement automatique
  useEffect(() => {
    const interval = setInterval(() => {
      loadRdvs() // Rafraîchir sans forcer (utilise le cache si récent)
    }, 30000) // 30 secondes

    return () => clearInterval(interval)
  }, [loadRdvs])

  return {
    // Données
    prospects,
    rendezVous,
    propositions,
    commercialInfo,
    loading,
    
    // Actions
    loadProspects,
    loadRdvs,
    createRdv,
    updateRdv,
    deleteRdv,
    setCommercialInfo,
    
    // Utilitaire
    refreshAll: async () => {
      await Promise.all([
        loadProspects(true),
        loadRdvs(true)
      ])
    }
  }
}
