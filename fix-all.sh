#!/bin/bash

echo "🔧 Correction globale des erreurs de build..."

# 1. Corriger l'export AIDashboard
if grep -q "AIDashboardEnhanced" components/ai-dashboard.tsx 2>/dev/null; then
  sed -i '' 's/AIDashboardEnhanced/AIDashboard/g' components/ai-dashboard.tsx
  echo "✅ Export AIDashboard corrigé"
fi

# 2. Protéger tous les .map() dans les fichiers
find app -name "*.tsx" -o -name "*.ts" | while read file; do
  if grep -q "\.map(" "$file" 2>/dev/null; then
    echo "⚠️  Vérifiez les .map() dans: $file"
  fi
done

# 3. Nettoyer et rebuilder
rm -rf .next
echo "🚀 Lancement du build..."
pnpm build
