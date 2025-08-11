// app/api/upload/route.ts
// API pour gérer l'upload de fichiers

import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }
    
    // Vérifier le type de fichier
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé' },
        { status: 400 }
      )
    }
    
    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux (max 10MB)' },
        { status: 400 }
      )
    }
    
    // Créer un nom de fichier unique
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Créer le dossier uploads s'il n'existe pas
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'contrats')
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      console.log('Dossier uploads existe déjà')
    }
    
    // Générer un nom unique pour le fichier
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(7)
    const extension = file.name.split('.').pop()
    const fileName = `${timestamp}-${randomString}.${extension}`
    const filePath = join(uploadDir, fileName)
    
    // Sauvegarder le fichier
    await writeFile(filePath, buffer)
    
    // Retourner l'URL du fichier
    const fileUrl = `/uploads/contrats/${fileName}`
    
    console.log(`✅ Fichier uploadé: ${fileName}`)
    
    return NextResponse.json({
      success: true,
      fileName: fileName,
      originalName: file.name,
      url: fileUrl,
      size: file.size,
      type: file.type
    })
    
  } catch (error) {
    console.error('❌ Erreur upload:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload du fichier' },
      { status: 500 }
    )
  }
}

// GET - Récupérer la liste des fichiers uploadés
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contratId = searchParams.get('contrat_id')
    
    // Pour l'instant, retourner une liste vide
    // En production, vous devriez stocker les associations fichier-contrat dans une base de données
    return NextResponse.json({
      files: [],
      total: 0
    })
    
  } catch (error) {
    console.error('❌ Erreur GET /api/upload:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des fichiers' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un fichier
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('file')
    
    if (!fileName) {
      return NextResponse.json(
        { error: 'Nom du fichier requis' },
        { status: 400 }
      )
    }
    
    // Vérifier que le fichier existe et le supprimer
    const filePath = join(process.cwd(), 'public', 'uploads', 'contrats', fileName)
    
    // Note: En production, vous devriez vérifier les permissions avant de supprimer
    const fs = await import('fs/promises')
    
    try {
      await fs.unlink(filePath)
      console.log(`✅ Fichier supprimé: ${fileName}`)
      
      return NextResponse.json({
        success: true,
        message: 'Fichier supprimé avec succès'
      })
    } catch (error) {
      console.error('Fichier non trouvé:', fileName)
      return NextResponse.json(
        { error: 'Fichier non trouvé' },
        { status: 404 }
      )
    }
    
  } catch (error) {
    console.error('❌ Erreur DELETE /api/upload:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du fichier' },
      { status: 500 }
    )
  }
}
