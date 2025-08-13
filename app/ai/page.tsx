'use client'

import * as React from 'react'

export default function AIPage() {
  const [callList, setCallList] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)

  const generateList = async () => {
    setLoading(true)
    
    // Charger les prospects
    try {
      const res = await fetch('/api/prospects?limit=100')
      const data = await res.json()
      const prospects = data.data || data || []
      
      // Trier : Hôtels d'abord, puis pharmacies, puis autres
      const sorted = prospects.sort((a: any, b: any) => {
        const order: any = { hotel: 1, pharmacie: 2, entreprise: 3, autre: 4 }
        return (order[a.secteur] || 5) - (order[b.secteur] || 5)
      })
      
      setCallList(sorted.slice(0, 30))
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🤖 Système IA Commercial ProspectMed</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Workflow Intelligent</h2>
          <p className="text-gray-600 mb-4">
            Organisation automatique : Hôtels (priorité MAX) → Pharmacies → Entreprises
          </p>
          <button
            onClick={generateList}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Chargement...' : '📞 Générer Liste d\'Appels'}
          </button>
        </div>

        {callList.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">
              Liste d'Appels du Jour ({callList.length} prospects)
            </h3>
            
            <div className="space-y-4">
              {/* Hôtels */}
              {callList.filter((p: any) => p.secteur === 'hotel').length > 0 && (
                <div>
                  <h4 className="font-semibold text-blue-600 mb-2">
                    🏨 HÔTELS - Priorité MAXIMALE
                  </h4>
                  <div className="space-y-2">
                    {callList.filter((p: any) => p.secteur === 'hotel').map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-blue-50 rounded">
                        <div>
                          <p className="font-medium">{p.nom}</p>
                          <p className="text-sm text-gray-600">{p.ville} • {p.telephone || 'Pas de tél'}</p>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-yellow-500">{'★'.repeat(p.score || 3)}</span>
                          <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                            Appeler
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pharmacies */}
              {callList.filter((p: any) => p.secteur === 'pharmacie').length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-600 mb-2">
                    💊 PHARMACIES - Priorité HAUTE
                  </h4>
                  <div className="space-y-2">
                    {callList.filter((p: any) => p.secteur === 'pharmacie').map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-green-50 rounded">
                        <div>
                          <p className="font-medium">{p.nom}</p>
                          <p className="text-sm text-gray-600">{p.ville} • {p.telephone || 'Pas de tél'}</p>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-yellow-500">{'★'.repeat(p.score || 3)}</span>
                          <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                            Appeler
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Entreprises */}
              {callList.filter((p: any) => p.secteur === 'entreprise').length > 0 && (
                <div>
                  <h4 className="font-semibold text-purple-600 mb-2">
                    🏢 ENTREPRISES - Opportunités
                  </h4>
                  <div className="space-y-2">
                    {callList.filter((p: any) => p.secteur === 'entreprise').slice(0, 5).map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-3 bg-purple-50 rounded">
                        <div>
                          <p className="font-medium">{p.nom}</p>
                          <p className="text-sm text-gray-600">{p.ville} • {p.telephone || 'Pas de tél'}</p>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-yellow-500">{'★'.repeat(p.score || 3)}</span>
                          <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                            Appeler
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
