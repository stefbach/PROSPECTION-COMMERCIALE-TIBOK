export type Prospect = {
  id: number
  nom: string
  secteur: 'clinique' | 'ehpad' | 'medecin' | 'hopital' | 'maison-retraite'
  ville: string
  statut: 'nouveau' | 'qualifie' | 'rdv-planifie' | 'en-negociation' | 'signe'
  region: 'ile-de-france' | 'paca' | 'aura' | 'grand-est' | 'occitanie'
  contact: string
  telephone: string
  email: string
  score: 1 | 2 | 3 | 4 | 5
  budget: string
  notes: string
  created_at?: string
  updated_at?: string
}

export type Appointment = {
  id: string
  prospect_id: number
  titre: string
  commercial: string
  date_time: string // ISO
  type_visite: 'decouverte' | 'presentation' | 'negociation' | 'signature' | 'suivi'
  priorite: 'normale' | 'haute' | 'urgente'
  duree_min: number
  notes: string
  created_at?: string
}

export type ContractFile = {
  id: string
  prospect_id: number
  file_path: string
  file_name: string
  fee_mur: number | null
  uploaded_at?: string
}

export type MonthlyRevenue = {
  month: string // YYYY-MM
  total_mur: number
}
