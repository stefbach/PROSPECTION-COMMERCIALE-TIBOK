// app/planning/page.tsx
'use client'

import PlanningAdvancedSection from '@/components/sections/planning'

export default function PlanningPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <PlanningAdvancedSection />
      </div>
    </div>
  )
}
