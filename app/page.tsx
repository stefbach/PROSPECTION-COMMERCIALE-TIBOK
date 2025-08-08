"use client"

import * as React from "react"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Bell } from 'lucide-react'
import DashboardSection from "@/components/sections/dashboard"
import ProspectsSection from "@/components/sections/prospects"
import RdvSection from "@/components/sections/rdv"
import QualificationSection from "@/components/sections/qualification"
import PlanningSection from "@/components/sections/planning"

export type Prospect = {
  id: number
  nom: string
  secteur: "clinique" | "ehpad" | "medecin" | "hopital" | "maison-retraite"
  ville: string
  statut: "nouveau" | "qualifie" | "rdv-planifie" | "en-negociation" | "signe"
  region: "ile-de-france" | "paca" | "aura" | "grand-est" | "occitanie"
  contact: string
  telephone: string
  email: string
  score: 1 | 2 | 3 | 4 | 5
  budget: string
  notes: string
}

export type RdvItem = {
  id: string
  prospectId?: number
  titre: string
  priorite: "Normale" | "Haute" | "Urgente"
  dateTimeLabel: string
  description: string
  tag?: string
  border: "blue" | "green" | "yellow"
}

type SectionKey = "dashboard" | "prospects" | "rdv" | "qualification" | "planning"

const initialProspects: Prospect[] = [
  {
    id: 1,
    nom: "Clinique Saint-Martin",
    secteur: "clinique",
    ville: "Paris 15ème",
    statut: "qualifie",
    region: "ile-de-france",
    contact: "Dr. Moreau",
    telephone: "01.45.32.18.97",
    email: "direction@clinique-saint-martin.fr",
    score: 4,
    budget: "15,000-25,000€",
    notes: "Intéressé par solution télémédecine pour urgences nocturnes",
  },
  {
    id: 2,
    nom: "EHPAD Les Roses",
    secteur: "ehpad",
    ville: "Lyon 6ème",
    statut: "rdv-planifie",
    region: "aura",
    contact: "Mme Dubois",
    telephone: "04.72.15.89.34",
    email: "direction@ehpad-roses.fr",
    score: 5,
    budget: "18,000€",
    notes: "Budget validé, souhaite démarrer avant fin d'année",
  },
  {
    id: 3,
    nom: "Cabinet Dr. Lambert",
    secteur: "medecin",
    ville: "Marseille",
    statut: "nouveau",
    region: "paca",
    contact: "Dr. Lambert",
    telephone: "04.91.25.47.83",
    email: "contact@cabinet-lambert.fr",
    score: 2,
    budget: "Non communiqué",
    notes: "Pas de besoin immédiat, à recontacter dans 6 mois",
  },
  {
    id: 4,
    nom: "Hôpital Privé de Versailles",
    secteur: "hopital",
    ville: "Versailles",
    statut: "en-negociation",
    region: "ile-de-france",
    contact: "M. Rousseau",
    telephone: "01.39.24.65.78",
    email: "dsi@hopital-versailles.fr",
    score: 5,
    budget: "35,000€",
    notes: "Négociation avancée, décision cette semaine",
  },
  {
    id: 5,
    nom: "Maison de Retraite Belle Vue",
    secteur: "maison-retraite",
    ville: "Nice",
    statut: "qualifie",
    region: "paca",
    contact: "M. Petit",
    telephone: "04.93.85.47.21",
    email: "direction@bellevue-nice.fr",
    score: 3,
    budget: "12,000€",
    notes: "Intéressé mais budget serré",
  },
]

const initialRdvs: RdvItem[] = [
  {
    id: "rdv-1",
    prospectId: 1,
    titre: "Clinique Saint-Martin",
    priorite: "Haute",
    dateTimeLabel: "Demain 14:30 • M. Dupont • Négociation",
    description: "Finaliser le contrat télémédecine - 150 lits",
    tag: "Négociation",
    border: "blue",
  },
  {
    id: "rdv-2",
    prospectId: 2,
    titre: "EHPAD Les Roses",
    priorite: "Normale",
    dateTimeLabel: "Vendredi 10:00 • Mme Martin • Découverte",
    description: "Première visite - présentation services télémédecine",
    tag: "Découverte",
    border: "green",
  },
  {
    id: "rdv-3",
    prospectId: 3,
    titre: "Dr. Lambert - Cabinet",
    priorite: "Urgente",
    dateTimeLabel: "Lundi 16:30 • M. Bernard • Signature",
    description: "Signature contrat - cabinet 3 médecins",
    tag: "Signature",
    border: "yellow",
  },
]

export default function Page() {
  const [section, setSection] = React.useState<SectionKey>("dashboard")
  const [prospects, setProspects] = React.useState<Prospect[]>(initialProspects)
  const [rdvs, setRdvs] = React.useState<RdvItem[]>(initialRdvs)
  const [selectedProspectId, setSelectedProspectId] = React.useState<number | undefined>(undefined)
  const { toast } = useToast()

  function navigateTo(next: SectionKey) {
    setSection(next)
  }

  function planifierRdvFromProspect(id: number) {
    setSelectedProspectId(id)
    setSection("rdv")
  }

  function addProspect(p: Omit<Prospect, "id">) {
    const next: Prospect = { ...p, id: Math.max(0, ...prospects.map(x => x.id)) + 1 }
    setProspects(prev => [next, ...prev])
    toast({ title: "Prospect ajouté", description: `${next.nom} a été ajouté à la base.` })
  }

  function updateProspectStatus(id: number, statut: Prospect["statut"]) {
    setProspects(prev => prev.map(p => (p.id === id ? { ...p, statut } : p)))
    toast({ title: "Statut mis à jour", description: `Prospect #${id} → ${statut}` })
  }

  function addRdv(item: Omit<RdvItem, "id">) {
    const id = `rdv-${Date.now()}`
    setRdvs(prev => [{ id, ...item }, ...prev])
    toast({ title: "RDV planifié", description: `${item.titre}` })
  }

  const today = new Date().toLocaleDateString("fr-FR")

  return (
    <SidebarProvider /* Collapsible sidebar and mobile behavior */>
      <AppSidebar onNavigate={navigateTo} current={section} />
      <SidebarInset>
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-md bg-blue-100 text-blue-700 grid place-items-center font-bold">
                  PM
                </div>
                <h1 className="text-xl font-semibold text-gray-900">ProspectMed Pro</h1>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="hidden md:inline">Admin • {today}</span>
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6">
          {section === "dashboard" && <DashboardSection />}
          {section === "prospects" && (
            <ProspectsSection
              prospects={prospects}
              onAddProspect={addProspect}
              onCall={(id) => toast({ title: "Appel en cours", description: `Prospect #${id}` })}
              onPlanifierRdv={planifierRdvFromProspect}
              onEdit={(id) => toast({ title: "Édition", description: `Prospect #${id}` })}
            />
          )}
          {section === "rdv" && (
            <RdvSection
              prospects={prospects}
              rdvs={rdvs}
              onAddRdv={addRdv}
              selectedProspectId={selectedProspectId}
              onResetSelected={() => setSelectedProspectId(undefined)}
            />
          )}
          {section === "qualification" && (
            <QualificationSection
              onQualify={(id, statut) => updateProspectStatus(id, statut)}
              onPlanifierRdv={planifierRdvFromProspect}
            />
          )}
          {section === "planning" && <PlanningSection />}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
