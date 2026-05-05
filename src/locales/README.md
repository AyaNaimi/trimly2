# 📁 Dossier des Traductions

Ce dossier contient tous les fichiers de traduction pour l'application Trimly.

## 📄 Fichiers

- `en.json` - English (Anglais) 🇬🇧
- `fr.json` - Français 🇫🇷
- `es.json` - Español (Espagnol) 🇪🇸

## 🏗️ Structure

Chaque fichier de traduction suit la même structure :

```json
{
  "common": {
    "cancel": "...",
    "save": "...",
    ...
  },
  "navigation": {
    "home": "...",
    ...
  },
  "home": { ... },
  "subscriptions": { ... },
  "transactions": { ... },
  "reports": { ... },
  "settings": { ... },
  "categories": { ... },
  "notifications": { ... },
  "errors": { ... }
}
```

## ✏️ Modifier une traduction

1. Ouvrez le fichier de la langue concernée
2. Trouvez la clé à modifier (ex: `common.save`)
3. Modifiez la valeur
4. Sauvegardez le fichier
5. Vérifiez avec `npm run check-translations`

## ➕ Ajouter une nouvelle traduction

1. Ajoutez la clé dans `en.json` (langue de référence)
2. Ajoutez la même clé dans `fr.json` avec la traduction française
3. Ajoutez la même clé dans `es.json` avec la traduction espagnole
4. Vérifiez avec `npm run check-translations`

### Exemple

```json
// en.json
{
  "subscriptions": {
    "newKey": "New feature text"
  }
}

// fr.json
{
  "subscriptions": {
    "newKey": "Texte de la nouvelle fonctionnalité"
  }
}

// es.json
{
  "subscriptions": {
    "newKey": "Texto de la nueva función"
  }
}
```

## 🌍 Ajouter une nouvelle langue

### 1. Créer le fichier

Créez un nouveau fichier avec le code de la langue (ex: `de.json` pour l'allemand).

### 2. Copier la structure

Copiez le contenu de `en.json` et traduisez toutes les valeurs.

### 3. Mettre à jour le contexte

Dans `src/context/LanguageContext.js` :

```javascript
// Importer la nouvelle langue
import de from '../locales/de.json';

// Ajouter à l'objet i18n
const i18n = new I18n({
  en,
  fr,
  es,
  de, // Nouvelle langue
});

// Ajouter au tableau LANGUAGES
export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' }, // Nouvelle langue
];
```

### 4. Mettre à jour le script de vérification

Dans `scripts/check-translations.js` :

```javascript
const LANGUAGES = ['en', 'fr', 'es', 'de']; // Ajouter la nouvelle langue
```

### 5. Vérifier

```bash
npm run check-translations
```

## 🔍 Vérification des traductions

Pour vérifier que toutes les langues ont les mêmes clés :

```bash
npm run check-translations
```

Ce script vérifie :
- ✅ Que toutes les langues ont les mêmes clés
- ✅ Qu'il n'y a pas de clés manquantes
- ✅ Qu'il n'y a pas de valeurs vides
- ✅ Qu'il n'y a pas de clés en trop

## 📝 Conventions

### Nommage des clés

- Utilisez le camelCase : `myKey` (pas `my_key` ou `my-key`)
- Soyez descriptif : `addSubscriptionButton` (pas `btn1`)
- Groupez par contexte : `subscriptions.addButton`

### Organisation

- Groupez les traductions par écran ou fonctionnalité
- Utilisez des objets imbriqués pour la hiérarchie
- Gardez la même structure dans tous les fichiers

### Valeurs

- Utilisez des phrases complètes quand c'est approprié
- Respectez la ponctuation de la langue
- Utilisez `{{variable}}` pour les valeurs dynamiques

## 🎯 Langues suggérées à ajouter

Selon votre marché cible :

- 🇩🇪 Allemand (de) - Deutsch
- 🇮🇹 Italien (it) - Italiano
- 🇵🇹 Portugais (pt) - Português
- 🇳🇱 Néerlandais (nl) - Nederlands
- 🇯🇵 Japonais (ja) - 日本語
- 🇨🇳 Chinois (zh) - 中文
- 🇰🇷 Coréen (ko) - 한국어
- 🇷🇺 Russe (ru) - Русский
- 🇦🇪 Arabe (ar) - العربية

## 📊 Statistiques actuelles

- **Langues** : 3 (en, fr, es)
- **Clés par langue** : ~80
- **Total traductions** : ~240
- **Sections** : 9 (common, navigation, home, subscriptions, transactions, reports, settings, categories, notifications, errors)

## 🐛 Problèmes courants

### Clé manquante

**Symptôme** : La clé s'affiche au lieu du texte traduit

**Solution** : Ajoutez la clé dans tous les fichiers de langue

### Valeur vide

**Symptôme** : Rien ne s'affiche

**Solution** : Vérifiez que la valeur n'est pas vide dans le fichier JSON

### Structure différente

**Symptôme** : Erreurs lors de la vérification

**Solution** : Assurez-vous que tous les fichiers ont la même structure

## 💡 Conseils

1. **Testez dans chaque langue** après avoir ajouté des traductions
2. **Utilisez le script de vérification** régulièrement
3. **Gardez les fichiers synchronisés** - ajoutez les clés dans toutes les langues en même temps
4. **Documentez les contextes** - ajoutez des commentaires si nécessaire
5. **Faites relire** par un natif de la langue si possible

## 🔗 Ressources

- [i18n-js Documentation](https://github.com/fnando/i18n-js)
- [Expo Localization](https://docs.expo.dev/versions/latest/sdk/localization/)
- [ISO 639-1 Language Codes](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)
