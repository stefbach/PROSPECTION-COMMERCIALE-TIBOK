// app/page.tsx (mise à jour)
"use client"

import * as React from "react"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Bell, Brain } from 'lucide-react'
import DashboardSection from "@/components/sections/dashboard"
import ProspectsSection from "@/components/sections/prospects"
import RdvSection from "@/components/sections/rdv"
import QualificationSection from "@/components/sections/qualification"
import PlanningSection from "@/components/sections/planning"
import { AIDashboard } from "@/components/ai-dashboard"

type SectionKey = "dashboard" | "prospects" | "rdv" | "qualification" | "planning" | "ai"

export default function Page() {
  const [section, setSection] = React.useState<SectionKey>("dashboard")
  const [showAI, setShowAI] = React.useState(false)
  const { toast } = useToast()
  const today = new Date().toLocaleDateString("fr-FR")
  
  // Commercial actuel (à remplacer par authentification réelle)
  const currentCommercial = "Jean Dupont"

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
              <span className="hidden md:inline">{currentCommercial} • {today}</span>
              
              {/* Bouton IA */}
              <Button 
                variant={showAI ? "default" : "outline"} 
                size="sm"
                onClick={() => setShowAI(!showAI)}
                className="gap-2"
              >
                <Brain className="h-4 w-4" />
                Assistant IA
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                aria-label="Notifications" 
                onClick={() => toast({ title: 'Notifications', description: 'Aucune notification' })}
              >
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6">
          {/* Panel IA flottant */}
          {showAI && (
            <div className="fixed right-4 top-20 w-[400px] max-h-[calc(100vh-100px)] z-50 bg-background border rounded-lg shadow-xl overflow-hidden">
              <div className="p-2 border-b bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Assistant IA</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setShowAI(false)}
                  >
                    ✕
                  </Button>
                </div>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                <AIDashboard commercial={currentCommercial} />
              </div>
            </div>
          )}

          {/* Sections principales */}
          {section === "dashboard" && <DashboardSection />}
          {section === "prospects" && (
            <ProspectsSection onPlanifierRdv={() => setSection("rdv")} />
          )}
          {section === "rdv" && <RdvSection />}
          {section === "qualification" && (
            <QualificationSection
              onQualify={async (id, statut) => {
                try {
                  const res = await fetch(`/api/prospects/${id}`, { 
                    method: 'PATCH', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ statut }) 
                  })
                  if (!res.ok) throw new Error(await res.text())
                  
                  // Déclencher une analyse IA après qualification
                  if (statut === 'qualifie') {
                    fetch('/api/ai/analyze-prospect', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ prospectId: id })
                    })
                  }
                  
                  toast({ title: 'Qualifié', description: `Prospect #${id} → ${statut}` })
                } catch (e: any) {
                  toast({ title: 'Erreur', description: e.message })
                }
              }}
              onPlanifierRdv={() => setSection("rdv")}
            />
          )}
          {section === "planning" && <PlanningSection />}
          {section === "ai" && (
            <AIDashboard commercial={currentCommercial} />
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

// ============================================

// components/app-sidebar.tsx (mise à jour)
"use client"

import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Building2, CalendarPlus, ClipboardCheck, LayoutDashboard, Route, Brain } from 'lucide-react'

type Props = {
  onNavigate?: (key: "dashboard" | "prospects" | "rdv" | "qualification" | "planning" | "ai") => void
  current?: "dashboard" | "prospects" | "rdv" | "qualification" | "planning" | "ai"
}

export function AppSidebar({ onNavigate = () => {}, current = "dashboard" }: Props) {
  const items = [
    { key: "dashboard", title: "Tableau de Bord", icon: LayoutDashboard },
    { key: "prospects", title: "Base Prospects", icon: Building2 },
    { key: "rdv", title: "Prise de RDV", icon: CalendarPlus },
    { key: "qualification", title: "Qualification", icon: ClipboardCheck },
    { key: "planning", title: "Planning", icon: Route },
    { key: "ai", title: "Intelligence IA", icon: Brain, badge: "NEW" },
  ] as const

  return (
    <Sidebar variant="sidebar" collapsible="offcanvas">
      <SidebarHeader>
        <div className="px-2 py-1 text-xs text-sidebar-foreground/70">Navigation</div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>ProspectMed Pro</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={current === item.key}
                    onClick={() => onNavigate(item.key)}
                    aria-current={current === item.key ? "page" : undefined}
                  >
                    <item.icon />
                    <span className="flex items-center gap-2">
                      {item.title}
                      {item.badge && (
                        <span className="text-xs bg-gradient-to-r from-purple-500 to-blue-500 text-white px-1.5 py-0.5 rounded">
                          {item.badge}
                        </span>
                      )}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 py-1 text-xs text-sidebar-foreground/60">
          🤖 Propulsé par GPT-4
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export default AppSidebar
