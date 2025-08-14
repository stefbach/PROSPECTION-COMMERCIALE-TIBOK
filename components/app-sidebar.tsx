'use client'

import * as React from 'react'
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton 
} from "@/components/ui/sidebar"
import { Home, Users, Calendar, Brain } from "lucide-react"

interface AppSidebarProps {
  onNavigate?: (section: string) => void
  current?: string
}

export function AppSidebar({ onNavigate = () => {}, current = 'dashboard' }: AppSidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: Home },
    { id: 'prospects', label: 'Prospects', icon: Users },
    { id: 'rdv', label: 'Rendez-vous', icon: Calendar },
    { id: 'planning', label: 'Planning', icon: Calendar },
    { id: 'ai', label: 'Assistant IA', icon: Brain }
  ]

  // Protection contre undefined
  if (!menuItems || !Array.isArray(menuItems)) {
    return <Sidebar><SidebarContent>Loading...</SidebarContent></Sidebar>
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="h-8 w-8 rounded-md bg-blue-100 text-blue-700 grid place-items-center font-bold">
            PM
          </div>
          <div>
            <h2 className="text-lg font-semibold">ProspectMed</h2>
            <p className="text-xs text-muted-foreground">Pro Version</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => {
            const Icon = item?.icon || Home
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  onClick={() => onNavigate && onNavigate(item.id)}
                  isActive={current === item.id}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label || 'Menu'}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="px-2 py-4 text-xs text-muted-foreground">
          © 2025 ProspectMed
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
