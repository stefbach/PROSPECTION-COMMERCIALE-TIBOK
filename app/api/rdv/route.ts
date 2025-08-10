import React, { useState, useEffect, useMemo } from 'react'
import { Calendar, Clock, MapPin, Phone, Mail, Search, Plus, Eye, Trash2, Users, Target, AlertCircle, CheckCircle, Building, User, Timer, Car, DollarSign, Activity, RefreshCw, BellRing, Star, ChevronLeft, ChevronRight, Filter, X, Check, Edit2 } from 'lucide-react'

// Configuration Maurice
const DISTRICTS_MAURICE = {
  'port-louis': 'Port Louis',
  'pamplemousses': 'Pamplemousses',
  'riviere-du-rempart': 'Rivière du Rempart',
  'flacq': 'Flacq',
  'grand-port': 'Grand Port',
  'savanne': 'Savanne',
  'plaines-wilhems': 'Plaines Wilhems',
  'moka': 'Moka',
  'riviere-noire': 'Rivière Noire'
}

const SECTEURS = {
  'hotel': { label: 'Hôtel', icon: '🏨', color: 'bg-blue-100 text-blue-700' },
  'restaurant': { label: 'Restaurant', icon: '🍽️', color: 'bg-orange-100 text-orange-700' },
  'retail': { label: 'Retail', icon: '🏪', color: 'bg-purple-100 text-purple-700' },
  'clinique': { label: 'Clinique', icon: '🏥', color: 'bg-red-100 text-red-700' },
  'pharmacie': { label: 'Pharmacie', icon: '💊', color: 'bg-green-100 text-green-700' },
  'wellness': { label: 'Wellness', icon: '🌿', color: 'bg-emerald-100 text-emerald-700' },
  'spa': { label: 'Spa', icon: '💆', color: 'bg-pink-100 text-pink-700' },
  'tourisme': { label: 'Tourisme', icon: '🏖️', color: 'bg-yellow-100 text-yellow-700' },
  'immobilier': { label: 'Immobilier', icon: '🏘️', color: 'bg-indigo-100 text-indigo-700' },
  'autre': { label: 'Autre', icon: '🏢', color: 'bg-gray-100 text-gray-700' }
}

export default function MauritiusRdvCalendar() {
  // États
  const [prospects, setProspects] = useState([])
  const [rdvs, setRdvs] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentView, setCurrentView] = useState('calendar')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedRdv, setSelectedRdv] = useState(null)
  const [showNewRdvModal, setShowNewRdvModal] = useState(false)
  const [selectedProspect, setSelectedProspect] = useState(null)
  const [formData, setFormData] = useState({})
  
  // Commercial actuel (à remplacer par auth)
  const currentCommercial = 'Karine MOMUS'
  
  // Charger les données
  useEffect(() => {
    loadProspects()
    loadRdvs()
  }, [])
  
  async function loadProspects() {
    setLoading(true)
    try {
      const res = await fetch('/api/prospects?limit=5000')
      const data = await res.json()
      if (data.data) {
        setProspects(data.data)
      }
    } catch (error) {
      console.error('Erreur chargement prospects:', error)
    } finally {
      setLoading(false)
    }
  }
  
  async function loadRdvs() {
    try {
      const res = await fetch(`/api/rdv?commercial=${currentCommercial}`)
      const data = await res.json()
      setRdvs(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erreur chargement RDV:', error)
    }
  }
  
  // Statistiques
  const stats = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const week = new Date(today)
    week.setDate(week.getDate() + 7)
    
    return {
      totalProspects: prospects.length,
      nouveaux: prospects.filter(p => p.statut === 'nouveau').length,
      qualifies: prospects.filter(p => p.statut === 'qualifie').length,
      rdvTotal: rdvs.length,
      rdvAujourdhui: rdvs.filter(r => {
        const d = new Date(r.date_time)
        return d >= today && d < tomorrow
      }).length,
      rdvSemaine: rdvs.filter(r => {
        const d = new Date(r.date_time)
        return d >= today && d < week
      }).length
    }
  }, [prospects, rdvs])
  
  // Calendrier du mois
  const calendarDays = useMemo(() => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const current = new Date(startDate)
    
    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }, [selectedDate])
  
  // RDV par jour
  const rdvsByDay = useMemo(() => {
    const byDay = {}
    rdvs.forEach(rdv => {
      const date = new Date(rdv.date_time).toDateString()
      if (!byDay[date]) byDay[date] = []
      byDay[date].push(rdv)
    })
    return byDay
  }, [rdvs])
  
  // Créer un RDV
  async function createRdv(data) {
    try {
      const res = await fetch('/api/rdv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          commercial: currentCommercial
        })
      })
      
      if (res.ok) {
        const newRdv = await res.json()
        setRdvs([...rdvs, newRdv])
        setShowNewRdvModal(false)
        setSelectedProspect(null)
      }
    } catch (error) {
      console.error('Erreur création RDV:', error)
    }
  }
  
  // Supprimer un RDV
  async function deleteRdv(id) {
    try {
      const res = await fetch(`/api/rdv?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setRdvs(rdvs.filter(r => r.id !== id))
        setSelectedRdv(null)
      }
    } catch (error) {
      console.error('Erreur suppression RDV:', error)
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec stats */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gestion des Rendez-Vous
            </h1>
            <p className="text-sm text-gray-600">
              Commercial: {currentCommercial} • {prospects.length} prospects • Île Maurice
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { loadProspects(); loadRdvs() }}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button
              onClick={() => setShowNewRdvModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nouveau RDV
            </button>
          </div>
        </div>
        
        {/* KPIs */}
        <div className="grid grid-cols-6 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600">Total Prospects</p>
                <p className="text-2xl font-bold text-blue-700">{stats.totalProspects}</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600">Nouveaux</p>
                <p className="text-2xl font-bold text-green-700">{stats.nouveaux}</p>
              </div>
              <Target className="h-8 w-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-600">Qualifiés</p>
                <p className="text-2xl font-bold text-orange-700">{stats.qualifies}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-orange-400" />
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-600">RDV Total</p>
                <p className="text-2xl font-bold text-purple-700">{stats.rdvTotal}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-400" />
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-600">Aujourd'hui</p>
                <p className="text-2xl font-bold text-red-700">{stats.rdvAujourdhui}</p>
              </div>
              <Clock className="h-8 w-8 text-red-400" />
            </div>
          </div>
          
          <div className="bg-indigo-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-indigo-600">Cette semaine</p>
                <p className="text-2xl font-bold text-indigo-700">{stats.rdvSemaine}</p>
              </div>
              <Activity className="h-8 w-8 text-indigo-400" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="bg-white border-b px-6">
        <div className="flex gap-1">
          <button
            onClick={() => setCurrentView('calendar')}
            className={`px-4 py-2 font-medium ${
              currentView === 'calendar' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Calendrier
          </button>
          <button
            onClick={() => setCurrentView('list')}
            className={`px-4 py-2 font-medium ${
              currentView === 'list' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Liste des RDV
          </button>
          <button
            onClick={() => setCurrentView('prospects')}
            className={`px-4 py-2 font-medium ${
              currentView === 'prospects' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Prospects ({prospects.length})
          </button>
          <button
            onClick={() => setCurrentView('map')}
            className={`px-4 py-2 font-medium ${
              currentView === 'map' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Carte & Optimisation
          </button>
        </div>
      </div>
      
      {/* Vue Calendrier */}
      {currentView === 'calendar' && (
        <div className="p-6">
          <div className="bg-white rounded-lg shadow">
            {/* Header calendrier */}
            <div className="flex items-center justify-between p-4 border-b">
              <button
                onClick={() => {
                  const prev = new Date(selectedDate)
                  prev.setMonth(prev.getMonth() - 1)
                  setSelectedDate(prev)
                }}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <h2 className="text-lg font-semibold">
                {selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </h2>
              
              <button
                onClick={() => {
                  const next = new Date(selectedDate)
                  next.setMonth(next.getMonth() + 1)
                  setSelectedDate(next)
                }}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            
            {/* Grille calendrier */}
            <div className="p-4">
              <div className="grid grid-cols-7 gap-px mb-2">
                {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {calendarDays.map((day, index) => {
                  const dateStr = day.toDateString()
                  const dayRdvs = rdvsByDay[dateStr] || []
                  const isToday = dateStr === new Date().toDateString()
                  const isCurrentMonth = day.getMonth() === selectedDate.getMonth()
                  
                  return (
                    <div
                      key={index}
                      className={`bg-white p-2 min-h-[100px] ${
                        !isCurrentMonth ? 'bg-gray-50' : ''
                      } ${isToday ? 'bg-blue-50' : ''} hover:bg-gray-50 cursor-pointer`}
                      onClick={() => {
                        setSelectedDate(day)
                        setCurrentView('list')
                      }}
                    >
                      <div className={`text-sm font-medium ${
                        isToday ? 'text-blue-600' : 
                        isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {day.getDate()}
                      </div>
                      
                      {dayRdvs.length > 0 && (
                        <div className="mt-1 space-y-1">
                          {dayRdvs.slice(0, 3).map((rdv, i) => (
                            <div
                              key={i}
                              className={`text-xs p-1 rounded truncate ${
                                rdv.priorite === 'urgente' ? 'bg-red-100 text-red-700' :
                                rdv.priorite === 'haute' ? 'bg-orange-100 text-orange-700' :
                                'bg-blue-100 text-blue-700'
                              }`}
                              title={`${rdv.prospect_nom} - ${new Date(rdv.date_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
                            >
                              {new Date(rdv.date_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} {rdv.prospect_nom}
                            </div>
                          ))}
                          {dayRdvs.length > 3 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{dayRdvs.length - 3} autres
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Vue Liste */}
      {currentView === 'list' && (
        <div className="p-6">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Liste des rendez-vous</h3>
            </div>
            
            <div className="divide-y">
              {rdvs
                .sort((a, b) => new Date(a.date_time) - new Date(b.date_time))
                .map(rdv => {
                  const date = new Date(rdv.date_time)
                  const isPast = date < new Date()
                  
                  return (
                    <div
                      key={rdv.id}
                      className={`p-4 hover:bg-gray-50 ${isPast ? 'opacity-60' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-sm font-bold text-gray-900">
                              {date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                            </div>
                            <div className="text-lg text-gray-700">
                              {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          
                          <div>
                            <div className="font-medium text-gray-900">
                              {rdv.prospect_nom}
                            </div>
                            <div className="text-sm text-gray-600">
                              {SECTEURS[rdv.prospect_secteur]?.icon} {rdv.prospect_ville} • {rdv.type_visite} • {rdv.duree_min} min
                            </div>
                            {rdv.notes && (
                              <div className="text-sm text-gray-500 mt-1">
                                {rdv.notes}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            rdv.priorite === 'urgente' ? 'bg-red-100 text-red-700' :
                            rdv.priorite === 'haute' ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {rdv.priorite}
                          </span>
                          
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            rdv.statut === 'termine' ? 'bg-green-100 text-green-700' :
                            rdv.statut === 'annule' ? 'bg-red-100 text-red-700' :
                            rdv.statut === 'confirme' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {rdv.statut}
                          </span>
                          
                          <button
                            onClick={() => deleteRdv(rdv.id)}
                            className="p-1 hover:bg-red-50 rounded text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
                
              {rdvs.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  Aucun rendez-vous planifié
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Vue Prospects */}
      {currentView === 'prospects' && (
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4">
            {prospects.slice(0, 50).map(prospect => (
              <div key={prospect.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{prospect.nom}</h4>
                    <p className="text-sm text-gray-600">
                      {SECTEURS[prospect.secteur]?.icon} {SECTEURS[prospect.secteur]?.label}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    prospect.statut === 'nouveau' ? 'bg-blue-100 text-blue-700' :
                    prospect.statut === 'qualifie' ? 'bg-green-100 text-green-700' :
                    prospect.statut === 'en-negociation' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {prospect.statut}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {prospect.ville}, {DISTRICTS_MAURICE[prospect.district]}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {prospect.telephone}
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Score: {prospect.score}/5
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setSelectedProspect(prospect)
                    setShowNewRdvModal(true)
                  }}
                  className="w-full mt-3 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Planifier RDV
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Modal Nouveau RDV */}
      {showNewRdvModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Planifier un rendez-vous</h3>
                <button
                  onClick={() => {
                    setShowNewRdvModal(false)
                    setSelectedProspect(null)
                  }}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {!selectedProspect ? (
                <div>
                  <label className="block text-sm font-medium mb-2">Prospect</label>
                  <select 
                    value={formData.prospect_id || ''}
                    onChange={(e) => setFormData({...formData, prospect_id: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">Sélectionner un prospect</option>
                    {prospects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nom} - {p.ville}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="font-medium">{selectedProspect.nom}</p>
                  <p className="text-sm text-gray-600">
                    {selectedProspect.ville} • {selectedProspect.telephone}
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Heure</label>
                  <input
                    type="time"
                    value={formData.time || ''}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Type de visite</label>
                  <select 
                    value={formData.type_visite || 'decouverte'}
                    onChange={(e) => setFormData({...formData, type_visite: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="decouverte">Découverte</option>
                    <option value="presentation">Présentation</option>
                    <option value="negociation">Négociation</option>
                    <option value="signature">Signature</option>
                    <option value="suivi">Suivi</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Priorité</label>
                  <select 
                    value={formData.priorite || 'normale'}
                    onChange={(e) => setFormData({...formData, priorite: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="normale">Normale</option>
                    <option value="haute">Haute</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Durée</label>
                <select 
                  value={formData.duree_min || '60'}
                  onChange={(e) => setFormData({...formData, duree_min: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 heure</option>
                  <option value="90">1h30</option>
                  <option value="120">2 heures</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Objectifs, points à aborder..."
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (formData.date && formData.time) {
                      createRdv({
                        prospect_id: selectedProspect?.id || formData.prospect_id,
                        date_time: `${formData.date}T${formData.time}:00`,
                        type_visite: formData.type_visite || 'decouverte',
                        priorite: formData.priorite || 'normale',
                        duree_min: parseInt(formData.duree_min || '60'),
                        notes: formData.notes
                      })
                      setFormData({})
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Planifier le RDV
                </button>
                <button
                  onClick={() => {
                    setShowNewRdvModal(false)
                    setSelectedProspect(null)
                    setFormData({})
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
