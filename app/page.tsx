"use client"

import * as React from "react"

export default function Page() {
  const [prospects, setProspects] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(0)
  const [totalProspects, setTotalProspects] = React.useState(0)
  const [search, setSearch] = React.useState("")
  const limit = 50

  React.useEffect(() => {
    loadProspects(1)
  }, [])

  async function loadProspects(pageNum: number, searchTerm: string = search) {
    setLoading(true)
    setError("")
    try {
      const url = `/api/prospects?page=${pageNum}&limit=${limit}${searchTerm ? `&search=${searchTerm}` : ''}`
      console.log(`🔍 Requête: ${url}`)
      
      const res = await fetch(url)
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || `Erreur ${res.status}`)
      }
      
      const data = await res.json()
      console.log('✅ Réponse:', data)
      
      setProspects(data.data || [])
      setPage(pageNum)
      
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1)
        setTotalProspects(data.pagination.total || 0)
      }
      
    } catch (err: any) {
      console.error('❌ Erreur:', err)
      setError(err.message || 'Erreur de chargement')
      
      // Si Supabase n'est pas configuré, afficher les instructions
      if (err.message?.includes('SUPABASE_URL')) {
        setError('Supabase non configuré. Voir les instructions ci-dessous.')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    loadProspects(1, search)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">ProspectMed Pro - Île Maurice</h1>
            <p className="text-sm text-gray-600">
              Base Supabase : <span className="font-bold text-blue-600">{totalProspects}</span> prospects
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              Page {page} sur {totalPages} • {prospects.length} affichés
            </p>
          </div>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white px-6 py-4 border-b">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou ville..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
          />
          <button 
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            🔍 Rechercher
          </button>
          {search && (
            <button 
              type="button"
              onClick={() => {
                setSearch("")
                loadProspects(1, "")
              }}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              ✕ Effacer
            </button>
          )}
        </form>
      </div>

      {/* Stats */}
      <div className="p-6 grid grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-xs text-gray-600">Total BDD</p>
          <p className="text-2xl font-bold text-blue-600">4067</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-xs text-gray-600">Hôtels</p>
          <p className="text-2xl font-bold">🏨 {prospects.filter(p => p.secteur === 'hotel').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-xs text-gray-600">Pharmacies</p>
          <p className="text-2xl font-bold">💊 {prospects.filter(p => p.secteur === 'pharmacie').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-xs text-gray-600">Cliniques</p>
          <p className="text-2xl font-bold">🏥 {prospects.filter(p => p.secteur === 'clinique').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-xs text-gray-600">Statut</p>
          <p className="text-2xl font-bold">{loading ? '⏳' : error ? '❌' : '✅'}</p>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-semibold mb-2">⚠️ {error}</p>
          
          {error.includes('Supabase') && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <p className="font-bold mb-2">📝 Configuration Supabase requise :</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-700">
                <li>Allez sur Vercel → Settings → Environment Variables</li>
                <li>Ajoutez : <code className="bg-gray-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code></li>
                <li>Ajoutez : <code className="bg-gray-100 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
                <li>Redéployez l'application</li>
              </ol>
            </div>
          )}
          
          <button 
            onClick={() => loadProspects(page)}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Pagination */}
      <div className="px-6 pb-4 flex justify-center items-center gap-2">
        <button 
          onClick={() => loadProspects(1)}
          disabled={page === 1 || loading}
          className="px-3 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
        >
          ⏮️
        </button>
        
        {page > 3 && (
          <>
            <button onClick={() => loadProspects(1)} className="px-3 py-1 text-sm">1</button>
            <span>...</span>
          </>
        )}
        
        {[...Array(5)].map((_, i) => {
          const pageNum = page - 2 + i
          if (pageNum < 1 || pageNum > totalPages) return null
          return (
            <button
              key={pageNum}
              onClick={() => loadProspects(pageNum)}
              className={`px-3 py-1 rounded ${
                pageNum === page 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white hover:bg-gray-100'
              }`}
            >
              {pageNum}
            </button>
          )
        })}
        
        {page < totalPages - 2 && (
          <>
            <span>...</span>
            <button onClick={() => loadProspects(totalPages)} className="px-3 py-1 text-sm">
              {totalPages}
            </button>
          </>
        )}
        
        <button 
          onClick={() => loadProspects(Math.min(totalPages, page + 1))}
          disabled={page === totalPages || loading}
          className="px-3 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
        >
          ⏭️
        </button>
        
        <div className="ml-4 flex items-center gap-2">
          <span className="text-sm">Aller à :</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={page}
            onChange={(e) => {
              const p = parseInt(e.target.value)
              if (p >= 1 && p <= totalPages) loadProspects(p)
            }}
            className="w-16 px-2 py-1 border rounded text-center"
          />
        </div>
      </div>

      {/* Liste des prospects */}
      <div className="px-6 pb-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2">Chargement...</p>
          </div>
        ) : prospects.length > 0 ? (
          <div className="grid gap-2">
            {prospects.map((p) => (
              <div key={p.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-all">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {p.secteur === 'hotel' ? '🏨' : 
                       p.secteur === 'pharmacie' ? '💊' : 
                       p.secteur === 'clinique' ? '🏥' : '🏢'}
                    </span>
                    <div>
                      <h3 className="font-semibold">{p.nom || 'Sans nom'}</h3>
                      <p className="text-sm text-gray-600">
                        {p.ville || 'Ville N/A'} • {p.district || 'District N/A'}
                        {p.telephone && ` • 📞 ${p.telephone}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      p.statut === 'nouveau' ? 'bg-blue-100 text-blue-700' :
                      p.statut === 'qualifie' ? 'bg-green-100 text-green-700' :
                      p.statut === 'proposition' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {p.statut || 'nouveau'}
                    </span>
                    <button className="px-3 py-1 bg-indigo-500 text-white text-sm rounded hover:bg-indigo-600">
                      Détails
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-8 text-gray-500">Aucun prospect trouvé</p>
        )}
      </div>
    </div>
  )
}
