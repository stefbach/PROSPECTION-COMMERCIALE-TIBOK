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
import { Building2, CalendarPlus, ClipboardCheck, LayoutDashboard, Route } from 'lucide-react'

type Props = {
  onNavigate?: (key: "dashboard" | "prospects" | "rdv" | "qualification" | "planning") => void
  current?: "dashboard" | "prospects" | "rdv" | "qualification" | "planning"
}

export function AppSidebar({ onNavigate = () => {}, current = "dashboard" }: Props) {
  const items = [
    { key: "dashboard", title: "Tableau de Bord", icon: LayoutDashboard },
    { key: "prospects", title: "Base Prospects", icon: Building2 },
    { key: "rdv", title: "Prise de RDV", icon: CalendarPlus },
    { key: "qualification", title: "Qualification", icon: ClipboardCheck },
    { key: "planning", title: "Planning", icon: Route },
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
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 py-1 text-xs text-sidebar-foreground/60">Cmd/Ctrl+b pour basculer</div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export default AppSidebar
