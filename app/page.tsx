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

type SectionKey = "dashboard" | "prospects" | "rdv" | "qualification" | "planning"

export default function Page() {
  const [section, setSection] = React.useState<SectionKey>("dashboard")
  const { toast } = useToast()
  const today = new Date().toLocaleDateString("fr-FR")

  function navigateTo(next: SectionKey) {
    setSection(next)
  }

  return (
    <SidebarProvider>
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
              <Button variant="ghost" size="icon" aria-label="Notifications" onClick={() => toast({ title: 'Notifications', description: 'Aucune notification' })}>
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6">
          {section === "dashboard" && <DashboardSection />}
          {section === "prospects" && (
            <ProspectsSection
              onPlanifierRdv={() => setSection("rdv")}
            />
          )}
          {section === "rdv" && <RdvSection />}
          {section === "qualification" && (
            <QualificationSection
              onQualify={async (id, statut) => {
                try {
                  const res = await fetch(`/api/prospects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ statut }) })
                  if (!res.ok) throw new Error(await res.text())
                  toast({ title: 'Qualifié', description: `Prospect #${id} → ${statut}` })
                } catch (e: any) {
                  toast({ title: 'Erreur', description: e.message })
                }
              }}
              onPlanifierRdv={() => setSection("rdv")}
            />
          )}
          {section === "planning" && <PlanningSection />}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
