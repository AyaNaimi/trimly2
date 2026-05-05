#!/usr/bin/env node

/**
 * Script de vérification des traductions
 * Vérifie que toutes les langues ont les mêmes clés
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const LANGUAGES = ['en', 'fr', 'es'];

console.log('🌍 Vérification des traductions...\n');

// Charger tous les fichiers de traduction
const translations = {};
let hasErrors = false;

LANGUAGES.forEach(lang => {
  const filePath = path.join(LOCALES_DIR, `${lang}.json`);
  try {
    translations[lang] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`✅ ${lang}.json chargé`);
  } catch (error) {
    console.error(`❌ Erreur lors du chargement de ${lang}.json:`, error.message);
    hasErrors = true;
  }
});

if (hasErrors) {
  process.exit(1);
}

console.log('\n📊 Analyse des clés...\n');

// Fonction pour obtenir toutes les clés d'un objet de manière récursive
function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// Obtenir toutes les clés pour chaque langue
const allKeys = {};
LANGUAGES.forEach(lang => {
  allKeys[lang] = getAllKeys(translations[lang]);
});

// Comparer les clés
const referenceKeys = allKeys['en'];
console.log(`📝 Langue de référence (en): ${referenceKeys.length} clés\n`);

LANGUAGES.forEach(lang => {
  if (lang === 'en') return;
  
  const langKeys = allKeys[lang];
  console.log(`🔍 Vérification de ${lang}:`);
  console.log(`   Total: ${langKeys.length} clés`);
  
  // Clés manquantes
  const missingKeys = referenceKeys.filter(key => !langKeys.includes(key));
  if (missingKeys.length > 0) {
    console.log(`   ❌ ${missingKeys.length} clés manquantes:`);
    missingKeys.forEach(key => console.log(`      - ${key}`));
    hasErrors = true;
  } else {
    console.log(`   ✅ Aucune clé manquante`);
  }
  
  // Clés en trop
  const extraKeys = langKeys.filter(key => !referenceKeys.includes(key));
  if (extraKeys.length > 0) {
    console.log(`   ⚠️  ${extraKeys.length} clés en trop:`);
    extraKeys.forEach(key => console.log(`      - ${key}`));
    hasErrors = true;
  }
  
  console.log('');
});

// Vérifier les valeurs vides
console.log('🔍 Vérification des valeurs vides...\n');

function findEmptyValues(obj, prefix = '', lang = '') {
  const empty = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      empty.push(...findEmptyValues(obj[key], fullKey, lang));
    } else if (obj[key] === '' || obj[key] === null || obj[key] === undefined) {
      empty.push({ lang, key: fullKey });
    }
  }
  return empty;
}

LANGUAGES.forEach(lang => {
  const emptyValues = findEmptyValues(translations[lang], '', lang);
  if (emptyValues.length > 0) {
    console.log(`❌ ${lang}: ${emptyValues.length} valeurs vides`);
    emptyValues.forEach(({ key }) => console.log(`   - ${key}`));
    hasErrors = true;
  } else {
    console.log(`✅ ${lang}: Aucune valeur vide`);
  }
});

// Résumé
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ Des problèmes ont été détectés dans les traductions');
  console.log('   Veuillez corriger les erreurs ci-dessus');
  process.exit(1);
} else {
  console.log('✅ Toutes les traductions sont cohérentes !');
  console.log(`   ${referenceKeys.length} clés vérifiées pour ${LANGUAGES.length} langues`);
  process.exit(0);
}
