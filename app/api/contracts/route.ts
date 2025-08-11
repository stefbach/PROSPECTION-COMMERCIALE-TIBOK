import { NextRequest, NextResponse } from 'next/server'

// Stockage simple en mémoire
declare global {
  var contrats: any[] | undefined
  var contratId: number | undefined
}

if (!global.contrats) {
  global.contrats = []
  global.contratId = 1
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const prospect_id = searchParams.get('prospect_id')
  
  let filtered = global.contrats || []
  if (prospect_id) {
    filtered = filtered.filter(c => c.prospect_id === parseInt(prospect_id))
  }
  
  return NextResponse.json(filtered)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const newContrat = {
    id: global.contratId++,
    ...body,
    created_at: new Date().toISOString()
  }
  global.contrats?.push(newContrat)
  return NextResponse.json(newContrat)
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const index = global.contrats?.findIndex(c => c.id === parseInt(id!)) ?? -1
  if (index > -1) {
    global.contrats?.splice(index, 1)
  }
  return NextResponse.json({ success: true })
}
