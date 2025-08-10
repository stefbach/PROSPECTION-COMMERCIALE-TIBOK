import { NextRequest, NextResponse } from 'next/server'

// GET - Récupérer tous les RDV
export async function GET(request: NextRequest) {
  try {
    // Ici, connectez-vous à votre base de données
    // Pour l'exemple, je retourne des données mockées
    const rdvs = [
      {
        id: 1,
        prospect_id: 1,
        titre: "RDV Example",
        commercial: "M. Dupont",
        date_time: new Date().toISOString(),
        type_visite: "decouverte",
        priorite: "normale",
        duree_min: 60,
        notes: "Premier contact",
        statut: "planifie"
      }
    ]
    
    return NextResponse.json(rdvs)
  } catch (error) {
    console.error('Erreur GET /api/rdv:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des RDV' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau RDV
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validation des données
    if (!body.prospect_id || !body.commercial || !body.date_time) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
    }
    
    // Ici, sauvegardez dans votre base de données
    // Pour l'exemple, je retourne les données reçues avec un ID
    const newRdv = {
      id: Date.now(),
      ...body,
      created_at: new Date().toISOString()
    }
    
    return NextResponse.json(newRdv, { status: 201 })
  } catch (error) {
    console.error('Erreur POST /api/rdv:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du RDV' },
      { status: 500 }
    )
  }
}

// PATCH - Mettre à jour un RDV
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID du RDV manquant' },
        { status: 400 }
      )
    }
    
    // Ici, mettez à jour dans votre base de données
    const updatedRdv = {
      id,
      ...updateData,
      updated_at: new Date().toISOString()
    }
    
    return NextResponse.json(updatedRdv)
  } catch (error) {
    console.error('Erreur PATCH /api/rdv:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du RDV' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un RDV
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID du RDV manquant' },
        { status: 400 }
      )
    }
    
    // Ici, supprimez de votre base de données
    
    return NextResponse.json(
      { message: 'RDV supprimé avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur DELETE /api/rdv:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du RDV' },
      { status: 500 }
    )
  }
}
