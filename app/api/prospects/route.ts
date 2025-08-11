import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/database'

export async function GET(request: NextRequest) {
  try {
    const prospects = db.getProspects()
    return NextResponse.json(prospects)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const newProspect = db.createProspect(body)
    return NextResponse.json(newProspect, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const updated = db.updateProspect(body.id, body)
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    db.deleteProspect(parseInt(id!))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}
