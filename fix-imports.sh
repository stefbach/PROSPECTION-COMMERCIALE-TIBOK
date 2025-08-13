#!/bin/bash

echo "🚀 Correction automatique des imports ProspectMed..."
echo ""

# Détection du système
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="mac"
    echo "✓ Système : macOS"
else
    OS="linux"
    echo "✓ Système : Linux/Windows"
fi

echo ""
echo "📝 Correction du fichier openai-service.ts..."

# Corriger openai-service.ts
if [ -f "lib/openai-service.ts" ]; then
    cp lib/openai-service.ts lib/openai-service.ts.backup
    if [[ "$OS" == "mac" ]]; then
        sed -i '' 's/export { AIService, planifyWeeklyTours }/export { planifyWeeklyTours }/' lib/openai-service.ts
        sed -i '' 's/private static getZone/static getZone/g' lib/openai-service.ts
    else
        sed -i 's/export { AIService, planifyWeeklyTours }/export { planifyWeeklyTours }/' lib/openai-service.ts
        sed -i 's/private static getZone/static getZone/g' lib/openai-service.ts
    fi
    echo "✓ openai-service.ts corrigé"
fi

echo ""
echo "📝 Correction des imports dans les API..."

# Corriger tous les fichiers API
FILES=(
    "app/api/ai/analyze-prospect/route.ts"
    "app/api/ai/chat/route.ts"
    "app/api/ai/generate-script/route.ts"
    "app/api/ai/next-actions/route.ts"
    "app/api/ai/optimize-planning/route.ts"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  → $file"
        if [[ "$OS" == "mac" ]]; then
            sed -i '' "s/import { AIService }/import AIService/g" "$file"
        else
            sed -i "s/import { AIService }/import AIService/g" "$file"
        fi
    fi
done

echo ""
echo "✅ Corrections terminées !"
echo ""
echo "Test de compilation..."
npm run build
