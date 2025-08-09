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

