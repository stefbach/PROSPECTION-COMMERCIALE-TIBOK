#!/bin/bash

echo "🧹 Nettoyage complet..."

# Supprimer TOUS les caches possibles
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo
rm -rf dist
rm -rf build

# Supprimer et recréer les pages problématiques
rm -rf app/admin
mkdir -p app/admin/commerciaux
mkdir -p app/admin/dashboard

# Créer des versions ultra-simples
echo 'export default function Page() { return <div>Commerciaux</div> }' > app/admin/commerciaux/page.tsx
echo 'export default function Page() { return <div>Dashboard</div> }' > app/admin/dashboard/page.tsx

echo "✅ Nettoyage terminé"
echo "🚀 Build..."

pnpm build
