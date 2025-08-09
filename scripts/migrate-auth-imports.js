// scripts/migrate-auth-imports.js
// Script Node.js pour migrer automatiquement les imports

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Dossiers à scanner
  directories: ['app', 'components'],
  
  // Extensions de fichiers à traiter
  extensions: ['.tsx', '.ts'],
  
  // Pattern de l'ancien import
  oldImportPattern: /import\s+{([^}]+)}\s+from\s+['"]@\/lib\/auth-system['"]/g,
  
  // Imports à placer dans auth-system.ts
  authSystemExports: [
    'PERMISSIONS',
    'Permission',
    'AUDIT_ACTIONS',
    'AuditLog',
    'hasPermission',
    'hasAnyPermission',
    'hasAllPermissions',
    'canAccessRoute',
    'checkAuth',
    'logAction',
    'checkRateLimit',
    'ROLE_PERMISSIONS',
    'AuthUser',
    'AuthContextType'
  ],
  
  // Imports à placer dans auth-components.tsx
  authComponentsExports: [
    'AuthProvider',
    'useAuth',
    'ProtectedRoute',
    'Can',
    'withAuth',
    'usePermission',
    'useProtectedNavigation',
    'AuthorizedMenuItem',
    'AuthLoading'
  ]
};

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Fonction pour scanner récursivement les dossiers
function scanDirectory(dir, files = []) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    // Ignorer node_modules et .next
    if (item.name === 'node_modules' || item.name === '.next') {
      continue;
    }
    
    if (item.isDirectory()) {
      scanDirectory(fullPath, files);
    } else if (CONFIG.extensions.some(ext => item.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Fonction pour analyser et séparer les imports
function parseImports(importStatement) {
  const match = importStatement.match(/import\s+{([^}]+)}\s+from/);
  if (!match) return [];
  
  return match[1]
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

// Fonction pour migrer un fichier
function migrateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Vérifier si le fichier importe auth-system
  if (!content.includes('@/lib/auth-system')) {
    return { modified: false };
  }
  
  console.log(`${colors.cyan}📝 Traitement: ${colors.reset}${filePath}`);
  
  let newContent = content;
  let hasChanges = false;
  const changes = [];
  
  // Trouver tous les imports de auth-system
  const matches = [...content.matchAll(CONFIG.oldImportPattern)];
  
  for (const match of matches) {
    const fullImport = match[0];
    const imports = parseImports(fullImport);
    
    // Séparer les imports
    const authSystemImports = imports.filter(imp => 
      CONFIG.authSystemExports.includes(imp.replace(/\s+as\s+\w+/, ''))
    );
    
    const authComponentsImports = imports.filter(imp => 
      CONFIG.authComponentsExports.includes(imp.replace(/\s+as\s+\w+/, ''))
    );
    
    const unknownImports = imports.filter(imp => 
      !CONFIG.authSystemExports.includes(imp.replace(/\s+as\s+\w+/, '')) &&
      !CONFIG.authComponentsExports.includes(imp.replace(/\s+as\s+\w+/, ''))
    );
    
    // Construire les nouveaux imports
    let newImports = '';
    
    if (authSystemImports.length > 0) {
      newImports += `import { ${authSystemImports.join(', ')} } from '@/lib/auth-system'\n`;
      changes.push(`  ✅ Auth-system: ${authSystemImports.join(', ')}`);
    }
    
    if (authComponentsImports.length > 0) {
      newImports += `import { ${authComponentsImports.join(', ')} } from '@/lib/auth-components'`;
      changes.push(`  ✅ Auth-components: ${authComponentsImports.join(', ')}`);
    }
    
    if (unknownImports.length > 0) {
      console.log(`  ${colors.yellow}⚠️  Imports non reconnus: ${unknownImports.join(', ')}${colors.reset}`);
      changes.push(`  ⚠️  Non reconnus: ${unknownImports.join(', ')}`);
    }
    
    // Remplacer l'ancien import
    if (newImports) {
      newContent = newContent.replace(fullImport, newImports.trim());
      hasChanges = true;
    }
  }
  
  // Sauvegarder le fichier si modifié
  if (hasChanges) {
    // Créer une sauvegarde
    const backupPath = filePath + '.backup';
    fs.writeFileSync(backupPath, content);
    
    // Écrire le nouveau contenu
    fs.writeFileSync(filePath, newContent);
    
    console.log(`  ${colors.green}✓ Fichier migré${colors.reset}`);
    changes.forEach(change => console.log(change));
    
    return {
      modified: true,
      filePath,
      backupPath,
      changes
    };
  }
  
  return { modified: false };
}

// Fonction principale
function main() {
  console.log(`${colors.blue}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║  Migration des imports auth-system     ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════╝${colors.reset}\n`);
  
  const results = {
    scanned: 0,
    modified: 0,
    errors: 0,
    files: []
  };
  
  // Scanner les dossiers
  for (const dir of CONFIG.directories) {
    if (!fs.existsSync(dir)) {
      console.log(`${colors.yellow}⚠️  Dossier non trouvé: ${dir}${colors.reset}`);
      continue;
    }
    
    console.log(`${colors.cyan}📁 Scan du dossier: ${dir}${colors.reset}`);
    const files = scanDirectory(dir);
    
    for (const file of files) {
      results.scanned++;
      
      try {
        const result = migrateFile(file);
        if (result.modified) {
          results.modified++;
          results.files.push(result);
        }
      } catch (error) {
        console.error(`${colors.red}❌ Erreur lors du traitement de ${file}: ${error.message}${colors.reset}`);
        results.errors++;
      }
    }
  }
  
  // Afficher le résumé
  console.log(`\n${colors.blue}═══════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}📊 Résumé de la migration:${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════${colors.reset}`);
  console.log(`  Fichiers scannés: ${results.scanned}`);
  console.log(`  Fichiers modifiés: ${colors.green}${results.modified}${colors.reset}`);
  console.log(`  Erreurs: ${results.errors > 0 ? colors.red : ''}${results.errors}${colors.reset}`);
  
  if (results.modified > 0) {
    console.log(`\n${colors.cyan}📋 Fichiers modifiés:${colors.reset}`);
    results.files.forEach(file => {
      console.log(`  - ${file.filePath}`);
    });
    
    console.log(`\n${colors.yellow}💡 Des sauvegardes ont été créées (.backup)${colors.reset}`);
    console.log(`${colors.yellow}   Pour annuler, restaurez les fichiers .backup${colors.reset}`);
  }
  
  // Vérifier les fichiers auth
  console.log(`\n${colors.cyan}📌 Vérification des fichiers auth:${colors.reset}`);
  
  if (!fs.existsSync('lib/auth-components.tsx')) {
    console.log(`${colors.red}❌ lib/auth-components.tsx n'existe pas!${colors.reset}`);
    console.log(`   Créez ce fichier avec le code fourni`);
  } else {
    console.log(`${colors.green}✓ lib/auth-components.tsx existe${colors.reset}`);
  }
  
  if (fs.existsSync('lib/auth-system.ts')) {
    const authSystemContent = fs.readFileSync('lib/auth-system.ts', 'utf8');
    if (authSystemContent.includes('<') && authSystemContent.includes('/>')) {
      console.log(`${colors.yellow}⚠️  lib/auth-system.ts contient du JSX!${colors.reset}`);
      console.log(`   Remplacez son contenu par la version sans JSX`);
    } else {
      console.log(`${colors.green}✓ lib/auth-system.ts ne contient pas de JSX${colors.reset}`);
    }
  }
  
  console.log(`\n${colors.green}✨ Migration terminée!${colors.reset}`);
}

// Fonction pour restaurer les backups
function restore() {
  console.log(`${colors.blue}Restauration des backups...${colors.reset}`);
  
  let restored = 0;
  for (const dir of CONFIG.directories) {
    if (!fs.existsSync(dir)) continue;
    
    const files = scanDirectory(dir);
    for (const file of files) {
      const backupPath = file + '.backup';
      if (fs.existsSync(backupPath)) {
        const backup = fs.readFileSync(backupPath, 'utf8');
        fs.writeFileSync(file, backup);
        fs.unlinkSync(backupPath);
        restored++;
        console.log(`  ✓ Restauré: ${file}`);
      }
    }
  }
  
  console.log(`${colors.green}${restored} fichiers restaurés${colors.reset}`);
}

// Fonction pour nettoyer les backups
function clean() {
  console.log(`${colors.blue}Nettoyage des backups...${colors.reset}`);
  
  let cleaned = 0;
  for (const dir of CONFIG.directories) {
    if (!fs.existsSync(dir)) continue;
    
    const files = scanDirectory(dir);
    for (const file of files) {
      const backupPath = file + '.backup';
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);
        cleaned++;
        console.log(`  ✓ Supprimé: ${backupPath}`);
      }
    }
  }
  
  console.log(`${colors.green}${cleaned} backups supprimés${colors.reset}`);
}

// Gestion des arguments de ligne de commande
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'restore':
    restore();
    break;
  case 'clean':
    clean();
    break;
  case 'help':
    console.log('Usage: node migrate-auth-imports.js [command]');
    console.log('Commands:');
    console.log('  (aucun)  - Effectue la migration');
    console.log('  restore  - Restaure les fichiers depuis les backups');
    console.log('  clean    - Supprime les fichiers backup');
    console.log('  help     - Affiche cette aide');
    break;
  default:
    main();
}

// Export pour usage programmatique
module.exports = { migrateFile, scanDirectory, main };
