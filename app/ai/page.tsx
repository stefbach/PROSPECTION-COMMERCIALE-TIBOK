'use client'

import { AICommercialWorkflow } from '@/components/ai-commercial-workflow'

export default function AIPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-6">Système IA Commercial</h1>
        <AICommercialWorkflow />
      </div>
    </div>
  )
}
