'use client'

export default function CommercialDashboardPage() {
  const rdvs = []
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard Commercial</h1>
      <div className="space-y-4">
        {rdvs && rdvs.length > 0 ? (
          rdvs.map((rdv, i) => (
            <div key={i} className="p-4 border rounded">{rdv}</div>
          ))
        ) : (
          <p>Aucun RDV aujourd'hui</p>
        )}
      </div>
    </div>
  )
}
