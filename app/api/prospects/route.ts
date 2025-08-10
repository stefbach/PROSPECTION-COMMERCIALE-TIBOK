// =====================================
// app/api/prospects/route.ts
// =====================================

import { NextRequest, NextResponse } from 'next/server'

// Simuler une base de données en mémoire (à remplacer par votre vraie DB)
let prospects = [
  {
    id: 1,
    nom: "Clinique Saint-Martin",
    email: "contact@clinique-st-martin.fr",
    telephone: "+33 1 45 67 89 00",
    adresse: "45 rue de la Santé",
    ville: "Paris",
    code_postal: "75014",
    pays: "France",
    secteur: "Santé",
    statut: "nouveau",
    notes: "Très intéressés par notre solution",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    nom: "EHPAD Les Jardins",
    email: "direction@ehpad-jardins.fr",
    telephone: "+33 4 78 90 12 34",
    adresse: "12 avenue des Roses",
    ville: "Lyon",
    code_postal: "69003",
    pays: "France",
    secteur: "Senior",
    statut: "qualifie",
    notes: "Besoin urgent de modernisation",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

// GET - Récupérer tous les prospects
export async function GET(request: NextRequest) {
  try {
    console.log('API GET /prospects - Nombre de prospects:', prospects.length)
    
    // Si vous avez une vraie base de données, remplacez par :
    // const prospects = await db.prospect.findMany()
    
    return NextResponse.json(prospects)
  } catch (error) {
    console.error('Erreur GET /api/prospects:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des prospects' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau prospect
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('API POST /prospects - Données reçues:', body)
    
    // Validation des données
    if (!body.nom || !body.email || !body.telephone) {
      return NextResponse.json(
        { error: 'Données manquantes: nom, email et téléphone sont requis' },
        { status: 400 }
      )
    }
    
    // Créer le nouveau prospect
    const newProspect = {
      id: Date.now(), // ID temporaire, remplacer par auto-increment DB
      ...body,
      statut: body.statut || 'nouveau',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Ajouter à la "base de données"
    prospects.push(newProspect)
    
    // Si vous avez une vraie base de données :
    // const newProspect = await db.prospect.create({ data: body })
    
    console.log('Prospect créé:', newProspect)
    return NextResponse.json(newProspect, { status: 201 })
  } catch (error) {
    console.error('Erreur POST /api/prospects:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du prospect' },
      { status: 500 }
    )
  }
}

// =====================================
// app/api/prospects/[id]/route.ts
// =====================================

// import { NextRequest, NextResponse } from 'next/server'

// PATCH - Mettre à jour un prospect
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()
    
    console.log(`API PATCH /prospects/${id} - Données:`, body)
    
    // Trouver et mettre à jour le prospect
    const index = prospects.findIndex(p => p.id === id)
    if (index === -1) {
      return NextResponse.json(
        { error: 'Prospect non trouvé' },
        { status: 404 }
      )
    }
    
    prospects[index] = {
      ...prospects[index],
      ...body,
      updated_at: new Date().toISOString()
    }
    
    // Si vous avez une vraie base de données :
    // const updated = await db.prospect.update({
    //   where: { id },
    //   data: body
    // })
    
    return NextResponse.json(prospects[index])
  } catch (error) {
    console.error('Erreur PATCH /api/prospects/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un prospect
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    console.log(`API DELETE /prospects/${id}`)
    
    // Filtrer pour supprimer
    const initialLength = prospects.length
    prospects = prospects.filter(p => p.id !== id)
    
    if (prospects.length === initialLength) {
      return NextResponse.json(
        { error: 'Prospect non trouvé' },
        { status: 404 }
      )
    }
    
    // Si vous avez une vraie base de données :
    // await db.prospect.delete({ where: { id } })
    
    return NextResponse.json({ success: true, message: 'Prospect supprimé' })
  } catch (error) {
    console.error('Erreur DELETE /api/prospects/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    )
  }
}

// =====================================
// app/api/rdv/route.ts
// =====================================

// import { NextRequest, NextResponse } from 'next/server'

// Simuler une base de données en mémoire pour les RDV
let rdvs: any[] = []

// GET - Récupérer tous les RDV
export async function GET_RDV(request: NextRequest) {
  try {
    console.log('API GET /rdv - Nombre de RDV:', rdvs.length)
    
    // Si vous avez une vraie base de données :
    // const rdvs = await db.rdv.findMany()
    
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
export async function POST_RDV(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('API POST /rdv - Données reçues:', body)
    
    // Validation des données
    if (!body.prospect_id || !body.commercial || !body.date_time) {
      return NextResponse.json(
        { error: 'Données manquantes: prospect_id, commercial et date_time sont requis' },
        { status: 400 }
      )
    }
    
    // Créer le nouveau RDV
    const newRdv = {
      id: Date.now(), // ID temporaire
      prospect_id: body.prospect_id,
      titre: body.titre || 'Nouveau RDV',
      commercial: body.commercial,
      date_time: body.date_time,
      type_visite: body.type_visite || 'decouverte',
      priorite: body.priorite || 'normale',
      duree_min: body.duree_min || 60,
      notes: body.notes || '',
      statut: body.statut || 'planifie',
      created_at: new Date().toISOString()
    }
    
    // Ajouter à la "base de données"
    rdvs.push(newRdv)
    
    // Si vous avez une vraie base de données :
    // const newRdv = await db.rdv.create({ data: body })
    
    console.log('RDV créé:', newRdv)
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
export async function PATCH_RDV(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    console.log(`API PATCH /rdv/${id} - Données:`, updateData)
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID du RDV manquant' },
        { status: 400 }
      )
    }
    
    // Trouver et mettre à jour le RDV
    const index = rdvs.findIndex(r => r.id === id)
    if (index === -1) {
      return NextResponse.json(
        { error: 'RDV non trouvé' },
        { status: 404 }
      )
    }
    
    rdvs[index] = {
      ...rdvs[index],
      ...updateData,
      updated_at: new Date().toISOString()
    }
    
    // Si vous avez une vraie base de données :
    // const updated = await db.rdv.update({
    //   where: { id },
    //   data: updateData
    // })
    
    return NextResponse.json(rdvs[index])
  } catch (error) {
    console.error('Erreur PATCH /api/rdv:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du RDV' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un RDV
export async function DELETE_RDV(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    console.log(`API DELETE /rdv?id=${id}`)
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID du RDV manquant' },
        { status: 400 }
      )
    }
    
    // Filtrer pour supprimer
    const initialLength = rdvs.length
    rdvs = rdvs.filter(r => r.id !== parseInt(id))
    
    if (rdvs.length === initialLength) {
      return NextResponse.json(
        { error: 'RDV non trouvé' },
        { status: 404 }
      )
    }
    
    // Si vous avez une vraie base de données :
    // await db.rdv.delete({ where: { id: parseInt(id) } })
    
    return NextResponse.json({ 
      success: true, 
      message: 'RDV supprimé avec succès' 
    })
  } catch (error) {
    console.error('Erreur DELETE /api/rdv:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du RDV' },
      { status: 500 }
    )
  }
}

// =====================================
// NOTES D'IMPLÉMENTATION
// =====================================
/*
Pour connecter à une vraie base de données (ex: Prisma), remplacez les tableaux en mémoire par :

1. Installer Prisma:
   npm install prisma @prisma/client

2. Créer le schéma Prisma (prisma/schema.prisma):
   
   model Prospect {
     id          Int      @id @default(autoincrement())
     nom         String
     email       String
     telephone   String
     adresse     String
     ville       String
     code_postal String?
     pays        String   @default("France")
     secteur     String
     statut      String   @default("nouveau")
     notes       String?
     created_at  DateTime @default(now())
     updated_at  DateTime @updatedAt
     rdvs        Rdv[]
   }
   
   model Rdv {
     id           Int      @id @default(autoincrement())
     prospect_id  Int
     prospect     Prospect @relation(fields: [prospect_id], references: [id])
     titre        String
     commercial   String
     date_time    DateTime
     type_visite  String
     priorite     String
     duree_min    Int
     notes        String?
     statut       String   @default("planifie")
     created_at   DateTime @default(now())
     updated_at   DateTime @updatedAt
   }

3. Initialiser Prisma:
   npx prisma init
   npx prisma db push

4. Remplacer les tableaux par des appels Prisma:
   import { PrismaClient } from '@prisma/client'
   const prisma = new PrismaClient()
   
   // GET prospects
   const prospects = await prisma.prospect.findMany()
   
   // POST prospect
   const newProspect = await prisma.prospect.create({ data: body })
   
   // etc...
*/
