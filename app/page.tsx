"use client"

import * as React from "react"

export default function Page() {
  const [section, setSection] = React.useState("debug")
  const [apiResponse, setApiResponse] = React.useState(null)
  const [prospects, setProspects] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    testAPI()
  }, [])

  async function testAPI() {
    setLoading(true)
    setError("")
    try {
      console.log("🔍 Appel API /api/prospects...")
      const res = await fetch('/api/prospects')
      const data = await res.json()
      
      console.log("📦 Réponse brute:", data)
      setApiResponse(data)
      
      // Essayer différentes structures possibles
      const possibleData = 
        data.data ||           // { data: [...] }
        data.prospects ||      // { prospects: [...] }
        data.results ||        // { results: [...] }
        data.items ||          // { items: [...] }
        data ||                // Directement un array
        []
      
      console.log("📋 Données extraites:", possibleData)
      
      if (Array.isArray(possibleData)) {
        setProspects(possibleData)
      } else if (typeof possibleData === 'object') {
        // Si c'est un objet, prendre ses valeurs
        setProspects(Object.values(possibleData))
      }
      
    } catch (err) {
      console.error("❌ Erreur:", err)
      setError(err.message || "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-6">ProspectMed - Mode Debug</h1>
      
      {/* Navigation */}
      <div className="flex gap-2 mb-6">
        <button 
          onClick={() => setSection('debug')}
          className={`px-4 py-2 rounded ${section === 'debug' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
        >
          🔍 Debug API
        </button>
        <button 
          onClick={() => setSection('prospects')}
          className={`px-4 py-2 rounded ${section === 'prospects' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          📋 Prospects ({prospects.length})
        </button>
        <button 
          onClick={testAPI}
          className="px-4 py-2 bg-green-500 text-white rounded ml-auto"
        >
          🔄 Recharger
        </button>
      </div>

      {loading && <p className="text-blue-600">⏳ Chargement...</p>}
      {error && <p className="text-red-600">❌ Erreur: {error}</p>}

      {/* Section Debug */}
      {section === 'debug' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-bold mb-2 text-red-600">🔴 RÉPONSE API BRUTE</h2>
            <pre className="bg-black text-green-400 p-4 rounded overflow-x-auto text-xs">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-bold mb-2 text-blue-600">🔵 DONNÉES EXTRAITES</h2>
            <p className="mb-2">Type: {Array.isArray(prospects) ? 'Array' : typeof prospects}</p>
            <p className="mb-2">Nombre: {prospects.length}</p>
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-xs">
              {JSON.stringify(prospects, null, 2)}
            </pre>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-bold mb-2">📊 STRUCTURE DU PREMIER ÉLÉMENT</h2>
            {prospects.length > 0 ? (
              <div className="space-y-2">
                <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                  Clés disponibles: {Object.keys(prospects[0]).join(', ')}
                </p>
                <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-xs">
                  {JSON.stringify(prospects[0], null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-gray-500">Aucune donnée</p>
            )}
          </div>
        </div>
      )}

      {/* Section Prospects */}
      {section === 'prospects' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Liste des Prospects ({prospects.length})</h2>
          
          {prospects.length > 0 ? (
            <div className="space-y-2">
              {prospects.map((p, index) => (
                <div key={p.id || p._id || index} className="bg-white p-4 rounded shadow">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-bold">ID:</span> {p.id || p._id || index}
                    </div>
                    <div>
                      <span className="font-bold">Nom:</span> {p.nom || p.name || p.title || 'N/A'}
                    </div>
                    <div>
                      <span className="font-bold">Ville:</span> {p.ville || p.city || p.location || 'N/A'}
                    </div>
                    <div>
                      <span className="font-bold">Statut:</span> {p.statut || p.status || 'N/A'}
                    </div>
                  </div>
                  
                  <details className="mt-2">
                    <summary className="cursor-pointer text-blue-600 text-sm">Voir tout l'objet</summary>
                    <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                      {JSON.stringify(p, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Aucun prospect trouvé</p>
          )}
        </div>
      )}

      {/* Console de test */}
      <div className="mt-8 bg-yellow-50 p-4 rounded border border-yellow-200">
        <h3 className="font-bold mb-2">🛠️ Console de test</h3>
        <div className="space-x-2">
          <button 
            onClick={() => {
              fetch('/api/prospects')
                .then(r => r.text())
                .then(text => {
                  console.log("Réponse texte:", text)
                  alert("Réponse brute:\n" + text.substring(0, 500))
                })
            }}
            className="px-3 py-1 bg-yellow-500 text-white rounded text-sm"
          >
            Test Response Text
          </button>
          
          <button 
            onClick={() => {
              fetch('/api/prospects')
                .then(r => {
                  console.log("Headers:", Object.fromEntries(r.headers.entries()))
                  console.log("Status:", r.status)
                  return r.json()
                })
                .then(d => console.log("Data:", d))
            }}
            className="px-3 py-1 bg-purple-500 text-white rounded text-sm"
          >
            Log Console
          </button>
          
          <button 
            onClick={() => {
              console.clear()
              console.log("Console cleared")
            }}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
          >
            Clear Console
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2">Ouvrez la console du navigateur (F12) pour voir les logs</p>
      </div>
    </div>
  )
}
