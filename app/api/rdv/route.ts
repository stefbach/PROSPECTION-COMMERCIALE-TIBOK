import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/database'

export async function GET(request: NextRequest) {
  try {
    const rdvs = db.getRdvs()
    const { searchParams } = new URL(request.url)
    const prospect_id = searchParams.get('prospect_id')
    
    let filtered = rdvs
    if (prospect_id) {
      filtered = rdvs.filter(r => r.prospect_id === parseInt(prospect_id))
    }
    
    return NextResponse.json(db.enrichRdvs(filtered))
  } catch (error) {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const newRdv = db.createRdv(body)
    return NextResponse.json(newRdv, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const updated = db.updateRdv(body.id, body)
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    db.deleteRdv(parseInt(id!))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}
